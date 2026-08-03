/**
 * Lightweight SVG sparkline for metrics time series (ADR-0024).
 * No charting library — keeps cockpit sparse.
 */
export function Sparkline({
  values,
  width = 160,
  height = 40,
  stroke = "var(--color-brand-sky)",
  fill = "color-mix(in oklab, var(--color-brand-sky) 18%, transparent)",
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}) {
  if (values.length === 0) {
    return (
      <svg width={width} height={height} className={className} aria-hidden>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--color-mocha-surface1)"
          strokeWidth={1}
        />
      </svg>
    );
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const step = values.length === 1 ? width : width / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / span) * (height - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1]![0]},${height} L${pts[0]![0]},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`sparkline ${values.length} points`}
    >
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
