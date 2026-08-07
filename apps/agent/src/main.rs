//! Mission Control Local Agent — user-level daemon (ADR-0012/0013/0016/0004/0022)
//! Fetches Sites, streams results to Control Plane, cleans artifacts after runs.

mod crawl;

use clap::{Parser, Subcommand};
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "mc-agent", about = "Mission Control Local Agent")]
struct Cli {
    #[command(subcommand)]
    cmd: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run as foreground daemon (systemd --user / LaunchAgent wraps this)
    Daemon {
        #[arg(long, default_value = "http://127.0.0.1:5173")]
        control_plane: String,
        /// Convex site URL for agent HTTP routes (…convex.site)
        #[arg(long, env = "MC_CONVEX_SITE")]
        convex_site: Option<String>,
        #[arg(long, env = "MC_AGENT_SECRET", default_value = "")]
        agent_secret: String,
    },
    /// Heartbeat against Control Plane
    Heartbeat {
        #[arg(long, default_value = "http://127.0.0.1:5173")]
        control_plane: String,
    },
    /// Print agent data dir
    Paths,
    /// Run a crawl job locally (ADR-0004) — streams findings JSON to stdout
    Crawl {
        #[arg(long)]
        origin: String,
        /// rendered | http_only | cwv (rendered + Playwright Core Web Vitals)
        #[arg(long, default_value = "rendered")]
        mode: String,
        #[arg(long, default_value_t = false)]
        ignore_robots: bool,
        #[arg(long, default_value_t = 25)]
        max_pages: usize,
        /// Run Playwright CWV pass (also implied by --mode cwv)
        #[arg(long, default_value_t = false)]
        cwv: bool,
    },
    /// Poll Convex agent HTTP for one job, crawl, stream findings, complete
    Poll {
        #[arg(long, env = "MC_CONVEX_SITE")]
        convex_site: String,
        #[arg(long, env = "MC_AGENT_SECRET", default_value = "")]
        agent_secret: String,
        #[arg(long, default_value_t = 25)]
        max_pages: usize,
    },
}

#[derive(Serialize, Deserialize, Default)]
struct AgentConfig {
    refresh_token: Option<String>,
    agency_id: Option<String>,
    #[serde(default)]
    control_plane: Option<String>,
    #[serde(default)]
    convex_site: Option<String>,
}

fn data_dir() -> PathBuf {
    ProjectDirs::from("com", "MissionControl", "Agent")
        .map(|p| p.data_dir().to_path_buf())
        .unwrap_or_else(|| PathBuf::from(".mc-agent"))
}

fn auth_header(secret: &str) -> reqwest::header::HeaderMap {
    let mut h = reqwest::header::HeaderMap::new();
    if !secret.is_empty() {
        if let Ok(v) = reqwest::header::HeaderValue::from_str(&format!("Bearer {secret}")) {
            h.insert(reqwest::header::AUTHORIZATION, v);
        }
    }
    h
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    let cli = Cli::parse();
    match cli.cmd {
        Commands::Paths => {
            let d = data_dir();
            println!("{}", d.display());
            let artifacts = d.join("artifacts");
            fs::create_dir_all(&artifacts)?;
            println!("artifacts: {}", artifacts.display());
        }
        Commands::Heartbeat { control_plane } => {
            let url = format!("{}/api/agent/heartbeat", control_plane.trim_end_matches('/'));
            let client = reqwest::Client::new();
            let res = client.post(&url).json(&serde_json::json!({})).send().await?;
            println!("{}", res.text().await?);
        }
        Commands::Crawl {
            origin,
            mode,
            ignore_robots,
            max_pages,
            cwv,
        } => {
            let d = data_dir();
            fs::create_dir_all(d.join("artifacts"))?;
            let opts = crawl::CrawlOptions {
                origin,
                mode,
                ignore_robots,
                max_pages,
                cwv,
            };
            let result = tokio::task::spawn_blocking(move || crawl::run_crawl(&d, &opts)).await??;
            println!("{}", serde_json::to_string_pretty(&result)?);
        }
        Commands::Poll {
            convex_site,
            agent_secret,
            max_pages,
        } => {
            let site = convex_site.trim_end_matches('/').to_string();
            let client = reqwest::Client::new();
            let jobs_url = format!("{site}/agent/jobs");
            let res = client
                .get(&jobs_url)
                .headers(auth_header(&agent_secret))
                .send()
                .await?;
            let body: serde_json::Value = res.json().await?;
            let items = body
                .pointer("/data/items")
                .and_then(|v| v.as_array())
                .cloned()
                .unwrap_or_default();
            if items.is_empty() {
                println!("{{\"ok\":true,\"jobs\":0}}");
                return Ok(());
            }
            let job = &items[0];
            let crawl_run_id = job
                .get("crawlRunId")
                .and_then(|v| v.as_str())
                .ok_or("missing crawlRunId")?
                .to_string();
            let origin = job
                .get("origin")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let mode = job
                .get("mode")
                .and_then(|v| v.as_str())
                .unwrap_or("rendered")
                .to_string();
            let ignore_robots = job
                .get("ignoreRobots")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            // claim
            let _ = client
                .post(format!("{site}/agent/jobs/claim"))
                .headers(auth_header(&agent_secret))
                .json(&serde_json::json!({ "crawlRunId": crawl_run_id }))
                .send()
                .await?;

            let d = data_dir();
            let cwv = mode == "cwv";
            let opts = crawl::CrawlOptions {
                origin,
                mode,
                ignore_robots,
                max_pages,
                cwv,
            };
            let result =
                tokio::task::spawn_blocking(move || crawl::run_crawl(&d, &opts)).await??;

            // Bulk stream findings (faster than one HTTP call per finding)
            let findings_json: Vec<serde_json::Value> = result
                .findings
                .iter()
                .map(|f| {
                    serde_json::json!({
                        "type": f.r#type,
                        "severity": f.severity,
                        "url": f.url,
                        "message": f.message,
                    })
                })
                .collect();
            let _ = client
                .post(format!("{site}/agent/findings"))
                .headers(auth_header(&agent_secret))
                .json(&serde_json::json!({
                    "crawlRunId": crawl_run_id,
                    "findings": findings_json,
                }))
                .send()
                .await?;

            let pages = result.pages_retrieved;
            let broken = result.broken_links;
            let missing_alt = result.missing_alt;
            let dup = result.duplicate_titles;
            // Map Rust structure (snake) → Convex (camel) for site graph (ADR-0008)
            let structure_json = result.structure.as_ref().map(|s| {
                serde_json::json!({
                    "origin": s.origin,
                    "maxDepth": s.max_depth,
                    "nodeCount": s.node_count,
                    "edgeCount": s.edge_count,
                    "nodes": s.nodes.iter().map(|n| serde_json::json!({
                        "id": n.id,
                        "url": n.url,
                        "path": n.path,
                        "depth": n.depth,
                        "title": n.title,
                        "outDegree": n.out_degree,
                    })).collect::<Vec<_>>(),
                    "edges": s.edges.iter().map(|e| serde_json::json!({
                        "from": e.from,
                        "to": e.to,
                    })).collect::<Vec<_>>(),
                })
            });
            let mut complete_body = serde_json::json!({
                "crawlRunId": crawl_run_id,
                "metrics": {
                    "brokenLinks": broken,
                    "missingAlt": missing_alt,
                    "duplicatePercent": if pages > 0 { (dup as f64 / pages as f64) * 100.0 } else { 0.0 },
                    "pagesRetrieved": pages,
                }
            });
            if let Some(st) = structure_json {
                complete_body
                    .as_object_mut()
                    .unwrap()
                    .insert("structure".into(), st);
            }
            let _ = client
                .post(format!("{site}/agent/complete"))
                .headers(auth_header(&agent_secret))
                .json(&complete_body)
                .send()
                .await?;

            println!(
                "{}",
                serde_json::json!({
                    "ok": true,
                    "crawlRunId": crawl_run_id,
                    "pages": pages,
                    "findings": result.findings.len(),
                    "mode": result.mode_used,
                })
            );
        }
        Commands::Daemon {
            control_plane,
            convex_site,
            agent_secret,
        } => {
            tracing::info!(%control_plane, "mc-agent daemon starting (user-level service)");
            let d = data_dir();
            fs::create_dir_all(d.join("artifacts"))?;
            let config_path = d.join("config.json");
            let config: AgentConfig = if config_path.exists() {
                serde_json::from_str(&fs::read_to_string(&config_path)?)?
            } else {
                tracing::warn!("no config.json — pair via Desktop Agent Token first");
                AgentConfig::default()
            };
            if config.refresh_token.is_none() {
                tracing::warn!("missing refresh_token in config — crawls will not authenticate");
            } else {
                tracing::info!(agency = ?config.agency_id, "agent credentials loaded");
            }
            let cp = control_plane.clone();
            let site = convex_site
                .or(config.convex_site)
                .or_else(|| std::env::var("MC_CONVEX_SITE").ok())
                .unwrap_or_default();
            let secret = if agent_secret.is_empty() {
                std::env::var("MC_AGENT_SECRET").unwrap_or_default()
            } else {
                agent_secret
            };
            loop {
                let url = format!("{}/api/agent/heartbeat", cp.trim_end_matches('/'));
                let mut req = reqwest::Client::new().post(&url).json(&serde_json::json!({
                    "status": "idle",
                    "agencyId": config.agency_id,
                }));
                if let Some(ref token) = config.refresh_token {
                    req = req.bearer_auth(token);
                }
                match req.send().await {
                    Ok(r) => tracing::debug!(status = r.status().as_u16(), "heartbeat"),
                    Err(e) => tracing::warn!(error = %e, "heartbeat failed"),
                }

                // Poll Convex agent HTTP for work
                if !site.is_empty() {
                    let poll = std::process::Command::new(std::env::current_exe()?)
                        .args([
                            "poll",
                            "--convex-site",
                            &site,
                            "--agent-secret",
                            &secret,
                            "--max-pages",
                            "25",
                        ])
                        .output();
                    match poll {
                        Ok(o) if o.status.success() => {
                            let text = String::from_utf8_lossy(&o.stdout);
                            if text.contains("\"jobs\":0") {
                                tracing::debug!("no crawl jobs");
                            } else {
                                tracing::info!(%text, "poll completed");
                            }
                        }
                        Ok(o) => {
                            tracing::warn!(
                                stderr = %String::from_utf8_lossy(&o.stderr),
                                "poll failed"
                            );
                        }
                        Err(e) => tracing::warn!(error = %e, "poll spawn failed"),
                    }
                }

                tokio::time::sleep(std::time::Duration::from_secs(30)).await;
            }
        }
    }
    Ok(())
}
