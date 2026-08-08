import { handleApi } from "../src/server/api";

/**
 * Legacy Vercel serverless entry (SPA-era).
 * Primary path under TanStack Start + Nitro: `src/routes/api/$.ts` server handlers.
 * Kept for local/tooling compatibility; BOA deploys serve the Start route.
 */
export default async function handler(req: Request) {
  const url = new URL(req.url);
  const response = await handleApi(req, url.pathname);
  if (response) return response;
  return Response.json(
    { ok: false, error: { code: "not_found", message: `No handler for ${url.pathname}` } },
    { status: 404 },
  );
}
