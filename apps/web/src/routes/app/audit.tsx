import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Sparkline } from "@/components/mc/sparkline";
import { Progress } from "@/components/mc/progress";
import { downloadCsv } from "@/lib/export-csv";
import { SiteStructureGraph } from "@/components/mc/site-structure-graph";

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
  const saveReport = useMutation(api.reports.saveSnapshot);
  const reports = useQuery(
    api.reports.list,
    effectiveClient ? { clientId: effectiveClient as Id<"clients"> } : "skip",
  );
  const openIssues = useQuery(
    api.findings.listOpenIssues,
    effectiveSite ? { siteId: effectiveSite as Id<"sites"> } : "skip",
  );
  const clusters = useQuery(
    api.findings.clusterForRun,
    latestRun ? { crawlRunId: latestRun as Id<"crawlRuns"> } : "skip",
  );
  const fixNext = useQuery(
    api.findings.fixNext,
    effectiveSite ? { siteId: effectiveSite as Id<"sites">, limit: 8 } : "skip",
  );
  const comparison = useQuery(
    api.crawl.compareSnapshots,
    effectiveSite ? { siteId: effectiveSite as Id<"sites"> } : "skip",
  );
  const siteStructure = useQuery(
    api.crawl.structureFromFindings,
    latestRun ? { crawlRunId: latestRun as Id<"crawlRuns"> } : "skip",
  );
  const agentOnline = useQuery(api.schedules.agentOnline, {});
  const schedules = useQuery(api.schedules.list, {});
  const upsertSchedule = useMutation(api.schedules.upsert);
  const removeSchedule = useMutation(api.schedules.remove);

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [ignoreRobots, setIgnoreRobots] = useState(false);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [scheduleHours, setScheduleHours] = useState(24);
  const bulkSetStatus = useMutation(api.findings.bulkSetStatus);
  const bulkSetShared = useMutation(api.findings.bulkSetShared);

  const filteredFindings = useMemo(() => {
    const rows = findings ?? [];
    if (severityFilter === "all") return rows;
    return rows.filter((f) => f.severity === severityFilter);
  }, [findings, severityFilter]);

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
        mode: "cwv",
        ignoreRobots,
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
      const origin = sites?.find((s) => s.id === effectiveSite)?.origin ?? "https://example.com";
      const base = origin.replace(/\/$/, "");
      await completeRun({
        crawlRunId: run.crawlRunId,
        metrics: {
          brokenLinks: 1,
          missingAlt: 1,
          duplicatePercent: 0,
          pagesRetrieved: 3,
        },
        structure: {
          origin: base,
          maxDepth: 2,
          nodeCount: 4,
          edgeCount: 3,
          nodes: [
            { id: base, url: base, path: "/", depth: 0, title: "Home" },
            {
              id: `${base}/about`,
              url: `${base}/about`,
              path: "/about",
              depth: 1,
              title: "About",
            },
            {
              id: `${base}/blog`,
              url: `${base}/blog`,
              path: "/blog",
              depth: 1,
              title: "Blog",
            },
            {
              id: `${base}/blog/post`,
              url: `${base}/blog/post`,
              path: "/blog/post",
              depth: 2,
              title: "Post",
            },
          ],
          edges: [
            { from: base, to: `${base}/about` },
            { from: base, to: `${base}/blog` },
            { from: `${base}/blog`, to: `${base}/blog/post` },
          ],
        },
      });
      setNote(
        `Queued + sample stream + structure for ${run.crawlRunId}. Run \`mc-agent crawl --origin …\` for real graph.`,
      );
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Audit</h1>
          <p className="text-[var(--color-mocha-subtext0)] max-w-2xl">
            Local Agent only · rendered default · robots respect · artifacts cleaned · findings status
            in Convex (ADR-0004/0019–0024) · Sitebulb-class clusters & fix-next (ADR-0008).
          </p>
        </div>
        <div
          className={`text-xs px-3 py-1.5 rounded-full mc-glass ${
            agentOnline?.online ? "mc-neon-border text-[var(--color-brand-sky)]" : "text-[var(--color-mocha-subtext0)]"
          }`}
        >
          Agent {agentOnline?.online ? "online" : "offline"}
          {agentOnline?.lastSeenAt
            ? ` · seen ${new Date(agentOnline.lastSeenAt).toLocaleTimeString()}`
            : ""}
        </div>
      </div>
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
        <label className="text-xs flex items-center gap-2 text-[var(--color-mocha-subtext0)]">
          <input
            type="checkbox"
            checked={ignoreRobots}
            onChange={(e) => setIgnoreRobots(e.target.checked)}
          />
          Ignore robots.txt (logged override)
        </label>
        <Button onClick={() => void startCrawl()} disabled={busy || !effectiveSite}>
          Queue crawl run
        </Button>
        <Button
          variant="secondary"
          disabled={!latestRun}
          onClick={() =>
            void saveReport({ crawlRunId: latestRun as Id<"crawlRuns"> }).then((r) =>
              setNote(`Report saved · ${r.findingCount} findings`),
            )
          }
        >
          Save report snapshot
        </Button>
        <Button
          variant="secondary"
          disabled={(findings ?? []).length === 0}
          onClick={() => {
            downloadCsv(
              `findings-${latestRun || "export"}.csv`,
              (findings ?? []).map((f) => ({
                id: f._id,
                type: f.type,
                severity: f.severity,
                status: f.status,
                url: f.url,
                message: f.message ?? "",
                shared: f.shared,
              })),
            );
            setNote("Findings CSV downloaded");
          }}
        >
          Export findings CSV
        </Button>
        <Button
          variant="ghost"
          disabled={history.length === 0}
          onClick={() => {
            downloadCsv(
              `metrics-${effectiveSite || "site"}.csv`,
              history.map((h) => ({
                date: h.date,
                brokenLinks: h.brokenLinks,
                missingAlt: h.missingAlt,
                pages: h.pages,
              })),
            );
            setNote("Metrics CSV downloaded");
          }}
        >
          Export metrics CSV
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fix next</CardTitle>
            <CardDescription>Prioritised open issues (ADR-0008 Sitebulb insight)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(fixNext ?? []).length === 0 ? (
              <p className="text-[var(--color-mocha-subtext0)]">No open issues ranked yet.</p>
            ) : (
              (fixNext ?? []).map((f) => (
                <div key={f.type} className="mc-glass px-3 py-2 rounded-md flex justify-between gap-2">
                  <div>
                    <strong>{f.type.replace(/_/g, " ")}</strong>
                    <span className="block text-xs text-[var(--color-mocha-subtext0)]">{f.why}</span>
                  </div>
                  <span className="text-[var(--color-brand-flamingo)] font-mono text-xs">
                    ×{f.count} · {Math.round(f.score)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issue clusters</CardTitle>
            <CardDescription>This run · type grouping + priority score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(clusters ?? []).length === 0 ? (
              <p className="text-[var(--color-mocha-subtext0)]">Select a run with findings.</p>
            ) : (
              (clusters ?? []).slice(0, 8).map((c) => (
                <div key={c.type} className="flex justify-between gap-2 mc-glass px-3 py-2 rounded-md">
                  <span>
                    {c.type} · <span className="text-[var(--color-brand-sky)]">{c.maxSeverity}</span>
                  </span>
                  <span className="font-mono text-xs">
                    ×{c.count} · p{c.priority}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {comparison?.latest ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Run comparison</CardTitle>
            <CardDescription>
              Latest vs previous snapshot (ADR-0008 / 0024)
              {comparison.improving === true
                ? " · improving"
                : comparison.improving === false
                  ? " · regressions"
                  : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-4 gap-3 text-sm">
              {(
                [
                  ["Broken links", comparison.latest.brokenLinks, comparison.delta?.brokenLinks],
                  ["Missing alt", comparison.latest.missingAlt, comparison.delta?.missingAlt],
                  ["Dup %", comparison.latest.duplicatePercent, comparison.delta?.duplicatePercent],
                  ["Pages", comparison.latest.pagesRetrieved, comparison.delta?.pagesRetrieved],
                ] as const
              ).map(([label, val, d]) => (
                <div key={label} className="mc-glass rounded-md p-3">
                  <div className="text-xs text-[var(--color-mocha-subtext0)]">{label}</div>
                  <div className="text-lg font-semibold">{val}</div>
                  {d != null ? (
                    <div
                      className={`text-xs font-mono ${
                        d <= 0 && label !== "Pages"
                          ? "text-[var(--color-brand-sky)]"
                          : d > 0 && label !== "Pages"
                            ? "text-[var(--color-brand-flamingo)]"
                            : "text-[var(--color-mocha-subtext0)]"
                      }`}
                    >
                      {d > 0 ? `+${d}` : d} vs prev
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--color-mocha-subtext0)]">first run</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {siteStructure && siteStructure.nodes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Site structure</CardTitle>
            <CardDescription>
              Internal link graph by crawl depth (ADR-0008 Sitebulb-class viz)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SiteStructureGraph
              nodes={siteStructure.nodes}
              edges={siteStructure.edges}
              origin={siteStructure.origin}
              maxDepth={siteStructure.maxDepth}
              source={siteStructure.source}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduled crawls</CardTitle>
          <CardDescription>
            Queue when Agent is online (ADR-0008) · cron every 15m
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <label className="text-xs space-y-1">
              Interval (hours)
              <input
                type="number"
                min={1}
                max={720}
                className="block w-24 rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-2 py-1"
                value={scheduleHours}
                onChange={(e) => setScheduleHours(Number(e.target.value) || 24)}
              />
            </label>
            <Button
              variant="secondary"
              disabled={!effectiveSite}
              onClick={() =>
                void upsertSchedule({
                  siteId: effectiveSite as Id<"sites">,
                  intervalHours: scheduleHours,
                  mode: "rendered",
                  ignoreRobots,
                  enabled: true,
                }).then((r) =>
                  setNote(
                    `Schedule saved · next ${new Date(r.nextRunAt).toLocaleString()}`,
                  ),
                )
              }
            >
              Schedule this site
            </Button>
          </div>
          <ul className="space-y-1 text-sm">
            {(schedules ?? []).length === 0 ? (
              <li className="text-[var(--color-mocha-subtext0)]">No schedules.</li>
            ) : (
              (schedules ?? []).map((s) => (
                <li
                  key={s.id}
                  className="mc-glass px-3 py-2 rounded-md flex flex-wrap justify-between gap-2"
                >
                  <span className="font-mono text-xs">
                    site …{s.siteId.slice(-6)} · every {s.intervalHours}h ·{" "}
                    {s.enabled ? "on" : "off"}
                    <span className="block text-[var(--color-mocha-subtext0)]">
                      next {new Date(s.nextRunAt).toLocaleString()}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      void removeSchedule({ scheduleId: s.id as Id<"crawlSchedules"> }).then(() =>
                        setNote("Schedule removed"),
                      )
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>

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
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="mc-glass rounded-md p-3">
                  <div className="text-xs text-[var(--color-mocha-subtext0)] mb-1">Broken links</div>
                  <Sparkline values={history.map((h) => h.brokenLinks)} width={200} height={36} />
                </div>
                <div className="mc-glass rounded-md p-3">
                  <div className="text-xs text-[var(--color-mocha-subtext0)] mb-1">Missing alt</div>
                  <Sparkline
                    values={history.map((h) => h.missingAlt)}
                    width={200}
                    height={36}
                    stroke="var(--color-brand-flamingo)"
                    fill="color-mix(in oklab, var(--color-brand-flamingo) 18%, transparent)"
                  />
                </div>
                <div className="mc-glass rounded-md p-3">
                  <div className="text-xs text-[var(--color-mocha-subtext0)] mb-1">Pages retrieved</div>
                  <Sparkline values={history.map((h) => h.pages)} width={200} height={36} />
                </div>
              </div>
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
              {history.length > 0 ? (
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-[10px] text-[var(--color-mocha-subtext0)]">
                    <span>Latest pages</span>
                    <span>{history[history.length - 1]?.pages ?? 0}</span>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      ((history[history.length - 1]?.pages ?? 0) / 50) * 100,
                    )}
                  />
                </div>
              ) : null}
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

      {(reports ?? []).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report history</CardTitle>
            <CardDescription>Saved snapshots for export / portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(reports ?? []).slice(0, 5).map((r) => (
              <div key={r.id} className="mc-glass px-3 py-2 rounded-md flex justify-between gap-2">
                <span>{r.title}</span>
                <span className="text-xs text-[var(--color-mocha-subtext0)]">
                  {(r.summary as { findingCount?: number })?.findingCount ?? "?"} findings ·{" "}
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Open issues (fingerprinted)</CardTitle>
          <CardDescription>Across runs · type|url|message identity</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            {(openIssues ?? []).map((o) => (
              <li key={o.id} className="mc-glass px-3 py-2 rounded-md flex justify-between gap-2">
                <span>
                  {o.type} · {o.status}
                  <span className="block font-mono text-xs break-all">{o.url}</span>
                </span>
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
          {(findings ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              <select
                className="rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-2 py-1 text-xs"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All severities</option>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
              <Button
                variant="secondary"
                disabled={selectedFindings.length === 0}
                onClick={() =>
                  void bulkSetStatus({
                    findingIds: selectedFindings as Id<"auditFindings">[],
                    status: "triaged",
                  }).then((r) => {
                    setNote(`Bulk triaged ${r.updated}`);
                    setSelectedFindings([]);
                  })
                }
              >
                Bulk triage ({selectedFindings.length})
              </Button>
              <Button
                variant="ghost"
                disabled={selectedFindings.length === 0}
                onClick={() =>
                  void bulkSetStatus({
                    findingIds: selectedFindings as Id<"auditFindings">[],
                    status: "false_positive",
                  }).then(() => setSelectedFindings([]))
                }
              >
                Mark false positive
              </Button>
              <Button
                variant="secondary"
                disabled={selectedFindings.length === 0}
                onClick={() =>
                  void bulkSetShared({
                    findingIds: selectedFindings as Id<"auditFindings">[],
                    shared: true,
                  }).then((r) => {
                    setNote(`Shared ${r.updated} findings with portal`);
                    setSelectedFindings([]);
                  })
                }
              >
                Share to portal
              </Button>
            </div>
          ) : null}
          {filteredFindings.length === 0 ? (
            <p className="text-sm text-[var(--color-mocha-subtext0)]">No findings for run.</p>
          ) : (
            filteredFindings.map((f) => (
              <div key={f._id} className="mc-glass px-3 py-3 rounded-md space-y-2 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedFindings.includes(f._id)}
                      onChange={(e) => {
                        setSelectedFindings((prev) =>
                          e.target.checked
                            ? [...prev, f._id]
                            : prev.filter((id) => id !== f._id),
                        );
                      }}
                    />
                    <span>
                      <strong>{f.type}</strong> · {f.severity}
                    </span>
                  </label>
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
