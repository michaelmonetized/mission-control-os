import { createFileRoute } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

export const Route = createFileRoute("/app/crm")({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">CRM</h1>
      <p className="text-[var(--color-mocha-subtext0)] max-w-2xl">
        Dual conversation-centric CRM (ADR-0032): Agency CRM + per-Client CRM. Channels: email, SMS,
        social DM, web form, live chat. Full-fat automations with templates (ADR-0043).
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Agency CRM</CardTitle>
            <CardDescription>
              Sales, onboarding, service-provider relationships. Your pipeline outside delivery Clients.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Client CRM</CardTitle>
            <CardDescription>
              Same primitive for each Client — their contacts, conversations, pipelines, automations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  ),
});
