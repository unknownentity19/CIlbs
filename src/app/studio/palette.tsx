"use client";

import * as React from "react";
import { NODE_META, PALETTE_GROUPS } from "./constants";
import { NodeIcon } from "./node-icon";
import type { NodeKind } from "./types";

/**
 * Palette of node types. Each item is HTML-draggable into the canvas.
 * The canvas reads the dragged kind from the dataTransfer payload and creates
 * a new node at the drop position.
 */
export function Palette({
  onAdd,
}: {
  onAdd: (kind: NodeKind) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Nodes
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {PALETTE_GROUPS.map((g) => (
          <div key={g.title} className="mb-4 last:mb-0">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {g.title}
            </p>
            <div className="flex flex-col gap-1">
              {g.kinds.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-cilbs-node", kind);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  // Click adds; dragging places it where you drop it. A
                  // double-click requirement is undiscoverable, and on touch
                  // — where there is no drag-and-drop — it was the only way in.
                  onClick={() => onAdd(kind)}
                  className="group flex items-start gap-2.5 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-border hover:bg-accent active:cursor-grabbing"
                  title="Click to add, or drag onto the canvas"
                >
                  <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-md border border-border bg-card text-foreground">
                    <NodeIcon kind={kind} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-foreground">
                      {NODE_META[kind].label}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {NODE_META[kind].description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
