import { ConvexReactClient } from "convex/react";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!url) {
  console.warn(
    "VITE_CONVEX_URL is not set — Convex queries will fail until .env.local is configured",
  );
}

export const convex = new ConvexReactClient(url ?? "https://placeholder.convex.cloud");
