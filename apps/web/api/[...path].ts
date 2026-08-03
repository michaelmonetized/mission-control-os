import { handleApi } from "../src/server/api";

/** Vercel Serverless Function route handler for /api/* (ADR-0042 / ADR-0029) */
export default async function handler(req: Request) {
  const url = new URL(req.url);
  const response = await handleApi(req, url.pathname);
  if (response) return response;
  return Response.json(
    { ok: false, error: { code: "not_found", message: `No handler for ${url.pathname}` } },
    { status: 404 },
  );
}
