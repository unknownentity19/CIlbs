import { describe, expect, it } from "vitest";
import { sanitizeWorkflow } from "@/app/studio/persistence";
import { FALLBACK_NAME, serializeWorkflow } from "@/app/studio/serialize";
import { NODE_META } from "@/app/studio/constants";

const validNode = {
  id: "n1",
  kind: "webhook",
  label: "New lead",
  x: 32,
  y: 96,
  config: { path: "/hooks/new-lead", method: "POST" },
};

describe("sanitizeWorkflow", () => {
  it("rejects anything that isn't a workflow", () => {
    expect(sanitizeWorkflow(null)).toBeNull();
    expect(sanitizeWorkflow("{}")).toBeNull();
    expect(sanitizeWorkflow({ id: "w" })).toBeNull();
    expect(sanitizeWorkflow({ id: "w", name: "n", nodes: {}, edges: [] })).toBeNull();
  });

  it("keeps a well-formed workflow", () => {
    const wf = sanitizeWorkflow({
      id: "w",
      name: "Lead router",
      nodes: [validNode],
      edges: [],
    });
    expect(wf?.name).toBe("Lead router");
    expect(wf?.nodes).toHaveLength(1);
  });

  it("drops nodes of an unknown kind", () => {
    const wf = sanitizeWorkflow({
      id: "w",
      name: "n",
      nodes: [validNode, { ...validNode, id: "n2", kind: "carrier-pigeon" }],
      edges: [],
    });
    expect(wf?.nodes.map((n) => n.id)).toEqual(["n1"]);
  });

  it("drops nodes without real coordinates", () => {
    const wf = sanitizeWorkflow({
      id: "w",
      name: "n",
      nodes: [{ ...validNode, x: "left" }],
      edges: [],
    });
    expect(wf?.nodes).toHaveLength(0);
  });

  it("backfills config keys added after the draft was saved", () => {
    const wf = sanitizeWorkflow({
      id: "w",
      name: "n",
      nodes: [{ ...validNode, kind: "agent", config: { instructions: "hi" } }],
      edges: [],
    });
    const config = wf?.nodes[0]?.config as { model: string; instructions: string };
    expect(config.instructions).toBe("hi");
    expect(config.model).toBe(
      (NODE_META.agent.defaultConfig as { model: string }).model,
    );
  });

  it("drops edges that point at missing nodes", () => {
    const wf = sanitizeWorkflow({
      id: "w",
      name: "n",
      nodes: [validNode],
      edges: [
        { id: "e1", from: "n1", to: "ghost" },
        { id: "e2", from: "ghost", to: "n1" },
      ],
    });
    expect(wf?.edges).toHaveLength(0);
  });

  it("keeps recognised branches and discards junk ones", () => {
    const wf = sanitizeWorkflow({
      id: "w",
      name: "n",
      nodes: [validNode, { ...validNode, id: "n2" }],
      edges: [
        { id: "e1", from: "n1", to: "n2", branch: "false" },
        { id: "e2", from: "n2", to: "n1", branch: "maybe" },
      ],
    });
    expect(wf?.edges[0]?.branch).toBe("false");
    expect(wf?.edges[1]?.branch).toBeUndefined();
  });

  it("falls back to the type's label when one is missing", () => {
    const wf = sanitizeWorkflow({
      id: "w",
      name: "n",
      nodes: [{ ...validNode, label: 42 }],
      edges: [],
    });
    expect(wf?.nodes[0]?.label).toBe(NODE_META.webhook.label);
  });
});

describe("serializeWorkflow", () => {
  it("substitutes a name when the field has been emptied", () => {
    const payload = JSON.parse(
      serializeWorkflow({
        id: "wf_1",
        name: "   ",
        nodes: [],
        edges: [],
      }),
    ) as { name: string };
    // The server requires a non-empty name; without this default, clearing
    // the field made every subsequent cloud save fail validation.
    expect(payload.name).toBe(FALLBACK_NAME);
  });

  it("keeps a real name untouched", () => {
    const payload = JSON.parse(
      serializeWorkflow({
        id: "wf_1",
        name: "Lead router",
        nodes: [],
        edges: [],
      }),
    ) as { name: string };
    expect(payload.name).toBe("Lead router");
  });

  it("ignores fields the server doesn't store", () => {
    const payload = JSON.parse(
      serializeWorkflow({
        id: "wf_1",
        name: "n",
        nodes: [],
        edges: [],
        // @ts-expect-error deliberately extra
        scratch: "should not travel",
      }),
    ) as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(["edges", "id", "name", "nodes"]);
  });
});
