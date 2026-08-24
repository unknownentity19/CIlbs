"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { Issue } from "./validate";

/**
 * Lists what's wrong with the graph. Clicking an issue that belongs to a node
 * selects it, so "fix the thing the linter is complaining about" is one click
 * away from the inspector.
 */
export function IssuesPanel({
  issues,
  onSelectNode,
}: {
  issues: Issue[];
  onSelectNode: (id: string) => void;
}) {
  if (issues.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        <p className="text-sm font-medium text-foreground">No issues</p>
        <p className="text-xs text-muted-foreground">
          Every node is wired up and configured.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex h-full flex-col gap-1 overflow-y-auto px-2 py-3">
      {issues.map((issue) => {
        const Icon = issue.level === "error" ? XCircle : AlertTriangle;
        const clickable = !!issue.nodeId;
        return (
          <li key={issue.id}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => issue.nodeId && onSelectNode(issue.nodeId)}
              className={
                "w-full rounded-lg border border-transparent px-3 py-2 text-left transition-colors " +
                (clickable
                  ? "hover:border-border hover:bg-accent"
                  : "cursor-default")
              }
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={
                    "mt-0.5 h-3.5 w-3.5 shrink-0 " +
                    (issue.level === "error"
                      ? "text-red-500"
                      : "text-amber-500")
                  }
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {issue.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {issue.detail}
                  </p>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
