import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useOrganization } from "@clerk/tanstack-react-start";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AgencyGate } from "@/lib/auth-guards";
import { CockpitShell } from "@/components/layout/cockpit-shell";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";

export const Route = createFileRoute("/onboarding")({
  component: () => (
    <AgencyGate>
      <Onboarding />
    </AgencyGate>
  ),
});

const steps = [
  "Agency profile",
  "Self Client (you are first)",
  "Invite team",
  "Email Domain (Resend DNS)",
  "Location / Site",
  "Connect channels",
  "First Project",
  "Optional Crawl",
] as const;

function Onboarding() {
  const { organization } = useOrganization();
  const ensure = useMutation(api.agencies.ensureMine);
  const setStepRemote = useMutation(api.agencies.setOnboardingStep);
  const clients = useQuery(api.clients.list, {});
  const addLocation = useMutation(api.hierarchy.addLocation);
  const addSite = useMutation(api.hierarchy.addSite);
  const addProject = useMutation(api.tasks.addProject);
  const [step, setStep] = useState(0);
  const [agencyName, setAgencyName] = useState(organization?.name ?? "Studio Example");
  const [domain, setDomain] = useState("mail.example.com");
  const [siteOrigin, setSiteOrigin] = useState("https://example.com");
  const [saving, setSaving] = useState(false);

  async function persistAndAdvance(next: number) {
    setSaving(true);
    try {
      if (step === 0) {
        await ensure({ name: agencyName.trim() || undefined });
      }
      // Step 4 in UI (index 4) = Location / Site under Self Client
      if (step === 4) {
        const self = clients?.find((c) => c.isSelf);
        if (self) {
          const loc = await addLocation({
            clientId: self.id as Id<"clients">,
            name: "Primary",
          });
          await addSite({
            locationId: loc.id as Id<"locations">,
            origin: siteOrigin.trim() || "https://example.com",
          });
        }
      }
      // Step 6 = First Project
      if (step === 6) {
        const self = clients?.find((c) => c.isSelf);
        if (self) {
          await addProject({
            clientId: self.id as Id<"clients">,
            name: "First Project",
          });
        }
      }
      try {
        await setStepRemote({ step: next });
      } catch (e) {
        // First open can race before ensureMine lands — retry once after ensure
        const msg = e instanceof Error ? e.message : String(e);
        if (/Agency not found/i.test(msg)) {
          await ensure({ name: agencyName.trim() || undefined });
          await setStepRemote({ step: next });
        } else {
          throw e;
        }
      }
      setStep(next);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Onboarding save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CockpitShell title="Agency Onboarding">
      <p className="text-[var(--color-mocha-subtext0)] mb-6 max-w-[42rem]">
        Get your agency workspace ready.{" "}
        <strong className="text-[var(--color-brand-sky)]">You are your first client</strong> — a self
        client is created automatically for your team to dogfood the product.
      </p>
      <ol className="flex flex-wrap gap-2 mb-8">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              i === step
                ? "mc-neon-border text-[var(--color-brand-sky)]"
                : i < step
                  ? "border-[var(--color-mocha-green)] text-[var(--color-mocha-green)]"
                  : "border-[var(--color-mocha-surface1)] text-[var(--color-mocha-subtext0)]"
            }`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      <Card className="max-w-[32rem]">
        <CardHeader>
          <CardTitle>
            Step {step + 1}: {steps[step]}
          </CardTitle>
          <CardDescription>
            {step === 0 && "Name your agency workspace."}
            {step === 1 && "Your self client is ready for CRM, projects, social, and audit."}
            {step === 2 && "Invite teammates as Admin or Member from the organization switcher."}
            {step === 3 && "Add a sending domain, then verify DNS on Email."}
            {step === 7 && "Install the local agent when you are ready to run crawls."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <label className="block space-y-2 text-sm">
              Agency name
              <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
            </label>
          )}
          {step === 1 && (
            <p className="text-sm text-[var(--color-mocha-subtext1)]">
              Self client <strong>{agencyName}</strong> is ready for your team to use as a first
              workspace.
            </p>
          )}
          {step === 2 && (
            <p className="text-sm text-[var(--color-mocha-subtext1)]">
              Open the organization switcher → Manage → Members to invite staff. Client portal
              users are invited separately under Portal setup and never join the agency org.
            </p>
          )}
          {step === 3 && (
            <label className="block space-y-2 text-sm">
              Sending domain
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} />
              <span className="text-xs text-[var(--color-mocha-subtext0)]">
                Provision under Email ESP after onboarding — DNS records via Resend.
              </span>
            </label>
          )}
          {step === 4 && (
            <label className="block space-y-2 text-sm">
              Primary site origin
              <Input value={siteOrigin} onChange={(e) => setSiteOrigin(e.target.value)} />
              <span className="text-xs text-[var(--color-mocha-subtext0)]">
                Creates Location + Site under Self Client.
              </span>
            </label>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              disabled={step === 0 || saving}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button disabled={saving} onClick={() => void persistAndAdvance(step + 1)}>
                Continue
              </Button>
            ) : (
              <Link to="/app">
                <Button>Enter Cockpit</Button>
              </Link>
            )}
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => void persistAndAdvance(Math.min(step + 1, steps.length - 1))}
            >
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>
    </CockpitShell>
  );
}
