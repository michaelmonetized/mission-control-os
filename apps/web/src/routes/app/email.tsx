import { createFileRoute } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

export const Route = createFileRoute("/app/email")({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Email ESP</h1>
      <p className="text-[var(--color-mocha-subtext0)]">
        Full ESP on Resend (ADR-0036). Agency + Client Email Domains · DNS onboarding · same primitive
        for client brand send.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Email Domain</CardTitle>
          <CardDescription>Provision via Resend CLI/API · show SPF/DKIM · verify</CardDescription>
        </CardHeader>
      </Card>
    </div>
  ),
});
