/**
 * Stripe webhook signature verify + event normalize (ADR-0001/0031).
 * Pure Web Crypto — runs in Convex httpAction (no Node stripe SDK).
 */

export type NormalizedStripeBilling = {
  type: string;
  agencyId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan?: "starter" | "pro" | "enterprise";
  status?: "active" | "past_due" | "canceled" | "trialing";
  currentPeriodEnd?: number;
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify `Stripe-Signature` header (t=…,v1=…).
 * Rejects if timestamp skew > 5 minutes.
 */
export async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
  toleranceSec = 300,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!signatureHeader) return { ok: false, error: "missing Stripe-Signature" };
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, ...rest] = p.trim().split("=");
      return [k, rest.join("=")];
    }),
  ) as Record<string, string>;
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return { ok: false, error: "malformed Stripe-Signature" };

  const ts = Number(t);
  if (!Number.isFinite(ts)) return { ok: false, error: "bad timestamp" };
  const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (skew > toleranceSec) return { ok: false, error: "timestamp outside tolerance" };

  const expected = await hmacSha256Hex(webhookSecret, `${t}.${rawBody}`);
  if (!timingSafeEqual(expected, v1)) {
    return { ok: false, error: "signature mismatch" };
  }
  return { ok: true };
}

function mapStripeStatus(
  s: string | undefined,
): "active" | "past_due" | "canceled" | "trialing" | undefined {
  if (s === "active" || s === "past_due" || s === "canceled" || s === "trialing") {
    return s;
  }
  if (s === "unpaid" || s === "incomplete") return "past_due";
  if (s === "incomplete_expired") return "canceled";
  return undefined;
}

function planFromMeta(
  meta: Record<string, string> | undefined,
): "starter" | "pro" | "enterprise" | undefined {
  const p = meta?.plan;
  if (p === "starter" || p === "pro" || p === "enterprise") return p;
  return undefined;
}

/**
 * Extract billing fields from common Stripe event types.
 */
export function normalizeStripeEvent(event: {
  type: string;
  data?: { object?: Record<string, unknown> };
}): NormalizedStripeBilling {
  const type = event.type;
  const obj = (event.data?.object ?? {}) as Record<string, unknown>;
  const meta = (obj.metadata ?? {}) as Record<string, string>;

  if (type === "checkout.session.completed") {
    const agencyId =
      (obj.client_reference_id as string | undefined) ?? meta.agencyId;
    const subId = obj.subscription as string | undefined;
    const customerId = obj.customer as string | undefined;
    return {
      type,
      agencyId,
      stripeCustomerId: typeof customerId === "string" ? customerId : undefined,
      stripeSubscriptionId: typeof subId === "string" ? subId : undefined,
      plan: planFromMeta(meta),
      status: "active",
      // period end filled when subscription events arrive; provisional 30d
      currentPeriodEnd: Date.now() + 30 * 864e5,
    };
  }

  if (
    type === "customer.subscription.created" ||
    type === "customer.subscription.updated" ||
    type === "customer.subscription.deleted"
  ) {
    const subMeta = (obj.metadata ?? {}) as Record<string, string>;
    const items = obj.items as { data?: { price?: { id?: string } }[] } | undefined;
    const priceId = items?.data?.[0]?.price?.id;
    let plan = planFromMeta(subMeta);
    if (!plan && priceId) {
      // env map is only available at process level
      const map: Record<string, "starter" | "pro" | "enterprise"> = {};
      const s = process.env.STRIPE_PRICE_STARTER;
      const p = process.env.STRIPE_PRICE_PRO;
      const e = process.env.STRIPE_PRICE_ENTERPRISE;
      if (s) map[s] = "starter";
      if (p) map[p] = "pro";
      if (e) map[e] = "enterprise";
      plan = map[priceId];
    }
    const periodEnd = obj.current_period_end;
    const status =
      type === "customer.subscription.deleted"
        ? ("canceled" as const)
        : mapStripeStatus(obj.status as string | undefined);

    return {
      type,
      agencyId: subMeta.agencyId,
      stripeCustomerId:
        typeof obj.customer === "string" ? obj.customer : undefined,
      stripeSubscriptionId: typeof obj.id === "string" ? obj.id : undefined,
      plan,
      status,
      currentPeriodEnd:
        typeof periodEnd === "number" ? periodEnd * 1000 : Date.now() + 30 * 864e5,
    };
  }

  if (type === "invoice.payment_failed") {
    const lines = obj.lines as
      | { data?: { metadata?: Record<string, string> }[] }
      | undefined;
    const lineMeta = lines?.data?.[0]?.metadata;
    return {
      type,
      agencyId: lineMeta?.agencyId ?? meta.agencyId,
      stripeCustomerId:
        typeof obj.customer === "string" ? obj.customer : undefined,
      stripeSubscriptionId:
        typeof obj.subscription === "string" ? obj.subscription : undefined,
      plan: planFromMeta(lineMeta ?? meta),
      status: "past_due",
      currentPeriodEnd: Date.now(),
    };
  }

  return { type };
}
