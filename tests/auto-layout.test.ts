import { describe, expect, it } from "vitest";
import { autoLayout } from "@/app/studio/auto-layout";
import { GRID, NODE_W } from "@/app/studio/constants";
import { NODE_META } from "@/app/studio/constants";
import type { Edge, Workflow, WorkflowNode } from "@/app/studio/types";

function node(id: string, x = 0, y = 0): WorkflowNode {
  return {
    id,
    kind: "http",
    label: id,
    x,
    y,
    config: structuredClone(
      NODE_META.http.defaultConfig,
    ) as WorkflowNode["config"],
  };
}

const at = (wf: Workflow, id: string) => wf.nodes.find((n) => n.id === id)!;

describe("autoLayout", () => {
  it("leaves an empty workflow alone", () => {
    const empty: Workflow = { id: "w", name: "n", nodes: [], edges: [] };
    expect(autoLayout(empty)).toBe(empty);
  });

  it("puts each node to the right of its upstream node", () => {
    const wf: Workflow = {
      id: "w",
      name: "chain",
      nodes: [node("a", 900, 40), node("b", 10, 300), node("c", 500, 700)],
      edges: [
        { id: "e1", from: "a", to: "b" },
        { id: "e2", from: "b", to: "c" },
      ],
    };
    const out = autoLayout(wf);
    expect(at(out, "a").x).toBeLessThan(at(out, "b").x);
    expect(at(out, "b").x).toBeLessThan(at(out, "c").x);
    expect(at(out, "b").x - at(out, "a").x).toBeGreaterThanOrEqual(NODE_W);
  });

  it("stacks siblings in the same column", () => {
    const wf: Workflow = {
      id: "w",
      name: "fan-out",
      nodes: [node("a"), node("b", 0, 200), node("c", 0, 400)],
      edges: [
        { id: "e1", from: "a", to: "b" },
        { id: "e2", from: "a", to: "c" },
      ],
    };
    const out = autoLayout(wf);
    expect(at(out, "b").x).toBe(at(out, "c").x);
    expect(at(out, "b").y).not.toBe(at(out, "c").y);
  });

  it("uses the longest path, not the first one found", () => {
    // a → b → c and a → c: c belongs in the third column, behind b.
    const wf: Workflow = {
      id: "w",
      name: "diamond",
      nodes: [node("a"), node("b"), node("c")],
      edges: [
        { id: "e1", from: "a", to: "b" },
        { id: "e2", from: "b", to: "c" },
        { id: "e3", from: "a", to: "c" },
      ],
    };
    const out = autoLayout(wf);
    expect(at(out, "c").x).toBeGreaterThan(at(out, "b").x);
  });

  it("still positions every node when the graph has a cycle", () => {
    const edges: Edge[] = [
      { id: "e1", from: "a", to: "b" },
      { id: "e2", from: "b", to: "a" },
    ];
    const out = autoLayout({
      id: "w",
      name: "cyclic",
      nodes: [node("a", 5, 7), node("b", 9, 3)],
      edges,
    });
    expect(out.nodes).toHaveLength(2);
    for (const n of out.nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
  });

  it("snaps every position to the grid", () => {
    const out = autoLayout({
      id: "w",
      name: "snap",
      nodes: [node("a", 3, 9), node("b", 111, 57)],
      edges: [{ id: "e1", from: "a", to: "b" }],
    });
    for (const n of out.nodes) {
      expect(n.x % GRID).toBe(0);
      expect(n.y % GRID).toBe(0);
    }
  });
});
