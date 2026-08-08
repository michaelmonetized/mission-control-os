import { useQuery } from "convex/react";
import { Link } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/tanstack-react-start";

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
    <div className="mb-3 rounded-[var(--radius-sm)] border border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-mantle)] px-3 py-2">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--color-brand-sky)]">Setup</p>
        <span className="text-[10px] text-[var(--color-mocha-subtext0)]">
          {items.length - remaining.length}/{items.length}
        </span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li key={i.id}>
            <Link
              to={i.to}
              className={`text-[11px] px-2 py-0.5 rounded-full border ${
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
