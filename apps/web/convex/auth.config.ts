/**
 * Clerk JWT validation for Convex (Agency org claims on session token).
 *
 * Set CLERK_JWT_ISSUER_DOMAIN on each Convex deployment
 * (e.g. https://your-instance.clerk.accounts.dev or https://clerk.example.com).
 * Falls back to the known dev Frontend API host for local work.
 */
const clerkDomain =
  process.env.CLERK_JWT_ISSUER_DOMAIN?.replace(/\/$/, "") ||
  "https://famous-salmon-94.clerk.accounts.dev";

export default {
  providers: [
    {
      domain: clerkDomain,
      applicationID: "convex",
    },
  ],
};
