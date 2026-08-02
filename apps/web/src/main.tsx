import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { convex } from "./lib/convex";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!publishableKey) {
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY — run `clerk env pull` and set Vite prefix");
}

function AppTree() {
  return (
    <ClerkProvider
      publishableKey={publishableKey ?? ""}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      // Agency staff pick org after sign-in; client portal users stay personal (ADR-0026)
      taskUrls={{
        "choose-organization": "/select-agency",
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <RouterProvider router={router} />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppTree />
  </React.StrictMode>,
);
