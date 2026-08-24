"use client";

import type { Edge, NodeKind, Workflow, WorkflowNode } from "./types";

type Spec = {
  key: string;
  kind: NodeKind;
  label: string;
  x: number;
  y: number;
  config: WorkflowNode["config"];
};

function id() {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

/** [from, to, branch?] — the branch only matters when `from` is a condition. */
type Pair = [string, string, ("true" | "false")?];

function build(name: string, specs: Spec[], pairs: Pair[]): Workflow {
  const idByKey = new Map<string, string>();
  const nodes: WorkflowNode[] = specs.map((s) => {
    const nid = id();
    idByKey.set(s.key, nid);
    return {
      id: nid,
      kind: s.kind,
      label: s.label,
      x: s.x,
      y: s.y,
      // The spec config is fully typed at the call-site below.
      config: s.config,
    };
  });
  const edges: Edge[] = pairs
    .map(([from, to, branch]) => {
      const f = idByKey.get(from);
      const t = idByKey.get(to);
      if (!f || !t) return null;
      const edge: Edge = { id: id(), from: f, to: t };
      if (branch) edge.branch = branch;
      return edge;
    })
    .filter((e): e is Edge => e !== null);
  return { id: id(), name, nodes, edges };
}

export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  build: () => Workflow;
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "lead-router",
    name: "Lead router",
    description:
      "Webhook → AI agent classifies → branch routes to Slack or DB.",
    build: () =>
      build(
        "Lead router",
        [
          {
            key: "t",
            kind: "webhook",
            label: "New lead",
            x: 32,
            y: 96,
            config: { path: "/hooks/new-lead", method: "POST" },
          },
          {
            key: "a",
            kind: "agent",
            label: "Classify priority",
            x: 296,
            y: 96,
            config: {
              model: "gpt-4o",
              instructions:
                "Classify the lead as 'high', 'medium', or 'low' priority and explain in one sentence.",
              tools: ["http", "search"],
            },
          },
          {
            key: "c",
            kind: "condition",
            label: "If high priority",
            x: 560,
            y: 96,
            config: { expression: "$.priority == 'high'" },
          },
          {
            key: "s",
            kind: "slack",
            label: "Notify #sales",
            x: 824,
            y: 16,
            config: {
              channel: "#sales",
              message: "🔥 High-priority lead: {{ input.email }}",
            },
          },
          {
            key: "p",
            kind: "postgres",
            label: "Insert lead",
            x: 824,
            y: 176,
            config: {
              query:
                "INSERT INTO leads (email, priority) VALUES ($1, $2);",
            },
          },
        ],
        [
          ["t", "a"],
          ["a", "c"],
          ["c", "s", "true"],
          ["c", "p", "false"],
        ],
      ),
  },
  {
    id: "support-triage",
    name: "Support triage",
    description:
      "Schedule → fetch tickets → reasoning agent drafts replies → Slack.",
    build: () =>
      build(
        "Support triage",
        [
          {
            key: "t",
            kind: "schedule",
            label: "Every 5 minutes",
            x: 32,
            y: 112,
            config: { cron: "*/5 * * * *" },
          },
          {
            key: "h",
            kind: "http",
            label: "Fetch open tickets",
            x: 296,
            y: 112,
            config: {
              url: "https://api.zendesk.com/v2/tickets?status=open",
              method: "GET",
            },
          },
          {
            key: "a",
            kind: "agent",
            label: "Draft reply",
            x: 560,
            y: 112,
            config: {
              model: "claude-opus-5",
              instructions:
                "Draft a polite, accurate reply with citations.",
              tools: ["search"],
            },
          },
          {
            key: "n",
            kind: "notion",
            label: "Log to Notion",
            x: 824,
            y: 112,
            config: {
              database: "Tickets",
              properties: '{ "Status": "Replied" }',
            },
          },
        ],
        [
          ["t", "h"],
          ["h", "a"],
          ["a", "n"],
        ],
      ),
  },
  {
    id: "churn-watch",
    name: "Churn watch",
    description:
      "Nightly SQL → agent scores risk → high risk pages sales, the rest is logged.",
    build: () =>
      build(
        "Churn watch",
        [
          {
            key: "t",
            kind: "schedule",
            label: "Nightly at 02:00",
            x: 32,
            y: 112,
            config: { cron: "0 2 * * *" },
          },
          {
            key: "q",
            kind: "postgres",
            label: "Accounts at risk",
            x: 296,
            y: 112,
            config: {
              query:
                "SELECT id, name, last_seen_at FROM accounts WHERE last_seen_at < now() - interval \'21 days\';",
            },
          },
          {
            key: "a",
            kind: "agent",
            label: "Score churn risk",
            x: 560,
            y: 112,
            config: {
              model: "claude-sonnet-5",
              instructions:
                "Score each account\'s churn risk from 0-100 and draft a one-line reason a CSM can act on.",
              tools: ["search"],
            },
          },
          {
            key: "c",
            kind: "condition",
            label: "Risk over 70?",
            x: 824,
            y: 112,
            config: { expression: "$.risk > 70" },
          },
          {
            key: "s",
            kind: "slack",
            label: "Page the CSM",
            x: 1088,
            y: 32,
            config: {
              channel: "#customer-success",
              message: "⚠️ {{ input.name }} is trending to churn — {{ input.reason }}",
            },
          },
          {
            key: "n",
            kind: "notion",
            label: "Log to Notion",
            x: 1088,
            y: 192,
            config: {
              database: "Accounts",
              properties: '{ "Reviewed": "Yes" }',
            },
          },
        ],
        [
          ["t", "q"],
          ["q", "a"],
          ["a", "c"],
          ["c", "s", "true"],
          ["c", "n", "false"],
        ],
      ),
  },
  {
    id: "blank",
    name: "Blank canvas",
    description: "Start from zero. Drag nodes from the palette.",
    build: () => build("Untitled workflow", [], []),
  },
];
