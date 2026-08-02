import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

export const Route = createFileRoute("/app/audit")({
  component: AuditPage,
});

const STATUSES = [
  "open",
  "triaged",
  "in_progress",
  "done",
  "wont_fix",
  "false_positive",
] as const;

function AuditPage() {
  const clients = useQuery(api.clients.list, {});
  const [clientId, setClientId] = useState("");
  const effectiveClient =
    clientId || clients?.find((c) => c.isSelf)?.id || clients?.[0]?.id || "";

  const sites = useQuery(
    api.hierarchy.listSitesForClient,
    effectiveClient ? { clientId: effectiveClient as Id<"clients"> } : "skip",
  );
  const [siteId, setSiteId] = useState("");
  const effectiveSite = siteId || sites?.[0]?.id || "";

  const runs = useQuery(
    api.crawl.listRuns,
    effectiveSite ? { siteId: effectiveSite as Id<"sites"> } : "skip",
  );
  const [runId, setRunId] = useState("");
  const latestRun = runId || runs?.[0]?._id || "";

  const findings = useQuery(
    api.crawl.findingsForRun,
    latestRun ? { crawlRunId: latestRun as Id<"crawlRuns"> } : "skip",
  );
  const metrics = useQuery(
    api.crawl.metricsForSite,
    effectiveSite ? { siteId: effectiveSite as Id<"sites"> } : "skip",
  );

  const queueRun = useMutation(api.crawl.queueRun);
  const streamFinding = useMutation(api.crawl.streamFinding);
  const completeRun = useMutation(api.crawl.completeRun);
  const setStatus = useMutation(api.findings.setStatus);
  const setShared = useMutation(api.findings.setShared);
  const toTask = useMutation(api.findings.createTaskFromFinding);

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const history = useMemo(() => {
    return (metrics ?? [])
      .slice()
      .sort((a, b) => a.completedAt - b.completedAt)
      .map((m) => ({
        date: new Date(m.completedAt).toISOString().slice(0, 10),
        brokenLinks: m.brokenLinks,
        missingAlt: m.missingAlt,
        pages: m.pagesRetrieved,
      }));
  }, [metrics]);

  const maxB = Math.max(...history.map((h) => h.brokenLinks), 1);

  async function startCrawl() {
    if (!effectiveSite) return;
    setBusy(true);
    setNote(null);
    try {
      const run = await queueRun({
        siteId: effectiveSite as Id<"sites">,
        mode: "rendered",
        ignoreRobots: false,
      });
      setRunId(run.crawlRunId);
      // Demo stream: agent would call these; simulate core finding types
      await streamFinding({
        crawlRunId: run.crawlRunId,
        type: "missing_alt",
        severity: "medium",
        url: sites?.find((s) => s.id === effectiveSite)?.origin ?? "/",
        message: "img without alt (streamed sample until Agent polls)",
      });
      await streamFinding({
        crawlRunId: run.crawlRunId,
        type: "broken_link",
        severity: "high",
        url: `${sites?.find((s) => s.id === effectiveSite)?.origin ?? ""}/missing`,
        message: "404 sample",
      });
      await completeRun({
        crawlRunId: run.crawlRunId,
        metrics: {
          brokenLinks: 1,
          missingAlt: 1,
          duplicatePercent: 0,
          pagesRetrieved: 3,
        },
      });
      setNote(
        `Queued + sample stream for ${run.crawlRunId}. Run \`mc-agent crawl --origin …\` locally for real crawl.`,
      );
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit</h1>
      <p className="text-[var(--color-mocha-subtext0)] max-w-2xl">
        Local Agent only · rendered default · robots respect · artifacts cleaned · findings status in
        Convex (ADR-0004/0019–0024).
      </p>
      {note ? <p className="text-sm text-[var(--color-brand-sky)]">{note}</p> : null}

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm space-y-1">
          Client
          <select
            className="block rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2"
            value={effectiveClient}
            onChange={(e) => {
              setClientId(e.target.value);
              setSiteId("");
              setRunId("");
            }}
          >
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm space-y-1">
          Site
          <select
            className="block rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2 min-w-[14rem]"
            value={effectiveSite}
            onChange={(e) => {
              setSiteId(e.target.value);
              setRunId("");
            }}
          >
            {(sites ?? []).length === 0 ? (
              <option value="">Add location/site on Clients</option>
            ) : (
              (sites ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.origin} ({s.locationName})
                </option>
              ))
            )}
          </select>
        </label>
        <Button onClick={() => void startCrawl()} disabled={busy || !effectiveSite}>
          Queue crawl run
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metrics over time</CardTitle>
          <CardDescription>Durable metrics snapshots per completed run (ADR-0024)</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--color-mocha-subtext0)]">No snapshots yet.</p>
          ) : (
            <>
              <div className="flex items-end gap-3 h-40">
                {history.map((h, i) => (
                  <div key={`${h.date}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end h-28">
                      <div
                        className="flex-1 rounded-t bg-[var(--color-brand-sky)] opacity-90"
                        style={{ height: `${(h.brokenLinks / maxB) * 100}%` }}
                        title={`Broken: ${h.brokenLinks}`}
                      />
                      <div
                        className="flex-1 rounded-t bg-[var(--color-brand-flamingo)] opacity-90"
                        style={{
                          height: `${(h.missingAlt / Math.max(...history.map((x) => x.missingAlt), 1)) * 100}%`,
                        }}
                        title={`Missing alt: ${h.missingAlt}`}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--color-mocha-subtext0)]">
                      {h.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3 text-[var(--color-mocha-subtext0)]">
                <span className="text-[var(--color-brand-sky)]">■</span> broken links{" "}
                <span className="text-[var(--color-brand-flamingo)]">■</span> missing alt
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crawl runs</CardTitle>
          <CardDescription>{runs?.length ?? 0} runs for selected site</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(runs ?? []).map((r) => (
              <li key={r._id}>
                <button
                  type="button"
                  className={`w-full text-left mc-glass px-3 py-2 rounded-md ${
                    latestRun === r._id ? "mc-neon-border" : ""
                  }`}
                  onClick={() => setRunId(r._id)}
                >
                  <span className="font-mono text-xs">{r._id.slice(-8)}</span> · {r.status} ·{" "}
                  {r.mode}
                  {r.ignoreRobots ? " · robots override" : ""}
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Findings</CardTitle>
          <CardDescription>Live status field (ADR-0023) · share to portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(findings ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-mocha-subtext0)]">No findings for run.</p>
          ) : (
            (findings ?? []).map((f) => (
              <div key={f._id} className="mc-glass px-3 py-3 rounded-md space-y-2 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span>
                    <strong>{f.type}</strong> · {f.severity}
                  </span>
                  <span className="text-xs text-[var(--color-mocha-subtext0)]">{f.status}</span>
                </div>
                <div className="font-mono text-xs break-all">{f.url}</div>
                {f.message ? <p className="text-[var(--color-mocha-subtext0)]">{f.message}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-2 py-1 text-xs"
                    value={f.status}
                    onChange={(e) =>
                      void setStatus({
                        findingId: f._id,
                        status: e.target.value as (typeof STATUSES)[number],
                      })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    onClick={() => void setShared({ findingId: f._id, shared: !f.shared })}
                  >
                    {f.shared ? "Unshare" : "Share to portal"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      void toTask({ findingId: f._id }).then((r) =>
                        setNote(`Created task ${r.taskId}`),
                      )
                    }
                  >
                    → Task
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
