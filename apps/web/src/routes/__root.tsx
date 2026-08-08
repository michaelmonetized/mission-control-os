/// <reference types="vite/client" />
import * as React from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { CommandPaletteHost } from "@/components/layout/command-palette";
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
    </AppProviders>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
    | string
    | undefined;

  if (!publishableKey && import.meta.env.DEV) {
    console.error(
      "Missing VITE_CLERK_PUBLISHABLE_KEY — run `clerk env pull` and set Vite prefix",
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey ?? ""}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      taskUrls={{
        "choose-organization": "/select-agency",
      }}
    >
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
