import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * System crons (ADR-0044 first-class non-CRM automation).
 * Social due-check is a product rule, not the CRM builder.
 */
const crons = cronJobs();

// Heartbeat log every hour — proves scheduler plane is alive
crons.interval(
  "system heartbeat",
  { hours: 1 },
  internal.cronsHandlers.heartbeat,
  {},
);

// Queue due crawl schedules when agent is online (ADR-0008)
crons.interval(
  "crawl schedules tick",
  { minutes: 15 },
  internal.schedules.tickDue,
  {},
);

export default crons;
