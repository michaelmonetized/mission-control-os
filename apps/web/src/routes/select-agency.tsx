import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useAuth,
  useClerk,
  useOrganizationList,
  useSession,
  useUser,
} from "@clerk/tanstack-react-start";
import { LogoLockup } from "@/components/mc/logo";
import { Button } from "@/components/mc/button";
import { Input } from "@/components/mc/input";

export const Route = createFileRoute("/select-agency")({
  component: SelectAgencyPage,
});

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
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

/**
 * Prefer hard navigation after org activation — Clerk TaskChooseOrganization
 * hangs forever on Continue when SPA routerPush/setActive never settles under Start.
 */
function goToApp() {
  window.location.assign("/app");
}

function SelectAgencyPage() {
  const { isLoaded, isSignedIn, orgId } = useAuth({ treatPendingAsSignedOut: false });
  const { session, isLoaded: sessionLoaded } = useSession();
  const { user } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();

  const { isLoaded: orgsLoaded, userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const pendingOrgTask = session?.currentTask?.key === "choose-organization";
  const needsAgency = pendingOrgTask || (isSignedIn && !orgId);

  const defaultName =
    user?.fullName
      ? `${user.fullName.split(" ")[0]}'s Agency`
      : user?.primaryEmailAddress?.emailAddress?.split("@")[0]
        ? `${user.primaryEmailAddress.emailAddress.split("@")[0]}'s Agency`
        : "My Agency";

  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  // Org already active → leave this page (hard nav clears stuck task UI).
  useEffect(() => {
    if (!isLoaded || !sessionLoaded) return;
    if (orgId && !pendingOrgTask) {
      goToApp();
    }
  }, [isLoaded, sessionLoaded, orgId, pendingOrgTask]);

  async function activateOrg(organizationId: string) {
    setBusy(true);
    setError(null);
    try {
      // Hard navigate inside setActive's navigate hook — TaskChooseOrganization
      // + SPA routerPush never settles under TanStack Start (Continue spins forever).
      const params = {
        organization: organizationId,
        navigate: async () => {
          goToApp();
        },
      };
      if (setActive) {
        await setActive(params);
      } else {
        await clerk.setActive(params);
      }
      // Fallback if navigate hook is skipped by Clerk version
      goToApp();
    } catch (e) {
      console.error("setActive org", e);
      setError(e instanceof Error ? e.message : "Could not activate agency");
      setBusy(false);
    }
  }

  async function createAndContinue() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Agency name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const org = await clerk.createOrganization({ name: trimmed });
      await activateOrg(org.id);
    } catch (e) {
      console.error("createOrganization", e);
      setError(e instanceof Error ? e.message : "Could not create agency");
      setBusy(false);
    }
  }

  if (!isLoaded || !sessionLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-[var(--color-mocha-subtext0)]">
        Loading auth…
      </div>
    );
  }

  if (!isSignedIn && !pendingOrgTask) {
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

  if (orgId && !pendingOrgTask) {
    return (
      <AgencyShell subtitle="Opening cockpit…">
        <Button className="w-full" onClick={() => goToApp()} disabled={busy}>
          Open Cockpit
        </Button>
      </AgencyShell>
    );
  }

  if (!needsAgency) {
    return (
      <AgencyShell>
        <Button className="w-full" onClick={() => void navigate({ to: "/app" })}>
          Continue
        </Button>
      </AgencyShell>
    );
  }

  const memberships = userMemberships?.data ?? [];

  return (
    <AgencyShell subtitle="Create or select an agency workspace to continue.">
      <div className="mc-glass w-full space-y-5 rounded-[var(--radius-lg)] border border-[var(--color-mocha-surface1)] p-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-[var(--color-mocha-text)]">
            Setup your agency
          </h1>
          <p className="mt-1 text-sm text-[var(--color-mocha-subtext0)]">
            Enter a name for your workspace
          </p>
        </div>

        {orgsLoaded && memberships.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-mocha-subtext0)]">
              Your agencies
            </p>
            <ul className="space-y-2">
              {memberships.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void activateOrg(m.organization.id)}
                    className="w-full rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] px-3 py-2.5 text-left text-sm hover:border-[var(--color-brand-sky)] disabled:opacity-50"
                  >
                    {m.organization.name}
                  </button>
                </li>
              ))}
            </ul>
            <div className="relative py-2 text-center text-xs text-[var(--color-mocha-subtext0)]">
              <span className="bg-[var(--color-mocha-surface0)] px-2">or create new</span>
            </div>
          </div>
        ) : null}

        <label className="block space-y-2 text-sm">
          <span className="text-[var(--color-mocha-subtext0)]">Name</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            autoComplete="organization"
            onKeyDown={(e) => {
              if (e.key === "Enter") void createAndContinue();
            }}
          />
        </label>

        {error ? (
          <p className="text-sm text-[var(--color-mocha-red)]" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          className="w-full"
          disabled={busy || !name.trim()}
          onClick={() => void createAndContinue()}
        >
          {busy ? "Working…" : "Continue"}
        </Button>

        {user ? (
          <p className="text-center text-xs text-[var(--color-mocha-subtext0)]">
            Signed in as {user.primaryEmailAddress?.emailAddress}
            {" · "}
            <button
              type="button"
              className="text-[var(--color-brand-sky)] underline"
              onClick={() => void clerk.signOut({ redirectUrl: "/" })}
            >
              Sign out
            </button>
          </p>
        ) : null}
      </div>
    </AgencyShell>
  );
}
