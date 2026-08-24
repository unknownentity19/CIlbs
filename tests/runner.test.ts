import { describe, expect, it, vi, afterEach } from "vitest";
import { runWorkflow, topoSort } from "@/app/studio/runner";
import type { Edge, RunStep, Workflow, WorkflowNode } from "@/app/studio/types";
import { NODE_META } from "@/app/studio/constants";

function node(id: string, kind: WorkflowNode["kind"]): WorkflowNode {
  return {
    id,
    kind,
    label: id,
    x: 0,
    y: 0,
    config: structuredClone(
      NODE_META[kind].defaultConfig,
    ) as WorkflowNode["config"],
  };
}

function edge(from: string, to: string, branch?: Edge["branch"]): Edge {
  return { id: `${from}->${to}`, from, to, branch };
}

/** Run to completion under fake timers and return every emitted step. */
async function collect(workflow: Workflow): Promise<RunStep[]> {
  vi.useFakeTimers();
  const steps: RunStep[] = [];
  const done = runWorkflow(workflow, ({ step }) => {
    steps.push(step);
  });
  await vi.runAllTimersAsync();
  await done;
  return steps;
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("topoSort", () => {
  it("orders nodes upstream-first", () => {
    const nodes = [node("c", "slack"), node("a", "webhook"), node("b", "agent")];
    const sorted = topoSort(nodes, [edge("a", "b"), edge("b", "c")]);
    expect(sorted?.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });

  it("returns null when the graph contains a cycle", () => {
    const nodes = [node("a", "webhook"), node("b", "agent")];
    expect(topoSort(nodes, [edge("a", "b"), edge("b", "a")])).toBeNull();
  });

  it("ignores edges pointing at nodes that no longer exist", () => {
    const nodes = [node("a", "webhook")];
    expect(topoSort(nodes, [edge("a", "ghost")])?.map((n) => n.id)).toEqual([
      "a",
    ]);
  });
});

describe("runWorkflow", () => {
  it("reports a cycle instead of running forever", async () => {
    const workflow: Workflow = {
      id: "w",
      name: "cyclic",
      nodes: [node("a", "webhook"), node("b", "agent")],
      edges: [edge("a", "b"), edge("b", "a")],
    };
    const steps = await collect(workflow);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.status).toBe("error");
  });

  it("runs every node of a linear graph", async () => {
    const workflow: Workflow = {
      id: "w",
      name: "linear",
      nodes: [node("a", "webhook"), node("b", "slack")],
      edges: [edge("a", "b")],
    };
    const steps = await collect(workflow);
    const final = steps.filter((s) => s.status !== "running");
    expect(final.map((s) => s.status)).toEqual(["success", "success"]);
  });

  it("skips the branch a condition did not take", async () => {
    // 0.9 > 0.65, so the condition evaluates false and the true branch dies.
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const workflow: Workflow = {
      id: "w",
      name: "branching",
      nodes: [
        node("t", "webhook"),
        node("c", "condition"),
        node("yes", "slack"),
        node("no", "postgres"),
      ],
      edges: [
        edge("t", "c"),
        edge("c", "yes", "true"),
        edge("c", "no", "false"),
      ],
    };
    const steps = await collect(workflow);
    const byNode = new Map(
      steps.filter((s) => s.status !== "running").map((s) => [s.nodeId, s]),
    );
    expect(byNode.get("yes")?.status).toBe("skipped");
    expect(byNode.get("no")?.status).toBe("success");
  });

  it("skips everything downstream of a skipped node", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const workflow: Workflow = {
      id: "w",
      name: "cascade",
      nodes: [
        node("c", "condition"),
        node("yes", "slack"),
        node("after", "notion"),
      ],
      edges: [edge("c", "yes", "true"), edge("yes", "after")],
    };
    const steps = await collect(workflow);
    const byNode = new Map(
      steps.filter((s) => s.status !== "running").map((s) => [s.nodeId, s]),
    );
    expect(byNode.get("yes")?.status).toBe("skipped");
    expect(byNode.get("after")?.status).toBe("skipped");
  });

  it("stops emitting once aborted", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const steps: RunStep[] = [];
    const workflow: Workflow = {
      id: "w",
      name: "abortable",
      nodes: [node("a", "agent"), node("b", "slack")],
      edges: [edge("a", "b")],
    };
    const done = runWorkflow(workflow, ({ step }) => steps.push(step), controller.signal);
    controller.abort();
    await vi.runAllTimersAsync();
    await done;
    // Only the first "running" step escapes before the abort is observed.
    expect(steps.every((s) => s.status === "running")).toBe(true);
  });
});
