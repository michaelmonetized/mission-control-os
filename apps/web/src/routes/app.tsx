import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CockpitShell } from "@/components/layout/cockpit-shell";
import { AgencyGate } from "@/lib/auth-guards";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
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

  useEffect(() => {
    if (!isLoaded || !orgId) return;
    void ensure({}).catch((e) => console.warn("ensureMine", e));
  }, [isLoaded, orgId, ensure]);

  return <>{children}</>;
}
