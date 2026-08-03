import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Badge } from "@/components/mc/badge";
import { Alert, AlertDescription } from "@/components/mc/alert";
import { useState } from "react";

export const Route = createFileRoute("/app/jobs")({
  component: JobsPage,
});

/** Agent job queue UI (ADR-0004/0012) — claim from cockpit when daemon offline. */
function JobsPage() {
  const queued = useQuery(api.jobs.listQueuedCrawls, { limit: 25 });
  const claim = useMutation(api.jobs.claimCrawl);
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agent jobs</h1>
        <p className="text-sm text-[var(--color-mocha-subtext0)]">
          Queued crawl runs for Local Agent daemon · claim marks running
        </p>
      </div>
      {note ? (
        <Alert>
          <AlertDescription className="font-mono text-xs">{note}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Queued crawls</CardTitle>
          <CardDescription>
            {queued === undefined ? "…" : `${queued.length} waiting`} · prefer{" "}
            <code className="text-[10px]">mc-agent</code> poll over manual claim
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(queued ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-mocha-subtext0)]">Queue empty.</p>
          ) : (
            (queued ?? []).map((j) => (
              <div
                key={j.crawlRunId}
                className="mc-glass px-3 py-2 rounded-md flex flex-wrap justify-between gap-2 text-sm"
              >
                <div>
                  <div className="font-medium break-all">{j.origin}</div>
                  <div className="text-[10px] text-[var(--color-mocha-subtext0)] space-x-2">
                    <Badge variant="secondary">{j.mode}</Badge>
                    <span>{new Date(j.startedAt).toLocaleString()}</span>
                    {j.ignoreRobots ? <span>robots override</span> : null}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    void claim({ crawlRunId: j.crawlRunId as Id<"crawlRuns"> })
                      .then((r) => setNote(`Claimed ${r.crawlRunId} → ${r.origin}`))
                      .catch((e) =>
                        setNote(e instanceof Error ? e.message : "claim failed"),
                      )
                  }
                >
                  Claim
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
