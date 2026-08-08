import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/react";
import { LogoLockup } from "@/components/mc/logo";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 gap-8">
      <LogoLockup sky />
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/app"
        appearance={clerkAppearance}
      />
    </div>
  );
}
