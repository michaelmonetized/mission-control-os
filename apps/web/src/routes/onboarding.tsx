import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { OrganizationProfile, useOrganization } from "@clerk/tanstack-react-start";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AgencyGate } from "@/lib/auth-guards";
import { CockpitShell } from "@/components/layout/cockpit-shell";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const Route = createFileRoute("/onboarding")({
  component: () => (
    <AgencyGate>
      <Onboarding />
    </AgencyGate>
  ),
});

const steps = [
  "Agency profile",
  "Self client",
  "Invite team",
  "Primary site",
  "First project",
] as const;

/** Last step index; checklist treats step >= COMPLETE as done. */
const COMPLETE = steps.length;

function Onboarding() {
  const { organization } = useOrganization();
  const ensure = useMutation(api.agencies.ensureMine);
  const setStepRemote = useMutation(api.agencies.setOnboardingStep);
  const agency = useQuery(api.agencies.getMine, {});
  const clients = useQuery(api.clients.list, {});
  const addLocation = useMutation(api.hierarchy.addLocation);
  const addSite = useMutation(api.hierarchy.addSite);
  const addProject = useMutation(api.tasks.addProject);

  const remoteStep = agency?.onboardingStep ?? 0;
  const [step, setStep] = useState(0);
  const [agencyName, setAgencyName] = useState(organization?.name ?? "");
  const [siteOrigin, setSiteOrigin] = useState("https://");
  const [projectName, setProjectName] = useState("First project");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (organization?.name && !agencyName) setAgencyName(organization.name);
  }, [organization?.name, agencyName]);

  useEffect(() => {
    if (typeof remoteStep === "number" && remoteStep > 0 && remoteStep < COMPLETE) {
      setStep(Math.min(remoteStep, COMPLETE - 1));
    }
  }, [remoteStep]);

  const self = clients?.find((c) => c.isSelf);

  async function persistStep(next: number) {
    try {
      await setStepRemote({ step: next });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/Agency not found/i.test(msg)) {
        await ensure({ name: agencyName.trim() || undefined });
        await setStepRemote({ step: next });
      } else {
        throw e;
      }
    }
  }

  async function persistAndAdvance(next: number) {
    setSaving(true);
    try {
      if (step === 0) {
        await ensure({ name: agencyName.trim() || undefined });
      }
      if (step === 3) {
        if (!self) throw new Error("Self client not ready yet — go back and continue from Self client");
        const origin = siteOrigin.trim().replace(/\/$/, "");
        if (!origin || origin === "https:") throw new Error("Enter a site URL like https://example.com");
        const loc = await addLocation({
          clientId: self.id as Id<"clients">,
          name: "Primary",
        });
        await addSite({
          locationId: loc.id as Id<"locations">,
          origin,
        });
      }
      if (step === 4) {
        if (!self) throw new Error("Self client not ready yet");
        const title = projectName.trim() || "First project";
        await addProject({
          clientId: self.id as Id<"clients">,
          name: title,
        });
      }
      await persistStep(next);
      if (next >= COMPLETE) {
        window.location.assign("/app");
        return;
      }
      setStep(next);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Onboarding save failed");
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    await persistAndAdvance(COMPLETE);
  }

  return (
    <CockpitShell title="Agency setup">
      <p className="mb-4 max-w-[36rem] text-sm text-[var(--color-mocha-subtext0)]">
        A few steps to open your workspace.{" "}
        <strong className="text-[var(--color-brand-sky)]">You are your first client</strong> so the
        team can use CRM, audit, and social on real data.
      </p>
      <ol className="mb-5 flex flex-wrap gap-1.5">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              i === step
                ? "border-[var(--color-brand-sky)] text-[var(--color-brand-sky)]"
                : i < step
                  ? "border-[var(--color-mocha-green)] text-[var(--color-mocha-green)]"
                  : "border-[var(--color-mocha-surface1)] text-[var(--color-mocha-subtext0)]"
            }`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      <Card className="max-w-[36rem]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {steps[step]}
          </CardTitle>
          <CardDescription>
            {step === 0 && "Name shown across the cockpit and reports."}
            {step === 1 && "Confirm your self client exists, then continue."}
            {step === 2 && "Invite staff as Admin or Member. Skip if you are solo for now."}
            {step === 3 && "Add the primary website for your self client."}
            {step === 4 && "Create a delivery project to track work."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <label className="block space-y-2 text-sm">
              Agency name
              <Input
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Studio Example"
              />
            </label>
          )}

          {step === 1 && (
            <div className="space-y-3 text-sm">
              {self ? (
                <p className="text-[var(--color-mocha-text)]">
                  Self client ready: <strong>{self.name}</strong>
                </p>
              ) : (
                <p className="text-[var(--color-mocha-peach)]">
                  Self client is still provisioning. Continue will retry, or open Clients.
                </p>
              )}
              <Link to="/app/clients" className="text-[var(--color-brand-sky)] underline text-sm">
                View clients
              </Link>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-mocha-surface1)] [&_.cl-rootBox]:w-full [&_.cl-card]:shadow-none">
                <OrganizationProfile
                  appearance={clerkAppearance}
                  routing="hash"
                />
              </div>
              <p className="text-xs text-[var(--color-mocha-subtext0)]">
                Use Members to invite. Client portal users are invited under Portal setup — they do
                not join the agency org.
              </p>
            </div>
          )}

          {step === 3 && (
            <label className="block space-y-2 text-sm">
              Primary site URL
              <Input
                value={siteOrigin}
                onChange={(e) => setSiteOrigin(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </label>
          )}

          {step === 4 && (
            <label className="block space-y-2 text-sm">
              Project name
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="First project"
              />
            </label>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
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
              <Button disabled={saving} onClick={() => void finish()}>
                Enter cockpit
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => void persistAndAdvance(Math.min(step + 1, COMPLETE))}
            >
              Skip
            </Button>
            <Link to="/app" className="ml-auto text-xs self-center text-[var(--color-mocha-subtext0)]">
              Leave setup
            </Link>
          </div>
        </CardContent>
      </Card>
    </CockpitShell>
  );
}
