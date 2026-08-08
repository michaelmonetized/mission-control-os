import { useAuth, useOrganization } from "@clerk/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { CreateOrganization, OrganizationList, SignInButton } from "@clerk/react";

/** Agency cockpit: must be signed in + active Clerk Organization (ADR-0015). */
export function AgencyGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, orgId, orgRole } = useAuth();
  const { organization } = useOrganization();

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
            <CardTitle>Sign in to Mission Control</CardTitle>
            <CardDescription>
              Agency staff use Clerk Organizations. Client portal users sign in without joining the
              Agency org (ADR-0026).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SignInButton mode="modal" forceRedirectUrl="/app">
              <Button className="w-full">Sign in</Button>
            </SignInButton>
            <Link to="/sign-up" className="text-sm text-center text-[var(--color-brand-sky)]">
              Create account
            </Link>
            <Link to="/" className="text-xs text-center text-[var(--color-mocha-subtext0)]">
              ← Landing
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 gap-8">
        <div className="text-center max-w-[32rem]">
          <h1 className="text-2xl font-semibold mb-2">Select or create your Agency</h1>
          <p className="text-sm text-[var(--color-mocha-subtext0)]">
            Each Agency is a Clerk Organization (ADR-0015). Solo operators still create one org.
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

  // orgRole is org:admin | org:member (ADR-0045)
  void organization;
  void orgRole;

  return <>{children}</>;
}

/** Client portal: signed in, but must NOT require Agency org membership. */
export function PortalGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // stay on page; show sign-in UI
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-[var(--color-mocha-subtext0)]">
        Loading…
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <Card className="max-w-[28rem] w-full">
          <CardHeader>
            <CardTitle>Client Portal</CardTitle>
            <CardDescription>
              Sign in with the email your agency invited. You will not join their Clerk Organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton mode="modal" forceRedirectUrl="/portal">
              <Button className="w-full">Sign in</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function useIsAgencyAdmin() {
  const { orgRole, has } = useAuth();
  if (has) {
    try {
      return has({ role: "org:admin" });
    } catch {
      /* fall through */
    }
  }
  return orgRole === "org:admin";
}
