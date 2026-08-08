import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PortalGate } from "@/lib/auth-guards";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { LogoLockup } from "@/components/mc/logo";
import { UserButton } from "@clerk/react";

export const Route = createFileRoute("/portal/onboarding")({
  component: () => (
    <PortalGate>
      <ClientOnboarding />
    </PortalGate>
  ),
});

const steps = [
  "Welcome & role",
  "Brand profile",
  "Approval calendar intro",
  "Optional Email Domain",
  "Done",
] as const;

/** Client User onboarding (ADR-0041) — guided B with Email Domain branch D. */
function ClientOnboarding() {
  const [step, setStep] = useState(0);
  const [brand, setBrand] = useState("");

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="mc-glass mx-4 mt-4 px-5 py-3 flex justify-between rounded-[var(--radius-lg)]">
        <LogoLockup sky />
        <UserButton />
      </header>
      <main className="flex-1 px-4 py-10 max-w-[32rem] mx-auto w-full space-y-6">
        <h1 className="text-2xl font-semibold">Client onboarding</h1>
        <p className="text-sm text-[var(--color-mocha-subtext0)]">
          Guided path for external Client Users (ADR-0041). You never join the Agency Clerk org.
        </p>
        <ol className="flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <li
              key={s}
              className={`text-xs px-2 py-1 rounded-full border ${
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
        <Card>
          <CardHeader>
            <CardTitle>
              Step {step + 1}: {steps[step]}
            </CardTitle>
            <CardDescription>
              {step === 3
                ? "Optional Client Email Domain — agency may manage DNS (branch D)."
                : "Complete to unlock portal CRM + approval calendar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {step === 1 ? (
              <label className="block text-sm space-y-1">
                Brand / business name
                <input
                  className="w-full rounded border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </label>
            ) : null}
            {step === 2 ? (
              <p className="text-sm text-[var(--color-mocha-subtext0)]">
                Social posts are <strong>default-approved</strong>. You can disapprove or edit any
                item before publish.
              </p>
            ) : null}
            {step === 4 ? (
              <p className="text-sm text-[var(--color-mocha-green)]">
                You&apos;re set{brand ? ` — ${brand}` : ""}. Open the portal for graphs and shared
                findings.
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
              ) : (
                <Link to="/portal">
                  <Button>Enter portal</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
