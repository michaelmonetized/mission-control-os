import React, { useState } from "react";
import { SCENES, SceneData } from "./scroll-world";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import {
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Database,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Sliders,
  DollarSign,
  Clock,
  ShieldCheck,
  Smartphone,
  Monitor,
  Layout,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";

interface SceneSectionOverlayProps {
  scene: SceneData;
  isActive: boolean;
}

export function SceneSectionOverlay({ scene, isActive }: SceneSectionOverlayProps) {
  const [copied, setCopied] = useState(false);
  const [crawlDomain, setCrawlDomain] = useState("city-plumbing-pros.com");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlLogs, setCrawlLogs] = useState<string[]>([]);

  // Interactive Crawl Simulation for Scene 2
  const runCrawlSimulation = () => {
    setIsCrawling(true);
    setCrawlLogs(["[LOCAL AGENT] Initializing Chromium headless daemon...", `[AUDIT] Target: https://${crawlDomain}`]);

    setTimeout(() => {
      setCrawlLogs((prev) => [...prev, "[CRAWL] Rendered DOM parsed (4.2ms) · 128 elements found", "[SCHEMA] LocalBusiness JSON-LD validated ✓"]);
    }, 400);

    setTimeout(() => {
      setCrawlLogs((prev) => [
        ...prev,
        "[SERP] Local Pack position: #1 (Map Grid 5x5)",
        "[HEALTH] CWL Score: 98/100 · Mobile Ready"
      ]);
      setIsCrawling(false);
    }, 900);
  };

  // Interactive CRM Stage Switcher for Scene 3
  const [crmWorkspace, setCrmWorkspace] = useState<"agency" | "client">("agency");

  // Interactive Surface Switcher for Scene 4
  const [activeSurface, setActiveSurface] = useState<"web" | "desktop" | "tui" | "mobile">("web");

  return (
    <div
      className={`transition-all duration-700 transform ${
        isActive ? "opacity-100 translate-y-0 scale-100" : "opacity-40 translate-y-4 scale-98 pointer-events-none"
      }`}
    >
      <div className="grid lg:grid-cols-12 gap-8 items-center my-12">
        {/* Left Column: Text & Value proposition */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--color-brand-sky)]/15 text-[var(--color-brand-sky)] border border-[var(--color-brand-sky)]/30">
              {scene.eyebrow}
            </span>
            <span className="text-xs font-mono text-[var(--color-mocha-subtext0)]">Step 0{scene.id + 1} of 05</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {scene.headline}
          </h2>

          <p className="text-base text-[var(--color-mocha-subtext0)] leading-relaxed">
            {scene.body}
          </p>

          <div className="flex flex-wrap gap-2 my-2">
            {scene.pills.map((pill) => (
              <span
                key={pill}
                className="px-2.5 py-1 rounded-md text-xs font-mono bg-[var(--color-mocha-surface0)] text-[var(--color-mocha-subtext1)] border border-white/5"
              >
                #{pill}
              </span>
            ))}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            {scene.stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="text-xs text-[var(--color-mocha-subtext0)] uppercase font-mono">{s.label}</span>
                <span className="text-sm font-bold text-[var(--color-brand-sky)] font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Live Preview Widget */}
        <div className="lg:col-span-6">
          <div className="mc-glass rounded-2xl p-5 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
              <Sparkles className="w-24 h-24 text-[var(--color-brand-sky)]" />
            </div>

            {/* SCENE 01 WIDGET: Launchpad Cockpit Gauges */}
            {scene.id === 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--color-brand-sky)]" />
                    <span className="text-xs font-mono font-bold text-white">SYSTEM TELEMETRY</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#181825] p-3 rounded-xl border border-white/5">
                    <span className="text-xs text-[var(--color-mocha-subtext0)] font-mono">Agency MRR</span>
                    <div className="text-xl font-bold text-white font-mono mt-1">$48,500</div>
                    <span className="text-[10px] text-emerald-400 font-mono">+18% this month</span>
                  </div>
                  <div className="bg-[#181825] p-3 rounded-xl border border-white/5">
                    <span className="text-xs text-[var(--color-mocha-subtext0)] font-mono">Active Audits</span>
                    <div className="text-xl font-bold text-[var(--color-brand-sky)] font-mono mt-1">142 sites</div>
                    <span className="text-[10px] text-[var(--color-brand-sky)] font-mono">Daemon synced</span>
                  </div>
                </div>

                <div className="bg-[#11111b] p-3 rounded-xl border border-white/10 font-mono text-xs text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-[var(--color-brand-flamingo)]" />
                    bun run --filter @mc/web dev
                  </span>
                  <span className="text-[10px] text-emerald-400">PORT 5173 READY</span>
                </div>
              </div>
            )}

            {/* SCENE 02 WIDGET: Interactive Local Agent Crawl Simulator */}
            {scene.id === 1 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[var(--color-brand-sky)]" />
                    LOCAL AGENT CRAWLER
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-brand-flamingo)]">Rust Daemon v1.4</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={crawlDomain}
                    onChange={(e) => setCrawlDomain(e.target.value)}
                    className="flex-1 bg-[#181825] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[var(--color-brand-sky)]"
                  />
                  <Button size="sm" onClick={runCrawlSimulation} disabled={isCrawling} className="text-xs">
                    {isCrawling ? "Scanning..." : "Run Audit"}
                  </Button>
                </div>

                <div className="bg-[#11111b] p-3 rounded-xl border border-white/10 font-mono text-[11px] space-y-1.5 h-28 overflow-y-auto">
                  {crawlLogs.map((log, i) => (
                    <div key={i} className="text-slate-300">
                      {log}
                    </div>
                  ))}
                  {crawlLogs.length === 0 && (
                    <div className="text-slate-500 italic">Click "Run Audit" to simulate real-time Rust crawl...</div>
                  )}
                </div>
              </div>
            )}

            {/* SCENE 03 WIDGET: Interactive Dual CRM Workspace */}
            {scene.id === 2 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex gap-1 bg-[#181825] p-1 rounded-lg">
                    <button
                      onClick={() => setCrmWorkspace("agency")}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                        crmWorkspace === "agency"
                          ? "bg-[var(--color-brand-sky)] text-[var(--color-mocha-crust)]"
                          : "text-[var(--color-mocha-subtext0)] hover:text-white"
                      }`}
                    >
                      Agency CRM
                    </button>
                    <button
                      onClick={() => setCrmWorkspace("client")}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                        crmWorkspace === "client"
                          ? "bg-[var(--color-brand-flamingo)] text-[var(--color-mocha-crust)]"
                          : "text-[var(--color-mocha-subtext0)] hover:text-white"
                      }`}
                    >
                      Client CRM
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Convex Synced</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-[#181825] p-2.5 rounded-lg border border-white/5">
                    <div className="font-bold text-white mb-2 font-mono text-[11px]">Inbound Leads</div>
                    <div className="p-2 rounded bg-[#313244]/60 border border-sky-400/30 text-[10px] font-mono mb-1.5">
                      {crmWorkspace === "agency" ? "Apex Dental ($3.2k/mo)" : "Downtown Dental Audit"}
                    </div>
                    <div className="p-2 rounded bg-[#313244]/60 border border-sky-400/30 text-[10px] font-mono">
                      {crmWorkspace === "agency" ? "Metro Roofing ($5k/mo)" : "Emergency Plumbing Audit"}
                    </div>
                  </div>

                  <div className="bg-[#181825] p-2.5 rounded-lg border border-white/5">
                    <div className="font-bold text-white mb-2 font-mono text-[11px]">Audit Sent</div>
                    <div className="p-2 rounded bg-[#313244]/60 border border-amber-400/30 text-[10px] font-mono mb-1.5">
                      {crmWorkspace === "agency" ? "Summit Legal" : "Local Map Pack Audit"}
                    </div>
                  </div>

                  <div className="bg-[#181825] p-2.5 rounded-lg border border-white/5">
                    <div className="font-bold text-white mb-2 font-mono text-[11px]">Retainer Won</div>
                    <div className="p-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                      {crmWorkspace === "agency" ? "Boba World ($4k/mo)" : "5-Star Review Campaign"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 04 WIDGET: Multi-Surface Sync Switcher */}
            {scene.id === 3 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[var(--color-brand-sky)]" />
                    SURFACE SYNC FABRIC
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-brand-sky)]">5 Native Targets</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 bg-[#181825] p-1 rounded-lg">
                  {[
                    ["web", "Web Cockpit"],
                    ["desktop", "Electron"],
                    ["tui", "Rust TUI"],
                    ["mobile", "iOS / Android"]
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setActiveSurface(id as any)}
                      className={`py-1.5 px-2 rounded text-[11px] font-mono transition-colors ${
                        activeSurface === id
                          ? "bg-[var(--color-brand-sky)] text-[var(--color-mocha-crust)] font-bold"
                          : "text-[var(--color-mocha-subtext0)] hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="bg-[#11111b] p-4 rounded-xl border border-white/10 text-xs font-mono text-slate-300">
                  {activeSurface === "web" && (
                    <div className="space-y-1">
                      <div className="text-[var(--color-brand-sky)] font-bold">@mc/web (Vite + TanStack Router)</div>
                      <div className="text-slate-400">Cockpit UI running at http://127.0.0.1:5173</div>
                    </div>
                  )}
                  {activeSurface === "desktop" && (
                    <div className="space-y-1">
                      <div className="text-[var(--color-brand-flamingo)] font-bold">@mc/desktop (Electron Shell)</div>
                      <div className="text-slate-400">Native window controls, system tray, offline cache.</div>
                    </div>
                  )}
                  {activeSurface === "tui" && (
                    <div className="space-y-1">
                      <div className="text-emerald-400 font-bold">@mc/tui (Cargo / Ratatui)</div>
                      <div className="text-slate-400">cargo run --manifest-path apps/tui/Cargo.toml</div>
                    </div>
                  )}
                  {activeSurface === "mobile" && (
                    <div className="space-y-1">
                      <div className="text-amber-300 font-bold">@mc/mobile (iOS & Android Native)</div>
                      <div className="text-slate-400">On-the-go client notification & instant audit approvals.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCENE 05 WIDGET: White-Labeled Client Portal Preview */}
            {scene.id === 4 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--color-brand-flamingo)]" />
                    WHITE-LABEL CLIENT PORTAL
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Live URL active</span>
                </div>

                <div className="bg-[#181825] p-3 rounded-xl border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Portal Share Link:</span>
                    <button
                      onClick={() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 text-[var(--color-brand-sky)] hover:underline"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied Link!" : "Copy Link"}</span>
                    </button>
                  </div>
                  <div className="bg-[#11111b] px-3 py-2 rounded-lg text-xs font-mono text-slate-200 border border-white/5 truncate">
                    https://missioncontrol.agency/portal/client-apex-dental
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg text-emerald-300">
                    <div className="text-[10px] text-emerald-400/80">Monthly Keyword Lift</div>
                    <div className="text-base font-bold mt-0.5">+42 Keywords in Top 3</div>
                  </div>
                  <div className="bg-sky-500/10 border border-sky-500/30 p-2.5 rounded-lg text-sky-300">
                    <div className="text-[10px] text-sky-400/80">Client Actions</div>
                    <div className="text-base font-bold mt-0.5">0 Pending Approvals</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

{/* Interactive Agency ROI & Savings Calculator Component */}
export function AgencyRoiCalculator() {
  const [locations, setLocations] = useState(15);
  const [currentSpend, setCurrentSpend] = useState(850);
  const [hoursPerWeek, setHoursPerWeek] = useState(12);

  // Math savings calculations
  const monthlySoftwareSavings = Math.max(0, currentSpend - 149);
  const monthlyHoursSaved = hoursPerWeek * 4 * 0.75; // 75% time saved
  const yearlyDollarValue = monthlySoftwareSavings * 12 + monthlyHoursSaved * 75 * 12; // $75/hr billing rate

  return (
    <div className="my-20 p-8 rounded-3xl mc-glass border border-[var(--color-brand-sky)]/30 shadow-2xl relative overflow-hidden">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--color-brand-flamingo)]/15 text-[var(--color-brand-flamingo)] border border-[var(--color-brand-flamingo)]/30">
          ROI & EFFICIENCY ESTIMATOR
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-3">
          Calculate Agency Time & Tool Savings
        </h2>
        <p className="text-base text-[var(--color-mocha-subtext0)]">
          Replace Screaming Frog, BrightLocal, HubSpot, and custom portal SaaS tools with one unified Mission Control OS.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Sliders Input Column */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-[#181825]/90 p-6 rounded-2xl border border-white/10">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Managed Client Locations:</span>
              <span className="text-[var(--color-brand-sky)] font-bold">{locations} locations</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={locations}
              onChange={(e) => setLocations(parseInt(e.target.value))}
              className="w-full h-2 bg-[#313244] rounded-lg appearance-none cursor-pointer accent-[var(--color-brand-sky)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Current Monthly Software Stack Spend:</span>
              <span className="text-[var(--color-brand-flamingo)] font-bold">${currentSpend} / mo</span>
            </div>
            <input
              type="range"
              min={100}
              max={3000}
              step={50}
              value={currentSpend}
              onChange={(e) => setCurrentSpend(parseInt(e.target.value))}
              className="w-full h-2 bg-[#313244] rounded-lg appearance-none cursor-pointer accent-[var(--color-brand-flamingo)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Manual Reporting / Audit Hours (per week):</span>
              <span className="text-emerald-400 font-bold">{hoursPerWeek} hrs / wk</span>
            </div>
            <input
              type="range"
              min={2}
              max={40}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
              className="w-full h-2 bg-[#313244] rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>

        {/* Results Card Column */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-[#11111b] p-6 rounded-2xl border border-[var(--color-brand-sky)]/40 flex flex-col gap-4 relative overflow-hidden">
            <div className="text-xs font-mono text-[var(--color-mocha-subtext0)] uppercase tracking-wider">
              ESTIMATED ANNUAL VALUE RECLAIMED
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-[var(--color-brand-sky)] font-mono">
              ${yearlyDollarValue.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ yr</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Software Spend Cut
                </span>
                <span className="text-lg font-bold text-emerald-300 font-mono">${(monthlySoftwareSavings * 12).toLocaleString()} / yr</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-brand-flamingo)]" />
                  Team Time Saved
                </span>
                <span className="text-lg font-bold text-[var(--color-brand-flamingo)] font-mono">{Math.round(monthlyHoursSaved * 12)} hrs / yr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
