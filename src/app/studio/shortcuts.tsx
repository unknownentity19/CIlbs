"use client";

import * as React from "react";
import { X } from "lucide-react";

/** Every shortcut the studio listens for, grouped the way users think. */
const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Editing",
    items: [
      ["⌘ Z", "Undo"],
      ["⇧ ⌘ Z", "Redo"],
      ["⌘ D", "Duplicate selected node"],
      ["⌫", "Delete selected node"],
      ["↑ ↓ ← →", "Nudge selection (⇧ for a bigger step)"],
      ["Esc", "Cancel a half-drawn edge, then deselect"],
    ],
  },
  {
    title: "Canvas",
    items: [
      ["Drag", "Pan the canvas"],
      ["⌘ scroll", "Zoom to cursor"],
      ["⌘ + / ⌘ −", "Zoom in / out"],
      ["⌘ 0", "Reset zoom to 100%"],
      ["F", "Fit the graph to the view"],
    ],
  },
  {
    title: "Workflow",
    items: [
      ["⌘ ⏎", "Run / stop the simulation"],
      ["⌘ S", "Save"],
      ["⇧ ⌘ E", "Export the workflow as JSON"],
      ["?", "Show this list"],
    ],
  },
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  // Close on Escape and trap the initial focus on the dialog so keyboard users
  // land inside it rather than back on the canvas.
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    ref.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-lg focus:outline-none"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Keyboard shortcuts
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Use Ctrl instead of ⌘ on Windows and Linux.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              <dl className="mt-2 flex flex-col gap-1">
                {group.items.map(([keys, description]) => (
                  <div
                    key={keys}
                    className="flex items-center justify-between gap-4 rounded-md px-2 py-1 text-xs hover:bg-accent"
                  >
                    <dt className="text-muted-foreground">{description}</dt>
                    <dd className="shrink-0 font-mono text-[11px] text-foreground">
                      {keys}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
