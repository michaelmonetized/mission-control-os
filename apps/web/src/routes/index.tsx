import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { Show, SignInButton, UserButton } from "@clerk/react";
import { LogoLockup } from "@/components/mc/logo";
import { Button } from "@/components/mc/button";
import { ArrowRight } from "lucide-react";
import { lazy, Suspense } from "react";

/** Keep R3F/drei/three out of the SSR/server function graph. */
const WorldStage = lazy(() =>
  import("@/components/landing/world-stage").then((m) => ({ default: m.WorldStage })),
);

export const Route = createFileRoute("/")({
  component: Landing,
});

function FlightPlaceholder() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center bg-[#11111b] text-sm text-[#a6adc8]"
      aria-hidden
    >
      Loading flight…
    </div>
  );
}

function Landing() {
  return (
    <div className="bg-[#11111b] text-[#cdd6f4] selection:bg-[#89dceb]/40 selection:text-white">
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#11111b]/55 px-5 py-3 backdrop-blur-2xl lg:px-10">
        <div className="mx-auto flex max-w-[1140px] items-center justify-between">
          <Link to="/" className="relative">
            <LogoLockup sky className="origin-left scale-[0.88]" />
          </Link>
          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/app">
                <Button size="sm" variant="ghost" className="text-xs text-[#a6adc8]">
                  Sign in
                </Button>
              </SignInButton>
              <Link to="/sign-up" className="hidden sm:block">
                <Button size="sm" className="text-xs font-semibold">
                  Create agency
                </Button>
              </Link>
            </Show>
            <Show when="signed-in">
              <Link to="/app">
                <Button size="sm" className="gap-1.5 text-xs font-semibold">
                  Open Cockpit <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      {/* Hero — editorial, not a card grid */}
      <section className="relative flex min-h-dvh flex-col justify-end overflow-hidden px-6 pb-20 pt-32 lg:px-12 lg:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-24 h-[420px] w-[420px] rounded-full bg-[#89dceb]/[0.07] blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[380px] w-[480px] rounded-full bg-[#f2cdcd]/[0.05] blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(205,214,244,0.08) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1140px]">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#89dceb]">
            Mission Control OS · Agency operating system
          </p>
          <h1 className="max-w-[56rem] text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Fly the agency.{" "}
            <span className="bg-gradient-to-r from-[#89dceb] via-[#cba6f7] to-[#f2cdcd] bg-clip-text text-transparent">
              Not a pile of tabs.
            </span>
          </h1>
          <p className="mt-6 max-w-[36rem] text-base leading-relaxed text-[#a6adc8] sm:text-lg">
            Technical audit, dual CRM, social, email, automations, and a real client portal —
            one multi-tenant cockpit. Local Rust crawls. Flat SaaS pricing.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/app">
                <Button className="gap-2 font-semibold">
                  Enter free <ArrowRight className="h-4 w-4" />
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link to="/app">
                <Button className="gap-2 font-semibold">
                  Open Cockpit <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Show>
            <a href="#flight">
              <Button variant="secondary" className="text-sm">
                Take the flight
              </Button>
            </a>
          </div>
        </div>
      </section>

      <div id="flight">
        <ClientOnly fallback={<FlightPlaceholder />}>
          <Suspense fallback={<FlightPlaceholder />}>
            <WorldStage />
          </Suspense>
        </ClientOnly>
      </div>

      <section className="relative overflow-hidden px-6 py-28 text-center lg:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#89dceb]/[0.06] blur-[100px]" />
        </div>
        <h2 className="relative z-10 mx-auto max-w-[42rem] text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Stop renting crawlers.{" "}
          <span className="text-[#89dceb]">Own the loop.</span>
        </h2>
        <p className="relative z-10 mx-auto mt-5 max-w-[32rem] text-[#a6adc8]">
          Screaming Frog depth. Sitebulb prioritisation. Client-ready portal. One flat plan —
          Starter, Pro, or Enterprise.
        </p>
        <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/app">
              <Button className="gap-2 font-semibold">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </SignInButton>
            <Link to="/portal">
              <Button variant="secondary">Client portal preview</Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link to="/app">
              <Button className="gap-2 font-semibold">
                Mission Control <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Show>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-[1140px] flex-col items-center justify-between gap-4 text-xs text-[#6c7086] sm:flex-row">
          <div className="flex items-center gap-3">
            <LogoLockup sky className="origin-left scale-[0.65]" />
            <span>© 2026 Mission Control</span>
          </div>
          <div className="flex gap-5">
            <a
              href="https://github.com/michaelmonetized/mission-control-os"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[#89dceb]"
            >
              GitHub
            </a>
            <Link to="/portal" className="transition-colors hover:text-[#89dceb]">
              Portal
            </Link>
            <Link to="/app/settings" className="transition-colors hover:text-[#89dceb]">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
