import { createFileRoute } from "@tanstack/react-router";
import {
  CreateOrganization,
  OrganizationList,
  Show,
  RedirectToSignIn,
} from "@clerk/react";
import { LogoLockup } from "@/components/mc/logo";

export const Route = createFileRoute("/select-agency")({
  component: SelectAgencyPage,
});

function SelectAgencyPage() {
  return (
    <>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
      <Show when="signed-in">
        <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 gap-8">
          <LogoLockup sky />
          <div className="text-center max-w-lg">
            <h1 className="text-2xl font-semibold mb-2">Your Agency</h1>
            <p className="text-sm text-[var(--color-mocha-subtext0)]">
              Clerk Organization = Agency (ADR-0015). Client portal users skip this step.
            </p>
          </div>
          <div className="w-full max-w-lg mc-glass p-6 rounded-[var(--radius-lg)]">
            <OrganizationList
              hidePersonal
              afterCreateOrganizationUrl="/onboarding"
              afterSelectOrganizationUrl="/app"
            />
          </div>
          <div className="w-full max-w-lg">
            <CreateOrganization afterCreateOrganizationUrl="/onboarding" />
          </div>
        </div>
      </Show>
    </>
  );
}
