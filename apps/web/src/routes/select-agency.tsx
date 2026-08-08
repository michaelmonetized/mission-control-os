import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CreateOrganization,
  OrganizationList,
  TaskChooseOrganization,
  useAuth,
  useSession,
} from "@clerk/tanstack-react-start";
import { LogoLockup } from "@/components/mc/logo";
import { Button } from "@/components/mc/button";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const Route = createFileRoute("/select-agency")({
  component: SelectAgencyPage,
});

/** Shared shell: logo + Clerk card, no double chrome around Clerk UI. */
function AgencyShell({
  children,
  subtitle,
}: {
  children: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="flex w-full max-w-[26rem] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <LogoLockup sky className="origin-center scale-[0.95]" />
          {subtitle ? (
            <p className="max-w-[22rem] text-sm leading-relaxed text-[var(--color-mocha-subtext0)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex w-full justify-center [&_.cl-rootBox]:mx-auto [&_.cl-card]:mx-auto [&_.cl-cardBox]:mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Clerk `taskUrls.choose-organization` lands here after OAuth when an org is
 * required. During that pending session task, `isSignedIn` is often still false —
 * do NOT gate on isSignedIn. Render TaskChooseOrganization so the task can complete.
 */
function SelectAgencyPage() {
  // Pending org task sessions are "signed out" by default — flip that so
  // post-OAuth choose-organization is not treated as signed-out dead-end UI.
  const { isLoaded, isSignedIn, orgId } = useAuth({ treatPendingAsSignedOut: false });
  const { session, isLoaded: sessionLoaded } = useSession();

  const pendingOrgTask = session?.currentTask?.key === "choose-organization";

  if (!isLoaded || !sessionLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-[var(--color-mocha-subtext0)]">
        Loading auth…
      </div>
    );
  }

  // Active session task (post OAuth / force-org): official task UI.
  if (pendingOrgTask) {
    return (
      <AgencyShell subtitle="Create or select an agency workspace to continue.">
        <TaskChooseOrganization
          redirectUrlComplete="/app"
          appearance={clerkAppearance}
        />
      </AgencyShell>
    );
  }

  // Truly signed out (no pending task) — path SignIn, not a modal.
  if (!isSignedIn) {
    return (
      <AgencyShell subtitle="Sign in to select or create your agency. Client portal users skip this step.">
        <div className="flex w-full flex-col items-stretch gap-3">
          <Link to="/sign-in" className="w-full">
            <Button className="w-full">Sign in</Button>
          </Link>
          <Link
            to="/"
            className="text-center text-xs text-[var(--color-mocha-subtext0)]"
          >
            ← Landing
          </Link>
        </div>
      </AgencyShell>
    );
  }

  // Signed in, no pending task, already has org → soft hint to cockpit.
  if (orgId) {
    return (
      <AgencyShell subtitle="Agency already selected.">
        <Link to="/app">
          <Button>Open Cockpit</Button>
        </Link>
      </AgencyShell>
    );
  }

  // Signed in without org (app needs one, no pending Clerk task).
  return (
    <AgencyShell subtitle="Create or select an agency workspace to continue.">
      <div className="flex w-full flex-col items-center gap-6">
        <OrganizationList
          hidePersonal
          afterCreateOrganizationUrl="/onboarding"
          afterSelectOrganizationUrl="/app"
          appearance={clerkAppearance}
        />
        <CreateOrganization
          afterCreateOrganizationUrl="/onboarding"
          appearance={clerkAppearance}
        />
      </div>
    </AgencyShell>
  );
}
