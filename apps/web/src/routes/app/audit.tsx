import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

export const Route = createFileRoute("/app/audit")({
  component: AuditPage,
});

/** Demo metrics history — ADR-0024 graphs */
const history = [
  { date: "2026-03-01", brokenLinks: 28, missingAlt: 14 },
  { date: "2026-04-01", brokenLinks: 22, missingAlt: 11 },
  { date: "2026-05-01", brokenLinks: 13, missingAlt: 3 },
  { date: "2026-06-01", brokenLinks: 7, missingAlt: 0 },
  { date: "2026-07-01", brokenLinks: 0, missingAlt: 0 },
];

function AuditPage() {
  const maxB = Math.max(...history.map((h) => h.brokenLinks), 1);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit</h1>
      <p className="text-[var(--color-mocha-subtext0)] max-w-2xl">
        Local Agent (user-level daemon) · rendered crawl default · artifacts cleaned after run · results
        stream to Convex · findings statuses live.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Metrics over time</CardTitle>
          <CardDescription>Broken links & missing alt — sample series for Client Portal graphs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-40">
            {history.map((h) => (
              <div key={h.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-28">
                  <div
                    className="flex-1 rounded-t bg-[var(--color-brand-sky)] opacity-90"
                    style={{ height: `${(h.brokenLinks / maxB) * 100}%` }}
                    title={`Broken: ${h.brokenLinks}`}
                  />
                  <div
                    className="flex-1 rounded-t bg-[var(--color-brand-flamingo)] opacity-90"
                    style={{ height: `${(h.missingAlt / 14) * 100}%` }}
                    title={`Missing alt: ${h.missingAlt}`}
                  />
                </div>
                <span className="text-[10px] text-[var(--color-mocha-subtext0)]">{h.date.slice(5)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3 text-[var(--color-mocha-subtext0)]">
            <span className="text-[var(--color-brand-sky)]">■</span> broken links{" "}
            <span className="text-[var(--color-brand-flamingo)]">■</span> missing alt
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
