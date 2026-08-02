/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agencies from "../agencies.js";
import type * as agent from "../agent.js";
import type * as automations from "../automations.js";
import type * as clients from "../clients.js";
import type * as connections from "../connections.js";
import type * as crawl from "../crawl.js";
import type * as crm from "../crm.js";
import type * as email from "../email.js";
import type * as findings from "../findings.js";
import type * as hierarchy from "../hierarchy.js";
import type * as lib_auth from "../lib/auth.js";
import type * as portal from "../portal.js";
import type * as social from "../social.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agencies: typeof agencies;
  agent: typeof agent;
  automations: typeof automations;
  clients: typeof clients;
  connections: typeof connections;
  crawl: typeof crawl;
  crm: typeof crm;
  email: typeof email;
  findings: typeof findings;
  hierarchy: typeof hierarchy;
  "lib/auth": typeof lib_auth;
  portal: typeof portal;
  social: typeof social;
  tasks: typeof tasks;
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
