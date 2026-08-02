//! Mission Control TUI — Mocha ANSI sparse cockpit (DSD-0002 TUI mapping, ADR-0005/0006)
//! Equal surface: j/k navigate · : command palette seed · connects to Control Plane later.

use std::io::{self, Write};

/// Catppuccin Mocha → 256-color / truecolor ANSI (DSD open Q #5 seed).
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
    "Tasks",
    "Audit",
    "Social",
    "Email",
    "Automations",
    "Portal",
];

fn main() {
    let mut selected = 0usize;
    let mut command = String::new();
    let mut mode = Mode::Navigate;

    println!(
        "{bold}{sky}Mission Control{reset} {dim}TUI{reset}",
        bold = mocha::BOLD,
        sky = mocha::SKY,
        reset = mocha::RESET,
        dim = mocha::DIM
    );
    println!(
        "{sub}j/k navigate · Enter open · : command · q quit{reset}",
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
                    println!(
                        "{sky}→ {mod}{reset} {sub}(wire Sync Fabric HTTP later){reset}",
                        sky = mocha::SKY,
                        mod = MODULES[selected],
                        reset = mocha::RESET,
                        sub = mocha::SUB
                    );
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
