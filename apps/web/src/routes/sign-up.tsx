import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@clerk/react";
import { LogoLockup } from "@/components/mc/logo";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
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
