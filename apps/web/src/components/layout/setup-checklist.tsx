import { useQuery } from "convex/react";
import { Link } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/react";

/**
 * Persistent setup checklist (ADR-0040) until critical OS paths are ready.
 */
export function SetupChecklist() {
  const { orgId, isLoaded } = useAuth();
  const agency = useQuery(api.agencies.getMine, isLoaded && orgId ? {} : "skip");
  const clients = useQuery(api.clients.list, isLoaded && orgId ? {} : "skip");
  const domains = useQuery(api.email.listDomains, isLoaded && orgId ? {} : "skip");
  const connections = useQuery(api.connections.list, isLoaded && orgId ? {} : "skip");
  const projects = useQuery(api.tasks.listProjects, isLoaded && orgId ? {} : "skip");

  if (!isLoaded || !orgId || agency === undefined) return null;

  const self = clients?.find((c) => c.isSelf);
  const step = agency?.onboardingStep ?? 0;

  const items = [
    {
      id: "agency",
      label: "Agency profile",
      done: Boolean(agency),
      to: "/onboarding",
    },
    {
      id: "self",
      label: "Self Client ready",
      done: Boolean(self),
      to: "/app/clients",
    },
    {
      id: "email",
      label: "Email domain (optional)",
      done: (domains?.length ?? 0) > 0,
      to: "/app/email",
    },
    {
      id: "connect",
      label: "Connected account (optional)",
      done: (connections?.length ?? 0) > 0,
      to: "/app/connections",
    },
    {
      id: "project",
      label: "First project",
      done: (projects?.length ?? 0) > 0,
      to: "/app/tasks",
    },
    {
      id: "onboarding",
      label: "Onboarding spine",
      done: step >= 7,
      to: "/onboarding",
    },
  ];

  const remaining = items.filter((i) => !i.done);
  if (remaining.length === 0) return null;

  return (
    <div className="mc-glass mx-4 mb-2 px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-mocha-surface1)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-[var(--color-brand-sky)]">Setup checklist</p>
        <span className="text-xs text-[var(--color-mocha-subtext0)]">
          {items.length - remaining.length}/{items.length} complete · skippable
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i.id}>
            <Link
              to={i.to}
              className={`text-xs px-2.5 py-1 rounded-full border ${
                i.done
                  ? "border-[var(--color-mocha-green)] text-[var(--color-mocha-green)]"
                  : "border-[var(--color-mocha-surface1)] text-[var(--color-mocha-subtext0)] hover:text-[var(--color-brand-sky)]"
              }`}
            >
              {i.done ? "✓" : "○"} {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
