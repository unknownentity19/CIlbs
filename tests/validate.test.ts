import { describe, expect, it } from "vitest";
import { validateWorkflow } from "@/app/studio/validate";
import { NODE_META } from "@/app/studio/constants";
import type { Edge, Workflow, WorkflowNode } from "@/app/studio/types";

function node(
  id: string,
  kind: WorkflowNode["kind"],
  config?: Partial<Record<string, unknown>>,
): WorkflowNode {
  return {
    id,
    kind,
    label: id,
    x: 0,
    y: 0,
    config: {
      ...(structuredClone(NODE_META[kind].defaultConfig) as object),
      ...config,
    } as WorkflowNode["config"],
  };
}

function wf(nodes: WorkflowNode[], edges: Edge[] = []): Workflow {
  return { id: "w", name: "test", nodes, edges };
}

const ids = (workflow: Workflow) => validateWorkflow(workflow).map((i) => i.id);

describe("validateWorkflow", () => {
  it("says nothing about an empty canvas", () => {
    expect(validateWorkflow(wf([]))).toEqual([]);
  });

  it("passes a well-formed graph", () => {
    const graph = wf(
      [node("t", "webhook"), node("s", "slack")],
      [{ id: "e", from: "t", to: "s" }],
    );
    expect(validateWorkflow(graph)).toEqual([]);
  });

  it("flags a graph with no trigger", () => {
    expect(ids(wf([node("s", "slack")]))).toContain("no-trigger");
  });

  it("flags a node nothing is wired into", () => {
    const graph = wf([node("t", "webhook"), node("s", "slack")], [
      { id: "e", from: "t", to: "t" },
    ]);
    expect(ids(graph)).toContain("orphan-s");
  });

  it("flags a trigger that goes nowhere", () => {
    expect(ids(wf([node("t", "webhook")]))).toContain("dead-trigger-t");
  });

  it("reports a cycle as an error", () => {
    const graph = wf(
      [node("a", "http"), node("b", "slack")],
      [
        { id: "e1", from: "a", to: "b" },
        { id: "e2", from: "b", to: "a" },
      ],
    );
    const cycle = validateWorkflow(graph).find((i) => i.id === "cycle");
    expect(cycle?.level).toBe("error");
  });

  it("flags a condition that is missing one side", () => {
    const graph = wf(
      [node("t", "webhook"), node("c", "condition"), node("s", "slack")],
      [
        { id: "e1", from: "t", to: "c" },
        { id: "e2", from: "c", to: "s", branch: "true" },
      ],
    );
    expect(ids(graph)).toContain("no-false-c");
    expect(ids(graph)).not.toContain("no-true-c");
  });

  it("catches unusable configuration", () => {
    const graph = wf(
      [
        node("t", "schedule", { cron: "not a cron" }),
        node("h", "http", { url: "example.com" }),
        node("n", "notion", { properties: "{ nope }" }),
      ],
      [
        { id: "e1", from: "t", to: "h" },
        { id: "e2", from: "h", to: "n" },
      ],
    );
    const found = ids(graph);
    expect(found).toContain("config-t");
    expect(found).toContain("config-h");
    expect(found).toContain("config-n");
  });

  it("accepts valid configuration", () => {
    const graph = wf(
      [
        node("t", "schedule", { cron: "*/5 * * * *" }),
        node("h", "http", { url: "https://api.example.com" }),
      ],
      [{ id: "e1", from: "t", to: "h" }],
    );
    expect(ids(graph)).not.toContain("config-t");
    expect(ids(graph)).not.toContain("config-h");
  });
});
