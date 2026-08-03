import { useEffect, useRef, useState, useCallback } from "react";

/* ─── Scene data ─── */

export interface SceneData {
  id: number;
  eyebrow: string;
  headline: string;
  body: string;
  imageSrc: string;
}

export const SCENES: SceneData[] = [
  {
    id: 0,
    eyebrow: "Command Center",
    headline: "Your entire agency.\nOne cockpit.",
    body: "Every audit, every client, every dollar — live in one glass dashboard. No more juggling six tabs to see if you're profitable.",
    imageSrc: "/diorama/scene_1.jpg",
  },
  {
    id: 1,
    eyebrow: "Site Scanner",
    headline: "Crawl any site.\nLocally. Instantly.",
    body: "A Rust daemon on your machine renders pages and audits them at 480 pages per second. No per-crawl bills. No API limits. Just raw speed.",
    imageSrc: "/diorama/scene_2.jpg",
  },
  {
    id: 2,
    eyebrow: "Dual Pipeline",
    headline: "Two CRMs.\nZero confusion.",
    body: "One workspace runs your agency. The other faces your clients. Leads flow in, audits fire automatically, deals close themselves.",
    imageSrc: "/diorama/scene_3.jpg",
  },
  {
    id: 3,
    eyebrow: "Every Surface",
    headline: "Desktop. Terminal.\nPhone. Everywhere.",
    body: "Web, Electron, a Rust TUI, iOS, Android — one sync fabric keeps them all in lockstep. Start a task at your desk, finish it on site.",
    imageSrc: "/diorama/scene_4.jpg",
  },
  {
    id: 4,
    eyebrow: "Client Portal",
    headline: "Your brand.\nTheir dashboard.",
    body: "White-labeled reporting your clients actually open. Live rankings, task approvals, and ROI proof — on your domain, under your logo.",
    imageSrc: "/diorama/scene_5.jpg",
  },
];

/* ─── Easing ─── */

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/* ─── Main component ─── */

export function ScrollWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imageRefs = useRef<HTMLImageElement[]>([]);

  /* Preload images */
  useEffect(() => {
    let loaded = 0;
    const images: HTMLImageElement[] = [];
    SCENES.forEach((s, i) => {
      const img = new Image();
      img.src = s.imageSrc;
      img.onload = () => {
        loaded++;
        if (loaded === SCENES.length) setImagesLoaded(true);
      };
      images[i] = img;
    });
    imageRefs.current = images;
  }, []);

  /* Scroll → progress. The container is (N+1) viewports tall; scrolling
     through it maps linearly to 0..1 progress. */
  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const travel = el.scrollHeight - window.innerHeight;
      if (travel <= 0) return;
      const raw = -rect.top / travel;
      setProgress(clamp(raw, 0, 1));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Which scene is active + local fraction within that scene */
  const N = SCENES.length;
  const scaled = progress * N; // 0..N
  const sceneIdx = clamp(Math.floor(scaled), 0, N - 1);
  const frac = scaled - sceneIdx; // 0..1 within scene

  /* Camera transform per scene driven by frac.
     Architecture B "fly through": dive in → pull out → hop → land on next.
     We split each scene's fraction:
       0.00–0.55  dive in  (zoom 1→1.35, slight drift)
       0.55–0.80  pull out (zoom 1.35→0.85, opacity cross-starts)
       0.80–1.00  arrive   (next scene fading in, zoom 0.85→1)
  */
  const getSceneStyle = useCallback(
    (idx: number): React.CSSProperties => {
      if (idx === sceneIdx) {
        // Active scene
        let scale: number;
        let opacity: number;
        let translateY: number;
        let translateX: number;

        if (frac < 0.55) {
          // Dive in
          const t = frac / 0.55;
          const e = easeOutCubic(t);
          scale = 1 + e * 0.35;
          opacity = 1;
          translateY = e * -3; // slight upward drift
          translateX = e * (idx % 2 === 0 ? -2 : 2);
        } else if (frac < 0.8) {
          // Pull out
          const t = (frac - 0.55) / 0.25;
          const e = easeInOutQuad(t);
          scale = 1.35 - e * 0.5;
          opacity = 1 - e * 0.6;
          translateY = -3 + e * 8;
          translateX = (idx % 2 === 0 ? -2 : 2) * (1 - e);
        } else {
          // Fade out
          const t = (frac - 0.8) / 0.2;
          opacity = 0.4 - t * 0.4;
          scale = 0.85 - t * 0.1;
          translateY = 5 + t * 5;
          translateX = 0;
        }

        return {
          transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
          opacity,
          zIndex: 2,
          transition: "none",
        };
      } else if (idx === sceneIdx + 1 && frac > 0.65) {
        // Next scene arriving
        const t = (frac - 0.65) / 0.35;
        const e = easeOutCubic(t);
        return {
          transform: `scale(${0.8 + e * 0.2}) translate(0%, ${(1 - e) * 10}%)`,
          opacity: e,
          zIndex: 3,
          transition: "none",
        };
      } else {
        return { transform: "scale(0.8)", opacity: 0, zIndex: 0 };
      }
    },
    [sceneIdx, frac],
  );

  /* Text overlay visibility — show when we're in the dive-in phase */
  const getTextStyle = useCallback(
    (idx: number): React.CSSProperties => {
      if (idx === sceneIdx) {
        // Text is visible during dive (0..0.5), then fades
        if (frac < 0.12) {
          const t = frac / 0.12;
          return { opacity: easeOutCubic(t), transform: `translateY(${(1 - t) * 30}px)` };
        } else if (frac < 0.5) {
          return { opacity: 1, transform: "translateY(0)" };
        } else {
          const t = (frac - 0.5) / 0.2;
          return { opacity: clamp(1 - t, 0, 1), transform: `translateY(${-t * 40}px)` };
        }
      }
      return { opacity: 0, transform: "translateY(40px)" };
    },
    [sceneIdx, frac],
  );

  /* Progress dots */
  const dotProgress = progress * N;

  return (
    <div
      ref={containerRef}
      style={{ height: `${(N + 1) * 100}vh` }}
      className="relative"
    >
      {/* Sticky viewport — this is the "screen" the camera renders into */}
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-[#0c0c14]">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(137,220,235,0.07) 0%, transparent 70%)`,
          }}
        />

        {/* Scene images — all stacked, only one visible at a time */}
        {SCENES.map((scene, idx) => (
          <div
            key={scene.id}
            className="absolute inset-0 will-change-transform"
            style={getSceneStyle(idx)}
          >
            <img
              src={scene.imageSrc}
              alt=""
              className="h-full w-full object-cover"
              loading={idx < 2 ? "eager" : "lazy"}
            />
            {/* Vignette overlay for depth */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(12,12,20,0.65) 100%)",
              }}
            />
          </div>
        ))}

        {/* Text overlays — glass panels floating over the scene */}
        {SCENES.map((scene, idx) => (
          <div
            key={`text-${scene.id}`}
            className="pointer-events-none absolute inset-0 flex items-end justify-start p-8 sm:p-12 lg:p-20"
            style={getTextStyle(idx)}
          >
            <div className="pointer-events-auto max-w-lg">
              {/* Eyebrow */}
              <span className="mb-3 inline-block rounded-full border border-[#89dceb]/30 bg-[#89dceb]/10 px-3 py-1 text-[11px] font-medium tracking-widest text-[#89dceb] backdrop-blur-md uppercase">
                {scene.eyebrow}
              </span>

              {/* Headline */}
              <h2 className="mt-2 text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl whitespace-pre-line drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]">
                {scene.headline}
              </h2>

              {/* Body */}
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#a6adc8] sm:text-lg drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
                {scene.body}
              </p>
            </div>
          </div>
        ))}

        {/* Minimal progress dots — right edge */}
        <div className="absolute right-6 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3 sm:right-8">
          {SCENES.map((_, idx) => {
            const isActive = idx === sceneIdx;
            return (
              <button
                key={idx}
                onClick={() => {
                  const el = containerRef.current;
                  if (!el) return;
                  const travel = el.scrollHeight - window.innerHeight;
                  const target = (idx / N) * travel + el.offsetTop;
                  window.scrollTo({ top: target, behavior: "smooth" });
                }}
                className="group relative flex h-3 w-3 items-center justify-center"
                aria-label={`Go to scene ${idx + 1}`}
              >
                <span
                  className="block rounded-full transition-all duration-500"
                  style={{
                    width: isActive ? 10 : 6,
                    height: isActive ? 10 : 6,
                    backgroundColor: isActive
                      ? "#89dceb"
                      : "rgba(205,214,244,0.25)",
                    boxShadow: isActive
                      ? "0 0 12px rgba(137,220,235,0.6)"
                      : "none",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Scroll cue — only at the very start */}
        {progress < 0.04 && (
          <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse">
            <span className="text-xs font-medium tracking-widest text-[#a6adc8] uppercase">
              Scroll to explore
            </span>
            <svg width="20" height="28" viewBox="0 0 20 28" fill="none" className="text-[#89dceb]">
              <rect x="1" y="1" width="18" height="26" rx="9" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="10" cy="9" r="2" fill="currentColor">
                <animate attributeName="cy" values="9;18;9" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
