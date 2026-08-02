# Client Portal access: email invites + email allowlist

Client Users gain portal access through **either**:

1. **Email invite link (A)** — Agency staff invite a specific email; Resend (or Clerk invitation) delivers a link; on accept, Convex writes the Client grant (ADR-0026).
2. **Email allowlist claim (C)** — Agency adds allowed emails (or patterns) for a Client; when that person signs in with a matching Clerk email, they can **claim** the grant without a one-off invite send.

Both paths produce the same end state: Clerk User outside Agency org + Convex ACL → Client/Locations.

## Why

- Invites cover ad-hoc stakeholders and clear audit (“who invited”).
- Allowlist covers recurring “anyone at billing@client.com / owner@client.com” without re-sending for every login or known SSO emails.

## Considered

- Shareable codes (B) — weaker control; rejected.
- Invites only or allowlist only — incomplete for real agencies.

## Consequences

- Control Plane UI: Invite + Allowlist management per Client.
- Claim flow must prevent grant theft (exact email match; optional domain allowlist is stricter product choice—default **exact emails** unless later expanded).
- Revoke removes grant and invalidates invite; allowlist removal blocks future claims.
