# Connected Accounts may be owned by Agency or Client

**Connectivity** allows **either** Agency staff or Client Users to attach **Connected Accounts** (social, mail, ads, etc.), subject to workspace permissions.

- Prefer **Client-owned** connections for Client brand channels when the Client can complete OAuth.
- **Agency-owned** connections are valid when the agency operates the channel with permission (common in local SEO retainers).
- Credentials and tokens are scoped to the CRM/tenancy workspace and never leak across Clients.

## Why

Mixed real-world ownership: some clients never log into Meta Business; some insist on owning the Instagram login.

## Consequences

- UI: “Connect as Agency” vs “Connect as Client” with clear who can disconnect/rotate.
- Publish path uses the Connected Account bound to that Social Post / Location.
- Client Portal includes Connectivity for Client-owned accounts; Agency can manage both with audit trail.
