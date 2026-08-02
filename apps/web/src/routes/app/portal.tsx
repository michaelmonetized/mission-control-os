import { createFileRoute } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

export const Route = createFileRoute("/app/portal")({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Client Portal</h1>
      <p className="text-[var(--color-mocha-subtext0)]">
        Client Users outside Agency Clerk Org (ADR-0026). Invite + allowlist. Graphs + Shared Findings +
        full Client CRM (ADR-0025/0028/0032).
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Client experience</CardTitle>
          <CardDescription>
            Onboarding B+D · Approval Calendar · optional Client Email Domain
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  ),
});
