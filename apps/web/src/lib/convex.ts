import { ConvexReactClient } from "convex/react";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!url) {
  console.error(
    "VITE_CONVEX_URL is not set — Convex queries will fail until env is configured (Vercel / .env.local)",
  );
}

/** Placeholder only for local/dev builds missing env; real URL required on deployed previews. */
export const convex = new ConvexReactClient(url ?? "https://placeholder.convex.cloud");
