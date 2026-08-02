/**
 * Clerk JWT validation for Convex (Agency org claims on session token).
 *
 * Domain = Clerk Frontend API host for Mission Control OS (dev).
 * When a production Clerk instance is added, append another provider entry
 * (or replace this domain). Convex requires auth.config domains to be static
 * or fully declared as deployment env vars before deploy.
 */
export default {
  providers: [
    {
      domain: "https://famous-salmon-94.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
