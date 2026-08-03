import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useOrganization, useUser } from "@clerk/react";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Badge } from "@/components/mc/badge";
import { Button } from "@/components/mc/button";
import { Input } from "@/components/mc/input";
import { KEYMAP } from "@/lib/keymap";
import { Separator } from "@/components/mc/separator";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { orgRole } = useAuth();
  const { organization } = useOrganization();
  const { user } = useUser();
  const agency = useQuery(api.agencies.getMine, {});
  const who = useQuery(api.agencies.whoami, {});
  const fireWebhook = useAction(api.webhooks.fire);
  const [hookUrl, setHookUrl] = useState("https://httpbin.org/post");
  const [hookNote, setHookNote] = useState<string | null>(null);
  const [hookBusy, setHookBusy] = useState(false);

  async function testWebhook() {
    setHookBusy(true);
    setHookNote(null);
    try {
      const res = await fireWebhook({
        url: hookUrl,
        payload: { ping: true, agencyId: agency?._id },
        idempotencyKey: `settings-test-${Date.now()}`,
      });
      setHookNote(JSON.stringify(res));
    } catch (e) {
      setHookNote(e instanceof Error ? e.message : "Failed");
    } finally {
      setHookBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-[var(--color-mocha-subtext0)]">
        Agency = Clerk Organization · roles Admin/Member (ADR-0015/0045)
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
            <CardDescription>Clerk identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              User: <span className="text-[var(--color-brand-sky)]">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
            <div>
              Org: {organization?.name ?? "—"}{" "}
              <Badge variant="secondary">{orgRole ?? "no role"}</Badge>
            </div>
            <div className="font-mono text-xs text-[var(--color-mocha-subtext0)]">
              {who?.signedIn ? who.subject : "not signed in to Convex"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agency (Convex)</CardTitle>
            <CardDescription>ensureMine row</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {agency ? (
              <>
                <div>{agency.name}</div>
                <div className="font-mono text-xs text-[var(--color-mocha-subtext0)]">
                  {agency._id}
                </div>
                <div>Onboarding step: {agency.onboardingStep ?? 0}</div>
              </>
            ) : (
              <p className="text-[var(--color-mocha-subtext0)]">No agency row yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook probe</CardTitle>
          <CardDescription>Automation action catalog (ADR-0043) · failures → Trigger handoff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            value={hookUrl}
            onChange={(e) => setHookUrl(e.target.value)}
            placeholder="https://example.com/hook"
          />
          <Button onClick={() => void testWebhook()} disabled={hookBusy || !hookUrl.trim()}>
            {hookBusy ? "Sending…" : "Fire test webhook"}
          </Button>
          {hookNote ? (
            <pre className="text-[10px] mc-glass p-2 rounded-md overflow-x-auto">{hookNote}</pre>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keyboard</CardTitle>
          <CardDescription>⌘K command palette</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-1 text-xs font-mono text-[var(--color-mocha-subtext0)]">
            {KEYMAP.map((k) => (
              <li key={k.keys}>
                <span className="text-[var(--color-brand-sky)]">{k.keys}</span> — {k.action}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
