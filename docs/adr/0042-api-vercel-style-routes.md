# Public and app API: Vercel-style paths (no version in URL)

Mission Control HTTP APIs use **Vercel / filesystem-route style** paths under `/api/…`, organized by **module** and **action**. **No API version segment in the path** (no `/v1/`). Versioning, if needed later, is via headers or negotiated schema—not URL prefixes.

## Pattern

```
/api/<module>/<action>
/api/<module>/<noun>/...
```

Prefer **single path words** when clear; use **kebab-case** only when a multi-word segment is unavoidable. Prefer nested single words over compound kebabs:

| Prefer | Avoid |
|--------|--------|
| `/api/crawl/run` | `/api/v1/crawl-run/start` |
| `/api/crawl/results` | `/api/crawlRun/results` |
| `/api/clients/list` | `/api/clients/list/{clientId}` |
| `/api/clients/update` | `/api/clients/{clientId}` PATCH-only REST |
| `/api/notify/email` | `/api/notify/(email)` required syntax |
| `/api/tasks/list` | `/api/v1/tasks/list` |

### Identifiers and filters in the body

**Do not put resource IDs in the URL** for normal CRUD/list. Send ids, filters, and pagination in the **JSON body** (or consistent JSON envelope):

```json
// POST /api/clients/list
{ "filters": { "query": "acme" }, "cursor": null, "limit": 50 }

// POST /api/clients/update
{ "clientId": "…", "patch": { "name": "Acme LLC" } }

// POST /api/crawl/run
{ "siteId": "…", "ignoreRobots": false }
```

HTTP method may be POST for list/update for body uniformity, or GET+body avoided; **prefer POST for list/filter and mutations** so all args stay in JSON (document in OpenAPI).

## Modules (illustrative)

`crm`, `clients`, `contacts`, `tasks`, `projects`, `crawl`, `audit`, `social`, `email`, `notify`, `agent`, `portal`, …

CRM dual workspace: pass `workspaceId` / scope in body, not only URL.

## Auth

Clerk session, API key, or Agent Token via headers. Agency/Client authorization enforced server-side from auth + body ids.

## Why

User-specified: no version in paths; kebabs only when needed; single-word segments (`crawl/run`, `crawl/results`); ids and filters in JSON body on routes like `/api/clients/list`, `/api/clients/update`.

## Consequences

- Protocol/OpenAPI documents body schemas per route; path params are rare (optional catch-alls only if platform forces).
- Cacheable GETs for public unauthenticated assets only; authenticated list uses POST+body.
- Breaking changes require coordinated client updates or header versioning—not parallel `/v2` trees by default.
