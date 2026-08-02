import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { KEYMAP } from "@/lib/keymap";

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
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Cockpit</h1>
      <p className="text-[var(--color-mocha-subtext0)] mb-8 max-w-2xl">
        Sparse Mission Control shell. ⌘K palette (vim j/k · Superhuman-ish binds). Self Client is live
        after onboarding.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <Card className="mt-8">
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
