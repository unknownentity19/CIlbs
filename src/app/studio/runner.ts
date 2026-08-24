/**
 * Mock runner for the studio.
 *
 * Walks the workflow graph in topological order (Kahn's algorithm) and emits
 * a "run step" for each node with an on-brand fake output. There's no real
 * API call here — the goal is to make the canvas feel alive and give users a
 * believable preview of what their workflow would do in production.
 *
 * Branching is honoured: a `condition` node evaluates to true or false, and
 * only the edges tagged with the matching branch stay live. A node whose every
 * inbound edge went dead is reported as `skipped` rather than run, which is
 * what makes a two-way condition read correctly on the canvas.
 *
 * The runner streams updates via a callback so the UI can render each step
 * as it transitions through pending → running → success/skipped.
 */


import type { Edge, NodeKind, RunStep, Workflow, WorkflowNode } from "./types";

export type RunUpdate = {
  step: RunStep;
  index: number;
  total: number;
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Topologically sort nodes. Returns null if the graph contains a cycle, so
 * the caller can surface the error rather than spin forever.
 */
export function topoSort(
  nodes: WorkflowNode[],
  edges: Edge[],
): WorkflowNode[] | null {
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    indegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    if (!indegree.has(e.from) || !indegree.has(e.to)) continue;
    adj.get(e.from)!.push(e.to);
    indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1);
  }
  const queue: string[] = [];
  for (const [id, d] of indegree) if (d === 0) queue.push(id);
  const out: WorkflowNode[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    const node = nodes.find((n) => n.id === id);
    if (node) out.push(node);
    for (const next of adj.get(id) ?? []) {
      const d = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, d);
      if (d === 0) queue.push(next);
    }
  }
  return out.length === nodes.length ? out : null;
}

function fakeDuration(kind: NodeKind) {
  const ranges: Record<NodeKind, [number, number]> = {
    webhook: [60, 140],
    schedule: [40, 90],
    http: [180, 420],
    agent: [600, 1400],
    condition: [40, 90],
    transform: [80, 160],
    slack: [120, 260],
    postgres: [110, 240],
    notion: [200, 380],
  };
  const [lo, hi] = ranges[kind];
  return Math.round(lo + Math.random() * (hi - lo));
}

function fakeOutput(node: WorkflowNode): string {
  switch (node.kind) {
    case "webhook": {
      const cfg = node.config as { path: string; method: string };
      return `${cfg.method} ${cfg.path} → 200 OK\n→ payload: { email: "ada@cilbs.com", source: "website" }`;
    }
    case "schedule": {
      const cfg = node.config as { cron: string };
      return `triggered by cron "${cfg.cron}" at ${new Date().toISOString()}`;
    }
    case "http": {
      const cfg = node.config as { url: string; method: string };
      return `${cfg.method} ${cfg.url}\n← 200 OK · 14.2 KB · 248ms`;
    }
    case "agent": {
      const cfg = node.config as { model: string; instructions: string };
      const choices = ["high", "medium", "low"] as const;
      const priority = choices[Math.floor(Math.random() * choices.length)];
      return [
        `model: ${cfg.model}`,
        `tokens: 412 in / 87 out`,
        `reasoning: matched signals on domain age, recent visits, and pricing-page intent.`,
        `output: { priority: "${priority}", reason: "strong intent signal" }`,
      ].join("\n");
    }
    case "condition": {
      // Filled in by the runner, which owns the evaluated result.
      const cfg = node.config as { expression: string };
      return `evaluating ${cfg.expression}`;
    }
    case "transform": {
      return `→ { ...input, normalized: true, ts: ${Date.now()} }`;
    }
    case "slack": {
      const cfg = node.config as { channel: string; message: string };
      return `posted to ${cfg.channel}\n→ "${cfg.message.slice(0, 80)}${
        cfg.message.length > 80 ? "…" : ""
      }"`;
    }
    case "postgres": {
      const cfg = node.config as { query: string };
      return `${cfg.query.split("\n")[0]}\n→ 1 row affected`;
    }
    case "notion": {
      const cfg = node.config as { database: string };
      return `created row in "${cfg.database}" · id=ntn_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
    }
  }
}

/**
 * Drive a simulated run. The callback fires every time a step changes
 * status. Consumers wire this to React state.
 */
export async function runWorkflow(
  workflow: Workflow,
  onUpdate: (update: RunUpdate) => void,
  signal?: AbortSignal,
): Promise<void> {
  const ordered = topoSort(workflow.nodes, workflow.edges);
  if (!ordered) {
    onUpdate({
      step: {
        nodeId: "_graph",
        label: "Graph error",
        status: "error",
        output: "Cycle detected. Remove the loop and try again.",
      },
      index: 0,
      total: 1,
    });
    return;
  }

  const byId = new Map(workflow.nodes.map((n) => [n.id, n]));
  const inbound = new Map<string, Edge[]>();
  for (const e of workflow.edges) {
    const list = inbound.get(e.to) ?? [];
    list.push(e);
    inbound.set(e.to, list);
  }

  /** Nodes that actually executed, and how each condition evaluated. */
  const executed = new Set<string>();
  const conditionResult = new Map<string, boolean>();

  /** An edge is live when its source ran and, for conditions, the branch matches. */
  const isLive = (edge: Edge) => {
    if (!executed.has(edge.from)) return false;
    const source = byId.get(edge.from);
    if (source?.kind === "condition") {
      const taken = conditionResult.get(edge.from) ?? true;
      return (edge.branch ?? "true") === (taken ? "true" : "false");
    }
    return true;
  };

  const total = ordered.length;
  for (let i = 0; i < ordered.length; i++) {
    if (signal?.aborted) return;
    const node = ordered[i]!;
    const feeds = inbound.get(node.id) ?? [];

    // A node with no inputs is a root and always runs; otherwise at least one
    // inbound edge has to be live.
    if (feeds.length > 0 && !feeds.some(isLive)) {
      onUpdate({
        step: {
          nodeId: node.id,
          label: node.label,
          status: "skipped",
          output: "upstream branch not taken",
        },
        index: i,
        total,
      });
      continue;
    }

    const startedAt = Date.now();
    onUpdate({
      step: { nodeId: node.id, label: node.label, status: "running", startedAt },
      index: i,
      total,
    });

    await sleep(fakeDuration(node.kind));
    if (signal?.aborted) return;

    executed.add(node.id);

    let output = fakeOutput(node);
    if (node.kind === "condition") {
      // Weighted so the happy path is the common case, but the false branch
      // still shows up often enough to demo.
      const taken = Math.random() < 0.65;
      conditionResult.set(node.id, taken);
      output = `${output} → ${taken}\n→ following the "${taken}" branch`;
    }

    onUpdate({
      step: {
        nodeId: node.id,
        label: node.label,
        status: "success",
        startedAt,
        finishedAt: Date.now(),
        output,
      },
      index: i,
      total,
    });
  }
}
