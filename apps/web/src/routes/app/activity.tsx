import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Badge } from "@/components/mc/badge";
import { ScrollArea } from "@/components/mc/scroll-area";

export const Route = createFileRoute("/app/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const events = useQuery(api.activity.list, { limit: 80 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity</h1>
        <p className="text-sm text-[var(--color-mocha-subtext0)]">
          Cross-module agency trail · CRM, crawl, social, automations
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[28rem] pr-3">
            {(events ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-mocha-subtext0)]">No events yet.</p>
            ) : (
              <ul className="space-y-3">
                {(events ?? []).map((e) => (
                  <li
                    key={e.id}
                    className="mc-glass rounded-md px-3 py-2 flex flex-wrap gap-2 items-start justify-between"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{e.kind}</Badge>
                        {e.entityType ? (
                          <span className="text-[10px] text-[var(--color-mocha-subtext0)]">
                            {e.entityType}
                            {e.entityId ? ` · ${e.entityId.slice(0, 8)}` : ""}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm">{e.message}</p>
                    </div>
                    <time className="text-[10px] text-[var(--color-mocha-subtext0)] shrink-0">
                      {new Date(e.createdAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
