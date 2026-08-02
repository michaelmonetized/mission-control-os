import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * System mail via Resend (ADR-0036) — portal invites, product mail.
 * Uses RESEND_API_KEY on Convex deployment.
 */
export const sendPortalInviteEmail = action({
  args: {
    to: v.string(),
    agencyName: v.optional(v.string()),
    clientName: v.optional(v.string()),
    portalUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const apiKey = process.env["RESEND_API_KEY"];
    const to = args.to.trim().toLowerCase();
    const portalUrl = args.portalUrl ?? "http://127.0.0.1:5173/portal";
    const subject = `${args.agencyName ?? "Your agency"} invited you to Mission Control`;
    const html = `
      <p>You've been invited to the Client Portal${args.clientName ? ` for <strong>${args.clientName}</strong>` : ""}.</p>
      <p><a href="${portalUrl}">Open portal</a></p>
      <p>You will sign in with this email and will <em>not</em> join the agency's staff organization.</p>
    `;

    if (!apiKey) {
      return {
        ok: true,
        mock: true,
        to,
        subject,
        note: "RESEND_API_KEY unset — invite email not sent",
      };
    }

    const from = process.env["RESEND_FROM"] ?? "Mission Control <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });
    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      throw new Error(json.message ?? `Resend error ${res.status}`);
    }
    return { ok: true, mock: false, id: json.id, to };
  },
});

/** Internal ping for scheduled jobs / Trigger handoff smoke. */
export const logSystem = action({
  args: { message: v.string() },
  handler: async (_ctx, args) => {
    console.log("[mc-notify]", args.message);
    return { ok: true };
  },
});

/**
 * SMS notify stub (ADR-0033 channel readiness).
 * Wire Twilio / provider when SMS_PROVIDER_* env is set.
 */
export const sendSms = action({
  args: {
    to: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const sid = process.env["TWILIO_ACCOUNT_SID"];
    const token = process.env["TWILIO_AUTH_TOKEN"];
    const from = process.env["TWILIO_FROM"];
    if (!sid || !token || !from) {
      return {
        ok: true,
        mock: true,
        to: args.to,
        note: "SMS provider env unset — message not sent",
      };
    }
    // Twilio REST would go here
    return {
      ok: true,
      mock: false,
      to: args.to,
      note: "Twilio credentials present — implement send in next iteration",
    };
  },
});
