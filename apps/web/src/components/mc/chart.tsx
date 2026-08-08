import { useMemo, useState, useEffect, Component, type ReactNode } from "react";
import { defineChart, lineY, areaY, barY } from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts-scales/linear";
import { scalePoint } from "@tanstack/charts-scales/point";
import { Chart } from "@tanstack/react-charts";
import { cn } from "@/lib/utils";

export type SeriesPoint = { x: string | number; y: number };

type ChartKind = "line" | "area" | "bar";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

class ChartErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

/** Minimal SVG path for sparklines / chart fallback (no deps, SSR-safe). */
function SvgSeries({
  data,
  height,
  color,
  kind,
  className,
  ariaLabel,
}: {
  data: SeriesPoint[];
  height: number;
  color: string;
  kind: ChartKind;
  className?: string;
  ariaLabel?: string;
}) {
  const w = 320;
  const pad = 4;
  const ys = data.map((d) => d.y);
  const min = Math.min(...ys, 0);
  const max = Math.max(...ys, 1);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = height - pad - ((d.y - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  });
  const line = pts.join(" ");
  const area = `M${pts[0]} L${line.slice(pts[0]!.length + 1)} L${w - pad},${height - pad} L${pad},${height - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className={cn("w-full", className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
    >
      {kind === "area" ? (
        <path d={area} fill={color} opacity={0.25} />
      ) : null}
      {kind === "bar"
        ? data.map((d, i) => {
            const bw = (w - pad * 2) / data.length - 2;
            const x = pad + i * ((w - pad * 2) / data.length);
            const h = ((d.y - min) / span) * (height - pad * 2);
            return (
              <rect
                key={i}
                x={x}
                y={height - pad - h}
                width={Math.max(bw, 1)}
                height={h}
                fill={color}
                opacity={0.9}
              />
            );
          })
        : (
          <polyline
            fill="none"
            stroke={color}
            strokeWidth={2}
            points={line}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
    </svg>
  );
}

/**
 * Product metrics chart. Client-only TanStack Charts with SVG fallback
 * (avoids SSR crashes from pre-alpha chart renderer).
 */
export function MetricsChart({
  data,
  kind = "area",
  height = 160,
  color = "var(--color-brand-sky)",
  className,
  ariaLabel = "Metrics chart",
}: {
  data: SeriesPoint[];
  kind?: ChartKind;
  height?: number;
  color?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const mounted = useMounted();

  const definition = useMemo(() => {
    if (!mounted || data.length === 0) return null;
    try {
      const mark =
        kind === "bar"
          ? barY(data, { x: "x", y: "y", fill: color })
          : kind === "line"
            ? lineY(data, { x: "x", y: "y", stroke: color })
            : areaY(data, { x: "x", y: "y", fill: color });

      return defineChart({
        marks: [mark],
        x: {
          scale: () => scalePoint().padding(0.15),
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
        },
      });
    } catch {
      return null;
    }
  }, [data, kind, color, mounted]);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-[var(--color-mocha-surface1)] text-xs text-[var(--color-mocha-subtext0)]",
          className,
        )}
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const fallback = (
    <SvgSeries
      data={data}
      height={height}
      color={color}
      kind={kind}
      className={className}
      ariaLabel={ariaLabel}
    />
  );

  if (!mounted || !definition) {
    return fallback;
  }

  return (
    <ChartErrorBoundary fallback={fallback}>
      <div className={cn("w-full overflow-hidden rounded-md", className)} style={{ height }}>
        <Chart definition={definition} height={height} ariaLabel={ariaLabel} />
      </div>
    </ChartErrorBoundary>
  );
}

export function Sparkline({
  values,
  width = 160,
  height = 40,
  stroke = "var(--color-brand-sky)",
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}) {
  const data = useMemo(
    () => values.map((y, i) => ({ x: i, y })),
    [values],
  );

  if (values.length === 0) {
    return <div className={className} style={{ width, height }} />;
  }

  // Sparklines stay on the reliable SVG path (no chart lib).
  return (
    <div className={className} style={{ width, height }}>
      <SvgSeries
        data={data}
        height={height}
        color={stroke}
        kind="line"
        ariaLabel="Sparkline"
      />
    </div>
  );
}
