import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/tanstack-react-start";
import { api } from "../../../convex/_generated/api";
import { cn } from "cnfast";

/**
 * Command palette — `;` open · Esc close · Enter select · j/k move.
 */

const COMMANDS = [
  { id: "cockpit", label: "Go to Cockpit", to: "/app", keys: "g c" },
  { id: "clients", label: "Go to Clients", to: "/app/clients", keys: "g l" },
  { id: "crm", label: "Go to CRM", to: "/app/crm", keys: "g r" },
  { id: "pipeline", label: "Go to Pipeline", to: "/app/pipeline", keys: "g i" },
  { id: "tasks", label: "Go to Tasks", to: "/app/tasks", keys: "g t" },
  { id: "audit", label: "Go to Audit", to: "/app/audit", keys: "g a" },
  { id: "jobs", label: "Go to Agent jobs", to: "/app/jobs", keys: "g j" },
  { id: "reports", label: "Go to Reports", to: "/app/reports", keys: "g d" },
  { id: "social", label: "Go to Social", to: "/app/social", keys: "g s" },
  { id: "email", label: "Go to Email ESP", to: "/app/email", keys: "g e" },
  { id: "auto", label: "Go to Automations", to: "/app/automations", keys: "g u" },
  { id: "activity", label: "Go to Activity", to: "/app/activity", keys: "g v" },
  { id: "portal", label: "Go to Portal setup", to: "/app/portal", keys: "g p" },
  { id: "onboarding", label: "Agency Onboarding", to: "/onboarding", keys: "g o" },
  { id: "client-portal", label: "Open Client Portal", to: "/portal", keys: "g x" },
  { id: "settings", label: "Settings", to: "/app/settings", keys: "g ," },
  { id: "connections", label: "Connected Accounts", to: "/app/connections", keys: "g n" },
] as const;

type PaletteItem = {
  id: string;
  label: string;
  to: string;
  keys?: string;
  kind?: string;
};

export function CommandPaletteHost() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const { orgId, isLoaded } = useAuth();
  const search = useQuery(
    api.search.agencySearch,
    open && isLoaded && orgId && q.trim().length >= 2 ? { q: q.trim() } : "skip",
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const cmds: PaletteItem[] = !needle
      ? [...COMMANDS]
      : COMMANDS.filter(
          (c) =>
            c.label.toLowerCase().includes(needle) ||
            c.keys.includes(needle) ||
            c.id.includes(needle),
        );
    const hits: PaletteItem[] = [];
    for (const c of search?.clients ?? []) {
      hits.push({
        id: `client-${c.id}`,
        label: `Client: ${c.name}`,
        to: "/app/clients",
        kind: "client",
      });
    }
    for (const t of search?.tasks ?? []) {
      hits.push({
        id: `task-${t.id}`,
        label: `Task: ${t.title}`,
        to: "/app/tasks",
        kind: "task",
      });
    }
    for (const c of search?.contacts ?? []) {
      hits.push({
        id: `contact-${c.id}`,
        label: `Contact: ${c.name}`,
        to: "/app/crm",
        kind: "contact",
      });
    }
    for (const o of search?.opportunities ?? []) {
      hits.push({
        id: `opp-${o.id}`,
        label: `Deal: ${o.name} (${o.stage})`,
        to: "/app/pipeline",
        kind: "opportunity",
      });
    }
    return [...hits, ...cmds];
  }, [q, search]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement)?.isContentEditable;

      // `;` opens palette (not while typing in fields)
      if (e.key === ";" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing) {
        e.preventDefault();
        setOpen((o) => !o);
        setQ("");
        setIdx(0);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "j" && !e.metaKey && !e.ctrlKey) {
        // vim down when not typing in input with modifiers — allow when target not input
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          setIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
        }
      } else if (e.key === "k" && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          setIdx((i) => Math.max(i - 1, 0));
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[idx]) {
        e.preventDefault();
        void navigate({ to: filtered[idx]!.to });
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, idx, navigate]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close palette"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-[32rem] mc-glass rounded-[var(--radius-lg)] shadow-2xl overflow-hidden border border-[var(--color-mocha-surface1)]">
        <div className="px-3 py-2 border-b border-[var(--color-mocha-surface1)] flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--color-brand-sky)]">;</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command… (j/k · enter · esc)"
            className="flex-1 bg-transparent outline-none text-sm py-2 text-[var(--color-mocha-text)]"
          />
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-[var(--color-mocha-subtext0)]">No matches</li>
          ) : (
            filtered.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm flex justify-between gap-3",
                    i === idx
                      ? "bg-[color-mix(in_oklab,var(--color-brand-sky)_16%,transparent)] text-[var(--color-brand-sky)]"
                      : "hover:bg-[var(--color-mocha-surface0)]",
                  )}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => {
                    void navigate({ to: c.to });
                    setOpen(false);
                  }}
                >
                  <span>{c.label}</span>
                  <kbd className="text-[10px] text-[var(--color-mocha-subtext0)] font-mono">
                    {c.keys}
                  </kbd>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
