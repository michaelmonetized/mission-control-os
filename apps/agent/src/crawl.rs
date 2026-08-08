//! Local crawl executor (ADR-0004) — artifacts local, findings streamed (ADR-0019/0020).
//! Default mode is rendered when Playwright is available (ADR-0022); otherwise HTTP.
//! Depth: broken links, missing alt, title/h1/meta, duplicates, canonical, noindex (ADR-0008).

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrawlOptions {
    pub origin: String,
    /// "rendered" | "http_only" | "cwv" (rendered + Playwright Core Web Vitals pass)
    pub mode: String,
    pub ignore_robots: bool,
    pub max_pages: usize,
    /// Force CWV pass even when mode is rendered (default true for mode=cwv)
    #[serde(default)]
    pub cwv: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CwvMetrics {
    pub url: String,
    pub lcp_ms: f64,
    pub cls: f64,
    pub fcp_ms: f64,
    pub ttfb_ms: f64,
    pub load_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Finding {
    pub r#type: String,
    pub severity: String,
    pub url: String,
    pub message: Option<String>,
    #[serde(default)]
    pub fingerprint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StructureNode {
    pub id: String,
    pub url: String,
    pub path: String,
    pub depth: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub out_degree: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StructureEdge {
    pub from: String,
    pub to: String,
}

/// Site structure graph (ADR-0008 Sitebulb-class visualisation).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteStructure {
    pub origin: String,
    pub nodes: Vec<StructureNode>,
    pub edges: Vec<StructureEdge>,
    pub max_depth: usize,
    pub node_count: usize,
    pub edge_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrawlResult {
    pub findings: Vec<Finding>,
    pub pages_retrieved: usize,
    pub broken_links: usize,
    pub missing_alt: usize,
    pub duplicate_titles: usize,
    pub missing_meta: usize,
    pub mode_used: String,
    pub artifacts_dir: PathBuf,
    #[serde(default)]
    pub structure: Option<SiteStructure>,
}

fn fingerprint(kind: &str, url: &str, detail: &str) -> String {
    format!("{kind}|{url}|{detail}")
}

fn push_finding(
    findings: &mut Vec<Finding>,
    kind: &str,
    severity: &str,
    url: &str,
    message: impl Into<String>,
) {
    let msg = message.into();
    findings.push(Finding {
        r#type: kind.into(),
        severity: severity.into(),
        url: url.into(),
        fingerprint: fingerprint(kind, url, &msg),
        message: Some(msg),
    });
}

pub fn run_crawl(data_dir: &Path, opts: &CrawlOptions) -> Result<CrawlResult, String> {
    let run_id = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis();
    let artifacts = data_dir.join("artifacts").join(format!("run_{run_id}"));
    fs::create_dir_all(&artifacts).map_err(|e| e.to_string())?;

    let origin = opts.origin.trim_end_matches('/').to_string();
    let robots_disallow = if opts.ignore_robots {
        tracing::warn!(origin = %origin, "robots override enabled (logged)");
        HashSet::new()
    } else {
        fetch_robots_disallow(&origin).unwrap_or_default()
    };

    let want_cwv = opts.cwv || opts.mode == "cwv";
    let use_rendered =
        (opts.mode != "http_only" || want_cwv) && playwright_available();
    let mode_used = if want_cwv && use_rendered {
        "cwv".to_string()
    } else if use_rendered {
        "rendered".to_string()
    } else {
        if opts.mode == "rendered" || opts.mode == "cwv" || want_cwv {
            tracing::warn!("Playwright not found — falling back to http_only (no CWV)");
        }
        "http_only".to_string()
    };

    let mut queue: VecDeque<(String, usize)> = VecDeque::new();
    let mut seen: HashSet<String> = HashSet::new();
    queue.push_back((origin.clone(), 0));
    seen.insert(origin.clone());

    let mut findings: Vec<Finding> = Vec::new();
    let mut pages = 0usize;
    let mut broken = 0usize;
    let mut missing_alt = 0usize;
    let mut missing_meta = 0usize;
    let mut titles: HashMap<String, Vec<String>> = HashMap::new();
    // Structure graph: depth + internal edges
    let mut depths: HashMap<String, usize> = HashMap::new();
    depths.insert(origin.clone(), 0);
    let mut page_titles: HashMap<String, String> = HashMap::new();
    let mut out_links: HashMap<String, Vec<String>> = HashMap::new();
    let mut max_depth = 0usize;

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .redirect(reqwest::redirect::Policy::limited(5))
        .user_agent("MissionControlAgent/0.1 (+local-audit)")
        .build()
        .map_err(|e| e.to_string())?;

    // Soft rate limit between page fetches (open Q #20 defaults)
    let delay_ms = 150u64;

    while let Some((url, depth)) = queue.pop_front() {
        if pages >= opts.max_pages {
            break;
        }
        if is_disallowed(&url, &origin, &robots_disallow) {
            continue;
        }

        if pages > 0 {
            std::thread::sleep(std::time::Duration::from_millis(delay_ms));
        }

        let fetch = fetch_page(&client, &url, use_rendered, &artifacts);
        let html = match fetch {
            Ok(h) => h,
            Err(status_msg) => {
                broken += 1;
                push_finding(
                    &mut findings,
                    "broken_link",
                    "high",
                    &url,
                    status_msg,
                );
                continue;
            }
        };

        pages += 1;
        max_depth = max_depth.max(depth);
        depths.insert(url.clone(), depth);
        let page_path = artifacts.join(format!("page_{pages}.html"));
        let _ = fs::write(&page_path, &html);

        // title
        let title = extract_title(&html);
        if title.is_empty() {
            push_finding(
                &mut findings,
                "missing_title",
                "high",
                &url,
                "document missing <title>",
            );
        } else {
            page_titles.insert(url.clone(), title.clone());
            titles.entry(title.clone()).or_default().push(url.clone());
            if title.len() > 60 {
                push_finding(
                    &mut findings,
                    "title_too_long",
                    "low",
                    &url,
                    format!("title length {} > 60", title.len()),
                );
            }
        }

        // h1
        let h1s = count_tag(&html, "h1");
        if h1s == 0 {
            push_finding(
                &mut findings,
                "missing_h1",
                "medium",
                &url,
                "no H1 on page",
            );
        } else if h1s > 1 {
            push_finding(
                &mut findings,
                "multiple_h1",
                "low",
                &url,
                format!("{h1s} H1 elements"),
            );
        }

        // meta description
        if extract_meta_description(&html).is_none() {
            missing_meta += 1;
            push_finding(
                &mut findings,
                "missing_meta_description",
                "medium",
                &url,
                "no meta description",
            );
        }

        // canonical
        if let Some(canon) = extract_rel(&html, "canonical") {
            let abs = resolve_url(&url, &canon);
            if !abs.starts_with(&origin) {
                push_finding(
                    &mut findings,
                    "canonical_off_origin",
                    "medium",
                    &url,
                    format!("canonical points off-origin: {abs}"),
                );
            }
        }

        // noindex
        if html_has_noindex(&html) {
            push_finding(
                &mut findings,
                "noindex",
                "low",
                &url,
                "page has noindex robots directive",
            );
        }

        // missing alt
        for m in extract_imgs_missing_alt(&html) {
            missing_alt += 1;
            push_finding(&mut findings, "missing_alt", "medium", &url, m);
        }

        // thin content heuristic
        let text_len = strip_tags_len(&html);
        if text_len < 200 {
            push_finding(
                &mut findings,
                "thin_content",
                "low",
                &url,
                format!("approx text length {text_len} < 200"),
            );
        }

        // missing viewport
        if !html.to_ascii_lowercase().contains("name=\"viewport\"")
            && !html.to_ascii_lowercase().contains("name='viewport'")
        {
            push_finding(
                &mut findings,
                "missing_viewport",
                "medium",
                &url,
                "no viewport meta",
            );
        }

        // mixed content on https pages
        if url.starts_with("https://") && html.to_ascii_lowercase().contains("src=\"http://") {
            push_finding(
                &mut findings,
                "mixed_content",
                "medium",
                &url,
                "page loads http:// assets over https",
            );
        }

        // missing lang attribute
        if !html.to_ascii_lowercase().contains("<html")
            || (!html.to_ascii_lowercase().contains("lang=")
                && html.to_ascii_lowercase().contains("<html"))
        {
            let lower = html.to_ascii_lowercase();
            if let Some(i) = lower.find("<html") {
                let snippet = &lower[i..].chars().take(80).collect::<String>();
                if !snippet.contains("lang=") {
                    push_finding(
                        &mut findings,
                        "missing_html_lang",
                        "low",
                        &url,
                        "html element missing lang attribute",
                    );
                }
            }
        }

        let lower_html = html.to_ascii_lowercase();

        // missing Open Graph title (social share readiness)
        if !lower_html.contains("property=\"og:title\"")
            && !lower_html.contains("property='og:title'")
        {
            push_finding(
                &mut findings,
                "missing_og_title",
                "low",
                &url,
                "no og:title meta for social previews",
            );
        }

        // missing charset
        if !lower_html.contains("charset=") {
            push_finding(
                &mut findings,
                "missing_charset",
                "low",
                &url,
                "no charset declaration",
            );
        }

        // empty heading elements (a11y/SEO)
        if lower_html.contains("<h1></h1>")
            || lower_html.contains("<h1 />")
            || lower_html.contains("<h1/>")
        {
            push_finding(
                &mut findings,
                "empty_h1",
                "medium",
                &url,
                "empty h1 element",
            );
        }

        // title too short (SEO heuristic)
        {
            let title = extract_title(&html);
            let t = title.trim();
            if !t.is_empty() && t.chars().count() < 10 {
                push_finding(
                    &mut findings,
                    "title_too_short",
                    "low",
                    &url,
                    format!("title length {} < 10", t.chars().count()),
                );
            }
        }

        // missing favicon hint
        if !lower_html.contains("rel=\"icon\"")
            && !lower_html.contains("rel='icon'")
            && !lower_html.contains("rel=\"shortcut icon\"")
        {
            push_finding(
                &mut findings,
                "missing_favicon",
                "low",
                &url,
                "no favicon link rel",
            );
        }

        // structured data / JSON-LD (Sitebulb-class SEO)
        if !lower_html.contains("application/ld+json")
            && !lower_html.contains("itemtype=")
        {
            push_finding(
                &mut findings,
                "missing_structured_data",
                "low",
                &url,
                "no JSON-LD or microdata itemtype",
            );
        }

        // hreflang for international SEO (only flag homepage-ish roots lightly)
        let path = url.trim_end_matches('/');
        let is_rootish = path == origin.trim_end_matches('/')
            || path.ends_with("/index.html")
            || path.ends_with("/en")
            || path.ends_with("/en-us");
        if is_rootish
            && !lower_html.contains("hreflang=")
            && !lower_html.contains("rel=\"alternate\"")
        {
            push_finding(
                &mut findings,
                "missing_hreflang",
                "low",
                &url,
                "root page missing hreflang/alternate links",
            );
        }

        // CWV-adjacent heuristics without full Lighthouse (ADR-0008 Sitebulb-class depth)
        // large images without width/height → CLS risk
        for img in extract_imgs_no_dimensions(&html) {
            push_finding(
                &mut findings,
                "large_image_no_dimensions",
                "medium",
                &url,
                format!("img missing width/height (CLS risk): {img}"),
            );
        }
        // render-blocking classic scripts in head (no async/defer)
        let blocking_scripts = count_render_blocking_scripts_in_head(&html);
        if blocking_scripts > 0 {
            push_finding(
                &mut findings,
                "render_blocking_script",
                "medium",
                &url,
                format!("{blocking_scripts} classic script(s) in <head> without async/defer"),
            );
        }
        // many images, none lazy — LCP/bandwidth heuristic
        let img_count = lower_html.matches("<img").count();
        let lazy_count = lower_html.matches("loading=\"lazy\"").count()
            + lower_html.matches("loading='lazy'").count();
        if img_count >= 8 && lazy_count == 0 {
            push_finding(
                &mut findings,
                "missing_lazy_loading",
                "low",
                &url,
                format!("{img_count} images with no loading=lazy"),
            );
        }

        // enqueue same-origin links + record structure edges
        let mut outs: Vec<String> = Vec::new();
        for link in extract_hrefs(&html) {
            if link.starts_with("mailto:") || link.starts_with("tel:") || link.starts_with("javascript:") {
                continue;
            }
            let abs = resolve_url(&url, &link);
            if abs.starts_with(&origin) {
                // strip fragment for graph identity
                let abs = abs.split('#').next().unwrap_or(&abs).to_string();
                outs.push(abs.clone());
                if seen.insert(abs.clone()) {
                    queue.push_back((abs, depth + 1));
                }
            }
        }
        out_links.insert(url.clone(), outs);
    }

    // duplicate titles
    let mut duplicate_titles = 0usize;
    for (title, urls) in &titles {
        if urls.len() > 1 {
            duplicate_titles += urls.len();
            for u in urls {
                push_finding(
                    &mut findings,
                    "duplicate_title",
                    "medium",
                    u,
                    format!("title shared by {} pages: {title}", urls.len()),
                );
            }
        }
    }

    // Playwright Core Web Vitals pass (ADR-0008 full CWV depth)
    if want_cwv && use_rendered {
        let mut cwv_urls: Vec<String> = vec![origin.clone()];
        // Sample up to 4 additional shallow pages
        let mut shallow: Vec<(usize, String)> = depths
            .iter()
            .filter(|(u, _)| *u != &origin)
            .map(|(u, d)| (*d, u.clone()))
            .collect();
        shallow.sort_by_key(|(d, _)| *d);
        for (_, u) in shallow.into_iter().take(4) {
            cwv_urls.push(u);
        }
        for u in cwv_urls {
            match measure_cwv_with_playwright(&u, &artifacts) {
                Ok(m) => {
                    apply_cwv_findings(&mut findings, &m);
                    let _ = fs::write(
                        data_dir
                            .join("artifacts")
                            .join(format!("cwv_{}.json", pages)),
                        serde_json::to_string_pretty(&m).unwrap_or_default(),
                    );
                }
                Err(e) => {
                    tracing::warn!(url = %u, error = %e, "CWV measurement failed");
                    push_finding(
                        &mut findings,
                        "cwv_measurement_failed",
                        "low",
                        &u,
                        e,
                    );
                }
            }
        }
    }

    // Build site structure graph (ADR-0008)
    let mut nodes: Vec<StructureNode> = depths
        .iter()
        .map(|(url, d)| {
            let path = url
                .strip_prefix(&origin)
                .unwrap_or(url.as_str())
                .to_string();
            let path = if path.is_empty() {
                "/".to_string()
            } else {
                path
            };
            let outs = out_links.get(url).map(|v| v.len()).unwrap_or(0);
            StructureNode {
                id: url.clone(),
                url: url.clone(),
                path,
                depth: *d,
                title: page_titles.get(url).cloned(),
                out_degree: Some(outs),
            }
        })
        .collect();
    nodes.sort_by(|a, b| a.depth.cmp(&b.depth).then_with(|| a.path.cmp(&b.path)));

    let mut edges: Vec<StructureEdge> = Vec::new();
    for (from, tos) in &out_links {
        for to in tos {
            if depths.contains_key(to) {
                edges.push(StructureEdge {
                    from: from.clone(),
                    to: to.clone(),
                });
            }
        }
    }
    // Cap payload: keep shallow nodes, then drop orphan edges
    if nodes.len() > 200 {
        nodes.truncate(200);
    }
    let keep: HashSet<String> = nodes.iter().map(|n| n.id.clone()).collect();
    edges.retain(|e| keep.contains(&e.from) && keep.contains(&e.to));
    if edges.len() > 500 {
        edges.truncate(500);
    }

    let structure = SiteStructure {
        origin: origin.clone(),
        node_count: nodes.len(),
        edge_count: edges.len(),
        max_depth,
        nodes,
        edges,
    };

    // ADR-0020: clean artifacts after run (keep a small summary json optional)
    let _ = fs::write(
        data_dir.join("artifacts").join(format!("summary_{run_id}.json")),
        serde_json::to_string_pretty(&serde_json::json!({
            "pages": pages,
            "broken": broken,
            "missing_alt": missing_alt,
            "duplicate_titles": duplicate_titles,
            "mode": mode_used,
            "structure": {
                "node_count": structure.node_count,
                "edge_count": structure.edge_count,
                "max_depth": structure.max_depth,
            },
        }))
        .unwrap_or_default(),
    );
    let _ = fs::write(
        data_dir
            .join("artifacts")
            .join(format!("structure_{run_id}.json")),
        serde_json::to_string_pretty(&structure).unwrap_or_default(),
    );
    cleanup_artifacts(&artifacts);

    Ok(CrawlResult {
        findings,
        pages_retrieved: pages,
        broken_links: broken,
        missing_alt,
        duplicate_titles,
        missing_meta,
        mode_used,
        artifacts_dir: artifacts,
        structure: Some(structure),
    })
}

fn fetch_page(
    client: &reqwest::blocking::Client,
    url: &str,
    use_rendered: bool,
    artifacts: &Path,
) -> Result<String, String> {
    if use_rendered {
        match render_with_playwright(url, artifacts) {
            Ok(h) => return Ok(h),
            Err(e) => tracing::warn!(%url, error = %e, "rendered fetch failed; trying HTTP"),
        }
    }
    match client.get(url).send() {
        Ok(r) if r.status().is_success() => r.text().map_err(|e| e.to_string()),
        Ok(r) => Err(format!("HTTP {}", r.status())),
        Err(e) => Err(e.to_string()),
    }
}

fn cleanup_artifacts(dir: &Path) {
    if let Err(e) = fs::remove_dir_all(dir) {
        tracing::warn!(path = %dir.display(), error = %e, "artifact cleanup failed");
    } else {
        tracing::info!(path = %dir.display(), "artifacts cleaned after run");
    }
}

fn playwright_available() -> bool {
    // Prefer local playwright package; fall back to npx
    Command::new("node")
        .args(["-e", "require('playwright'); console.log('ok')"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
        || Command::new("npx")
            .args(["--yes", "playwright", "--version"])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
}

fn render_with_playwright(url: &str, artifacts: &Path) -> Result<String, String> {
    let out = artifacts.join("playwright_out.html");
    let script = format!(
        r#"const {{ chromium }} = require('playwright');
(async () => {{
  const browser = await chromium.launch({{ headless: true }});
  const page = await browser.newPage();
  await page.goto({url}, {{ waitUntil: 'networkidle', timeout: 45000 }});
  const html = await page.content();
  require('fs').writeFileSync({out}, html);
  await browser.close();
}})().catch(e => {{ console.error(e); process.exit(1); }});"#,
        url = serde_json::to_string(url).map_err(|e| e.to_string())?,
        out = serde_json::to_string(out.to_str().unwrap_or("out.html")).map_err(|e| e.to_string())?
    );
    let status = Command::new("node")
        .arg("-e")
        .arg(&script)
        .status()
        .map_err(|e| e.to_string())?;
    if !status.success() {
        return Err("playwright render failed".into());
    }
    fs::read_to_string(out).map_err(|e| e.to_string())
}

/// Core Web Vitals via Playwright PerformanceObserver (ADR-0008).
/// Thresholds: LCP good&lt;2500 / poor&gt;4000; CLS good&lt;0.1 / poor&gt;0.25; TTFB/FCP informational.
fn measure_cwv_with_playwright(url: &str, artifacts: &Path) -> Result<CwvMetrics, String> {
    let out = artifacts.join("cwv_metrics.json");
    let script = format!(
        r#"const {{ chromium }} = require('playwright');
const fs = require('fs');
(async () => {{
  const browser = await chromium.launch({{ headless: true }});
  const page = await browser.newPage();
  await page.goto({url}, {{ waitUntil: 'networkidle', timeout: 60000 }});
  // Allow late LCP / layout shifts
  await page.waitForTimeout(2000);
  const metrics = await page.evaluate(() => new Promise((resolve) => {{
    let lcp = 0;
    let cls = 0;
    try {{
      const poLcp = new PerformanceObserver((list) => {{
        for (const e of list.getEntries()) {{
          if (e.entryType === 'largest-contentful-paint') lcp = e.startTime;
        }}
      }});
      poLcp.observe({{ type: 'largest-contentful-paint', buffered: true }});
      const poCls = new PerformanceObserver((list) => {{
        for (const e of list.getEntries()) {{
          if (e.entryType === 'layout-shift' && !e.hadRecentInput) cls += e.value;
        }}
      }});
      poCls.observe({{ type: 'layout-shift', buffered: true }});
    }} catch (_) {{}}
    setTimeout(() => {{
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint') || [];
      const fcp = (paint.find(p => p.name === 'first-contentful-paint') || {{}}).startTime || 0;
      // LCP from buffered entries if observer missed
      if (!lcp) {{
        try {{
          const lcps = performance.getEntriesByType('largest-contentful-paint');
          if (lcps.length) lcp = lcps[lcps.length - 1].startTime;
        }} catch (_) {{}}
      }}
      resolve({{
        lcp: lcp || 0,
        cls: cls || 0,
        fcp: fcp || 0,
        ttfb: nav ? (nav.responseStart - nav.requestStart) : 0,
        load: nav ? nav.loadEventEnd : 0,
      }});
    }}, 1500);
  }}));
  fs.writeFileSync({out}, JSON.stringify(metrics));
  console.log(JSON.stringify(metrics));
  await browser.close();
}})().catch(e => {{ console.error(String(e)); process.exit(1); }});"#,
        url = serde_json::to_string(url).map_err(|e| e.to_string())?,
        out = serde_json::to_string(out.to_str().unwrap_or("cwv.json")).map_err(|e| e.to_string())?
    );
    let output = Command::new("node")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| e.to_string())?;
    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("playwright CWV failed: {err}"));
    }
    let raw = if out.exists() {
        fs::read_to_string(&out).map_err(|e| e.to_string())?
    } else {
        String::from_utf8_lossy(&output.stdout).to_string()
    };
    // last JSON line
    let line = raw
        .lines()
        .rev()
        .find(|l| l.trim().starts_with('{'))
        .unwrap_or(raw.trim());
    let v: serde_json::Value =
        serde_json::from_str(line).map_err(|e| format!("cwv parse: {e} · {line}"))?;
    Ok(CwvMetrics {
        url: url.to_string(),
        lcp_ms: v.get("lcp").and_then(|x| x.as_f64()).unwrap_or(0.0),
        cls: v.get("cls").and_then(|x| x.as_f64()).unwrap_or(0.0),
        fcp_ms: v.get("fcp").and_then(|x| x.as_f64()).unwrap_or(0.0),
        ttfb_ms: v.get("ttfb").and_then(|x| x.as_f64()).unwrap_or(0.0),
        load_ms: v.get("load").and_then(|x| x.as_f64()).unwrap_or(0.0),
    })
}

fn apply_cwv_findings(findings: &mut Vec<Finding>, m: &CwvMetrics) {
    // LCP thresholds (ms)
    if m.lcp_ms > 4000.0 {
        push_finding(
            findings,
            "cwv_lcp_poor",
            "high",
            &m.url,
            format!("LCP {:.0}ms > 4000ms (poor)", m.lcp_ms),
        );
    } else if m.lcp_ms > 2500.0 {
        push_finding(
            findings,
            "cwv_lcp_needs_improvement",
            "medium",
            &m.url,
            format!("LCP {:.0}ms needs improvement (2500–4000)", m.lcp_ms),
        );
    }
    // CLS
    if m.cls > 0.25 {
        push_finding(
            findings,
            "cwv_cls_poor",
            "high",
            &m.url,
            format!("CLS {:.3} > 0.25 (poor)", m.cls),
        );
    } else if m.cls > 0.1 {
        push_finding(
            findings,
            "cwv_cls_needs_improvement",
            "medium",
            &m.url,
            format!("CLS {:.3} needs improvement (0.1–0.25)", m.cls),
        );
    }
    // TTFB informational
    if m.ttfb_ms > 800.0 {
        push_finding(
            findings,
            "cwv_ttfb_slow",
            "medium",
            &m.url,
            format!("TTFB {:.0}ms > 800ms", m.ttfb_ms),
        );
    }
    // FCP
    if m.fcp_ms > 3000.0 {
        push_finding(
            findings,
            "cwv_fcp_poor",
            "medium",
            &m.url,
            format!("FCP {:.0}ms > 3000ms", m.fcp_ms),
        );
    } else if m.fcp_ms > 1800.0 {
        push_finding(
            findings,
            "cwv_fcp_needs_improvement",
            "low",
            &m.url,
            format!("FCP {:.0}ms needs improvement", m.fcp_ms),
        );
    }
    // Metrics are written to artifacts/cwv_*.json — only threshold breaches become findings
}

fn fetch_robots_disallow(origin: &str) -> Result<HashSet<String>, String> {
    let client = reqwest::blocking::Client::new();
    let body = client
        .get(format!("{origin}/robots.txt"))
        .send()
        .map_err(|e| e.to_string())?
        .text()
        .unwrap_or_default();
    let mut set = HashSet::new();
    let mut in_star = false;
    for line in body.lines() {
        let line = line.trim();
        if line.to_ascii_lowercase().starts_with("user-agent:") {
            let ua = line.split(':').nth(1).unwrap_or("").trim();
            in_star = ua == "*";
        } else if in_star && line.to_ascii_lowercase().starts_with("disallow:") {
            let path = line.split(':').nth(1).unwrap_or("").trim();
            if !path.is_empty() {
                set.insert(path.to_string());
            }
        }
    }
    Ok(set)
}

fn is_disallowed(url: &str, origin: &str, rules: &HashSet<String>) -> bool {
    let path = url.strip_prefix(origin).unwrap_or("/");
    rules.iter().any(|r| path.starts_with(r))
}

fn extract_hrefs(html: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut rest = html;
    while let Some(i) = rest.find("href=") {
        rest = &rest[i + 5..];
        let quote = rest.chars().next();
        if quote == Some('"') || quote == Some('\'') {
            let q = quote.unwrap();
            rest = &rest[1..];
            if let Some(end) = rest.find(q) {
                out.push(rest[..end].to_string());
                rest = &rest[end + 1..];
            }
        }
    }
    out
}

fn extract_imgs_missing_alt(html: &str) -> Vec<String> {
    let mut out = Vec::new();
    let lower = html.to_ascii_lowercase();
    let mut idx = 0;
    while let Some(rel) = lower[idx..].find("<img") {
        let start = idx + rel;
        let end = lower[start..].find('>').map(|e| start + e).unwrap_or(html.len());
        let tag = &html[start..end.min(html.len())];
        let tlow = tag.to_ascii_lowercase();
        if !tlow.contains("alt=") || tlow.contains("alt=\"\"") || tlow.contains("alt=''") {
            out.push(tag.chars().take(120).collect());
        }
        idx = end + 1;
        if idx >= html.len() {
            break;
        }
    }
    out
}

/// Images without width+height attributes (CLS risk — CWV-adjacent).
fn extract_imgs_no_dimensions(html: &str) -> Vec<String> {
    let mut out = Vec::new();
    let lower = html.to_ascii_lowercase();
    let mut idx = 0;
    while let Some(rel) = lower[idx..].find("<img") {
        let start = idx + rel;
        let end = lower[start..].find('>').map(|e| start + e).unwrap_or(html.len());
        let tag = &html[start..end.min(html.len())];
        let tlow = tag.to_ascii_lowercase();
        let has_w = tlow.contains("width=");
        let has_h = tlow.contains("height=");
        if !(has_w && has_h) {
            out.push(tag.chars().take(120).collect());
        }
        idx = end + 1;
        if idx >= html.len() {
            break;
        }
    }
    // Cap noise — sample first few per page
    out.truncate(5);
    out
}

/// Classic scripts in `<head>` without async/defer (render-blocking heuristic).
fn count_render_blocking_scripts_in_head(html: &str) -> usize {
    let lower = html.to_ascii_lowercase();
    // Cap head scan on a char boundary (UTF-8 safe) — avoid panic on multi-byte slice
    let cap = lower
        .char_indices()
        .take_while(|(i, _)| *i < 50_000)
        .map(|(i, c)| i + c.len_utf8())
        .last()
        .unwrap_or(0)
        .min(lower.len());
    let head_end = lower.find("</head>").unwrap_or(cap);
    let head = &lower[..head_end.min(lower.len())];
    let mut count = 0usize;
    let mut idx = 0;
    while let Some(rel) = head[idx..].find("<script") {
        let start = idx + rel;
        let end = head[start..].find('>').map(|e| start + e).unwrap_or(head.len());
        let tag = &head[start..end.min(head.len())];
        let is_module = tag.contains("type=\"module\"") || tag.contains("type='module'");
        let async_or_defer = tag.contains("async") || tag.contains("defer");
        let has_src = tag.contains("src=");
        if has_src && !async_or_defer && !is_module {
            count += 1;
        }
        idx = end + 1;
        if idx >= head.len() {
            break;
        }
    }
    count
}

fn extract_title(html: &str) -> String {
    let lower = html.to_ascii_lowercase();
    if let Some(s) = lower.find("<title") {
        let after = &html[s..];
        if let Some(gt) = after.find('>') {
            let rest = &after[gt + 1..];
            if let Some(end) = rest.to_ascii_lowercase().find("</title>") {
                return rest[..end].trim().to_string();
            }
        }
    }
    String::new()
}

fn count_tag(html: &str, tag: &str) -> usize {
    let needle = format!("<{tag}");
    html.to_ascii_lowercase().matches(&needle).count()
}

fn extract_meta_description(html: &str) -> Option<String> {
    let lower = html.to_ascii_lowercase();
    let mut idx = 0;
    while let Some(rel) = lower[idx..].find("<meta") {
        let start = idx + rel;
        let end = lower[start..].find('>').map(|e| start + e).unwrap_or(html.len());
        let tag = lower[start..end.min(lower.len())].to_string();
        if tag.contains("name=\"description\"") || tag.contains("name='description'") {
            // find content=
            if let Some(c) = tag.find("content=") {
                let rest = &tag[c + 8..];
                let q = rest.chars().next()?;
                if q == '"' || q == '\'' {
                    let inner = &rest[1..];
                    if let Some(e) = inner.find(q) {
                        return Some(inner[..e].to_string());
                    }
                }
            }
        }
        idx = end + 1;
        if idx >= lower.len() {
            break;
        }
    }
    None
}

fn extract_rel(html: &str, rel: &str) -> Option<String> {
    let lower = html.to_ascii_lowercase();
    let needle = format!("rel=\"{rel}\"");
    let needle2 = format!("rel='{rel}'");
    let mut idx = 0;
    while let Some(rel_pos) = lower[idx..]
        .find(&needle)
        .or_else(|| lower[idx..].find(&needle2))
    {
        let start = idx + rel_pos;
        // search backward for <link
        let window_start = start.saturating_sub(200);
        let slice = &html[window_start..start.min(html.len())];
        if let Some(link_rel) = slice.rfind("<link") {
            let tag_start = window_start + link_rel;
            let tag_end = html[tag_start..]
                .find('>')
                .map(|e| tag_start + e)
                .unwrap_or(html.len());
            let tag = &html[tag_start..tag_end];
            let tlow = tag.to_ascii_lowercase();
            if let Some(c) = tlow.find("href=") {
                let rest = &tag[c + 5..];
                let q = rest.chars().next()?;
                if q == '"' || q == '\'' {
                    let inner = &rest[1..];
                    if let Some(e) = inner.find(q) {
                        return Some(inner[..e].to_string());
                    }
                }
            }
        }
        idx = start + 1;
    }
    None
}

fn html_has_noindex(html: &str) -> bool {
    let lower = html.to_ascii_lowercase();
    lower.contains("noindex")
        && (lower.contains("name=\"robots\"")
            || lower.contains("name='robots'")
            || lower.contains("name=robots"))
}

fn strip_tags_len(html: &str) -> usize {
    let mut out = String::new();
    let mut in_tag = false;
    for c in html.chars() {
        match c {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(c),
            _ => {}
        }
    }
    out.split_whitespace().map(|w| w.len() + 1).sum::<usize>().saturating_sub(1)
}

fn resolve_url(base: &str, href: &str) -> String {
    if href.starts_with("http://") || href.starts_with("https://") {
        return href.to_string();
    }
    if href.starts_with("//") {
        return format!("https:{href}");
    }
    if href.starts_with('/') {
        if let Ok(u) = url::Url::parse(base) {
            return format!("{}://{}{}", u.scheme(), u.host_str().unwrap_or(""), href);
        }
    }
    format!(
        "{}/{}",
        base.trim_end_matches('/'),
        href.trim_start_matches('/')
    )
}
