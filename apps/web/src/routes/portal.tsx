import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { UserButton } from "@clerk/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PortalGate } from "@/lib/auth-guards";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/mc/card";
import { Button } from "@/components/mc/button";
import { LogoLockup } from "@/components/mc/logo";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/portal")({
  component: () => (
    <PortalGate>
      <ClientPortalHome />
    </PortalGate>
  ),
});

function ClientPortalHome() {
  const grants = useQuery(api.portal.myGrants);
  const claim = useMutation(api.portal.claimInvite);
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    void claim({}).catch(() => {});
  }, [claim]);

  useEffect(() => {
    if (!clientId && grants?.[0]?.clientId) {
      setClientId(grants[0].clientId);
    }
  }, [grants, clientId]);

  const shared = useQuery(
    api.findings.sharedForClient,
    clientId ? { clientId: clientId as Id<"clients"> } : "skip",
  );
  const portalContacts = useQuery(
    api.portalCrm.listContacts,
    clientId ? { clientId: clientId as Id<"clients"> } : "skip",
  );
  const sites = useQuery(
    api.hierarchy.listSitesForPortalClient,
    clientId ? { clientId: clientId as Id<"clients"> } : "skip",
  );
  const firstSite = sites?.[0]?.id;
  const metrics = useQuery(
    api.crawl.metricsForPortalSite,
    firstSite ? { siteId: firstSite as Id<"sites"> } : "skip",
  );

  const history = useMemo(
    () =>
      (metrics ?? [])
        .slice()
        .sort((a, b) => a.completedAt - b.completedAt)
        .map((m) => ({
          date: new Date(m.completedAt).toISOString().slice(5, 10),
          broken: m.brokenLinks,
          alt: m.missingAlt,
        })),
    [metrics],
  );
  const maxB = Math.max(...history.map((h) => h.broken), 1);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="mc-glass sticky top-0 z-40 mx-4 mt-4 px-5 py-3 flex items-center justify-between rounded-[var(--radius-lg)]">
        <LogoLockup sky />
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-mocha-subtext0)]">Client Portal</span>
          <UserButton />
        </div>
      </header>
      <main className="flex-1 px-4 py-8 max-w-3xl w-full mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Your client workspaces</h1>
        <p className="text-sm text-[var(--color-mocha-subtext0)]">
          Outside Agency Clerk Org (ADR-0026). Graphs + Agency-shared findings (ADR-0028).
        </p>
        {grants === undefined ? (
          <p className="text-sm text-[var(--color-mocha-subtext0)]">Loading grants…</p>
        ) : grants.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No portal access yet</CardTitle>
              <CardDescription>
                Ask your agency to invite this email. After invite, refresh this page.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <select
              className="rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {grants.map((g) => (
                <option key={g._id} value={g.clientId}>
                  Client {String(g.clientId).slice(-6)} · {g.role}
                </option>
              ))}
            </select>

            <Card>
              <CardHeader>
                <CardTitle>Audit graphs</CardTitle>
                <CardDescription>Metrics snapshots for your sites</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-[var(--color-mocha-subtext0)]">No metrics yet.</p>
                ) : (
                  <div className="flex items-end gap-2 h-32">
                    {history.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5 items-end h-24">
                          <div
                            className="flex-1 rounded-t bg-[var(--color-brand-sky)]"
                            style={{ height: `${(h.broken / maxB) * 100}%` }}
                          />
                          <div
                            className="flex-1 rounded-t bg-[var(--color-brand-flamingo)]"
                            style={{
                              height: `${(h.alt / Math.max(...history.map((x) => x.alt), 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--color-mocha-subtext0)]">{h.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client CRM contacts</CardTitle>
                <CardDescription>Workspace scoped to your grant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {(portalContacts ?? []).length === 0 ? (
                  <p className="text-[var(--color-mocha-subtext0)]">No contacts yet.</p>
                ) : (
                  (portalContacts ?? []).map((c) => (
                    <div key={c.id} className="mc-glass px-3 py-2 rounded-md">
                      {c.name}
                      {c.email ? (
                        <span className="text-xs text-[var(--color-mocha-subtext0)]"> · {c.email}</span>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shared findings</CardTitle>
                <CardDescription>Agency chose to share these with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(shared ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--color-mocha-subtext0)]">None shared yet.</p>
                ) : (
                  (shared ?? []).map((f) => (
                    <div key={f.id} className="mc-glass px-3 py-2 rounded-md text-sm">
                      <strong>{f.type}</strong> · {f.severity} · {f.status}
                      <div className="font-mono text-xs break-all">{f.url}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
        <Link to="/">
          <Button variant="secondary">Back to landing</Button>
        </Link>
      </main>
    </div>
  );
}
