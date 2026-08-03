import { createFileRoute, Link } from "@tanstack/react-router";
import { Show, SignInButton, UserButton } from "@clerk/react";
import { LogoLockup } from "@/components/mc/logo";
import { Button } from "@/components/mc/button";
import { ScrollWorld } from "@/components/mc/scroll-world";
import { ArrowRight, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="bg-[#0c0c14] text-[#cdd6f4] selection:bg-[#89dceb] selection:text-[#11111b]">
      {/* ─── Nav ─── */}
      <header className="fixed top-0 z-50 w-full backdrop-blur-xl bg-[#0c0c14]/70 border-b border-white/[0.06] px-5 lg:px-10 py-3 flex items-center justify-between">
        <Link to="/">
          <LogoLockup sky className="scale-[0.85] origin-left" />
        </Link>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/app">
              <Button size="sm" className="text-xs">Sign in</Button>
            </SignInButton>
            <Link to="/sign-up" className="hidden sm:block">
              <Button size="sm" variant="secondary" className="text-xs">
                Create agency
              </Button>
            </Link>
          </Show>

          <Show when="signed-in">
            <Link to="/app">
              <Button size="sm" className="text-xs gap-1.5">
                Open Cockpit <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <UserButton />
          </Show>
        </div>
      </header>

      {/* ─── Hero (one viewport) ─── */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#89dceb]/[0.04] blur-[120px]" />
        </div>

        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
          <LogoLockup sky className="scale-125 mb-2" />

          <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Run your entire agency{" "}
            <span className="bg-gradient-to-r from-[#89dceb] to-[#f2cdcd] bg-clip-text text-transparent">
              from one cockpit
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-[#a6adc8] sm:text-xl">
            Audits, CRM, client portal, email, and five native surfaces —
            powered by a local Rust engine that never bills you per crawl.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/app">
                <Button className="gap-2 text-sm font-bold">
                  Get started free <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link to="/app">
                <Button className="gap-2 text-sm font-bold">
                  Open Cockpit <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Show>

            <a href="#world">
              <Button variant="secondary" className="gap-2 text-sm">
                See how it works <ChevronDown className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-[#89dceb]/60" />
        </div>
      </section>

      {/* ─── The scroll world ─── */}
      <div id="world">
        <ScrollWorld />
      </div>

      {/* ─── Bottom CTA ─── */}
      <section className="relative flex flex-col items-center gap-8 px-6 py-32 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#89dceb]/[0.05] blur-[100px]" />
        </div>

        <h2 className="relative z-10 max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          Stop paying per crawl.{" "}
          <span className="text-[#89dceb]">Start running your agency.</span>
        </h2>

        <p className="relative z-10 max-w-lg text-base text-[#a6adc8] sm:text-lg">
          Mission Control replaces Screaming Frog, BrightLocal, HubSpot,
          and your janky client portal — for one flat price. Or self-host it.
        </p>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/app">
              <Button className="gap-2 text-sm font-bold">
                Start for free <ArrowRight className="w-4 h-4" />
              </Button>
            </SignInButton>
            <Link to="/portal">
              <Button variant="secondary" className="text-sm">
                See client portal
              </Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link to="/app">
              <Button className="gap-2 text-sm font-bold">
                Enter Mission Control <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Show>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.06] py-6 px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row text-xs text-[#6c7086]">
          <div className="flex items-center gap-3">
            <LogoLockup sky className="scale-[0.65] origin-left" />
            <span>© 2026 Mission Control</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/michaelmonetized/mission-control-os"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#89dceb] transition-colors"
            >
              GitHub
            </a>
            <Link to="/portal" className="hover:text-[#89dceb] transition-colors">
              Client Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
