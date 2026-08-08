import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@clerk/react";
import { LogoLockup } from "@/components/mc/logo";
import { clerkAppearance } from "@/lib/clerk-appearance";

/** Catch-all for Clerk path routing (/sign-up/* multi-step + OAuth callbacks). */
export const Route = createFileRoute("/sign-up/$")({
  component: SignUpCatchAll,
});

function SignUpCatchAll() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 gap-8">
      <LogoLockup sky />
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding"
        appearance={clerkAppearance}
      />
    </div>
  );
}
