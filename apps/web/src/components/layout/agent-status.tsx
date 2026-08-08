import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/tanstack-react-start";

/** Shows queued crawl jobs awaiting Local Agent (ADR-0004). */
export function AgentStatusBadge() {
  const { orgId, isLoaded } = useAuth();
  const jobs = useQuery(api.jobs.listQueuedCrawls, isLoaded && orgId ? { limit: 5 } : "skip");

  if (!isLoaded || !orgId || jobs === undefined) return null;
  const n = jobs.length;
  return (
    <span
      className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${
        n > 0
          ? "border-[var(--color-mocha-peach)] text-[var(--color-mocha-peach)]"
          : "border-[var(--color-mocha-surface1)] text-[var(--color-mocha-subtext0)]"
      }`}
      title={n > 0 ? `${n} crawl job(s) queued for Local Agent` : "No queued agent jobs"}
    >
      Agent {n > 0 ? `· ${n} job${n === 1 ? "" : "s"}` : "· idle"}
    </span>
  );
}
