/**
 * Studio data model.
 *
 * The studio is a fully client-side workflow builder. A workflow is a directed
 * graph of nodes connected by edges. Nodes have a kind (e.g. "agent"), free
 * config the user edits in the inspector, and a position on the canvas.
 *
 * The whole graph is serialised to localStorage so a draft survives a refresh.
 */

export type NodeKind =
  | "webhook"
  | "schedule"
  | "http"
  | "agent"
  | "condition"
  | "transform"
  | "slack"
  | "postgres"
  | "notion";

export type NodeCategory = "trigger" | "action" | "logic" | "ai";

/**
 * A typed config object per node kind. Each kind owns the fields the inspector
 * renders. Anything not present here renders nothing — keeping kinds and
 * configs in lock-step is intentional.
 */
export type NodeConfig = {
  webhook: { path: string; method: "POST" | "GET" };
  schedule: { cron: string };
  http: { url: string; method: "GET" | "POST" | "PUT" | "DELETE" };
  agent: {
    model:
      | "claude-opus-5"
      | "claude-sonnet-5"
      | "claude-haiku-4-5"
      | "gpt-4o"
      | "gemini-1.5-pro"
      | "llama-3.1-70b";
    instructions: string;
    tools: string[];
  };
  condition: { expression: string };
  transform: { code: string };
  slack: { channel: string; message: string };
  postgres: { query: string };
  notion: { database: string; properties: string };
};

export type WorkflowNode<K extends NodeKind = NodeKind> = {
  id: string;
  kind: K;
  label: string;
  x: number;
  y: number;
  config: NodeConfig[K];
};

export type Edge = {
  id: string;
  from: string; // node id
  to: string; // node id
  /**
   * Which side of a condition this edge carries. Only meaningful when the
   * source node is a `condition`: the runner follows the edges whose branch
   * matches the evaluated result and skips the rest. Undefined behaves as
   * "true" so graphs saved before branching existed keep working.
   */
  branch?: "true" | "false";
};

export type Workflow = {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: Edge[];
};

/** `skipped` = the node sat on the branch a condition did not take. */
export type RunStepStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "skipped";

export type RunStep = {
  nodeId: string;
  label: string;
  status: RunStepStatus;
  startedAt?: number;
  finishedAt?: number;
  output?: string;
};

export type RunState = {
  status: "idle" | "running" | "success" | "error";
  steps: RunStep[];
  startedAt?: number;
  finishedAt?: number;
};

/** A NodeKind → category mapping used for palette grouping and accent colour. */
export const NODE_CATEGORY: Record<NodeKind, NodeCategory> = {
  webhook: "trigger",
  schedule: "trigger",
  http: "action",
  agent: "ai",
  condition: "logic",
  transform: "logic",
  slack: "action",
  postgres: "action",
  notion: "action",
};
