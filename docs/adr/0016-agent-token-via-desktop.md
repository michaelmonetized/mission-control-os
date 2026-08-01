# Agent credentials: Desktop-issued long-lived token

The Local Agent does not use interactive Clerk login. **Desktop** (Electron), after a normal Clerk User + Agency (org) session, **mints or fetches an Agent credential** and **writes it into the user-level secret store** for the daemon.

## Flow

1. Operator signs into Mission Control in Desktop (Clerk).
2. On **Agent install / first link**, Desktop requests an **Agent token** (long-lived refresh credential + orgscope) from the Control Plane, bound to that **User + Agency**.
3. Desktop **writes** the credential to the OS user secret store (keychain / libsecret / Windows Credential Manager)—not plaintext next to the binary.
4. On **Desktop open**, Desktop **checks** token validity and **refreshes or rotates** if needed, rewriting the store.
5. The **Agent daemon** reads the store, uses short-lived access tokens for Control Plane calls, and **must be able to refresh using the long-lived credential without Desktop running** (scheduled Crawl Runs). Desktop repair-on-open is backup, not the only refresh path.

## Why

- Matches “use Desktop auth state” UX without sharing Electron memory with the daemon.
- Fits user-level service (ADR-0013) and Clerk org = Agency (ADR-0015).
- Avoids a separate human login ceremony for the Agent.

## Considered

- Live session only while Desktop is open — breaks always-on crawls.
- Org machine tokens only — worse laptop UX; deferred as optional later.
- Agent embeds full Clerk SPA — wrong process model.

## Consequences

- Control Plane needs Agent credential APIs: issue, refresh, revoke (per User/Agent device).
- Revoke on password reset / org removal / “unlink this machine.”
- Multiple machines ⇒ multiple Agent credentials per User/Agency.
- Headless: one-time Desktop (or future CLI) link still required unless machine tokens are added later.
- Prefer refresh-token shape: long-lived refresh + short-lived access; “forever JWT with no refresh” is rejected.
