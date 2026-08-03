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
    pub mode: String, // "rendered" | "http_only"
    pub ignore_robots: bool,
    pub max_pages: usize,
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
pub struct CrawlResult {
    pub findings: Vec<Finding>,
    pub pages_retrieved: usize,
    pub broken_links: usize,
    pub missing_alt: usize,
    pub duplicate_titles: usize,
    pub missing_meta: usize,
    pub mode_used: String,
    pub artifacts_dir: PathBuf,
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

    let use_rendered = opts.mode != "http_only" && playwright_available();
    let mode_used = if use_rendered {
        "rendered".to_string()
    } else {
        if opts.mode == "rendered" {
            tracing::warn!("Playwright not found — falling back to http_only");
        }
        "http_only".to_string()
    };

    let mut queue: VecDeque<String> = VecDeque::new();
    let mut seen: HashSet<String> = HashSet::new();
    queue.push_back(origin.clone());
    seen.insert(origin.clone());

    let mut findings: Vec<Finding> = Vec::new();
    let mut pages = 0usize;
    let mut broken = 0usize;
    let mut missing_alt = 0usize;
    let mut missing_meta = 0usize;
    let mut titles: HashMap<String, Vec<String>> = HashMap::new();

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .redirect(reqwest::redirect::Policy::limited(5))
        .user_agent("MissionControlAgent/0.1 (+local-audit)")
        .build()
        .map_err(|e| e.to_string())?;

    // Soft rate limit between page fetches (open Q #20 defaults)
    let delay_ms = 150u64;

    while let Some(url) = queue.pop_front() {
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

        // enqueue same-origin links
        for link in extract_hrefs(&html) {
            if link.starts_with("mailto:") || link.starts_with("tel:") || link.starts_with("javascript:") {
                continue;
            }
            let abs = resolve_url(&url, &link);
            if abs.starts_with(&origin) && seen.insert(abs.clone()) {
                queue.push_back(abs);
            }
        }
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

    // ADR-0020: clean artifacts after run (keep a small summary json optional)
    let _ = fs::write(
        data_dir.join("artifacts").join(format!("summary_{run_id}.json")),
        serde_json::to_string_pretty(&serde_json::json!({
            "pages": pages,
            "broken": broken,
            "missing_alt": missing_alt,
            "duplicate_titles": duplicate_titles,
            "mode": mode_used,
        }))
        .unwrap_or_default(),
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
