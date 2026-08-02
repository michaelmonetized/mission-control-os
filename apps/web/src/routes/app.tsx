import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CockpitShell } from "@/components/layout/cockpit-shell";
import { AgencyGate } from "@/lib/auth-guards";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";

export const Route = createFileRoute("/app")({
  component: AgencyAppLayout,
});

function AgencyAppLayout() {
  return (
    <AgencyGate>
      <AgencyBootstrap>
        <CockpitShell>
          <Outlet />
        </CockpitShell>
      </AgencyBootstrap>
    </AgencyGate>
  );
}

/** Ensure Convex Agency + Self Client exist for active Clerk org. */
function AgencyBootstrap({ children }: { children: React.ReactNode }) {
  const { orgId, isLoaded } = useAuth();
  const ensure = useMutation(api.agencies.ensureMine);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded || !orgId) return;
    setReady(false);
    setError(null);
    void ensure({})
      .then(() => setReady(true))
      .catch((e) => {
        console.warn("ensureMine", e);
        setError(e instanceof Error ? e.message : "Failed to ensure Agency");
        setReady(true); // still show shell so user can retry / switch org
      });
  }, [isLoaded, orgId, ensure]);

  if (!ready && orgId) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-[var(--color-mocha-subtext0)]">
        Preparing Agency workspace…
      </div>
    );
  }

  return (
    <>
      {error ? (
        <div className="mx-4 mt-4 px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-mocha-peach)] text-sm text-[var(--color-mocha-peach)]">
          Agency setup issue: {error}. Try reloading or re-selecting your organization.
        </div>
      ) : null}
      {children}
    </>
  );
}
