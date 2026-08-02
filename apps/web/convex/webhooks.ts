import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Outbound webhook for automations (ADR-0043 action catalog).
 * Tries inline HTTP POST; failures should hand off to Trigger (ADR-0046).
 */
export const fire = action({
  args: {
    url: v.string(),
    payload: v.optional(v.any()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const url = args.url.trim();
    if (!/^https?:\/\//i.test(url)) throw new Error("url must be http(s)");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(args.idempotencyKey
            ? { "Idempotency-Key": args.idempotencyKey }
            : {}),
        },
        body: JSON.stringify({
          source: "mission-control",
          at: Date.now(),
          payload: args.payload ?? {},
        }),
      });
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          handoff: true,
          error: `webhook HTTP ${res.status}`,
        };
      }
      return { ok: true, status: res.status, handoff: false };
    } catch (e) {
      return {
        ok: false,
        handoff: true,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
});
