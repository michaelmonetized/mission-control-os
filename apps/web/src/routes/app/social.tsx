import { createFileRoute } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

export const Route = createFileRoute("/app/social")({
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Social</h1>
      <p className="text-[var(--color-mocha-subtext0)] max-w-2xl">
        Default-approved posts · N-week look-ahead Approval Calendar · client may disapprove with notes
        or edit. Publish failure → notify Agency+Client and reschedule before next post (ADR-0037/0038).
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Approval Calendar</CardTitle>
          <CardDescription>
            Full auto option · recycle/categories · Agency or Client Connected Accounts
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  ),
});
