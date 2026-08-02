import { createFileRoute, Link } from "@tanstack/react-router";
import { Show, SignInButton, UserButton } from "@clerk/react";
import { LogoLockup } from "@/components/mc/logo";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-16">
      <div className="absolute top-4 right-4">
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
      <LogoLockup sky className="mb-10 scale-110" />
      <p className="max-w-xl text-center text-[var(--color-mocha-subtext0)] mb-10 leading-relaxed">
        Sparse ops cockpit for local SEO agencies — audit, dual CRM, tasks, email, social, and
        client portal. Built to mog Screaming Frog and run the full agency OS.
      </p>
      <div className="flex flex-wrap gap-3 justify-center mb-16">
        <Show when="signed-out">
          <SignInButton mode="modal" forceRedirectUrl="/app">
            <Button>Sign in</Button>
          </SignInButton>
          <Link to="/sign-up">
            <Button variant="secondary">Create agency account</Button>
          </Link>
        </Show>
        <Show when="signed-in">
          <Link to="/app">
            <Button>Open Cockpit</Button>
          </Link>
          <Link to="/onboarding">
            <Button variant="secondary">Onboarding</Button>
          </Link>
        </Show>
        <Link to="/portal">
          <Button variant="secondary">Client Portal</Button>
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl w-full">
        {[
          ["Audit", "Local Agent · rendered crawl · live Convex results"],
          ["CRM", "Agency + Client workspaces · conversations · automations"],
          ["Surfaces", "Web · Electron · TUI · iOS · Android · Sync Fabric"],
        ].map(([t, d]) => (
          <Card key={t}>
            <CardHeader>
              <CardTitle className="text-lg">{t}</CardTitle>
              <CardDescription>{d}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  );
}
