import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CreateOrganization,
  OrganizationList,
  SignInButton,
  useAuth,
} from "@clerk/tanstack-react-start";
import { LogoLockup } from "@/components/mc/logo";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

export const Route = createFileRoute("/select-agency")({
  component: SelectAgencyPage,
});

/**
 * Session task target for Clerk `choose-organization` (taskUrls in root).
 * Never use <RedirectToSignIn /> here — under Start SSR it hard-navigates while
 * the session is still hydrating and causes OAuth refresh loops.
 */
function SelectAgencyPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-[var(--color-mocha-subtext0)]">
        Loading auth…
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <Card className="max-w-[28rem] w-full">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Select an Agency after signing in. Client portal users skip this step.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SignInButton mode="modal" fallbackRedirectUrl="/select-agency">
              <Button className="w-full">Sign in</Button>
            </SignInButton>
            <Link to="/" className="text-xs text-center text-[var(--color-mocha-subtext0)]">
              ← Landing
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
