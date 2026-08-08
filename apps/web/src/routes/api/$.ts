import { createFileRoute } from "@tanstack/react-router";
import { handleApi } from "@/server/api";

/**
 * Catch-all dual-write / public CRM HTTP surface (ADR-0034 / ADR-0042).
 * Replaces SPA-era apps/web/api/[...path].ts under TanStack Start + Nitro.
 */
async function apiHandler({ request }: { request: Request }) {
  const url = new URL(request.url);
  const response = await handleApi(request, url.pathname);
  if (response) return response;
  return Response.json(
    {
      ok: false,
      error: { code: "not_found", message: `No handler for ${url.pathname}` },
    },
    { status: 404 },
  );
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: apiHandler,
      POST: apiHandler,
      PUT: apiHandler,
      PATCH: apiHandler,
      DELETE: apiHandler,
      OPTIONS: apiHandler,
    },
  },
});
