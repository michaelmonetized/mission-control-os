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
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 gap-8">
        <LogoLockup sky />
        <div className="text-center max-w-[32rem]">
          <h1 className="text-2xl font-semibold mb-2">Your Agency</h1>
          <p className="text-sm text-[var(--color-mocha-subtext0)]">
            Clerk Organization = Agency (ADR-0015). Create or select one to continue.
          </p>
        </div>
        <div className="w-full max-w-[32rem] mc-glass p-6 rounded-[var(--radius-lg)]">
          <TaskChooseOrganization
            redirectUrlComplete="/app"
            appearance={clerkAppearance}
          />
        </div>
      </div>
    );
  }

  // Truly signed out (no pending task) — navigate to path SignIn, not a modal
  // SignInButton (modals no-op if Clerk is mid-handshake).
  if (!isSignedIn) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 gap-6">
        <LogoLockup sky />
        <p className="text-sm text-[var(--color-mocha-subtext0)] text-center max-w-[28rem]">
          Sign in to select or create your Agency. Client portal users skip this step.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[20rem]">
          <Link to="/sign-in" search={{}} className="w-full">
            <Button className="w-full">Sign in</Button>
          </Link>
          <Link
            to="/"
            className="text-xs text-center text-[var(--color-mocha-subtext0)]"
          >
            ← Landing
          </Link>
        </div>
      </div>
    );
  }

  // Signed in, no pending task, already has org → soft hint to cockpit.
  if (orgId) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 gap-4">
        <LogoLockup sky />
        <p className="text-sm text-[var(--color-mocha-subtext0)]">Agency already selected.</p>
        <Link to="/app">
          <Button>Open Cockpit</Button>
        </Link>
      </div>
    );
  }

  // Signed in without org (org not required by Clerk task, but app needs one).
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 gap-8">
      <LogoLockup sky />
      <div className="text-center max-w-[32rem]">
        <h1 className="text-2xl font-semibold mb-2">Your Agency</h1>
        <p className="text-sm text-[var(--color-mocha-subtext0)]">
          Clerk Organization = Agency (ADR-0015). Client portal users skip this step.
        </p>
      </div>
      <div className="w-full max-w-[32rem] mc-glass p-6 rounded-[var(--radius-lg)]">
        <OrganizationList
          hidePersonal
          afterCreateOrganizationUrl="/onboarding"
          afterSelectOrganizationUrl="/app"
        />
      </div>
      <div className="w-full max-w-[32rem]">
        <CreateOrganization afterCreateOrganizationUrl="/onboarding" />
      </div>
    </div>
  );
}
