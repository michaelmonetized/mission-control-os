# Vercel cost control (preview free minutes, Blacksmith prod)

Aligned with uncap/invite / bestwnc-style shipping.

## Framework

`apps/web` is **TanStack Start** + Nitro (`framework: "tanstack-start"` in root and `apps/web/vercel.json`). Preview builds use Vercel's Start detection; do not set SPA `rewrites` to `index.html`.

## Free preview minutes only

`vercel.json` disables Git production auto-deploy for `main` / `master`:

```json
"git": {
  "deploymentEnabled": {
    "main": false,
    "master": false
  }
}
```

- **PR / stack branches** → Preview deploys (hobby free minutes)
- **Pushes to `main`** → **no** Vercel compile/deploy from Git

Project-level belt-and-suspenders: ignore-build command skips `main`/`master` even if config drifts.

## Production without Vercel build minutes

When ready to ship production, use **Blacksmith prebuilt** (same pattern as `uncap.us` / `invite`):

1. Build on Blacksmith runner (`blacksmith-4vcpu-ubuntu-2404`)
2. `vercel deploy --prebuilt --prod`

See `uncap.us/docs/blacksmith-vercel-ship.md`. Do **not** re-enable Git production auto-deploy on `main` once Blacksmith is wired, or you pay twice.

## Agent rules

- Prefer pushes to stack/PR branches only
- Do **not** push to `main` to “test deploy”
- Do **not** run `vercel deploy --prod` unless the user asked for a production ship
