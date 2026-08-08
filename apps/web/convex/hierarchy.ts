import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

/** Agency → Client → Location → Site hierarchy (ADR-0002). */

async function assertClient(
  ctx: { db: { get: (id: Id<"clients">) => Promise<{ agencyId: Id<"agencies"> } | null> } },
  clientId: Id<"clients">,
  agencyId: Id<"agencies">,
) {
  const client = await ctx.db.get(clientId);
  if (!client || client.agencyId !== agencyId) return null;
  return client;
}

export const listLocations = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    if (!(await assertClient(ctx, args.clientId, agency._id))) return [];
    const rows = await ctx.db
      .query("locations")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    return rows.map((l) => ({
      id: l._id,
      name: l.name,
      address: l.address,
      clientId: l.clientId,
    }));
  },
});

export const addLocation = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    if (!(await assertClient(ctx, args.clientId, agency._id))) {
      throw new Error("client not found");
    }
    const name = args.name.trim();
    if (!name) throw new Error("name required");
    const id = await ctx.db.insert("locations", {
      clientId: args.clientId,
      name,
      address: args.address?.trim(),
    });
    return { id, name, address: args.address, clientId: args.clientId };
  },
});

export const listSites = query({
  args: { locationId: v.id("locations") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const loc = await ctx.db.get(args.locationId);
    if (!loc) return [];
    if (!(await assertClient(ctx, loc.clientId, agency._id))) return [];
    const rows = await ctx.db
      .query("sites")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .collect();
    return rows.map((s) => ({
      id: s._id,
      origin: s.origin,
      locationId: s.locationId,
    }));
  },
});

async function sitesForClientId(ctx: { db: any }, clientId: Id<"clients">) {
  const locations = await ctx.db
    .query("locations")
    .withIndex("by_client", (q: any) => q.eq("clientId", clientId))
    .collect();
  const out: {
    id: Id<"sites">;
    origin: string;
    locationId: Id<"locations">;
    locationName: string;
  }[] = [];
  for (const loc of locations) {
    const sites = await ctx.db
      .query("sites")
      .withIndex("by_location", (q: any) => q.eq("locationId", loc._id))
      .collect();
    for (const s of sites) {
      out.push({
        id: s._id,
        origin: s.origin,
        locationId: loc._id,
        locationName: loc.name,
      });
    }
  }
  return out;
}

export const listSitesForClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    if (!(await assertClient(ctx, args.clientId, agency._id))) return [];
    return sitesForClientId(ctx, args.clientId);
  },
});

/** Portal / grant-scoped site list (ADR-0026/0028) — no Agency org required. */
export const listSitesForPortalClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rec = identity as Record<string, unknown>;
    const email = (rec.email as string | undefined)?.toLowerCase();
    const byUser = await ctx.db
      .query("portalGrants")
      .withIndex("by_clerkUser", (q) => q.eq("clerkUserId", identity.subject))
      .collect();
    const byEmail = email
      ? await ctx.db
          .query("portalGrants")
          .withIndex("by_email", (q) => q.eq("email", email))
          .collect()
      : [];
    const ok = [...byUser, ...byEmail].some((g) => g.clientId === args.clientId);
    if (!ok) return [];
    return sitesForClientId(ctx, args.clientId);
  },
});

export const addSite = mutation({
  args: {
    locationId: v.id("locations"),
    origin: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const loc = await ctx.db.get(args.locationId);
    if (!loc) throw new Error("location not found");
    if (!(await assertClient(ctx, loc.clientId, agency._id))) {
      throw new Error("location not in agency");
    }
    let origin = args.origin.trim();
    if (!origin) throw new Error("origin required");
    if (!/^https?:\/\//i.test(origin)) origin = `https://${origin}`;
    origin = origin.replace(/\/$/, "");
    const id = await ctx.db.insert("sites", {
      locationId: args.locationId,
      origin,
    });
    return { id, origin, locationId: args.locationId };
  },
});
