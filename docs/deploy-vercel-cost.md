# Vercel cost control (preview free minutes, Blacksmith prod)

Aligned with uncap/invite / bestwnc-style shipping.

## Framework (TanStack Start monorepo)

`apps/web` is **TanStack Start** + Nitro. Project settings that must match:

| Setting | Value |
| --- | --- |
| Root Directory | `.` (repo root) — current linked project |
| Framework Preset | `tanstack-start` |
| Output Directory | **unset / auto** (never `dist` or `apps/web/dist`) |
| Install | `bun install` |
| Build | `bun run build && node scripts/vercel-promote-boa.mjs` |

Nitro writes Build Output API to **`apps/web/.vercel/output`**. The promote script copies it to **repo-root `.vercel/output`** so Vercel (Root Directory = `.`) consumes BOA instead of looking for SPA `dist`.

If you switch Root Directory to `apps/web` in the dashboard, use `apps/web/vercel.json` only (install/build `cd ../..`) and the promote script is unnecessary for Git deploys — keep one strategy, not both half-configured.

Do **not** set SPA `rewrites` to `index.html`.

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

When ready to ship production, use **Blacksmith prebuilt** (`.github/workflows/deploy-production.yml`):

1. `bun install` + `bun run build` (Nitro vercel preset → `apps/web/.vercel/output`)
2. `node scripts/vercel-promote-boa.mjs` → root `.vercel/output`
3. `vercel pull` + `vercel deploy --prebuilt --prod` (**no** second `vercel build`)

Do **not** re-enable Git production auto-deploy on `main` once Blacksmith is wired, or you pay twice.

## Agent rules

- Prefer pushes to stack/PR branches only
- Do **not** push to `main` to “test deploy”
- Do **not** run `vercel deploy --prod` unless the user asked for a production ship
