import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Catppuccin Mocha — brand continuity with Mission Control DSDs */
const C = {
  base: "#1e1e2e",
  mantle: "#181825",
  crust: "#11111b",
  text: "#cdd6f4",
  sub: "#a6adc8",
  sky: "#89dceb",
  flamingo: "#f2cdcd",
  mauve: "#cba6f7",
  sapphire: "#74c7ec",
  teal: "#94e2d5",
  peach: "#fab387",
};

export type Station = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
};

export const STATIONS: Station[] = [
  {
    id: "cockpit",
    eyebrow: "Command",
    title: "One glass cockpit for the whole agency.",
    body: "Clients, pipeline, tasks, and live activity — sparse ops density, progressive disclosure, no widget walls.",
    accent: C.sky,
  },
  {
    id: "scanner",
    eyebrow: "Local Agent",
    title: "Crawl any site. On your metal. Zero per-page bills.",
    body: "Rust daemon + optional Playwright render. Artifacts stay local; findings stream to Convex in real time.",
    accent: C.sapphire,
  },
  {
    id: "crm",
    eyebrow: "Dual CRM",
    title: "Agency book and Client book. Same primitive.",
    body: "Conversations, opportunities, and automations — partitioned by workspace, not bolted-on half-CRM.",
    accent: C.mauve,
  },
  {
    id: "surfaces",
    eyebrow: "Every surface",
    title: "Web. Desktop. Terminal. Phone. Equal.",
    body: "One protocol fabric. Electron + Effect for the agent. TUI for power users. Native scaffolds for mobile.",
    accent: C.teal,
  },
  {
    id: "portal",
    eyebrow: "Client portal",
    title: "Your brand. Their dashboard. Outside your org.",
    body: "Client Users never join the Agency Clerk org. Graphs, shared findings, approvals — ACL-gated.",
    accent: C.flamingo,
  },
];

type ProgressRef = MutableRefObject<number>;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function CosmicField({ progress }: { progress: ProgressRef }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { viewport, camera } = useThree();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
    }),
    [],
  );

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uProgress;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
      vec2 u=f*f*(3.-2.*f);
      return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
    }
    float fbm(vec2 p){
      float v=0., a=.5;
      mat2 m=mat2(1.6,1.2,-1.2,1.6);
      for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=.55; }
      return v;
    }
    void main(){
      vec2 uv = vUv;
      vec2 p = (uv - .5) * vec2(1.8, 1.0);
      float t = uTime * .12;
      float pr = uProgress;
      vec2 q = vec2(fbm(p*1.8+t), fbm(p*1.8+vec2(4.1,1.7)-t));
      float n = fbm(p*2.4 + 2.2*q + pr*1.4);
      vec3 deep = vec3(0.06, 0.06, 0.10);
      vec3 mid  = vec3(0.12, 0.11, 0.20);
      vec3 sky  = vec3(0.537, 0.863, 0.922);
      vec3 fla  = vec3(0.949, 0.804, 0.804);
      vec3 mau  = vec3(0.796, 0.651, 0.969);
      vec3 col = mix(deep, mid, smoothstep(0.0, 0.6, n));
      col = mix(col, sky * 0.55, smoothstep(0.35, 0.9, n + pr*0.2) * 0.45);
      col = mix(col, mau * 0.5, smoothstep(0.5, 1.0, q.x) * 0.35);
      col = mix(col, fla * 0.4, smoothstep(0.65, 1.0, n) * 0.25 * pr);
      float vign = smoothstep(1.2, 0.2, length(p));
      col *= vign;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const camZ = camera.position.z;
    m.position.set(camera.position.x * 0.25, camera.position.y * 0.25, camZ - 16);
    m.scale.set(viewport.width * 2.6, viewport.height * 2.6, 1);
    const mat = m.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uProgress.value = progress.current;
  });

  return (
    <mesh ref={mesh} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
}

function StationMesh({
  position,
  color,
  active,
}: {
  position: [number, number, number];
  color: string;
  active: number;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = t * 0.15 + active * 0.4;
    g.position.y = position[1] + Math.sin(t * 0.8 + position[0]) * 0.08;
    const s = 0.85 + active * 0.25;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, s, 0.08));
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <group ref={group} position={position}>
        {/* Glass deck */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
          <circleGeometry args={[1.35, 48]} />
          <meshStandardMaterial
            color={C.mantle}
            transparent
            opacity={0.55}
            metalness={0.6}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={0.15 + active * 0.35}
          />
        </mesh>
        {/* Core orb */}
        <mesh>
          <icosahedronGeometry args={[0.55, 1]} />
          <MeshDistortMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.45 + active * 0.55}
            metalness={0.35}
            roughness={0.25}
            distort={0.25 + active * 0.15}
            speed={2}
          />
        </mesh>
        {/* Ring */}
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[0.95, 0.035, 12, 64]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>
        {/* Uplink bars */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[(i - 1) * 0.35, 0.85, 0]}>
            <boxGeometry args={[0.12, 0.35 + i * 0.12, 0.12]} />
            <meshStandardMaterial
              color={C.sky}
              emissive={C.sky}
              emissiveIntensity={0.3 + active * 0.4}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial
        color={C.crust}
        metalness={0.7}
        roughness={0.45}
        transparent
        opacity={0.55}
      />
    </mesh>
  );
}

function CameraRig({ progress }: { progress: ProgressRef }) {
  const { camera } = useThree();
  const smooth = useRef(0);

  // Path through stations along +Z with lateral sway
  useFrame(() => {
    smooth.current += (progress.current - smooth.current) * 0.07;
    const p = smooth.current;
    const n = STATIONS.length;
    const t = p * (n - 1);
    const i = Math.floor(t);
    const f = t - i;
    const ease = f * f * (3 - 2 * f);

    const z0 = i * 6;
    const z1 = Math.min(i + 1, n - 1) * 6;
    const z = THREE.MathUtils.lerp(z0, z1, ease);
    const x = Math.sin(p * Math.PI * 1.5) * 1.4;
    const y = 1.1 + Math.sin(p * Math.PI * 2) * 0.35;

    // Dive: approach then pull slightly (architecture B feel, real-time)
    const dive = Math.sin(ease * Math.PI) * 0.55;
    camera.position.set(x, y - dive * 0.35, z + 4.2 - dive * 1.2);
    camera.lookAt(x * 0.2, 0.2, z);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 42 + dive * 6;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

function Scene({ progress }: { progress: ProgressRef }) {
  return (
    <>
      <color attach="background" args={[C.crust]} />
      <fog attach="fog" args={[C.crust, 8, 28]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} color="#e6e9ef" />
      <pointLight position={[-4, 3, 2]} intensity={0.8} color={C.sky} />
      <pointLight position={[5, 2, 12]} intensity={0.55} color={C.flamingo} />

      <CosmicField progress={progress} />
      <GridFloor />
      <Sparkles count={80} scale={[18, 6, 32]} size={2} speed={0.25} color={C.sky} opacity={0.45} />

      {STATIONS.map((s, i) => {
        const center = i / Math.max(STATIONS.length - 1, 1);
        const active = 1 - Math.min(1, Math.abs(progress.current - center) * 3.2);
        return (
          <StationMesh
            key={s.id}
            position={[(i % 2 === 0 ? -0.9 : 0.9) * (i === 0 ? 0 : 1), 0, i * 6]}
            color={s.accent}
            active={Math.max(0, active)}
          />
        );
      })}

      <CameraRig progress={progress} />
    </>
  );
}

/**
 * Scroll-scrubbed R3F world — continuous flight through Mission Control stations.
 * Inspired by modern-design-playground Stage + GSAP pin/scrub (michaelhurley / invite).
 */
export function WorldStage() {
  const progress = useRef(0);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.55,
        pin: pin,
        anticipatePin: 1,
        onUpdate: (self) => {
          progress.current = self.progress;
          const idx = Math.min(
            STATIONS.length - 1,
            Math.floor(self.progress * STATIONS.length),
          );
          setActive(idx);
        },
      });
    });

    return () => ctx.revert();
  }, [reduced]);

  if (reduced) {
    return (
      <section className="relative bg-[#11111b] px-6 py-24">
        <div className="mx-auto max-w-3xl space-y-16">
          {STATIONS.map((s) => (
            <article key={s.id} className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#89dceb]">{s.eyebrow}</p>
              <h3 className="text-2xl font-semibold text-[#cdd6f4]">{s.title}</h3>
              <p className="text-[#a6adc8] leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={trackRef} className="relative" style={{ height: `${STATIONS.length * 100}vh` }}>
      <div ref={pinRef} className="relative h-dvh w-full overflow-hidden bg-[#11111b]">
        <Canvas
          className="absolute inset-0"
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          camera={{ position: [0, 1.2, 4.5], fov: 42, near: 0.1, far: 60 }}
        >
          <Suspense fallback={null}>
            <Scene progress={progress} />
          </Suspense>
        </Canvas>

        {/* Glass copy overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-end md:items-center">
          <div className="w-full max-w-xl p-6 md:p-12 md:ml-8 lg:ml-16">
            {STATIONS.map((s, i) => {
              const on = i === active;
              return (
                <article
                  key={s.id}
                  className="absolute bottom-24 left-6 right-6 md:static md:bottom-auto md:left-auto md:right-auto transition-all duration-500"
                  style={{
                    opacity: on ? 1 : 0,
                    transform: on ? "translateY(0)" : "translateY(12px)",
                    pointerEvents: on ? "auto" : "none",
                    position: on ? "relative" : "absolute",
                  }}
                  aria-hidden={!on}
                >
                  <div
                    className="rounded-2xl border border-white/10 bg-[#1e1e2e]/55 px-5 py-5 backdrop-blur-xl shadow-[0_0_40px_rgba(137,220,235,0.08)]"
                    style={{ boxShadow: `0 0 48px ${s.accent}22` }}
                  >
                    <p
                      className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
                      style={{ color: s.accent }}
                    >
                      {s.eyebrow}
                    </p>
                    <h2 className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                      {s.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-[#a6adc8] sm:text-base">
                      {s.body}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Route rail */}
        <nav
          className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2 md:right-8"
          aria-label="World stations"
        >
          {STATIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="group flex items-center justify-end gap-2"
              onClick={() => {
                const track = trackRef.current;
                if (!track) return;
                const top = track.offsetTop;
                const h = track.offsetHeight - window.innerHeight;
                const y = top + (i / Math.max(STATIONS.length - 1, 1)) * h;
                window.scrollTo({ top: y, behavior: "smooth" });
              }}
              aria-current={i === active ? "true" : undefined}
              aria-label={s.eyebrow}
            >
              <span className="hidden text-[10px] uppercase tracking-wider text-[#6c7086] opacity-0 transition group-hover:opacity-100 md:inline">
                {s.eyebrow}
              </span>
              <span
                className="block h-2 w-2 rounded-full transition-all"
                style={{
                  background: i === active ? s.accent : "#45475a",
                  boxShadow: i === active ? `0 0 12px ${s.accent}` : "none",
                  transform: i === active ? "scale(1.35)" : "scale(1)",
                }}
              />
            </button>
          ))}
        </nav>

        <p className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.25em] text-[#6c7086]">
          Scroll to fly
        </p>
      </div>
    </section>
  );
}
