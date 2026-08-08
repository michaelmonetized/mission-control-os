import { useMemo } from "react";
import { cn } from "cnfast";

export type StructureNode = {
  id: string;
  url: string;
  path: string;
  depth: number;
  title?: string;
  outDegree?: number;
};

export type StructureEdge = { from: string; to: string };

/**
 * Site structure visualisation (ADR-0008 Sitebulb-class).
 * Radial / layered layout by crawl depth — pure SVG, no deps.
 */
export function SiteStructureGraph({
  nodes,
  edges,
  origin,
  maxDepth,
  className,
  source,
}: {
  nodes: StructureNode[];
  edges: StructureEdge[];
  origin: string;
  maxDepth: number;
  className?: string;
  source?: string;
}) {
  const layout = useMemo(() => {
    const W = 640;
    const H = 360;
    const cx = W / 2;
    const cy = H / 2;
    const byDepth = new Map<number, StructureNode[]>();
    for (const n of nodes) {
      const d = n.depth;
      const list = byDepth.get(d) ?? [];
      list.push(n);
      byDepth.set(d, list);
    }
    const pos = new Map<string, { x: number; y: number }>();
    const depths = [...byDepth.keys()].sort((a, b) => a - b);
    const maxD = Math.max(maxDepth, ...depths, 1);

    for (const d of depths) {
      const list = byDepth.get(d) ?? [];
      const r = d === 0 ? 0 : 40 + (d / maxD) * Math.min(cx, cy) * 0.85;
      list.forEach((n, i) => {
        if (d === 0) {
          pos.set(n.id, { x: cx, y: cy });
          return;
        }
        const angle = (i / Math.max(list.length, 1)) * Math.PI * 2 - Math.PI / 2;
        pos.set(n.id, {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        });
      });
    }

    const drawnEdges = edges
      .map((e) => {
        const a = pos.get(e.from);
        const b = pos.get(e.to);
        if (!a || !b) return null;
        return { ...e, a, b };
      })
      .filter(Boolean) as {
      from: string;
      to: string;
      a: { x: number; y: number };
      b: { x: number; y: number };
    }[];

    return { W, H, pos, drawnEdges, nodes };
  }, [nodes, edges, maxDepth]);

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-[var(--color-mocha-subtext0)]">No structure nodes.</p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-mocha-subtext0)]">
        <span>
          {nodes.length} pages · {edges.length} links · depth {maxDepth}
        </span>
        <span className="font-mono truncate max-w-full">{origin}</span>
        {source ? (
          <span className="text-[var(--color-brand-sky)]">
            {source === "agent" ? "from agent" : "from findings"}
          </span>
        ) : null}
      </div>
      <svg
        viewBox={`0 0 ${layout.W} ${layout.H}`}
        className="w-full h-auto rounded-md mc-glass border border-[var(--color-mocha-surface1)]"
        role="img"
        aria-label="Site structure graph"
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-mocha-overlay0)" />
          </marker>
        </defs>
        {layout.drawnEdges.map((e, i) => (
          <line
            key={`${e.from}-${e.to}-${i}`}
            x1={e.a.x}
            y1={e.a.y}
            x2={e.b.x}
            y2={e.b.y}
            stroke="var(--color-mocha-surface2)"
            strokeWidth={1}
            opacity={0.7}
            markerEnd="url(#arrow)"
          />
        ))}
        {[...layout.pos.entries()].map(([id, p]) => {
          const node = nodes.find((n) => n.id === id);
          const isRoot = node?.depth === 0;
          return (
            <g key={id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isRoot ? 10 : 6}
                fill={
                  isRoot
                    ? "var(--color-brand-sky)"
                    : "var(--color-brand-flamingo)"
                }
                opacity={isRoot ? 1 : 0.85}
              >
                <title>{node?.title ?? node?.path ?? id}</title>
              </circle>
              {(isRoot || (node && node.depth <= 1 && nodes.length < 40)) && (
                <text
                  x={p.x}
                  y={p.y + (isRoot ? 22 : 16)}
                  textAnchor="middle"
                  fill="var(--color-mocha-subtext0)"
                  fontSize={9}
                  className="font-mono"
                >
                  {(node?.path ?? "/").slice(0, 18)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <ul className="max-h-36 overflow-y-auto text-[10px] font-mono space-y-0.5 text-[var(--color-mocha-subtext0)]">
        {nodes.slice(0, 40).map((n) => (
          <li key={n.id}>
            <span className="text-[var(--color-brand-sky)]">d{n.depth}</span>{" "}
            {n.path}
            {n.title ? ` · ${n.title.slice(0, 40)}` : ""}
          </li>
        ))}
        {nodes.length > 40 ? <li>… +{nodes.length - 40} more</li> : null}
      </ul>
    </div>
  );
}
