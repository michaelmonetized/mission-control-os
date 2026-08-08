import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/** List Email Domains for Agency (Agency ESP) or a Client (Client ESP). */
export const listDomains = query({
  args: {
    clientId: v.optional(v.id("clients")),
    /** When true, return all domains for the agency (agency + client). */
    all: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const rows = await ctx.db
      .query("emailDomains")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();

    const filtered = args.all
      ? rows
      : args.clientId
        ? rows.filter((d) => d.clientId === args.clientId)
        : rows.filter((d) => d.clientId === undefined);

    return filtered.map((d) => ({
      id: d._id,
      domain: d.domain,
      verified: d.verified,
      status: d.status,
      resendDomainId: d.resendDomainId,
      dnsRecords: d.dnsRecords,
      clientId: d.clientId,
    }));
  },
});

export const getDomainInternal = internalQuery({
  args: { id: v.id("emailDomains") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const ensureAgencyId = internalMutation({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    const agency = await getAgencyByClerkOrg(ctx, args.clerkOrgId);
    if (!agency) throw new Error("Agency not found — open cockpit once to ensureMine");
    return agency._id as Id<"agencies">;
  },
});

export const upsertDomainRecord = internalMutation({
  args: {
    agencyId: v.id("agencies"),
    clientId: v.optional(v.id("clients")),
    domain: v.string(),
    verified: v.boolean(),
    resendDomainId: v.optional(v.string()),
    dnsRecords: v.optional(v.any()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailDomains")
      .withIndex("by_agency", (q) => q.eq("agencyId", args.agencyId))
      .collect();
    const match = existing.find(
      (d) =>
        d.domain === args.domain &&
        (args.clientId ? d.clientId === args.clientId : d.clientId === undefined),
    );
    if (match) {
      await ctx.db.patch(match._id, {
        verified: args.verified,
        resendDomainId: args.resendDomainId,
        dnsRecords: args.dnsRecords,
        status: args.status,
      });
      return match._id;
    }
    return ctx.db.insert("emailDomains", {
      agencyId: args.agencyId,
      clientId: args.clientId,
      domain: args.domain,
      verified: args.verified,
      resendDomainId: args.resendDomainId,
      dnsRecords: args.dnsRecords,
      status: args.status,
    });
  },
});

function orgIdFromIdentity(identity: Record<string, unknown>) {
  return (
    (identity.org_id as string | undefined) ??
    (identity.orgId as string | undefined) ??
    undefined
  );
}

/**
 * Provision domain via Resend API (ADR-0036).
 * Set `RESEND_API_KEY` on the Convex deployment (`bunx convex env set RESEND_API_KEY re_...`).
 * Without a key, returns mock DNS records so onboarding UI can be developed.
 */
type ProvisionResult = {
  id: Id<"emailDomains">;
  domain: string;
  verified: boolean;
  status: string;
  resendDomainId: string | undefined;
  dnsRecords: unknown;
  mock: boolean;
};

export const provisionDomain = action({
  args: {
    domain: v.string(),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args): Promise<ProvisionResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const orgId = orgIdFromIdentity(identity as Record<string, unknown>);
    if (!orgId) throw new Error("No active Agency organization");

    const domain = args.domain.trim().toLowerCase();
    if (!domain) throw new Error("domain required");

    const agencyId: Id<"agencies"> = await ctx.runMutation(internal.email.ensureAgencyId, {
      clerkOrgId: orgId,
    });

    const apiKey = process.env["RESEND_API_KEY"];

    let resendDomainId: string | undefined;
    let dnsRecords: unknown = null;
    let status = "pending_dns";
    let verified = false;
    let mock = false;

    if (!apiKey) {
      mock = true;
      resendDomainId = `mock_${domain}`;
      dnsRecords = [
        {
          record: "DKIM",
          type: "TXT",
          name: "resend._domainkey",
          value: "p=mock-dkim — set RESEND_API_KEY on Convex for live provision",
          ttl: "Auto",
          status: "not_started",
        },
        {
          record: "SPF",
          type: "TXT",
          name: "send",
          value: "v=spf1 include:amazonses.com ~all",
          ttl: "Auto",
          status: "not_started",
        },
        {
          record: "MX",
          type: "MX",
          name: "send",
          value: "feedback-smtp.us-east-1.amazonses.com",
          priority: 10,
          ttl: "Auto",
          status: "not_started",
        },
      ];
      status = "pending_dns_mock";
    } else {
      const createRes = await fetch("https://api.resend.com/domains", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      });
      const createJson = (await createRes.json()) as {
        id?: string;
        status?: string;
        records?: unknown;
        message?: string;
      };

      if (!createRes.ok) {
        const listRes = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const listJson = (await listRes.json()) as {
          data?: { id: string; name: string; status: string }[];
        };
        const found = listJson.data?.find((d) => d.name === domain);
        if (!found) {
          throw new Error(createJson.message ?? `Resend error ${createRes.status}`);
        }
        resendDomainId = found.id;
        const getRes = await fetch(`https://api.resend.com/domains/${found.id}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const getJson = (await getRes.json()) as { records?: unknown; status?: string };
        dnsRecords = getJson.records ?? null;
        status = getJson.status ?? found.status;
        verified = status === "verified";
      } else {
        resendDomainId = createJson.id;
        dnsRecords = createJson.records ?? null;
        status = createJson.status ?? "not_started";
        verified = status === "verified";
      }
    }

    const id: Id<"emailDomains"> = await ctx.runMutation(internal.email.upsertDomainRecord, {
      agencyId,
      clientId: args.clientId,
      domain,
      verified,
      resendDomainId,
      dnsRecords,
      status,
    });

    return { id, domain, verified, status, resendDomainId, dnsRecords, mock };
  },
});

/** Trigger Resend verify + refresh DNS/status (pollable from UI). */
export const verifyDomain = action({
  args: {
    emailDomainId: v.id("emailDomains"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ verified: boolean; status: string; mock: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const row = await ctx.runQuery(internal.email.getDomainInternal, {
      id: args.emailDomainId,
    });
    if (!row) throw new Error("domain not found");

    const apiKey = process.env["RESEND_API_KEY"];

    if (!apiKey || !row.resendDomainId || row.resendDomainId.startsWith("mock_")) {
      await ctx.runMutation(internal.email.upsertDomainRecord, {
        agencyId: row.agencyId,
        clientId: row.clientId,
        domain: row.domain,
        verified: true,
        resendDomainId: row.resendDomainId,
        dnsRecords: row.dnsRecords,
        status: "verified_mock",
      });
      return { verified: true, status: "verified_mock", mock: true };
    }

    await fetch(`https://api.resend.com/domains/${row.resendDomainId}/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const getRes = await fetch(`https://api.resend.com/domains/${row.resendDomainId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const getJson = (await getRes.json()) as {
      status?: string;
      records?: unknown;
    };
    const status = getJson.status ?? "pending";
    const verified = status === "verified";

    await ctx.runMutation(internal.email.upsertDomainRecord, {
      agencyId: row.agencyId,
      clientId: row.clientId,
      domain: row.domain,
      verified,
      resendDomainId: row.resendDomainId,
      dnsRecords: getJson.records ?? row.dnsRecords,
      status,
    });

    return { verified, status, mock: false };
  },
});
