import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Badge } from "@/components/mc/badge";
import { KEYMAP } from "@/lib/keymap";
import { ScrollArea } from "@/components/mc/scroll-area";

export const Route = createFileRoute("/app/")({
  component: CockpitHome,
});

const modules = [
  { to: "/app/clients", title: "Clients", desc: "Agency → Client → Location → Site" },
  { to: "/app/crm", title: "CRM", desc: "Dual workspace · conversations · automations" },
  { to: "/app/tasks", title: "Tasks & Projects", desc: "CRM nurture vs Client PM" },
  { to: "/app/audit", title: "Audit", desc: "Crawl Runs · findings · metrics graphs" },
  { to: "/app/social", title: "Social", desc: "Default-approved look-ahead calendar" },
  { to: "/app/email", title: "Email ESP", desc: "Resend domains · Agency + Client" },
  { to: "/app/connections", title: "Connected Accounts", desc: "Agency or Client ownership" },
  { to: "/app/portal", title: "Client Portal", desc: "Graphs + shared findings + Client CRM" },
  { to: "/app/automations", title: "Automations", desc: "Trigger → action · templates" },
] as const;

function CockpitHome() {
  const summary = useQuery(api.dashboard.summary, {});
  const activity = useQuery(api.activity.list, { limit: 12 });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Cockpit</h1>
      <p className="text-[var(--color-mocha-subtext0)] mb-6 max-w-2xl">
        Sparse Mission Control shell. ⌘K palette (vim j/k · Superhuman-ish binds). Self Client is live
        after onboarding.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {[
          ["Clients", summary?.clients],
          ["Open tasks", summary?.openTasks],
          ["Queued crawls", summary?.queuedCrawls],
          ["Open findings", summary?.openFindings],
          ["Approved posts", summary?.approvedPosts],
        ].map(([label, value]) => (
          <Card key={String(label)} className="mc-elev-1">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-semibold text-[var(--color-brand-sky)]">
                {value === undefined ? "—" : value}
              </div>
              <div className="text-xs text-[var(--color-mocha-subtext0)]">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {modules.map((m) => (
            <Link key={m.to} to={m.to} className="block group">
              <Card className="h-full mc-transition group-hover:mc-elev-2">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-[var(--color-brand-sky)]">
                    {m.title}
                  </CardTitle>
                  <CardDescription>{m.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity</CardTitle>
            <CardDescription>Recent agency events</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72 pr-3">
              {(activity ?? []).length === 0 ? (
                <p className="text-sm text-[var(--color-mocha-subtext0)]">No events yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(activity ?? []).map((e) => (
                    <li key={e.id} className="border-b border-[var(--color-mocha-surface1)] pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{e.kind}</Badge>
                        <span className="text-[10px] text-[var(--color-mocha-subtext0)]">
                          {new Date(e.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-[var(--color-mocha-text)]">{e.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keymap</CardTitle>
          <CardDescription>⌘K palette · vim motions (DSD-0011)</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-1 text-xs font-mono text-[var(--color-mocha-subtext0)]">
            {KEYMAP.map((k) => (
              <li key={k.keys} className="flex gap-2">
                <span className="text-[var(--color-brand-sky)] min-w-[7rem]">{k.keys}</span>
                <span>{k.action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
