import {
  Bot,
  Database,
  GitBranch,
  Globe,
  MessageSquare,
  Play,
  Webhook,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NodeCategory = "trigger" | "ai" | "logic" | "action";

type Node = {
  id: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  category: NodeCategory;
  /** x, y, w, h are in viewBox units. The canvas is locked to the same
   * aspect ratio so percentage positioning aligns the absolute divs and
   * the SVG curves precisely at any width. */
  x: number;
  y: number;
  accent?: boolean;
};

/**
 * Marketing preview of a Cilbs workflow. Visuals follow the studio's
 * category palette (emerald = trigger, violet = AI, amber = logic,
 * sky = action) so the marketing surface feels consistent with the real
 * product.
 *
 * The trick that keeps everything aligned at any breakpoint: the canvas
 * is locked to the SVG's aspect ratio (`aspect-[VIEW_W/VIEW_H]`) and node
 * positions are emitted as percentages of the same viewBox. SVG curves
 * and absolute-positioned divs therefore live in one shared coordinate
 * system with zero drift between them.
 */

const VIEW_W = 800;
const VIEW_H = 280;
const NODE_W = 130;
const NODE_H = 56;

const NODES: Node[] = [
  {
    id: "trigger",
    label: "Webhook",
    sub: "POST /hooks/leads",
    icon: Webhook,
    category: "trigger",
    x: 32,
    y: 88,
  },
  {
    id: "fetch",
    label: "HTTP",
    sub: "Fetch CRM lead",
    icon: Globe,
    category: "action",
    x: 240,
    y: 24,
  },
  {
    id: "agent",
    label: "AI Agent",
    sub: "Classify & enrich",
    icon: Bot,
    category: "ai",
    x: 240,
    y: 152,
    accent: true,
  },
  {
    id: "branch",
    label: "Branch",
    sub: "if priority = high",
    icon: GitBranch,
    category: "logic",
    x: 460,
    y: 88,
  },
  {
    id: "db",
    label: "Postgres",
    sub: "Update record",
    icon: Database,
    category: "action",
    x: 660,
    y: 24,
  },
  {
    id: "slack",
    label: "Slack",
    sub: "Notify owner",
    icon: MessageSquare,
    category: "action",
    x: 660,
    y: 152,
  },
];

const EDGES: [string, string][] = [
  ["trigger", "fetch"],
  ["trigger", "agent"],
  ["fetch", "branch"],
  ["agent", "branch"],
  ["branch", "db"],
  ["branch", "slack"],
];

const CATEGORY_TONES: Record<
  NodeCategory,
  {
    icon: string;
    iconBg: string;
    border: string;
    halo: string;
    badge: string;
  }
> = {
  trigger: {
    icon: "text-emerald-600",
    iconBg: "bg-emerald-500/10 border-emerald-500/30",
    border: "border-emerald-500/40",
    halo: "shadow-[0_0_24px_-12px_rgb(16_185_129/0.55)]",
    badge: "bg-emerald-500/10 text-emerald-700",
  },
  ai: {
    icon: "text-violet-600",
    iconBg: "bg-violet-500/10 border-violet-500/30",
    border: "border-violet-500/40",
    halo: "shadow-[0_0_28px_-10px_rgb(139_92_246/0.55)]",
    badge: "bg-violet-500/10 text-violet-700",
  },
  logic: {
    icon: "text-amber-600",
    iconBg: "bg-amber-500/10 border-amber-500/30",
    border: "border-amber-500/40",
    halo: "shadow-[0_0_24px_-12px_rgb(245_158_11/0.55)]",
    badge: "bg-amber-500/10 text-amber-700",
  },
  action: {
    icon: "text-sky-600",
    iconBg: "bg-sky-500/10 border-sky-500/30",
    border: "border-sky-500/40",
    halo: "shadow-[0_0_24px_-12px_rgb(14_165_233/0.55)]",
    badge: "bg-sky-500/10 text-sky-700",
  },
};

function getNode(id: string) {
  return NODES.find((n) => n.id === id)!;
}

/** Map a viewBox value to a percentage of the canvas. */
const px = (n: number, total: number) => `${(n / total) * 100}%`;

export function WorkflowPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </span>
          <Breadcrumb />
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
      </div>

      {/* Canvas — locked to the viewBox aspect ratio so SVG and node divs
        live in one shared coordinate system. */}
      <div
        className="relative w-full overflow-hidden bg-grid"
        style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
      >
        {/* Soft gradient orbs for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-12 -top-12 h-1/2 w-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "rgb(var(--gradient-from) / 0.5)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -bottom-16 h-2/3 w-2/3 rounded-full opacity-40 blur-3xl"
          style={{ background: "rgb(var(--gradient-to) / 0.45)" }}
        />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="edge-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop
                offset="0%"
                stopColor="rgb(var(--gradient-from))"
                stopOpacity="0.25"
              />
              <stop
                offset="50%"
                stopColor="rgb(var(--gradient-via))"
                stopOpacity="0.6"
              />
              <stop
                offset="100%"
                stopColor="rgb(var(--gradient-to))"
                stopOpacity="0.25"
              />
            </linearGradient>
            <radialGradient id="pulse-glow">
              <stop
                offset="0%"
                stopColor="rgb(var(--gradient-via))"
                stopOpacity="0.85"
              />
              <stop
                offset="100%"
                stopColor="rgb(var(--gradient-via))"
                stopOpacity="0"
              />
            </radialGradient>
          </defs>

          {EDGES.map(([from, to], i) => {
            const a = getNode(from);
            const b = getNode(to);
            const x1 = a.x + NODE_W;
            const y1 = a.y + NODE_H / 2;
            const x2 = b.x;
            const y2 = b.y + NODE_H / 2;
            const cx = (x1 + x2) / 2;
            const path = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
            return (
              <g key={`${from}-${to}`}>
                {/* Soft halo */}
                <path
                  d={path}
                  stroke="url(#edge-gradient)"
                  strokeWidth={6}
                  fill="none"
                  opacity={0.35}
                />
                {/* Crisp line */}
                <path
                  d={path}
                  stroke="url(#edge-gradient)"
                  strokeWidth={1.5}
                  fill="none"
                />
                <circle
                  r={9}
                  fill="url(#pulse-glow)"
                  className="animate-edge-pulse"
                  style={{
                    offsetPath: `path("${path}")`,
                    animationDelay: `${i * 0.35}s`,
                  }}
                />
                <circle
                  r={3}
                  fill="rgb(var(--gradient-via))"
                  className="animate-edge-pulse"
                  style={{
                    offsetPath: `path("${path}")`,
                    animationDelay: `${i * 0.35}s`,
                  }}
                />
              </g>
            );
          })}
        </svg>

        {NODES.map((node, i) => {
          const tone = CATEGORY_TONES[node.category];
          const Icon = node.icon;
          return (
            <div
              key={node.id}
              className={cn(
                "animate-fade-up absolute flex flex-col rounded-xl border bg-card px-2.5 py-2",
                tone.border,
                tone.halo,
                node.accent && "ring-1 ring-violet-500/30",
              )}
              style={{
                left: px(node.x, VIEW_W),
                top: px(node.y, VIEW_H),
                width: px(NODE_W, VIEW_W),
                height: px(NODE_H, VIEW_H),
                animationDelay: `${0.1 + i * 0.07}s`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                    tone.iconBg,
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", tone.icon)} />
                </span>
                <span className="truncate text-[12px] font-semibold text-foreground">
                  {node.label}
                </span>
                {node.accent ? (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                      tone.badge,
                    )}
                  >
                    AI
                  </span>
                ) : null}
              </div>
              <span className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground">
                {node.sub}
              </span>
            </div>
          );
        })}

        {/* Floating reasoning chip removed per design request. */}
      </div>

      {/* Footer status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground sm:px-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-foreground" />
            <span className="text-foreground/80">6 nodes</span>
            <span className="opacity-50">·</span>
            <span>2 branches</span>
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-foreground/80 sm:inline-flex">
            <Play className="h-3 w-3" />v 12 · deployed
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>p95</span>
            <span className="text-foreground/85">184ms</span>
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <span>throughput</span>
            <span className="text-foreground/85">42 rps</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <div className="flex min-w-0 items-center gap-1.5 truncate text-[11px] font-mono text-muted-foreground">
      <span className="hidden rounded-md border border-border bg-background px-1.5 py-0.5 text-foreground/85 sm:inline">
        workspace
      </span>
      <span className="hidden opacity-50 sm:inline">/</span>
      <span className="rounded-md border border-border bg-background px-1.5 py-0.5">
        workflows
      </span>
      <span className="opacity-50">/</span>
      <span
        className="rounded-md border px-1.5 py-0.5 text-foreground"
        style={{
          background:
            "linear-gradient(90deg, rgb(var(--gradient-from) / 0.10), rgb(var(--gradient-to) / 0.10))",
          borderColor: "rgb(var(--gradient-via) / 0.35)",
        }}
      >
        lead-router
      </span>
    </div>
  );
}
