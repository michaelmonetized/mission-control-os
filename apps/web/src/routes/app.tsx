import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CockpitShell } from "@/components/layout/cockpit-shell";

export const Route = createFileRoute("/app")({
  component: () => (
    <CockpitShell>
      <Outlet />
    </CockpitShell>
  ),
});
