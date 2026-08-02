//! Local crawl executor (ADR-0004) — artifacts local, findings streamed (ADR-0019/0020).
//! Default mode is rendered when Playwright CLI is available (ADR-0022); otherwise HTTP.

use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrawlResult {
    pub findings: Vec<Finding>,
    pub pages_retrieved: usize,
    pub broken_links: usize,
    pub missing_alt: usize,
    pub mode_used: String,
    pub artifacts_dir: PathBuf,
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

    let use_rendered = opts.mode == "rendered" && playwright_available();
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

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .user_agent("MissionControlAgent/0.1 (+local-audit)")
        .build()
        .map_err(|e| e.to_string())?;

    while let Some(url) = queue.pop_front() {
        if pages >= opts.max_pages {
            break;
        }
        if is_disallowed(&url, &origin, &robots_disallow) {
            continue;
        }

        let html = if use_rendered {
            match render_with_playwright(&url, &artifacts) {
                Ok(h) => h,
                Err(e) => {
                    tracing::warn!(%url, error = %e, "rendered fetch failed; trying HTTP");
                    match client.get(&url).send() {
                        Ok(r) if r.status().is_success() => r.text().unwrap_or_default(),
                        Ok(r) => {
                            broken += 1;
                            findings.push(Finding {
                                r#type: "broken_link".into(),
                                severity: "high".into(),
                                url: url.clone(),
                                message: Some(format!("HTTP {}", r.status())),
                            });
                            continue;
                        }
                        Err(e) => {
                            broken += 1;
                            findings.push(Finding {
                                r#type: "broken_link".into(),
                                severity: "high".into(),
                                url: url.clone(),
                                message: Some(e.to_string()),
                            });
                            continue;
                        }
                    }
                }
            }
        } else {
            match client.get(&url).send() {
                Ok(r) if r.status().is_success() => r.text().unwrap_or_default(),
                Ok(r) => {
                    broken += 1;
                    findings.push(Finding {
                        r#type: "broken_link".into(),
                        severity: "high".into(),
                        url: url.clone(),
                        message: Some(format!("HTTP {}", r.status())),
                    });
                    continue;
                }
                Err(e) => {
                    broken += 1;
                    findings.push(Finding {
                        r#type: "broken_link".into(),
                        severity: "high".into(),
                        url: url.clone(),
                        message: Some(e.to_string()),
                    });
                    continue;
                }
            }
        };

        pages += 1;
        let page_path = artifacts.join(format!("page_{pages}.html"));
        let _ = fs::write(&page_path, &html);

        // missing alt
        for m in extract_imgs_missing_alt(&html) {
            missing_alt += 1;
            findings.push(Finding {
                r#type: "missing_alt".into(),
                severity: "medium".into(),
                url: url.clone(),
                message: Some(m),
            });
        }

        // enqueue same-origin links
        for link in extract_hrefs(&html) {
            let abs = resolve_url(&url, &link);
            if abs.starts_with(&origin) && seen.insert(abs.clone()) {
                queue.push_back(abs);
            }
        }
    }

    let result = CrawlResult {
        findings,
        pages_retrieved: pages,
        broken_links: broken,
        missing_alt,
        mode_used,
        artifacts_dir: artifacts.clone(),
    };

    // ADR-0020: clean artifacts after run
    cleanup_artifacts(&artifacts);
    Ok(result)
}

fn cleanup_artifacts(dir: &Path) {
    if let Err(e) = fs::remove_dir_all(dir) {
        tracing::warn!(path = %dir.display(), error = %e, "artifact cleanup failed");
    } else {
        tracing::info!(path = %dir.display(), "artifacts cleaned after run");
    }
}

fn playwright_available() -> bool {
    Command::new("npx")
        .args(["--yes", "playwright", "--version"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn render_with_playwright(url: &str, artifacts: &Path) -> Result<String, String> {
    let out = artifacts.join("playwright_out.html");
    // Minimal script via node -e if playwright installed
    let script = format!(
        r#"const {{ chromium }} = require('playwright');
(async () => {{
  const browser = await chromium.launch({{ headless: true }});
  const page = await browser.newPage();
  await page.goto({url}, {{ waitUntil: 'networkidle', timeout: 30000 }});
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
    format!("{}/{}", base.trim_end_matches('/'), href.trim_start_matches('/'))
}
