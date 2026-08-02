import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CockpitShell } from "@/components/layout/cockpit-shell";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Input } from "@/components/mc/input";
// Link used for Enter Cockpit

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
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
  const [step, setStep] = useState(0);
  const [agencyName, setAgencyName] = useState("Studio Example");
  const [domain, setDomain] = useState("mail.example.com");

  return (
    <CockpitShell title="Agency Onboarding">
      <p className="text-[var(--color-mocha-subtext0)] mb-6 max-w-2xl">
        Guided full-OS spine (ADR-0040). <strong className="text-[var(--color-brand-sky)]">You are your first
        Client</strong> — Self Client is created automatically.
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
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>
            Step {step + 1}: {steps[step]}
          </CardTitle>
          <CardDescription>
            {step === 0 && "Clerk Organization maps to Agency (ADR-0015)."}
            {step === 1 && "Self Client dogfoods Client CRM, PM, social, audit."}
            {step === 3 && "Resend-backed ESP — DNS records for Email Domain (ADR-0036)."}
            {step === 7 && "Requires Local Agent user-level daemon (ADR-0012/0013)."}
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
              Self Client: <strong>{agencyName}</strong> (isSelf=true)
            </p>
          )}
          {step === 3 && (
            <label className="block space-y-2 text-sm">
              Sending domain
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} />
              <span className="text-xs text-[var(--color-mocha-subtext0)]">
                Next: show SPF/DKIM from Resend CLI/API provision.
              </span>
            </label>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
            ) : (
              <Link to="/app">
                <Button>Enter Cockpit</Button>
              </Link>
            )}
            <Button variant="ghost" onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))}>
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>
    </CockpitShell>
  );
}
