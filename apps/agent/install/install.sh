#!/usr/bin/env bash
# Install Mission Control Local Agent as a user-level service (ADR-0012/0013).
# Usage:
#   ./install.sh [--bin /path/to/mc-agent] [--control-plane URL] [--uninstall]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTROL_PLANE="${MC_CONTROL_PLANE:-http://127.0.0.1:5173}"
BIN=""
UNINSTALL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bin) BIN="$2"; shift 2 ;;
    --control-plane) CONTROL_PLANE="$2"; shift 2 ;;
    --uninstall) UNINSTALL=1; shift ;;
    -h|--help)
      sed -n '2,6p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

os="$(uname -s)"
case "$os" in
  Darwin) PLATFORM=macos ;;
  Linux) PLATFORM=linux ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM=windows ;;
  *) echo "Unsupported OS: $os" >&2; exit 1 ;;
esac

if [[ -z "$BIN" ]]; then
  if [[ -x "$ROOT/target/release/mc-agent" ]]; then
    BIN="$ROOT/target/release/mc-agent"
  elif [[ -x "$ROOT/target/debug/mc-agent" ]]; then
    BIN="$ROOT/target/debug/mc-agent"
  elif command -v mc-agent >/dev/null 2>&1; then
    BIN="$(command -v mc-agent)"
  else
    echo "Build the agent first: cargo build --release -p mc-agent" >&2
    echo "Or pass --bin /path/to/mc-agent" >&2
    exit 1
  fi
fi
BIN="$(cd "$(dirname "$BIN")" && pwd)/$(basename "$BIN")"

echo "Platform: $PLATFORM"
echo "Agent:    $BIN"
echo "Control:  $CONTROL_PLANE"

install_macos() {
  local data="${HOME}/Library/Application Support/MissionControl/Agent"
  local launch="${HOME}/Library/LaunchAgents"
  local plist="${launch}/com.missioncontrol.agent.plist"
  mkdir -p "$data" "$launch" "${HOME}/Library/Logs/MissionControl"
  if [[ "$UNINSTALL" -eq 1 ]]; then
    launchctl bootout "gui/$(id -u)/com.missioncontrol.agent" 2>/dev/null || true
    rm -f "$plist"
    echo "Uninstalled LaunchAgent com.missioncontrol.agent"
    return
  fi
  sed \
    -e "s|__MC_AGENT_BIN__|${BIN}|g" \
    -e "s|__MC_CONTROL_PLANE__|${CONTROL_PLANE}|g" \
    -e "s|__MC_AGENT_DATA__|${data}|g" \
    "$ROOT/install/macos/com.missioncontrol.agent.plist" >"$plist"
  launchctl bootout "gui/$(id -u)/com.missioncontrol.agent" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$plist"
  launchctl enable "gui/$(id -u)/com.missioncontrol.agent"
  launchctl kickstart -k "gui/$(id -u)/com.missioncontrol.agent"
  echo "Installed LaunchAgent: $plist"
}

install_linux() {
  local unit_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
  local unit="${unit_dir}/mc-agent.service"
  local data="${XDG_DATA_HOME:-$HOME/.local/share}/mission-control-agent"
  mkdir -p "$unit_dir" "$data"
  if [[ "$UNINSTALL" -eq 1 ]]; then
    systemctl --user disable --now mc-agent.service 2>/dev/null || true
    rm -f "$unit"
    echo "Uninstalled systemd user unit mc-agent.service"
    return
  fi
  sed \
    -e "s|__MC_AGENT_BIN__|${BIN}|g" \
    -e "s|__MC_CONTROL_PLANE__|${CONTROL_PLANE}|g" \
    "$ROOT/install/linux/mc-agent.user.service" >"$unit"
  systemctl --user daemon-reload
  systemctl --user enable --now mc-agent.service
  echo "Installed systemd --user unit: $unit"
  echo "Tip: loginctl enable-linger \$USER  # keep agent after logout"
}

install_windows() {
  if [[ "$UNINSTALL" -eq 1 ]]; then
    powershell.exe -NoProfile -Command "Unregister-ScheduledTask -TaskName MissionControlAgent -Confirm:\$false" || true
    echo "Uninstalled Windows task MissionControlAgent"
    return
  fi
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File \
    "$ROOT/install/windows/install-user-task.ps1" \
    -AgentBin "$BIN" \
    -ControlPlane "$CONTROL_PLANE"
}

case "$PLATFORM" in
  macos) install_macos ;;
  linux) install_linux ;;
  windows) install_windows ;;
esac

echo "Done. Pair Desktop → Agent Token before crawl jobs (ADR-0016)."
