import { GRID, NODE_H, NODE_W } from "./constants";
import type { Workflow, WorkflowNode } from "./types";

/**
 * Tidy the graph into left-to-right layers.
 *
 * Every node lands in the column just right of its deepest upstream node
 * (longest-path layering), which is what a workflow reads like: triggers on
 * the left, terminal actions on the right. Nodes inside a cycle — which has no
 * valid layering — keep their relative order and get pushed to the end rather
 * than blocking the layout.
 */

const COL_GAP = 72;
const ROW_GAP = 36;
const MARGIN = 40;

function snap(v: number) {
  return Math.round(v / GRID) * GRID;
}

export function autoLayout(workflow: Workflow): Workflow {
  const { nodes, edges } = workflow;
  if (nodes.length === 0) return workflow;

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

  // Kahn's algorithm, tracking the longest path to each node as its layer.
  const layer = new Map<string, number>();
  const queue: string[] = [];
  for (const [id, d] of indegree) {
    if (d === 0) {
      layer.set(id, 0);
      queue.push(id);
    }
  }
  let visited = 0;
  while (queue.length) {
    const id = queue.shift()!;
    visited += 1;
    const base = layer.get(id) ?? 0;
    for (const next of adj.get(id) ?? []) {
      layer.set(next, Math.max(layer.get(next) ?? 0, base + 1));
      const d = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, d);
      if (d === 0) queue.push(next);
    }
  }

  // Anything left unvisited belongs to a cycle: park it in a trailing column
  // so the user can still see and untangle it.
  if (visited < nodes.length) {
    const tail = Math.max(-1, ...[...layer.values()]) + 1;
    for (const n of nodes) if (!layer.has(n.id)) layer.set(n.id, tail);
  }

  const columns = new Map<number, WorkflowNode[]>();
  for (const n of nodes) {
    const l = layer.get(n.id) ?? 0;
    const col = columns.get(l) ?? [];
    col.push(n);
    columns.set(l, col);
  }

  // Keep each column in its current top-to-bottom order so tidying feels like
  // a nudge rather than a reshuffle.
  for (const col of columns.values()) col.sort((a, b) => a.y - b.y);

  const tallest = Math.max(...[...columns.values()].map((c) => c.length));
  const canvasHeight = tallest * NODE_H + (tallest - 1) * ROW_GAP;

  const positions = new Map<string, { x: number; y: number }>();
  for (const [l, col] of columns) {
    const height = col.length * NODE_H + (col.length - 1) * ROW_GAP;
    const top = MARGIN + (canvasHeight - height) / 2;
    col.forEach((node, i) => {
      positions.set(node.id, {
        x: snap(MARGIN + l * (NODE_W + COL_GAP)),
        y: snap(top + i * (NODE_H + ROW_GAP)),
      });
    });
  }

  return {
    ...workflow,
    nodes: nodes.map((n) => ({ ...n, ...(positions.get(n.id) ?? {}) })),
  };
}
