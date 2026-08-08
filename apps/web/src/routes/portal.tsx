import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { UserButton } from "@clerk/tanstack-react-start";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PortalGate } from "@/lib/auth-guards";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/mc/card";
import { Button } from "@/components/mc/button";
import { LogoLockup } from "@/components/mc/logo";
import { Sparkline } from "@/components/mc/chart";
import { createMcColumnHelper, DataTable } from "@/components/mc/data-table";
import { downloadCsv } from "@/lib/export-csv";
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
  type SharedFindingRow = {
    id: string;
    type: string;
    severity: string;
    status: string;
    url: string;
  };

  const sharedHelper = useMemo(() => createMcColumnHelper<SharedFindingRow>(), []);
  const sharedColumns = useMemo(
    () =>
      sharedHelper.columns([
        sharedHelper.accessor("type", { header: "Type" }),
        sharedHelper.accessor("severity", { header: "Severity" }),
        sharedHelper.accessor("status", { header: "Status" }),
        sharedHelper.accessor("url", {
          header: "URL",
          cell: ({ getValue }) => (
            <span className="font-mono text-xs break-all">{String(getValue() ?? "")}</span>
          ),
        }),
      ]),
    [sharedHelper],
  );

  const sharedRows = useMemo<SharedFindingRow[]>(
    () =>
      (shared ?? []).map((f) => ({
        id: f.id,
        type: f.type,
        severity: f.severity,
        status: f.status,
        url: f.url,
      })),
    [shared],
  );

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="mc-glass sticky top-0 z-40 mx-4 mt-4 px-5 py-3 flex items-center justify-between rounded-[var(--radius-lg)]">
        <LogoLockup sky />
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-mocha-subtext0)]">Client Portal</span>
          <UserButton />
        </div>
      </header>
      <main className="flex-1 px-4 py-8 max-w-[48rem] w-full mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Your client workspaces</h1>
        <p className="text-sm text-[var(--color-mocha-subtext0)]">
          Your client workspace — metrics and findings your agency has shared with you.
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
              <CardContent className="space-y-4">
                {history.length === 0 ? (
                  <p className="text-sm text-[var(--color-mocha-subtext0)]">No metrics yet.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="mc-glass rounded-md p-3">
                        <div className="text-[10px] text-[var(--color-mocha-subtext0)] mb-1">
                          Broken links
                        </div>
                        <Sparkline values={history.map((h) => h.broken)} width={180} height={32} />
                      </div>
                      <div className="mc-glass rounded-md p-3">
                        <div className="text-[10px] text-[var(--color-mocha-subtext0)] mb-1">
                          Missing alt
                        </div>
                        <Sparkline
                          values={history.map((h) => h.alt)}
                          width={180}
                          height={32}
                          stroke="var(--color-brand-flamingo)"
                          fill="color-mix(in oklab, var(--color-brand-flamingo) 18%, transparent)"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client CRM contacts</CardTitle>
                <CardDescription>Workspace scoped to your grant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {portalContacts === undefined ? (
                  <p className="text-[var(--color-mocha-subtext0)]">Loading contacts…</p>
                ) : portalContacts.length === 0 ? (
                  <p className="text-[var(--color-mocha-subtext0)]">No contacts yet.</p>
                ) : (
                  portalContacts.map((c) => (
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
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>Shared findings</CardTitle>
                  <CardDescription>Agency chose to share these with you</CardDescription>
                </div>
                <Button
                  variant="secondary"
                  disabled={(shared ?? []).length === 0}
                  onClick={() =>
                    downloadCsv(
                      "portal-shared-findings.csv",
                      (shared ?? []).map((f) => ({
                        type: f.type,
                        severity: f.severity,
                        status: f.status,
                        url: f.url,
                      })),
                    )
                  }
                >
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={sharedColumns}
                  data={sharedRows}
                  filterColumn="type"
                  filterPlaceholder="Filter by type…"
                  pageSize={8}
                  emptyMessage="None shared yet."
                />
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
