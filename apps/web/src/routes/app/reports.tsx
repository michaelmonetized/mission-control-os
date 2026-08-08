import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Badge } from "@/components/mc/badge";
import { downloadCsv } from "@/lib/export-csv";

export const Route = createFileRoute("/app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const clients = useQuery(api.clients.list, {});
  const [clientId, setClientId] = useState("");
  const reports = useQuery(
    api.reports.list,
    clientId ? { clientId: clientId as Id<"clients"> } : {},
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-[var(--color-mocha-subtext0)]">
          Saved audit snapshots and export history.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm space-y-1">
          Client filter
          <select
            className="block rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 text-sm min-w-[12rem]"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">All clients</option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="secondary"
          disabled={(reports ?? []).length === 0}
          onClick={() =>
            downloadCsv(
              "audit-reports.csv",
              (reports ?? []).map((r) => {
                const s = (r.summary ?? {}) as {
                  origin?: string;
                  findingCount?: number;
                  metrics?: { brokenLinks?: number; missingAlt?: number; pagesRetrieved?: number };
                };
                return {
                  id: r.id,
                  title: r.title,
                  origin: s.origin ?? "",
                  findings: s.findingCount ?? "",
                  broken: s.metrics?.brokenLinks ?? "",
                  missingAlt: s.metrics?.missingAlt ?? "",
                  pages: s.metrics?.pagesRetrieved ?? "",
                  createdAt: new Date(r.createdAt).toISOString(),
                };
              }),
            )
          }
        >
          Export CSV
        </Button>
        <Link to="/app/audit" className="text-sm text-[var(--color-brand-sky)] underline-offset-2 hover:underline">
          Open Audit →
        </Link>
      </div>

      <div className="space-y-3">
        {(reports ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-mocha-subtext0)]">
            No snapshots yet. Save one from Audit after a crawl run.
          </p>
        ) : (
          (reports ?? []).map((r) => {
            const s = (r.summary ?? {}) as {
              origin?: string;
              findingCount?: number;
              byType?: Record<string, number>;
              metrics?: {
                brokenLinks?: number;
                missingAlt?: number;
                pagesRetrieved?: number;
                duplicatePercent?: number;
              };
            };
            const types = Object.entries(s.byType ?? {}).sort((a, b) => b[1] - a[1]);
            return (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex flex-wrap justify-between gap-2">
                    <span>{r.title}</span>
                    <Badge variant="secondary">{s.findingCount ?? 0} findings</Badge>
                  </CardTitle>
                  <CardDescription>
                    {s.origin ?? "—"} · {new Date(r.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {s.metrics ? (
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--color-mocha-subtext0)]">
                      <span>Broken: {s.metrics.brokenLinks ?? "—"}</span>
                      <span>Missing alt: {s.metrics.missingAlt ?? "—"}</span>
                      <span>Pages: {s.metrics.pagesRetrieved ?? "—"}</span>
                      <span>Dup %: {s.metrics.duplicatePercent ?? "—"}</span>
                    </div>
                  ) : null}
                  {types.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {types.slice(0, 12).map(([t, n]) => (
                        <Badge key={t} variant="secondary">
                          {t}: {n}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
