import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/mc/card";
import { Badge } from "@/components/mc/badge";

export const Route = createFileRoute("/app/")({
  component: CockpitHome,
});

function CockpitHome() {
  const summary = useQuery(api.dashboard.summary, {});
  const activity = useQuery(api.activity.list, { limit: 12 });
  const events = activity ?? [];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Cockpit</h1>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          ["Clients", summary?.clients],
          ["Open tasks", summary?.openTasks],
          ["Open deals", summary?.openDeals],
          ["Queued crawls", summary?.queuedCrawls],
          ["Open findings", summary?.openFindings],
          ["Approved posts", summary?.approvedPosts],
          ["Handoffs", summary?.queuedHandoffs],
        ].map(([label, value]) => (
          <Card key={String(label)} className="mc-elev-1">
            <CardContent className="px-3 py-3">
              <div className="text-xl font-semibold text-[var(--color-brand-sky)]">
                {value === undefined ? "—" : value}
              </div>
              <div className="text-xs text-[var(--color-mocha-subtext0)]">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length > 0 ? (
        <ul className="divide-y divide-[var(--color-mocha-surface0)] border-t border-[var(--color-mocha-surface0)]">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 text-sm"
            >
              <Badge variant="secondary" className="shrink-0">
                {e.kind}
              </Badge>
              <span className="min-w-0 flex-1 text-[var(--color-mocha-text)]">{e.message}</span>
              <time className="shrink-0 text-[10px] text-[var(--color-mocha-subtext0)]">
                {new Date(e.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
