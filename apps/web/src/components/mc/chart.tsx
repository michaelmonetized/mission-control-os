import { useMemo } from "react";
import { defineChart, lineY, areaY, barY } from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts-scales/linear";
import { scalePoint } from "@tanstack/charts-scales/point";
import { Chart } from "@tanstack/react-charts";
import { cn } from "@/lib/utils";

export type SeriesPoint = { x: string | number; y: number };

type ChartKind = "line" | "area" | "bar";

/**
 * TanStack Charts + MC theme (Catppuccin Mocha sky/flamingo).
 * Replaces ad-hoc SVG sparkline for product metrics (ADR-0024).
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
  const definition = useMemo(() => {
    const rows = data.length
      ? data
      : [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ];

    const mark =
      kind === "bar"
        ? barY(rows, { x: "x", y: "y", fill: color })
        : kind === "line"
          ? lineY(rows, { x: "x", y: "y", stroke: color })
          : areaY(rows, { x: "x", y: "y", fill: color });

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
  }, [data, kind, color]);

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

  return (
    <div className={cn("w-full overflow-hidden rounded-md", className)} style={{ height }}>
      <Chart definition={definition} height={height} ariaLabel={ariaLabel} />
    </div>
  );
}

/**
 * Drop-in sparkline API using TanStack Charts (narrow height, no axes chrome intended).
 */
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

  return (
    <div className={className} style={{ width, height }}>
      <MetricsChart
        data={data}
        kind="line"
        height={height}
        color={stroke}
        ariaLabel="Sparkline"
      />
    </div>
  );
}
