import { createFileRoute } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

export const Route = createFileRoute("/app/tasks")({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tasks & Projects</h1>
      <p className="text-[var(--color-mocha-subtext0)]">
        One Task system (ADR-0035). Flags route CRM nurture vs Client PM. Projects hang under Client —
        many projects per company/domain.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>CRM nurture</CardTitle>
            <CardDescription>Sales accountability · support delegation · Contact-linked</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Client PM</CardTitle>
            <CardDescription>Delivery Projects · promote from CRM with flags/tags</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  ),
});
