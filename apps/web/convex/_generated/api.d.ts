/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as agencies from "../agencies.js";
import type * as agent from "../agent.js";
import type * as automations from "../automations.js";
import type * as clients from "../clients.js";
import type * as connections from "../connections.js";
import type * as crawl from "../crawl.js";
import type * as crm from "../crm.js";
import type * as crons from "../crons.js";
import type * as cronsHandlers from "../cronsHandlers.js";
import type * as dashboard from "../dashboard.js";
import type * as email from "../email.js";
import type * as findings from "../findings.js";
import type * as handoffs from "../handoffs.js";
import type * as hierarchy from "../hierarchy.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as lib_auth from "../lib/auth.js";
import type * as notify from "../notify.js";
import type * as opportunities from "../opportunities.js";
import type * as portal from "../portal.js";
import type * as portalCrm from "../portalCrm.js";
import type * as reports from "../reports.js";
import type * as scheduler from "../scheduler.js";
import type * as social from "../social.js";
import type * as socialPublish from "../socialPublish.js";
import type * as tasks from "../tasks.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  agencies: typeof agencies;
  agent: typeof agent;
  automations: typeof automations;
  clients: typeof clients;
  connections: typeof connections;
  crawl: typeof crawl;
  crm: typeof crm;
  crons: typeof crons;
  cronsHandlers: typeof cronsHandlers;
  dashboard: typeof dashboard;
  email: typeof email;
  findings: typeof findings;
  handoffs: typeof handoffs;
  hierarchy: typeof hierarchy;
  http: typeof http;
  jobs: typeof jobs;
  "lib/auth": typeof lib_auth;
  notify: typeof notify;
  opportunities: typeof opportunities;
  portal: typeof portal;
  portalCrm: typeof portalCrm;
  reports: typeof reports;
  scheduler: typeof scheduler;
  social: typeof social;
  socialPublish: typeof socialPublish;
  tasks: typeof tasks;
  webhooks: typeof webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
