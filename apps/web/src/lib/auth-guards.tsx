import { useAuth, useOrganization, SignInButton } from "@clerk/tanstack-react-start";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";

/** Agency cockpit: must be signed in + active Clerk Organization (ADR-0015). */
export function AgencyGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, orgId, orgRole } = useAuth();
  const { organization } = useOrganization();
  const navigate = useNavigate();

  // Prefer a single org-selection surface (/select-agency) over embedding
  // OrganizationList on every gated route — avoids fighting Clerk taskUrls.
  useEffect(() => {
    if (isLoaded && isSignedIn && !orgId) {
      void navigate({ to: "/select-agency" });
    }
  }, [isLoaded, isSignedIn, orgId, navigate]);

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
            <SignInButton mode="modal" fallbackRedirectUrl="/app">
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
      <div className="min-h-dvh flex items-center justify-center text-[var(--color-mocha-subtext0)]">
        Selecting Agency…
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
            <SignInButton mode="modal" fallbackRedirectUrl="/portal">
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
