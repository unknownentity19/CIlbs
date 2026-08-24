import type { NodeKind, NodeConfig } from "./types";

/** Canvas grid spacing. Nodes snap to multiples of this when dragged. */
export const GRID = 16;

/** Node footprint on the canvas. Used for routing edges and hit-testing. */
export const NODE_W = 220;
export const NODE_H = 76;

/** localStorage key for persisting the user's draft workflow. */
export const STORAGE_KEY = "cilbs.studio.workflow.v1";

/**
 * Per-kind metadata used by the palette and inspector. Default config seeds
 * the node when it's added so the user sees a sensible starting state.
 */
export const NODE_META: Record<
  NodeKind,
  {
    label: string;
    description: string;
    defaultConfig: NodeConfig[NodeKind];
  }
> = {
  webhook: {
    label: "Webhook",
    description: "Trigger the workflow from an HTTP request.",
    defaultConfig: { path: "/incoming", method: "POST" },
  },
  schedule: {
    label: "Schedule",
    description: "Run on a cron schedule.",
    defaultConfig: { cron: "0 9 * * *" },
  },
  http: {
    label: "HTTP Request",
    description: "Call any REST endpoint.",
    defaultConfig: { url: "https://api.example.com/v1/items", method: "GET" },
  },
  agent: {
    label: "AI Agent",
    description: "Reason, call tools, and produce structured output.",
    defaultConfig: {
      model: "claude-sonnet-5",
      instructions:
        "Classify the incoming message as 'high', 'medium', or 'low' priority and explain why in one sentence.",
      tools: ["http", "search"],
    },
  },
  condition: {
    label: "Condition",
    description: "Branch based on an expression.",
    defaultConfig: { expression: "$.priority == 'high'" },
  },
  transform: {
    label: "Transform",
    description: "Run a small JS snippet on the payload.",
    defaultConfig: {
      code: "return { ...input, normalized: true };",
    },
  },
  slack: {
    label: "Slack",
    description: "Post a message to a channel.",
    defaultConfig: {
      channel: "#alerts",
      message: "New high-priority lead from {{ input.email }}.",
    },
  },
  postgres: {
    label: "Postgres",
    description: "Run a SQL query against your database.",
    defaultConfig: {
      query: "INSERT INTO leads (email, priority) VALUES ($1, $2);",
    },
  },
  notion: {
    label: "Notion",
    description: "Create or update a database row.",
    defaultConfig: {
      database: "Leads",
      properties: '{ "Status": "New", "Priority": "High" }',
    },
  },
};

export const PALETTE_GROUPS: { title: string; kinds: NodeKind[] }[] = [
  { title: "Triggers", kinds: ["webhook", "schedule"] },
  { title: "AI", kinds: ["agent"] },
  { title: "Logic", kinds: ["condition", "transform"] },
  { title: "Actions", kinds: ["http", "slack", "postgres", "notion"] },
];
