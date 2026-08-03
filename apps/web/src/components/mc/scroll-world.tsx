import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Compass, Monitor, Smartphone, FastForward, RotateCcw, ChevronDown, Sparkles } from "lucide-react";

export interface SceneData {
  id: number;
  title: string;
  eyebrow: string;
  headline: string;
  body: string;
  pills: string[];
  imageSrc: string;
  stats: { label: string; value: string }[];
}

export const SCENES: SceneData[] = [
  {
    id: 0,
    eyebrow: "SCENE 01 // COCKPIT HQ",
    title: "The Launchpad",
    headline: "Sparse Ops Command for Local SEO Agencies",
    body: "Built to mog legacy bloated tools. Monitor agency health, live crawls, team velocity, and revenue pipelines from one unified glass cockpit.",
    pills: ["Catppuccin Glass", "Vite Cockpit", "Clerk Multi-Org", "Real-Time Telemetry"],
    imageSrc: "/diorama/scene_1.jpg",
    stats: [
      { label: "Latency", value: "< 12ms" },
      { label: "Surfaces", value: "5 Native" },
      { label: "Architecture", value: "Convex + Rust" }
    ]
  },
  {
    id: 1,
    eyebrow: "SCENE 02 // ENGINE BAY",
    title: "The Scanner Bay",
    headline: "Local Agent Daemon & Rendered Crawls",
    body: "High-speed headless browser rendering powered by local Rust daemon. Audit technical SEO, schema graphs, backlink matrix, and local SERP rankings at native speeds.",
    pills: ["Rust Daemon", "Rendered DOM", "SERP Matrix", "Zero Cloud Overhead"],
    imageSrc: "/diorama/scene_2.jpg",
    stats: [
      { label: "Crawl Speed", value: "480 p/s" },
      { label: "Local Agent", value: "Active" },
      { label: "Engine", value: "Chromium / Rust" }
    ]
  },
  {
    id: 2,
    eyebrow: "SCENE 03 // MATRIX HUB",
    title: "The Matrix Hub",
    headline: "Dual CRM & Autonomous Pipeline Engine",
    body: "Separate workspaces for agency operations and client management. Trigger automated audits, email sequences, and task boards as soon as leads land.",
    pills: ["Dual CRM", "Kanban Automations", "Resend ESP", "Trigger.dev"],
    imageSrc: "/diorama/scene_3.jpg",
    stats: [
      { label: "Lead Response", value: "Instant" },
      { label: "Pipelines", value: "Dual Workspace" },
      { label: "Workflows", value: "100% Async" }
    ]
  },
  {
    id: 3,
    eyebrow: "SCENE 04 // TRANSMISSION",
    title: "The Transmission Array",
    headline: "Multi-Surface Sync Fabric",
    body: "One centralized sync protocol powering Web, Electron Desktop, Rust TUI, iOS, and Android. Never lose state whether in the terminal or on the field.",
    pills: ["Electron Shell", "Rust TUI", "React Native iOS/Android", "Sync Fabric"],
    imageSrc: "/diorama/scene_4.jpg",
    stats: [
      { label: "Platforms", value: "Web · Desktop · Mobile · TUI" },
      { label: "Sync Latency", value: "Real-time" },
      { label: "Offline First", value: "SQLite / Local" }
    ]
  },
  {
    id: 4,
    eyebrow: "SCENE 05 // EXECUTIVE LOUNGE",
    title: "The Client Portal",
    headline: "White-Labeled Client Experience",
    body: "Give clients transparent ROI dashboards, executive rank reports, live task updates, and instant action approvals without giving up backend control.",
    pills: ["White-Label Portal", "Executive Reports", "Client Approvals", "Shareable Links"],
    imageSrc: "/diorama/scene_5.jpg",
    stats: [
      { label: "Client Satisfaction", value: "99.4%" },
      { label: "Report Gen", value: "Automated" },
      { label: "Portal Access", value: "Custom Domain" }
    ]
  }
];

interface ScrollWorldEngineProps {
  progress: number; // 0 to 1
  onSeek?: (p: number) => void;
  isMobileView: boolean;
  setIsMobileView: (val: boolean) => void;
}

export function ScrollWorldEngine({
  progress,
  onSeek,
  isMobileView,
  setIsMobileView
}: ScrollWorldEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Preload diorama images
  useEffect(() => {
    let loadedCount = 0;
    const imgs: HTMLImageElement[] = [];

    SCENES.forEach((scene, index) => {
      const img = new Image();
      img.src = scene.imageSrc;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === SCENES.length) {
          setImagesLoaded(true);
        }
      };
      imgs[index] = img;
    });
    imagesRef.current = imgs;
  }, []);

  // Handle auto-flight play loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (onSeek) {
        const next = progress + 0.003 * speed;
        onSeek(next >= 1 ? 0 : next);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [isPlaying, speed, onSeek, progress]);

  // Render 3D scrub camera trajectory onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Compute active scene & flight connector phase
    const totalScenes = SCENES.length;
    const scaledP = progress * (totalScenes - 1);
    const sceneIndex = Math.min(Math.floor(scaledP), totalScenes - 1);
    const nextSceneIndex = Math.min(sceneIndex + 1, totalScenes - 1);
    const sceneFraction = scaledP - sceneIndex; // 0 to 1 between scenes

    // Architecture B camera mechanics:
    // In-scene phase (0 to 0.45): Camera dives into sceneIndex diorama, zoom in, subtle tilt rotation
    // Connector phase (0.45 to 0.85): Camera pulls up into high aerial hop, arc pitch elevation, horizontal pan
    // Arrival phase (0.85 to 1.0): Camera descends and lands on nextSceneIndex diorama

    const currentImg = imagesRef.current[sceneIndex];
    const nextImg = imagesRef.current[nextSceneIndex];

    // Background atmosphere gradient
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.1,
      width / 2,
      height / 2,
      width * 0.8
    );
    bgGrad.addColorStop(0, "#1e1e2e");
    bgGrad.addColorStop(0.5, "#181825");
    bgGrad.addColorStop(1, "#11111b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw particle grid lines for 3D depth feeling
    ctx.save();
    ctx.strokeStyle = "rgba(137, 220, 235, 0.06)";
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    const gridOffset = (progress * 800) % gridSpacing;
    for (let x = -width; x < width * 2; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x + gridOffset, 0);
      ctx.lineTo(x + gridOffset - 200, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Render diorama camera transformations
    if (imagesLoaded && currentImg && currentImg.complete) {
      ctx.save();

      // Architecture B flight calculation
      let scale = 1.0;
      let offsetX = 0;
      let offsetY = 0;
      let alphaCurrent = 1;
      let alphaNext = 0;
      let blurPx = 0;
      let rotDeg = 0;

      if (sceneFraction < 0.4) {
        // Deep Dive inside scene
        const diveT = sceneFraction / 0.4; // 0 to 1
        scale = 1.05 + diveT * 0.18; // Zooms in
        offsetY = diveT * 15;
        rotDeg = (diveT * 1.5) * (sceneIndex % 2 === 0 ? 1 : -1);
      } else if (sceneFraction < 0.85) {
        // Aerial Connector Hop
        const hopT = (sceneFraction - 0.4) / 0.45; // 0 to 1
        // Parabolic arc for aerial height
        const arcHeight = Math.sin(hopT * Math.PI);
        scale = 1.23 - arcHeight * 0.35; // Camera pulls back high into the air
        offsetY = -arcHeight * 60;
        offsetX = (hopT - 0.5) * 80 * (sceneIndex % 2 === 0 ? 1 : -1);
        rotDeg = (1.5 + arcHeight * 6) * (sceneIndex % 2 === 0 ? -1 : 1);
        blurPx = arcHeight * 4;

        // Crossfade to next image halfway through connector
        alphaNext = Math.min(1, Math.max(0, (hopT - 0.2) / 0.6));
        alphaCurrent = 1 - alphaNext;
      } else {
        // Descent Landing
        const landT = (sceneFraction - 0.85) / 0.15; // 0 to 1
        scale = 0.88 + landT * 0.17;
        offsetY = (1 - landT) * 30;
        rotDeg = (1 - landT) * -2;
        alphaCurrent = 0;
        alphaNext = 1;
      }

      // Apply blur if active
      if (blurPx > 0.5) {
        ctx.filter = `blur(${blurPx}px)`;
      }

      // Draw current scene diorama image
      if (alphaCurrent > 0) {
        ctx.save();
        ctx.globalAlpha = alphaCurrent;

        ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
        ctx.rotate((rotDeg * Math.PI) / 180);
        ctx.scale(scale, scale);

        // Aspect fit / crop
        const imgRatio = currentImg.width / currentImg.height;
        const canvasRatio = width / height;
        let drawW = width;
        let drawH = height;
        if (canvasRatio > imgRatio) {
          drawW = width * 1.05;
          drawH = drawW / imgRatio;
        } else {
          drawH = height * 1.05;
          drawW = drawH * imgRatio;
        }

        ctx.drawImage(currentImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // Draw next scene diorama image (during connector crossfade)
      if (alphaNext > 0 && nextImg && nextImg.complete) {
        ctx.save();
        ctx.globalAlpha = alphaNext;

        ctx.translate(width / 2 + offsetX * 0.5, height / 2 + offsetY * 0.5);
        ctx.rotate((-rotDeg * 0.5 * Math.PI) / 180);
        ctx.scale(scale * 1.02, scale * 1.02);

        const imgRatio = nextImg.width / nextImg.height;
        const canvasRatio = width / height;
        let drawW = width;
        let drawH = height;
        if (canvasRatio > imgRatio) {
          drawW = width * 1.05;
          drawH = drawW / imgRatio;
        } else {
          drawH = height * 1.05;
          drawW = drawH * imgRatio;
        }

        ctx.drawImage(nextImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      ctx.restore();
    }

    // Overlay 3D camera HUD wireframes
    ctx.save();
    // Sky blue camera lens reticle
    ctx.strokeStyle = "rgba(137, 220, 235, 0.35)";
    ctx.lineWidth = 1.5;
    const cx = width / 2;
    const cy = height / 2;

    // Corner reticles
    const rSize = 30;
    const padding = 24;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(padding, padding + rSize);
    ctx.lineTo(padding, padding);
    ctx.lineTo(padding + rSize, padding);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - padding - rSize, padding);
    ctx.lineTo(width - padding, padding);
    ctx.lineTo(width - padding, padding + rSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(padding, height - padding - rSize);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(padding + rSize, height - padding);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - padding - rSize, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(width - padding, height - padding - rSize);
    ctx.stroke();

    // Flight Telemetry HUD overlay text
    ctx.fillStyle = "rgba(242, 205, 205, 0.85)";
    ctx.font = "11px monospace";
    ctx.fillText(`CAM_POS: [SCENE_0${sceneIndex + 1} -> 0${nextSceneIndex + 1}]`, padding + 10, padding + 20);
    ctx.fillText(`SCRUB_ALT: ${(100 + Math.sin(progress * Math.PI * 4) * 45).toFixed(1)}m`, padding + 10, padding + 36);
    ctx.fillText(`FOV: 65° · ISO 400`, width - padding - 130, padding + 20);

    ctx.restore();
  }, [progress, isMobileView, imagesLoaded]);

  const activeScene = SCENES[Math.min(Math.floor(progress * (SCENES.length - 1)), SCENES.length - 1)];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[var(--color-brand-sky)]/20 mc-glass shadow-2xl">
      {/* 3D Camera Canvas Container */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-black overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={isMobileView ? 720 : 1280}
          height={isMobileView ? 1280 : 720}
          className={`w-full h-full object-cover transition-all duration-500 ${isMobileView ? "max-w-[380px] mx-auto aspect-[9/16] rounded-xl border border-sky-400/30" : ""}`}
        />

        {/* Loading overlay if images loading */}
        {!imagesLoaded && (
          <div className="absolute inset-0 bg-[#1e1e2e] flex flex-col items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-[var(--color-brand-sky)] animate-spin" />
            <span className="text-xs font-mono text-[var(--color-mocha-subtext0)]">
              Loading 3D Diorama Assets...
            </span>
          </div>
        )}

        {/* Floating Active Scene Badge */}
        <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e1e2e]/80 backdrop-blur-md border border-[var(--color-brand-sky)]/30 text-xs font-mono text-[var(--color-brand-sky)] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-sky)] animate-pulse" />
          <span>{activeScene.eyebrow}</span>
        </div>

        {/* Viewport Aspect Mode Switcher (Desktop 16:9 vs Mobile 9:16) */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-[#181825]/90 backdrop-blur-md p-1 rounded-lg border border-white/10 text-xs font-mono">
          <button
            onClick={() => setIsMobileView(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${!isMobileView ? "bg-[var(--color-brand-sky)] text-[var(--color-mocha-crust)] font-bold" : "text-[var(--color-mocha-subtext0)] hover:text-white"}`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop (16:9)</span>
          </button>
          <button
            onClick={() => setIsMobileView(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${isMobileView ? "bg-[var(--color-brand-sky)] text-[var(--color-mocha-crust)] font-bold" : "text-[var(--color-mocha-subtext0)] hover:text-white"}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile (9:16)</span>
          </button>
        </div>
      </div>

      {/* Interactive Camera Scrub Controller Bar */}
      <div className="p-4 bg-[#181825]/90 backdrop-blur-xl border-t border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl bg-[var(--color-brand-sky)] text-[var(--color-mocha-crust)] hover:opacity-90 transition-transform active:scale-95 shadow-md"
              title={isPlaying ? "Pause Camera Autopilot" : "Play Camera Autopilot"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={() => {
                if (onSeek) onSeek(0);
              }}
              className="p-2 rounded-lg bg-[var(--color-mocha-surface0)] text-[var(--color-mocha-subtext0)] hover:text-white hover:bg-[var(--color-mocha-surface1)] transition-colors"
              title="Reset Camera Position"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-[var(--color-mocha-subtext0)] bg-[var(--color-mocha-mantle)] px-2.5 py-1 rounded-md border border-white/5">
              <FastForward className="w-3.5 h-3.5 text-[var(--color-brand-flamingo)]" />
              <span>Speed:</span>
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-1.5 py-0.5 rounded ${speed === s ? "bg-[var(--color-brand-flamingo)] text-[var(--color-mocha-crust)] font-bold" : "hover:text-white"}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Section Node Indicators */}
          <div className="flex items-center gap-1 sm:gap-2">
            {SCENES.map((sc, idx) => {
              const sceneStart = idx / (SCENES.length - 1);
              const isActive = Math.abs(progress - sceneStart) < 0.12;

              return (
                <button
                  key={sc.id}
                  onClick={() => onSeek && onSeek(sceneStart)}
                  className={`px-2 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1 ${
                    isActive
                      ? "bg-[var(--color-brand-sky)] text-[var(--color-mocha-crust)] font-bold shadow-md"
                      : "bg-[var(--color-mocha-surface0)] text-[var(--color-mocha-subtext0)] hover:bg-[var(--color-mocha-surface1)]"
                  }`}
                >
                  <span>0{idx + 1}</span>
                  <span className="hidden lg:inline">{sc.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrub Slider Input */}
        <div className="relative flex items-center gap-3">
          <Compass className="w-4 h-4 text-[var(--color-brand-sky)] shrink-0 animate-spin-slow" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => onSeek && onSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-[var(--color-mocha-surface0)] rounded-lg appearance-none cursor-pointer accent-[var(--color-brand-sky)]"
          />
          <span className="text-xs font-mono text-[var(--color-brand-sky)] shrink-0 w-12 text-right">
            {(progress * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
