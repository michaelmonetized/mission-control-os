import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart } from "@tanstack/react-start";

/**
 * TanStack Start request middleware.
 * clerkMiddleware makes session cookies available on the server so SSR and
 * OAuth callbacks don't thrash between signed-out shell and client session
 * (redirect loops after Google sign-in).
 */
export const startInstance = createStart(() => ({
  requestMiddleware: [clerkMiddleware()],
}));
