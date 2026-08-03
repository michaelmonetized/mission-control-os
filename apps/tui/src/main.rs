//! Mission Control TUI — Mocha ANSI sparse cockpit (DSD-0002 TUI mapping, ADR-0005/0006)
//! Equal surface: j/k navigate · : command palette · HTTP query sync fabric to Control Plane.

use std::io::{self, Write};

mod mocha {
    pub const BASE: &str = "\x1b[38;2;30;30;46m"; // #1e1e2e
    pub const TEXT: &str = "\x1b[38;2;205;214;244m"; // #cdd6f4
    pub const SUB: &str = "\x1b[38;2;166;173;200m"; // #a6adc8
    pub const SKY: &str = "\x1b[38;2;137;220;235m"; // #89dceb
    pub const FLAMINGO: &str = "\x1b[38;2;242;205;205m"; // #f2cdcd
    pub const GREEN: &str = "\x1b[38;2;166;227;161m";
    pub const RESET: &str = "\x1b[0m";
    pub const BOLD: &str = "\x1b[1m";
    pub const DIM: &str = "\x1b[2m";
}

const MODULES: &[&str] = &[
    "Cockpit",
    "Clients",
    "CRM",
    "Pipeline",
    "Tasks",
    "Audit",
    "Social",
    "Email",
    "Automations",
    "Activity",
    "Portal",
    "Settings",
];

fn control_plane_url() -> String {
    std::env::var("MC_CONTROL_PLANE").unwrap_or_else(|_| "http://127.0.0.1:5173".to_string())
}

fn fetch_module_data(module: &str) -> Result<String, String> {
    let base = control_plane_url();
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(4))
        .build()
        .map_err(|e| e.to_string())?;

    let endpoint = match module {
        "Clients" => format!("{base}/api/clients/list"),
        "CRM" => format!("{base}/api/crm/contacts/list"),
        "Pipeline" => format!("{base}/api/pipeline/board"),
        "Tasks" => format!("{base}/api/tasks/list"),
        "Audit" => format!("{base}/api/crawl/results"),
        "Social" => format!("{base}/api/social/posts/list"),
        "Automations" => format!("{base}/api/automations/list"),
        "Email" => format!("{base}/api/email/domains/list"),
        "Activity" => format!("{base}/api/activity/list"),
        _ => format!("{base}/api/agent/heartbeat"),
    };

    let res = client
        .post(&endpoint)
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({}))
        .send();

    match res {
        Ok(resp) => {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            Ok(format!("Status {status}: {text}"))
        }
        Err(e) => Err(format!("Control Plane offline ({e})")),
    }
}

fn main() {
    let mut selected = 0usize;
    let mut command = String::new();
    let mut mode = Mode::Navigate;

    println!(
        "{bold}{sky}Mission Control{reset} {dim}TUI Surface{reset}",
        bold = mocha::BOLD,
        sky = mocha::SKY,
        reset = mocha::RESET,
        dim = mocha::DIM
    );
    println!(
        "{sub}j/k navigate · Enter fetch Control Plane · : command · q quit{reset}",
        sub = mocha::SUB,
        reset = mocha::RESET
    );
    println!();

    loop {
        draw(selected, &mode, &command);
        let mut line = String::new();
        if io::stdin().read_line(&mut line).is_err() {
            break;
        }
        let key = line.trim();
        match mode {
            Mode::Navigate => match key {
                "j" | "down" => selected = (selected + 1).min(MODULES.len() - 1),
                "k" | "up" => selected = selected.saturating_sub(1),
                "" | "enter" | "l" => {
                    let m = MODULES[selected];
                    println!(
                        "{sky}→ Querying Control Plane for {m}...{reset}",
                        sky = mocha::SKY,
                        m = m,
                        reset = mocha::RESET
                    );
                    match fetch_module_data(m) {
                        Ok(data) => println!(
                            "{green}✓ {m} Live Data:{reset}\n{sub}{data}{reset}",
                            green = mocha::GREEN,
                            m = m,
                            reset = mocha::RESET,
                            sub = mocha::SUB
                        ),
                        Err(err) => println!(
                            "{flamingo}✗ {m}: {err}{reset}",
                            flamingo = mocha::FLAMINGO,
                            m = m,
                            err = err,
                            reset = mocha::RESET
                        ),
                    }
                }
                ":" => {
                    mode = Mode::Command;
                    command.clear();
                }
                "q" | "quit" => break,
                _ => {}
            },
            Mode::Command => {
                if key.is_empty() || key == "esc" {
                    mode = Mode::Navigate;
                    command.clear();
                } else {
                    command = key.to_string();
                    if let Some(i) = MODULES
                        .iter()
                        .position(|m| m.to_lowercase().starts_with(&command.to_lowercase()))
                    {
                        selected = i;
                        println!(
                            "{green}:{command} → {mod}{reset}",
                            green = mocha::GREEN,
                            command = command,
                            mod = MODULES[i],
                            reset = mocha::RESET
                        );
                    } else {
                        println!(
                            "{flamingo}: unknown {command}{reset}",
                            flamingo = mocha::FLAMINGO,
                            command = command,
                            reset = mocha::RESET
                        );
                    }
                    mode = Mode::Navigate;
                    command.clear();
                }
            }
        }
    }
}

enum Mode {
    Navigate,
    Command,
}

fn draw(selected: usize, mode: &Mode, command: &str) {
    let _ = io::stdout().flush();
    for (i, m) in MODULES.iter().enumerate() {
        if i == selected {
            println!(
                "  {sky}{bold}> {m}{reset}",
                sky = mocha::SKY,
                bold = mocha::BOLD,
                m = m,
                reset = mocha::RESET
            );
        } else {
            println!("    {text}{m}{reset}", text = mocha::TEXT, m = m, reset = mocha::RESET);
        }
    }
    match mode {
        Mode::Navigate => print!(
            "\n{dim}nav{reset}> ",
            dim = mocha::DIM,
            reset = mocha::RESET
        ),
        Mode::Command => print!(
            "\n{sky}:{command}{reset}",
            sky = mocha::SKY,
            command = command,
            reset = mocha::RESET
        ),
    }
    let _ = io::stdout().flush();
}
