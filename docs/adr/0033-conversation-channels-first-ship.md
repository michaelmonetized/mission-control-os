# First-ship Conversation channels (Visible-class)

Conversations in Mission Control CRM support these **channels in the first ship**:

| Channel | Role |
|---------|------|
| **Email** | Connected mailboxes; inbound/outbound Messages |
| **SMS** | Text messaging via Connectivity provider |
| **Social DM** | Direct messages on connected social networks |
| **Web form** | Form submissions → Conversation / Contact |
| **Live chat widget** | Site embed chat → Conversation (Visible-class) |

The Conversation model is multi-channel from day one; each Message has a channel type. Additional channels (voice, WhatsApp, etc.) may follow without redesigning Conversation.

## Why

User specified the Visible-class channel set as first-ship, not email-only phased connectors.

## Consequences

- Connectivity must ship providers for mail, SMS, social, and widget hosting/auth.
- Live chat widget is a deliverable artifact (embed script) scoped to Client/Location/Site as product defines.
- Compliance: SMS consent, email CAN-SPAM/GDPR, social platform ToS—product and legal constraints.
