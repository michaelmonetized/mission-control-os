import { Link } from "@tanstack/react-router";
import { OrganizationSwitcher, UserButton, useAuth } from "@clerk/tanstack-react-start";
import { LogoLockup } from "@/components/mc/logo";
import { cn } from "cnfast";
import { useIsAgencyAdmin } from "@/lib/auth-guards";
import { AgentStatusBadge } from "@/components/layout/agent-status";

const nav = [
  { to: "/app", label: "Cockpit", exact: true },
  { to: "/app/clients", label: "Clients" },
  { to: "/app/crm", label: "CRM" },
  { to: "/app/pipeline", label: "Pipeline" },
  { to: "/app/tasks", label: "Tasks" },
  { to: "/app/audit", label: "Audit" },
  { to: "/app/jobs", label: "Jobs" },
  { to: "/app/reports", label: "Reports" },
  { to: "/app/social", label: "Social" },
  { to: "/app/email", label: "Email" },
  { to: "/app/connections", label: "Connect" },
  { to: "/app/automations", label: "Automations" },
  { to: "/app/activity", label: "Activity" },
  { to: "/app/portal", label: "Portal setup" },
  { to: "/app/settings", label: "Settings" },
] as const;

export function CockpitShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { isSignedIn, orgRole } = useAuth();
  const isAdmin = useIsAgencyAdmin();

  return (
    <div className="min-h-dvh flex bg-[var(--color-mocha-base)]">
      <aside className="sticky top-0 flex h-dvh w-[13.5rem] shrink-0 flex-col border-r border-[var(--color-mocha-surface0)] bg-[var(--color-mocha-mantle)] px-2 py-3">
        <Link to="/" className="mb-4 px-2">
          <LogoLockup sky className="origin-left scale-[0.85]" />
        </Link>
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={"exact" in item && item.exact ? { exact: true } : undefined}
              className={cn(
                "rounded-[var(--radius-xs)] px-2.5 py-1.5 text-sm text-[var(--color-mocha-subtext0)] transition-colors hover:bg-[var(--color-mocha-surface0)] hover:text-[var(--color-brand-sky)]",
              )}
              activeProps={{
                className:
                  "rounded-[var(--radius-xs)] px-2.5 py-1.5 text-sm text-[var(--color-brand-sky)] bg-[color-mix(in_oklab,var(--color-brand-sky)_12%,transparent)]",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-2 px-2 text-[10px] text-[var(--color-mocha-overlay0)]">
          <kbd className="font-mono text-[var(--color-brand-sky)]">;</kbd> palette ·{" "}
          <kbd className="font-mono text-[var(--color-brand-sky)]">?</kbd> keys
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-end gap-2 border-b border-[var(--color-mocha-surface0)] bg-[var(--color-mocha-base)]/90 px-3 py-2 backdrop-blur-md">
          {isSignedIn ? (
            <>
              <span className="hidden text-[10px] uppercase tracking-wide text-[var(--color-mocha-subtext0)] sm:inline">
                {isAdmin ? "Admin" : orgRole === "org:member" ? "Member" : "Staff"}
              </span>
              <AgentStatusBadge />
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/onboarding"
                afterSelectOrganizationUrl="/app"
                appearance={{
                  elements: {
                    rootBox: "flex items-center",
                    organizationSwitcherTrigger:
                      "text-[var(--color-mocha-text)] border border-[var(--color-mocha-surface1)] rounded-md px-2 py-1 text-xs",
                  },
                }}
              />
              <UserButton />
            </>
          ) : null}
        </header>
        <main className="flex-1 px-3 py-4 md:px-4 md:py-5">
          {title ? (
            <h1 className="mb-4 text-xl font-semibold text-[var(--color-mocha-text)]">
              {title}
            </h1>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
