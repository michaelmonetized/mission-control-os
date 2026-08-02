# Public and app API: Vercel-style path segments

Mission Control HTTP APIs follow **Vercel / filesystem-route style** paths under `/api/…`, organized by **module** then **verb or resource action**, not deep nested REST alone.

## Pattern

```
/api/<module>/<action>/...
/api/<module>/(alt|branches)/...
```

### Examples (illustrative, locked as style)

| Path | Intent |
|------|--------|
| `/api/notify/(email\|sms)` | Notification send by channel branch |
| `/api/crm/add/client` | Create Client (CRM / tenancy) |
| `/api/tasks/list` | List Tasks |
| `/api/crm/...`, `/api/tasks/...`, `/api/audit/...`, `/api/social/...`, `/api/email/...` | Module prefixes |

Branch segments use parentheses grouping where the platform allows (e.g. TanStack/Vite or Next-style route groups) or equivalent explicit paths `/api/notify/email`, `/api/notify/sms` with the same conceptual tree.

## Conventions

- **module** first: `crm`, `tasks`, `audit`, `social`, `email`, `notify`, `agent`, `portal`, …  
- **action** as path segment: `add`, `list`, `get`, `update`, `remove`, domain verbs (`start-crawl`, `share-finding`) when clearer than CRUD  
- JSON request/response; errors with stable `code` + message  
- Auth: Clerk session or API key / Agent Token; Agency org and CRM Workspace scope via headers or body as protocol defines  
- Versioning: prefer `/api/v1/...` prefix once public (protocol repo), or header version—default **`/api/v1/`** for external CRM/API consumers  

Internal TanStack server routes and public API share the same path philosophy so agents and humans navigate one tree.

## Why

User-specified Vercel-style routes (`/api/notify/(email|sms)`, `/api/crm/add/client`, `/api/tasks/list`) over pure GraphQL or deep REST nesting.

## Consequences

- OpenAPI in protocol repo documents these paths per module.  
- Not forbidden to use resource IDs: e.g. `/api/tasks/get/:taskId` or `/api/tasks/get` + id body—prefer consistent choice in protocol (recommend **path id for get/update/remove**, body for complex list filters).  
- Dual CRM: workspace id required on CRM routes (`workspaceId` / `clientId` as specified in protocol).
