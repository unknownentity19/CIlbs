import { NODE_META } from "./constants";
import { topoSort } from "./runner";
import { NODE_CATEGORY, type Workflow, type WorkflowNode } from "./types";

/**
 * Static checks that run on every edit, the way a linter would.
 *
 * `error` means the workflow cannot run as drawn (a cycle); everything else is
 * a `warning` — the run will still simulate, but the graph probably isn't what
 * the user meant. Each issue carries the node it belongs to so the panel can
 * select it on click.
 */

export type IssueLevel = "error" | "warning";

export type Issue = {
  id: string;
  level: IssueLevel;
  nodeId?: string;
  title: string;
  detail: string;
};

/** Loose cron sanity check: five or six whitespace-separated fields. */
function looksLikeCron(value: string) {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return false;
  return parts.every((p) => /^[0-9*/,\-?A-Za-z]+$/.test(p));
}

/** Per-kind config checks. Returns a reason string when the config is unusable. */
function configProblem(node: WorkflowNode): string | null {
  const cfg = node.config as Record<string, unknown>;
  const empty = (key: string) =>
    typeof cfg[key] !== "string" || (cfg[key] as string).trim() === "";

  switch (node.kind) {
    case "webhook":
      if (empty("path")) return "The webhook path is empty.";
      if (!(cfg.path as string).startsWith("/"))
        return "The webhook path should start with “/”.";
      return null;
    case "schedule":
      if (empty("cron")) return "The cron expression is empty.";
      if (!looksLikeCron(cfg.cron as string))
        return "That doesn’t look like a cron expression (e.g. “0 9 * * *”).";
      return null;
    case "http":
      if (empty("url")) return "The request URL is empty.";
      if (!/^https?:\/\//.test(cfg.url as string))
        return "The request URL should start with http:// or https://.";
      return null;
    case "agent": {
      if (empty("instructions"))
        return "The agent has no instructions, so it has nothing to do.";
      return null;
    }
    case "condition":
      if (empty("expression")) return "The condition expression is empty.";
      return null;
    case "transform":
      if (empty("code")) return "The transform has no code.";
      return null;
    case "slack":
      if (empty("channel")) return "No Slack channel set.";
      if (empty("message")) return "The Slack message is empty.";
      return null;
    case "postgres":
      if (empty("query")) return "The SQL query is empty.";
      return null;
    case "notion":
      if (empty("database")) return "No Notion database set.";
      if (typeof cfg.properties === "string" && cfg.properties.trim() !== "") {
        try {
          JSON.parse(cfg.properties as string);
        } catch {
          return "Properties isn’t valid JSON.";
        }
      }
      return null;
  }
}

export function validateWorkflow(workflow: Workflow): Issue[] {
  const issues: Issue[] = [];
  const { nodes, edges } = workflow;
  if (nodes.length === 0) return issues;

  // Cycles first: everything downstream of this is unreliable anyway.
  if (topoSort(nodes, edges) === null) {
    issues.push({
      id: "cycle",
      level: "error",
      title: "The graph contains a loop",
      detail:
        "Nodes feed back into each other, so there’s no order to run them in. Delete an edge to break the cycle.",
    });
  }

  const hasTrigger = nodes.some((n) => NODE_CATEGORY[n.kind] === "trigger");
  if (!hasTrigger) {
    issues.push({
      id: "no-trigger",
      level: "warning",
      title: "No trigger",
      detail:
        "Nothing starts this workflow. Add a Webhook or Schedule node so it can run on its own.",
    });
  }

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, typeof edges>();
  for (const n of nodes) {
    incoming.set(n.id, 0);
    outgoing.set(n.id, []);
  }
  for (const e of edges) {
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    outgoing.get(e.from)?.push(e);
  }

  for (const node of nodes) {
    const label = node.label || NODE_META[node.kind].label;
    const isTrigger = NODE_CATEGORY[node.kind] === "trigger";

    if (!isTrigger && (incoming.get(node.id) ?? 0) === 0) {
      issues.push({
        id: `orphan-${node.id}`,
        level: "warning",
        nodeId: node.id,
        title: `“${label}” never runs`,
        detail: "Nothing is wired into it. Connect an upstream node’s output.",
      });
    }

    if (isTrigger && (outgoing.get(node.id)?.length ?? 0) === 0) {
      issues.push({
        id: `dead-trigger-${node.id}`,
        level: "warning",
        nodeId: node.id,
        title: `“${label}” goes nowhere`,
        detail: "This trigger fires but isn’t connected to anything yet.",
      });
    }

    if (node.kind === "condition") {
      const outs = outgoing.get(node.id) ?? [];
      const branches = new Set(outs.map((e) => e.branch ?? "true"));
      // Only worth flagging once something is wired up — an unconnected
      // condition is already covered by the "goes nowhere" check.
      for (const side of ["true", "false"] as const) {
        if (outs.length > 0 && !branches.has(side)) {
          issues.push({
            id: `no-${side}-${node.id}`,
            level: "warning",
            nodeId: node.id,
            title: `“${label}” has no ${side} branch`,
            detail: `Nothing runs when the expression is ${side}. Draw another edge out of this node and click its pill to flip it to “${side}”.`,
          });
        }
      }
    }

    const problem = configProblem(node);
    if (problem) {
      issues.push({
        id: `config-${node.id}`,
        level: "warning",
        nodeId: node.id,
        title: `“${label}” isn’t configured`,
        detail: problem,
      });
    }
  }

  return issues;
}
