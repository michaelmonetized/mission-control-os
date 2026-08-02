import { createFileRoute } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

export const Route = createFileRoute("/app/automations")({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Automations</h1>
      <p className="text-[var(--color-mocha-subtext0)] max-w-2xl">
        CRM builder: email/SMS templates · triggers (ingest, status, pipeline, won/lost) · actions.
        Execute inline first; on first fail hand off to Trigger.dev (ADR-0043/0046). Non-CRM automation
        is first-class product behavior (ADR-0044).
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Workflow builder</CardTitle>
          <CardDescription>Admin role to edit · Member to run journeys</CardDescription>
        </CardHeader>
      </Card>
    </div>
  ),
});
