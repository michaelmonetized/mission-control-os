import React, { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Show, SignInButton, UserButton } from "@clerk/react";
import { LogoLockup } from "@/components/mc/logo";
import { Button } from "@/components/mc/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/mc/card";
import { ScrollWorldEngine, SCENES } from "@/components/mc/scroll-world";
import { SceneSectionOverlay, AgencyRoiCalculator } from "@/components/mc/landing-sections";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Layers,
  Cpu,
  Globe,
  Zap,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Activity,
  Boxes
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Monitor page scroll position and update scrub progress (0 to 1)
  useEffect(() => {
    const handleScroll = () => {
      const el = scrollContainerRef.current;
      if (!el) {
        // Fallback to window scroll
        const totalH = document.documentElement.scrollHeight - window.innerHeight;
        if (totalH > 0) {
          const p = Math.min(1, Math.max(0, window.scrollY / (totalH * 0.75)));
          setScrollProgress(p);
        }
        return;
      }

      const rect = el.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.min(1, Math.max(0, currentScroll / scrollableHeight));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeIndex = Math.min(
    Math.floor(scrollProgress * (SCENES.length - 1)),
    SCENES.length - 1
  );

  return (
    <div className="min-h-dvh bg-[#1e1e2e] text-[#cdd6f4] selection:bg-[var(--color-brand-sky)] selection:text-[#11111b] font-sans relative overflow-x-hidden">
      {/* Background Decorative Ambient Lighting Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[var(--color-brand-sky)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-[var(--color-brand-flamingo)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sticky Glass Top Header Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#181825]/80 border-b border-white/10 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <LogoLockup sky className="scale-90 origin-left" />
          </Link>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#313244]/50 border border-white/5 text-xs font-mono text-[var(--color-mocha-subtext0)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LOCAL AGENT DAEMON v1.4 OPERATIONAL</span>
          </div>
        </div>

        {/* Navigation Quick Jump Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-mono">
          <a href="#camera-world" className="hover:text-[var(--color-brand-sky)] transition-colors">
            // 3D DIORAMA
          </a>
          <a href="#journey" className="hover:text-[var(--color-brand-sky)] transition-colors">
            // JOURNEY SECTIONS
          </a>
          <a href="#calculator" className="hover:text-[var(--color-brand-sky)] transition-colors">
            // ROI CALCULATOR
          </a>
          <a href="#surfaces" className="hover:text-[var(--color-brand-sky)] transition-colors">
            // SURFACES
          </a>
        </nav>

        {/* Clerk Auth Action Buttons */}
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/app">
              <Button size="sm" className="font-mono text-xs font-bold">
                Sign In
              </Button>
            </SignInButton>
            <Link to="/sign-up">
              <Button size="sm" variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
                Create Agency
              </Button>
            </Link>
          </Show>

          <Show when="signed-in">
            <Link to="/app">
              <Button size="sm" className="font-mono text-xs font-bold gap-2">
                <span>Open Cockpit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <UserButton />
          </Show>

          <Link to="/portal" className="hidden sm:inline-block">
            <Button size="sm" variant="secondary" className="font-mono text-xs">
              Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-16">
        {/* HERO SECTION */}
        <section className="flex flex-col items-center text-center pt-8 pb-12 gap-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-sky)]/15 border border-[var(--color-brand-sky)]/30 text-xs font-mono font-semibold text-[var(--color-brand-sky)] shadow-lg">
            <Sparkles className="w-4 h-4 text-[var(--color-brand-flamingo)] animate-spin-slow" />
            <span>MISSION CONTROL OS // 3D SCROLL-DRIVEN CAMERA ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-none">
            The Sparse Ops Cockpit for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[var(--color-brand-sky)] via-[var(--color-brand-flamingo)] to-purple-400 bg-clip-text text-transparent">
              Local SEO Agencies
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--color-mocha-subtext0)] max-w-2xl leading-relaxed">
            Replace legacy bloated SaaS tools. Fly through our continuous 3D diorama world to see how our local Rust daemon, rendered crawl engine, dual CRM, and sync fabric run your entire agency OS.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/app">
                <Button size="lg" className="font-mono font-bold gap-2 text-sm shadow-xl hover:scale-105 transition-transform">
                  <span>Launch Agency Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
              <a href="#camera-world">
                <Button size="lg" variant="secondary" className="font-mono text-sm gap-2">
                  <span>Explore 3D Diorama</span>
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                </Button>
              </a>
            </Show>

            <Show when="signed-in">
              <Link to="/app">
                <Button size="lg" className="font-mono font-bold gap-2 text-sm shadow-xl hover:scale-105 transition-transform">
                  <span>Open Agency Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/onboarding">
                <Button size="lg" variant="secondary" className="font-mono text-sm">
                  Agency Onboarding
                </Button>
              </Link>
            </Show>
          </div>

          {/* Key Tech Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6 text-xs font-mono text-[var(--color-mocha-subtext0)]">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#181825] border border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              100% Local Data Control
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#181825] border border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-brand-sky)]" />
              Convex Real-Time Database
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#181825] border border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-brand-flamingo)]" />
              Catppuccin Mocha Glass UI
            </span>
          </div>
        </section>

        {/* 3D CAMERA SCRUB WORLD ENGINE SECTION */}
        <section id="camera-world" className="flex flex-col gap-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-[var(--color-brand-sky)] uppercase tracking-wider">
                SCROLL-DRIVEN CAMERA ENGINE (ARCHITECTURE B)
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Scroll to Fly Across the Floating Diorama World
              </h2>
            </div>
            <div className="text-xs font-mono text-[var(--color-mocha-subtext0)] bg-[#181825] px-3 py-1.5 rounded-lg border border-white/10">
              Active Section: <span className="text-[var(--color-brand-sky)] font-bold">{SCENES[activeIndex].title}</span>
            </div>
          </div>

          {/* Interactive Canvas Engine Widget */}
          <ScrollWorldEngine
            progress={scrollProgress}
            onSeek={(p) => setScrollProgress(p)}
            isMobileView={isMobileView}
            setIsMobileView={setIsMobileView}
          />
        </section>

        {/* SCROLL JOURNEY SECTIONS WRAPPER */}
        <section id="journey" ref={scrollContainerRef} className="flex flex-col gap-12 py-12 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-4">
            <span className="text-xs font-mono font-bold text-[var(--color-brand-flamingo)] uppercase tracking-wider">
              JOURNEY MAP
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              5 Modular Pillars of Mission Control OS
            </h2>
            <p className="text-sm text-[var(--color-mocha-subtext0)] mt-2">
              As you scroll down, the camera dives into each room's interior and flies over to the next diorama island.
            </p>
          </div>

          {/* Render individual Journey Overlays */}
          {SCENES.map((scene, idx) => (
            <div key={scene.id} className="scroll-mt-32" id={`scene-${idx}`}>
              <SceneSectionOverlay scene={scene} isActive={idx === activeIndex} />
            </div>
          ))}
        </section>

        {/* INTERACTIVE ROI CALCULATOR SECTION */}
        <section id="calculator" className="scroll-mt-24">
          <AgencyRoiCalculator />
        </section>

        {/* PLATFORM ARCHITECTURE GRID */}
        <section id="surfaces" className="flex flex-col gap-8 py-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold text-[var(--color-brand-sky)] uppercase tracking-wider">
              ENTERPRISE PLATFORM SPECS
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              Engineered for Speed, Precision, & Sovereignty
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="mc-glass border-white/10 hover:border-[var(--color-brand-sky)]/40 transition-colors">
              <CardHeader>
                <Cpu className="w-8 h-8 text-[var(--color-brand-sky)] mb-2" />
                <CardTitle className="text-xl">Local Rust Agent</CardTitle>
                <CardDescription className="text-sm text-[var(--color-mocha-subtext0)]">
                  Headless browser automation daemon running locally on your hardware. Zero per-crawl cloud billings or API rate-limits.
                </CardDescription>
              </CardHeader>
              <CardContent className="font-mono text-xs text-[var(--color-brand-sky)]">
                cargo run -- daemon
              </CardContent>
            </Card>

            <Card className="mc-glass border-white/10 hover:border-[var(--color-brand-flamingo)]/40 transition-colors">
              <CardHeader>
                <Boxes className="w-8 h-8 text-[var(--color-brand-flamingo)] mb-2" />
                <CardTitle className="text-xl">Dual CRM Engine</CardTitle>
                <CardDescription className="text-sm text-[var(--color-mocha-subtext0)]">
                  Isolated workspace states for internal agency ops and client-facing lead management with automated trigger workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="font-mono text-xs text-[var(--color-brand-flamingo)]">
                Convex Schema + Resend
              </CardContent>
            </Card>

            <Card className="mc-glass border-white/10 hover:border-purple-400/40 transition-colors">
              <CardHeader>
                <Globe className="w-8 h-8 text-purple-400 mb-2" />
                <CardTitle className="text-xl">Multi-Surface Sync</CardTitle>
                <CardDescription className="text-sm text-[var(--color-mocha-subtext0)]">
                  One sync protocol powers Web, Electron Desktop shell, terminal Rust TUI, and native mobile apps seamlessly.
                </CardDescription>
              </CardHeader>
              <CardContent className="font-mono text-xs text-purple-400">
                Web · Desktop · TUI · Mobile
              </CardContent>
            </Card>
          </div>
        </section>

        {/* BOTTOM CTA TERMINAL BOX */}
        <section className="my-12 p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#181825] to-[#11111b] border border-[var(--color-brand-sky)]/30 text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[var(--color-brand-sky)]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[var(--color-brand-flamingo)]/20 rounded-full blur-3xl pointer-events-none" />

          <LogoLockup sky className="scale-125 mb-2" />

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white max-w-2xl leading-tight">
            Ready to Take Control of Your Agency OS?
          </h2>

          <p className="text-base text-[var(--color-mocha-subtext0)] max-w-xl">
            Get started in seconds with live Convex dev database, Clerk agency organization authentication, and local agent crawling.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/app">
                <Button size="lg" className="font-mono font-bold text-sm gap-2">
                  <span>Sign In & Launch Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
              <Link to="/portal">
                <Button size="lg" variant="secondary" className="font-mono text-sm">
                  View Client Portal Demo
                </Button>
              </Link>
            </Show>

            <Show when="signed-in">
              <Link to="/app">
                <Button size="lg" className="font-mono font-bold text-sm gap-2">
                  <span>Enter Mission Control</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Show>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/10 py-8 px-4 lg:px-8 bg-[#11111b] text-xs font-mono text-[var(--color-mocha-subtext0)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoLockup sky className="scale-75 origin-left" />
            <span>© 2026 Mission Control OS · All Rights Reserved</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/michaelmonetized/mission-control-os"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--color-brand-sky)] transition-colors flex items-center gap-1"
            >
              <span>GitHub Repo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <Link to="/portal" className="hover:text-[var(--color-brand-sky)] transition-colors">
              Client Portal
            </Link>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Convex Dev Connected
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
