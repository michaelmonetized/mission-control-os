# Agent daemon runs at user level

The Local Agent service is **user-level**, not machine-wide root/SYSTEM:

| Platform | Default install |
|----------|-----------------|
| macOS | LaunchAgent (user domain) |
| Linux | systemd **user** unit (`systemd --user`) |
| Windows | Per-user service / equivalent user-session host |

No admin elevation is required for the default path. Multi-User agencies get **one Agent per OS user account** that installs it (or multiple user Agents on one machine), not a single shared root daemon.

## Why

- Lowest friction install for agency operators (MVP adoption).
- Avoids machine-wide privilege and sandbox horror for a process that fetches arbitrary client Sites.
- Aligns with “my laptop / my login” as the primary always-available worker.

## Considered

- Machine-level service (B) — better for shared office servers; higher privilege and IT friction.
- User default + machine opt-in (C) — more installer surface; deferred.
- Container-only (D) — power-user/VPS path later, not default.

## Consequences

- Agent lifetime follows the user session model unless the OS is configured for lingering (`loginctl enable-linger`, macOS user still logged in, etc.). Document this for “scheduled crawl while logged out.”
- Shared office mini-PC: create a dedicated OS user that stays logged in / lingering, or accept machine-level as a future opt-in.
- IPC and credential store are per-user (keychain/libsecret/cred manager under that account).
