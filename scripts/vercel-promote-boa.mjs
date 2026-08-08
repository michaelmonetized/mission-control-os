#!/usr/bin/env node
/**
 * Promote Nitro Vercel Build Output API from the web package to the monorepo root.
 *
 * Vercel project Root Directory is `.` (repo root). Workspace build writes
 * `apps/web/.vercel/output`; the platform only auto-consumes `.vercel/output`
 * at the project root (STATIC_BUILD_NO_OUT_DIR if missing).
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = join(root, "apps/web/.vercel/output");
const dest = join(root, ".vercel/output");

if (!existsSync(src)) {
  console.error(
    "[vercel-promote-boa] Missing apps/web/.vercel/output — run the web build first (nitro vercel preset).",
  );
  process.exit(1);
}

const configJson = join(src, "config.json");
const nitroJson = join(src, "nitro.json");
if (!existsSync(configJson) && !existsSync(nitroJson)) {
  console.error(
    "[vercel-promote-boa] apps/web/.vercel/output has no config.json/nitro.json — incomplete BOA.",
  );
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(join(root, ".vercel"), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[vercel-promote-boa] Promoted apps/web/.vercel/output → .vercel/output");
