/**
 * Clerk JWT validation for Convex (Agency org claims on session token).
 * Domain matches Mission Control OS dev instance (famous-salmon-94).
 */
export default {
  providers: [
    {
      domain: "https://famous-salmon-94.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
