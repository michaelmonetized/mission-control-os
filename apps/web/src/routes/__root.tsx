/// <reference types="vite/client" />
import * as React from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { CommandPaletteHost } from "@/components/layout/command-palette";
import { KeymapOverlayHost } from "@/components/layout/keymap-overlay";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { convex } from "@/lib/convex";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Mission Control" },
      {
        name: "description",
        content: "Agency operating system — audit, CRM, portal, multi-surface ops.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        href: "/brand/launch-keyhole-sky.svg",
        type: "image/svg+xml",
      },
    ],
  }),
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootComponent() {
  return (
    <AppProviders>
      <Outlet />
      <CommandPaletteHost />
      <KeymapOverlayHost />
    </AppProviders>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
    | string
    | undefined;

  if (!publishableKey) {
    console.error(
      "Missing VITE_CLERK_PUBLISHABLE_KEY — set in Vercel env or run `clerk env pull` (Vite prefix)",
    );
  }

  // Never pass publishableKey="" — that overrides SSR/middleware init state and
  // leaves Clerk dead (isSignedIn false, SignInButton no-ops).
  const clerkProps = {
    afterSignOutUrl: "/",
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
    taskUrls: {
      "choose-organization": "/select-agency",
    },
    ...(publishableKey ? { publishableKey } : {}),
  } as const;

  return (
    <ClerkProvider {...clerkProps}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-[var(--color-mocha-base)] text-[var(--color-mocha-text)] antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
