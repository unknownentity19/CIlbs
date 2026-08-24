"use client";

import * as React from "react";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/input";
import { NODE_META } from "./constants";
import { NodeIcon } from "./node-icon";
import { NODE_CATEGORY, type WorkflowNode } from "./types";

const CATEGORY_TONE: Record<string, string> = {
  trigger: "text-emerald-600",
  ai: "text-violet-600",
  logic: "text-amber-600",
  action: "text-sky-600",
};

export type InspectorProps = {
  node: WorkflowNode | null;
  onChangeLabel: (label: string) => void;
  onChangeConfig: (key: string, value: string | string[]) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function Inspector({
  node,
  onChangeLabel,
  onChangeConfig,
  onDuplicate,
  onDelete,
  onClose,
}: InspectorProps) {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium text-foreground">Inspector</p>
        <p className="text-xs text-muted-foreground">
          Select a node to edit its label and settings.
        </p>
      </div>
    );
  }

  const meta = NODE_META[node.kind];
  const category = NODE_CATEGORY[node.kind];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-3 border-b border-border px-4 py-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-accent">
          <NodeIcon
            kind={node.kind}
            className={`h-4 w-4 ${CATEGORY_TONE[category] ?? ""}`}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {meta.label}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {node.label}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
          aria-label="Close inspector"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`label-${node.id}`}>Label</Label>
          <Input
            id={`label-${node.id}`}
            value={node.label}
            onChange={(e) => onChangeLabel(e.target.value)}
            placeholder="A short, human name"
          />
          <FieldHint>Shown on the canvas. Keep it short and clear.</FieldHint>
        </div>

        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Configuration
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <KindFields node={node} onChangeConfig={onChangeConfig} />
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Tip
          </p>
          {node.kind === "condition" ? (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              Draw two edges out of this node, then click the pill on each to
              set which one is the true branch and which is the false branch.
            </p>
          ) : null}
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            Use{" "}
            <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px] text-foreground">
              {`{{ input.email }}`}
            </code>{" "}
            and similar handlebars to reference output from upstream nodes.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          className="flex-1"
          title="Duplicate node (⌘D)"
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="flex-1"
          title="Delete node (⌫)"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function KindFields({
  node,
  onChangeConfig,
}: {
  node: WorkflowNode;
  onChangeConfig: (key: string, value: string | string[]) => void;
}) {
  const cfg = node.config;
  switch (node.kind) {
    case "webhook":
      return (
        <>
          <TextField
            label="Path"
            value={(cfg as { path: string }).path}
            onChange={(v) => onChangeConfig("path", v)}
          />
          <SelectField
            label="Method"
            value={(cfg as { method: string }).method}
            options={["POST", "GET"]}
            onChange={(v) => onChangeConfig("method", v)}
          />
        </>
      );
    case "schedule":
      return (
        <TextField
          label="Cron expression"
          value={(cfg as { cron: string }).cron}
          onChange={(v) => onChangeConfig("cron", v)}
          mono
        />
      );
    case "http":
      return (
        <>
          <TextField
            label="URL"
            value={(cfg as { url: string }).url}
            onChange={(v) => onChangeConfig("url", v)}
            mono
          />
          <SelectField
            label="Method"
            value={(cfg as { method: string }).method}
            options={["GET", "POST", "PUT", "DELETE"]}
            onChange={(v) => onChangeConfig("method", v)}
          />
        </>
      );
    case "agent": {
      const ac = cfg as {
        model: string;
        instructions: string;
        tools: string[];
      };
      return (
        <>
          <SelectField
            label="Model"
            value={ac.model}
            options={[
              "claude-opus-5",
              "claude-sonnet-5",
              "claude-haiku-4-5",
              "gpt-4o",
              "gemini-1.5-pro",
              "llama-3.1-70b",
            ]}
            onChange={(v) => onChangeConfig("model", v)}
          />
          <TextAreaField
            label="Instructions"
            value={ac.instructions}
            onChange={(v) => onChangeConfig("instructions", v)}
          />
          <TextField
            label="Tools (comma separated)"
            value={ac.tools.join(", ")}
            onChange={(v) =>
              onChangeConfig(
                "tools",
                v
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              )
            }
            mono
          />
        </>
      );
    }
    case "condition":
      return (
        <TextField
          label="Expression"
          value={(cfg as { expression: string }).expression}
          onChange={(v) => onChangeConfig("expression", v)}
          mono
        />
      );
    case "transform":
      return (
        <TextAreaField
          label="JS code"
          value={(cfg as { code: string }).code}
          onChange={(v) => onChangeConfig("code", v)}
          mono
        />
      );
    case "slack":
      return (
        <>
          <TextField
            label="Channel"
            value={(cfg as { channel: string }).channel}
            onChange={(v) => onChangeConfig("channel", v)}
          />
          <TextAreaField
            label="Message"
            value={(cfg as { message: string }).message}
            onChange={(v) => onChangeConfig("message", v)}
          />
        </>
      );
    case "postgres":
      return (
        <TextAreaField
          label="SQL query"
          value={(cfg as { query: string }).query}
          onChange={(v) => onChangeConfig("query", v)}
          mono
        />
      );
    case "notion":
      return (
        <>
          <TextField
            label="Database"
            value={(cfg as { database: string }).database}
            onChange={(v) => onChangeConfig("database", v)}
          />
          <TextAreaField
            label="Properties (JSON)"
            value={(cfg as { properties: string }).properties}
            onChange={(v) => onChangeConfig("properties", v)}
            mono
          />
        </>
      );
  }
}

function TextField({
  label,
  value,
  onChange,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={mono ? "font-mono" : undefined}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.min(6, Math.max(2, Math.ceil(value.length / 40)))}
        className={
          "w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20" +
          (mono ? " font-mono text-[12px]" : "")
        }
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
