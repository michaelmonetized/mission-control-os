//! Mission Control Local Agent — user-level daemon (ADR-0012/0013/0016/0004/0022)
//! Fetches Sites, streams results to Control Plane, cleans artifacts after runs.

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
    },
    /// Heartbeat against Control Plane
    Heartbeat {
        #[arg(long, default_value = "http://127.0.0.1:5173")]
        control_plane: String,
    },
    /// Print agent data dir
    Paths,
}

#[derive(Serialize, Deserialize, Default)]
struct AgentConfig {
    refresh_token: Option<String>,
    agency_id: Option<String>,
}

fn data_dir() -> PathBuf {
    ProjectDirs::from("com", "MissionControl", "Agent")
        .map(|p| p.data_dir().to_path_buf())
        .unwrap_or_else(|| PathBuf::from(".mc-agent"))
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
        Commands::Daemon { control_plane } => {
            tracing::info!(%control_plane, "mc-agent daemon starting (user-level service)");
            let d = data_dir();
            fs::create_dir_all(d.join("artifacts"))?;
            // Load token from secret store path (Desktop writes ADR-0016)
            let config_path = d.join("config.json");
            if !config_path.exists() {
                tracing::warn!("no config.json — pair via Desktop Agent Token first");
            }
            loop {
                let url = format!(
                    "{}/api/agent/heartbeat",
                    control_plane.trim_end_matches('/')
                );
                match reqwest::Client::new()
                    .post(&url)
                    .json(&serde_json::json!({ "status": "idle" }))
                    .send()
                    .await
                {
                    Ok(r) => tracing::debug!(status = r.status().as_u16(), "heartbeat"),
                    Err(e) => tracing::warn!(error = %e, "heartbeat failed"),
                }
                // Poll for crawl jobs, run rendered crawl, stream findings, cleanup artifacts
                tokio::time::sleep(std::time::Duration::from_secs(30)).await;
            }
        }
    }
    Ok(())
}
