import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/tanstack-react-start";
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
        // fallback (not force): session tasks like choose-organization can run
        fallbackRedirectUrl="/app"
        appearance={clerkAppearance}
      />
    </div>
  );
}
