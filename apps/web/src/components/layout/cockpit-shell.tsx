import { Link } from "@tanstack/react-router";
import { OrganizationSwitcher, UserButton, useAuth } from "@clerk/react";
import { LogoLockup } from "@/components/mc/logo";
import { cn } from "cnfast";
import { useIsAgencyAdmin } from "@/lib/auth-guards";
import { AgentStatusBadge } from "@/components/layout/agent-status";

const nav = [
  { to: "/app", label: "Cockpit" },
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
    <div className="min-h-dvh flex flex-col">
      <header
        className="mc-glass sticky top-0 z-40 mx-4 mt-4 px-5 py-3 flex items-center justify-between gap-6"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <Link to="/" className="shrink-0">
          <LogoLockup sky />
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "px-3 py-1.5 rounded-[var(--radius-xs)] text-[var(--color-mocha-subtext0)] hover:text-[var(--color-brand-sky)] transition-colors",
              )}
              activeProps={{
                className:
                  "px-3 py-1.5 rounded-[var(--radius-xs)] text-[var(--color-brand-sky)] mc-neon-border bg-[color-mix(in_oklab,var(--color-brand-sky)_10%,transparent)]",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          {isSignedIn ? (
            <>
              <span className="text-[10px] uppercase tracking-wide text-[var(--color-mocha-subtext0)] hidden lg:inline">
                {isAdmin ? "Admin" : orgRole === "org:member" ? "Member" : "Staff"}
              </span>
              <span className="hidden md:inline">
                <AgentStatusBadge />
              </span>
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/onboarding"
                afterSelectOrganizationUrl="/app"
                appearance={{
                  elements: {
                    rootBox: "flex items-center",
                    organizationSwitcherTrigger:
                      "text-[var(--color-mocha-text)] border border-[var(--color-mocha-surface1)] rounded-md px-2 py-1",
                  },
                }}
              />
              <UserButton />
            </>
          ) : (
            <div className="text-xs text-[var(--color-mocha-subtext0)] hidden md:block">
              <kbd className="mc-neu px-2 py-1 rounded-[var(--radius-xs)] text-[var(--color-brand-sky)]">
                ⌘K
              </kbd>{" "}
              palette · vim j/k
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 px-4 py-8 max-w-[72rem] w-full mx-auto">
        {title ? (
          <h1 className="text-2xl font-semibold mb-6 text-[var(--color-mocha-text)] mc-sparse">
            {title}
          </h1>
        ) : null}
        {children}
      </main>
    </div>
  );
}
