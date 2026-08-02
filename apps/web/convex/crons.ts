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

export default crons;
