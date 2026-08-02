import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { UserButton } from "@clerk/react";
import { api } from "../../convex/_generated/api";
import { PortalGate } from "@/lib/auth-guards";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { Button } from "@/components/mc/button";
import { LogoLockup } from "@/components/mc/logo";
import { useEffect } from "react";

export const Route = createFileRoute("/portal")({
  component: () => (
    <PortalGate>
      <ClientPortalHome />
    </PortalGate>
  ),
});

function ClientPortalHome() {
  const grants = useQuery(api.portal.myGrants);
  const claim = useMutation(api.portal.claimInvite);

  useEffect(() => {
    void claim({}).catch(() => {
      /* unauthenticated or no email */
    });
  }, [claim]);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="mc-glass sticky top-0 z-40 mx-4 mt-4 px-5 py-3 flex items-center justify-between rounded-[var(--radius-lg)]">
        <LogoLockup sky />
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-mocha-subtext0)]">Client Portal</span>
          <UserButton />
        </div>
      </header>
      <main className="flex-1 px-4 py-8 max-w-3xl w-full mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Your client workspaces</h1>
        <p className="text-sm text-[var(--color-mocha-subtext0)]">
          Grants live in Convex — you are <strong>not</strong> a member of the Agency Clerk Org
          (ADR-0026).
        </p>
        {grants === undefined ? (
          <p className="text-sm text-[var(--color-mocha-subtext0)]">Loading grants…</p>
        ) : grants.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No portal access yet</CardTitle>
              <CardDescription>
                Ask your agency to invite this email. After invite, refresh this page.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="space-y-3">
            {grants.map((g) => (
              <li key={g._id} className="mc-glass px-4 py-3 rounded-[var(--radius-md)] flex justify-between">
                <span>
                  Client <span className="font-mono text-xs">{g.clientId}</span>
                </span>
                <span className="text-xs text-[var(--color-brand-sky)]">{g.role}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/">
          <Button variant="secondary">Back to landing</Button>
        </Link>
      </main>
    </div>
  );
}
