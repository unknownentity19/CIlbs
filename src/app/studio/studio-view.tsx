"use client";

import * as React from "react";
import {
  AlertTriangle,
  Download,
  FileCode2,
  Keyboard,
  LayoutGrid,
  ListTree,
  Loader2,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
  Square,
  Undo2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { confirmDiscard } from "@/lib/unsaved-guard";
import { loadLatestWorkflow } from "./actions";
import { useWorkflowPersistence } from "./use-workflow-persistence";
import { Canvas } from "./canvas";
import { Inspector } from "./inspector";
import { IssuesPanel } from "./issues-panel";
import { Palette } from "./palette";
import { RunLog } from "./run-log";
import { ShortcutsDialog } from "./shortcuts";
import { TouchDebugHUD } from "./touch-debug";
import { autoLayout } from "./auto-layout";
import { useHistory } from "./history";
import { NODE_META } from "./constants";
import {
  buildTemplate,
  loadFromStorage,
  sanitizeWorkflow,
} from "./persistence";
import { TEMPLATES } from "./templates";
import { validateWorkflow } from "./validate";
import type {
  Edge,
  NodeKind,
  RunState,
  Workflow,
  WorkflowNode,
} from "./types";
import { runWorkflow } from "./runner";

/** Generate a short, URL-safe id. Plenty for client-only state. */
function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Stable, deterministic seed used during SSR and the first client render so
 * server and client output match exactly. Real data — random ids, persisted
 * draft — is swapped in inside `useEffect` after hydration.
 */
const INITIAL_WORKFLOW: Workflow = {
  id: "wf_initial",
  name: "Untitled workflow",
  nodes: [],
  edges: [],
};

/** Would adding from→to close a loop? Walks forward from `to` looking for
 * `from`, which is cheaper than sorting the whole graph on every hover. */
function wouldCycle(edges: Edge[], from: string, to: string) {
  if (from === to) return true;
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const list = adj.get(e.from) ?? [];
    list.push(e.to);
    adj.set(e.from, list);
  }
  const seen = new Set<string>();
  const stack = [to];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === from) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const next of adj.get(id) ?? []) stack.push(next);
  }
  return false;
}

type SidePanel = "run" | "issues";
type Sheet = "palette" | "inspector" | "run" | null;

export function StudioView() {
  // Render the deterministic seed during SSR / first paint to avoid a
  // hydration mismatch (templates use random ids). The real workflow is
  // swapped in by the effect below.
  const history = useHistory<Workflow>(INITIAL_WORKFLOW);
  const workflow = history.present;
  const { commit, reset: resetHistory } = history;

  const [hydrated, setHydrated] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [run, setRun] = React.useState<RunState>({ status: "idle", steps: [] });
  const [sidePanel, setSidePanel] = React.useState<SidePanel>("run");
  const [sheet, setSheet] = React.useState<Sheet>(null);
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  // Bumped whenever the canvas should re-frame the graph.
  const [fitSignal, setFitSignal] = React.useState(0);
  const abortRef = React.useRef<AbortController | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  // Whether this account can store workflows server-side. False on
  // deployments with no database, where the draft stays in this browser.
  const [cloud, setCloud] = React.useState(false);
  // Where a click-added node should land: the middle of what the user can see.
  const viewCenterRef = React.useRef({ x: 240, y: 192 });

  // Tracks an in-progress edge being drawn from a node's output port. We keep
  // the cursor position so the canvas can render the bezier draft edge live.
  const [draftEdge, setDraftEdge] = React.useState<{
    fromId: string;
    x: number;
    y: number;
  } | null>(null);

  const notify = React.useCallback((message: string) => {
    setToast(message);
  }, []);

  // Stable identity: the canvas reads its bounding box inside the effect that
  // calls this, and an inline arrow would make that a layout read on every
  // render — including every frame of a node drag.
  const handleViewportChange = React.useCallback(
    (center: { x: number; y: number }) => {
      viewCenterRef.current = center;
    },
    [],
  );

  // Auto-dismiss the toast. Keyed on the message so a second notification
  // restarts the timer instead of inheriting the first one's remainder.
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Saving lives in its own hook: autosave on a debounce, an explicit save, a
  // dirty flag the navigation guard reads, and a flush that survives the tab
  // actually closing.
  const persistence = useWorkflowPersistence({ workflow, hydrated, cloud });
  const { saveNow, markPersisted } = persistence;

  // A failed save says why, wherever the visitor is: the status pill is
  // compact on a phone, so the reason goes through the toast instead.
  React.useEffect(() => {
    if (persistence.error) notify(persistence.error);
  }, [persistence.error, notify]);

  // Read by the hydration effect's async closure, which resolves long after
  // the render that started it.
  const workflowRef = React.useRef(workflow);
  React.useEffect(() => {
    workflowRef.current = workflow;
  }, [workflow]);

  // Hydrate after mount, so server output stays deterministic and the visual
  // swap to the real workflow happens just after first paint.
  //
  // With server storage available, the account's most recent graph wins. If
  // the account has none yet but this browser has a draft with something on
  // the canvas, the draft is adopted and pushed up — signing in shouldn't
  // throw away work.
  React.useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const local = loadFromStorage();

      const storage = user?.id
        ? await loadLatestWorkflow()
        : { available: false, workflow: null };
      if (cancelled) return;
      setCloud(storage.available);

      const adopted =
        storage.workflow === null
          ? local
          : {
              id: storage.workflow.id,
              name: storage.workflow.name,
              nodes: storage.workflow.nodes as Workflow["nodes"],
              edges: storage.workflow.edges as Workflow["edges"],
            };

      // The canvas stays interactive while the account's copy is loading, so
      // by the time it arrives the visitor may already have drawn something.
      // Replacing the canvas here would destroy that silently and beyond the
      // reach of undo, since resetting the history clears the stack.
      const edited =
        workflowRef.current.nodes.length > 0 ||
        workflowRef.current.edges.length > 0;
      if (edited && storage.workflow !== null) {
        setHydrated(true);
        notify(
          "Kept the workflow you were editing — your saved one is still in your account.",
        );
        return;
      }

      resetHistory(adopted);
      // Whatever came back from storage is by definition already stored. A
      // local draft adopted into an empty account is not: it still has to be
      // pushed up, so it stays dirty and the autosave takes it from here.
      if (storage.workflow !== null || !storage.available) {
        markPersisted(adopted);
      }

      setHydrated(true);
      setFitSignal((n) => n + 1);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
    // Keyed on the user *id*, not the user object: next-auth hands back a new
    // session object on every window focus, and depending on the object made
    // this effect — and its history reset — run on every tab switch.
  }, [resetHistory, user?.id, markPersisted, notify]);

  // Make sure any pending run is cancelled when this page unmounts. Without
  // this, navigating away mid-run leaves the runner pushing setState calls
  // into a stale React tree, which surfaces as a console error.
  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const selectedNode = workflow.nodes.find((n) => n.id === selectedId) ?? null;
  const issues = React.useMemo(() => validateWorkflow(workflow), [workflow]);
  const errorCount = issues.filter((i) => i.level === "error").length;

  const runningNodeId = React.useMemo(() => {
    const last = run.steps[run.steps.length - 1];
    return last && last.status === "running" ? last.nodeId : null;
  }, [run.steps]);

  const finishedNodeIds = React.useMemo(() => {
    const s = new Set<string>();
    for (const step of run.steps)
      if (step.status === "success") s.add(step.nodeId);
    return s;
  }, [run.steps]);

  const skippedNodeIds = React.useMemo(() => {
    const s = new Set<string>();
    for (const step of run.steps)
      if (step.status === "skipped") s.add(step.nodeId);
    return s;
  }, [run.steps]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  /** Nudge a drop point until it isn't sitting on top of an existing node. */
  function freeSpot(x: number, y: number) {
    let spot = { x, y };
    for (let i = 0; i < 12; i++) {
      const taken = workflow.nodes.some(
        (n) => Math.abs(n.x - spot.x) < 40 && Math.abs(n.y - spot.y) < 40,
      );
      if (!taken) break;
      spot = { x: spot.x + 48, y: spot.y + 48 };
    }
    return spot;
  }

  function addNode(kind: NodeKind, x?: number, y?: number) {
    const meta = NODE_META[kind];
    const center = viewCenterRef.current;
    const at =
      x === undefined || y === undefined
        ? freeSpot(
            Math.round((center.x - 110) / 16) * 16,
            Math.round((center.y - 38) / 16) * 16,
          )
        : { x, y };
    const node: WorkflowNode = {
      id: uid("n"),
      kind,
      label: meta.label,
      x: at.x,
      y: at.y,
      // Clone the typed default config so each node owns its own copy.
      config: structuredClone(meta.defaultConfig) as WorkflowNode["config"],
    };
    commit((w) => ({ ...w, nodes: [...w.nodes, node] }));
    setSelectedId(node.id);
  }

  function duplicateNode(id: string) {
    const source = workflow.nodes.find((n) => n.id === id);
    if (!source) return;
    const copy: WorkflowNode = {
      ...source,
      id: uid("n"),
      label: `${source.label} copy`,
      x: source.x + 32,
      y: source.y + 32,
      config: structuredClone(source.config),
    };
    commit((w) => ({ ...w, nodes: [...w.nodes, copy] }));
    setSelectedId(copy.id);
  }

  function moveNode(id: string, x: number, y: number) {
    // Tagged so a whole drag collapses into a single undo entry.
    commit(
      (w) => ({
        ...w,
        nodes: w.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
      }),
      `move:${id}`,
    );
  }

  function deleteNode(id: string) {
    commit((w) => ({
      ...w,
      nodes: w.nodes.filter((n) => n.id !== id),
      edges: w.edges.filter((e) => e.from !== id && e.to !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  }

  function deleteEdge(id: string) {
    commit((w) => ({ ...w, edges: w.edges.filter((e) => e.id !== id) }));
  }

  function setEdgeBranch(id: string, branch: "true" | "false") {
    commit((w) => ({
      ...w,
      edges: w.edges.map((e) => (e.id === id ? { ...e, branch } : e)),
    }));
  }

  function changeNodeLabel(id: string, label: string) {
    commit(
      (w) => ({
        ...w,
        nodes: w.nodes.map((n) => (n.id === id ? { ...n, label } : n)),
      }),
      `label:${id}`,
    );
  }

  function changeNodeConfig(id: string, key: string, value: string | string[]) {
    commit(
      (w) => ({
        ...w,
        nodes: w.nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                config: {
                  ...(n.config as Record<string, unknown>),
                  [key]: value,
                } as WorkflowNode["config"],
              }
            : n,
        ),
      }),
      `config:${id}:${key}`,
    );
  }

  function loadTemplate(id: string) {
    // Replacing the canvas throws away whatever is on it.
    if (!confirmDiscard("Load this template and lose your unsaved changes?")) {
      return;
    }
    resetHistory(buildTemplate(id));
    setSelectedId(null);
    setRun({ status: "idle", steps: [] });
    setFitSignal((n) => n + 1);
  }

  function clearCanvas() {
    if (!confirmDiscard("Clear the canvas and lose your unsaved changes?")) {
      return;
    }
    resetHistory({
      id: uid("wf"),
      name: "Untitled workflow",
      nodes: [],
      edges: [],
    });
    setSelectedId(null);
    setRun({ status: "idle", steps: [] });
    setFitSignal((n) => n + 1);
  }

  function tidy() {
    if (workflow.nodes.length === 0) return;
    commit((w) => autoLayout(w));
    setFitSignal((n) => n + 1);
    notify("Tidied the layout.");
  }

  // ─── Edge wiring ───────────────────────────────────────────────────────────

  function startConnect(fromId: string, x: number, y: number) {
    setDraftEdge({ fromId, x, y });
  }

  function updateDraft(x: number, y: number) {
    setDraftEdge((d) => (d ? { ...d, x, y } : d));
  }

  function completeConnect(toId: string | null) {
    const draft = draftEdge;
    setDraftEdge(null);
    if (!draft || !toId || toId === draft.fromId) return;
    if (workflow.edges.some((e) => e.from === draft.fromId && e.to === toId)) {
      return;
    }
    if (wouldCycle(workflow.edges, draft.fromId, toId)) {
      notify("That connection would create a loop.");
      return;
    }
    const source = workflow.nodes.find((n) => n.id === draft.fromId);
    // A condition's first edge is the true branch; the next one defaults to
    // false, which is what people mean when they wire up both outcomes.
    let branch: Edge["branch"];
    if (source?.kind === "condition") {
      const taken = new Set(
        workflow.edges
          .filter((e) => e.from === draft.fromId)
          .map((e) => e.branch ?? "true"),
      );
      branch = taken.has("true") && !taken.has("false") ? "false" : "true";
    }
    const edge: Edge = { id: uid("e"), from: draft.fromId, to: toId, branch };
    commit((w) => ({ ...w, edges: [...w.edges, edge] }));
  }

  // ─── Import / export ───────────────────────────────────────────────────────

  function exportJson() {
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(workflow.name || "workflow")
      .replace(/\s+/g, "-")
      .toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const wf = sanitizeWorkflow(parsed);
      if (wf && !confirmDiscard("Import this file and lose your unsaved changes?")) {
        return;
      }
      if (!wf) {
        notify("That file isn't a Cilbs workflow.");
        return;
      }
      resetHistory(wf);
      setSelectedId(null);
      setRun({ status: "idle", steps: [] });
      setFitSignal((n) => n + 1);
      notify(`Imported “${wf.name}”.`);
    } catch {
      notify("Couldn't read that file — is it valid JSON?");
    }
  }

  // ─── Run simulation ────────────────────────────────────────────────────────

  const handleRun = React.useCallback(async () => {
    if (abortRef.current && run.status === "running") {
      abortRef.current.abort();
      setRun((r) => ({ ...r, status: "idle" }));
      return;
    }
    if (workflow.nodes.length === 0) return;
    const controller = new AbortController();
    abortRef.current = controller;

    setRun({ status: "running", steps: [], startedAt: Date.now() });
    setSidePanel("run");
    if (window.matchMedia("(max-width: 1023px)").matches) setSheet("run");

    try {
      await runWorkflow(
        workflow,
        ({ step }) => {
          setRun((prev) => {
            // Replace the latest step for the same node, otherwise append.
            const last = prev.steps[prev.steps.length - 1];
            if (last && last.nodeId === step.nodeId) {
              return { ...prev, steps: [...prev.steps.slice(0, -1), step] };
            }
            return { ...prev, steps: [...prev.steps, step] };
          });
        },
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setRun((prev) => ({
          ...prev,
          status: prev.steps.some((s) => s.status === "error")
            ? "error"
            : "success",
          finishedAt: Date.now(),
        }));
      }
    } catch {
      setRun((prev) => ({ ...prev, status: "error" }));
    }
  }, [run.status, workflow]);

  // ─── Editor-level keyboard shortcuts ───────────────────────────────────────
  // Canvas-local shortcuts (zoom, fit, nudge, delete) live in canvas.tsx; the
  // ones here act on the document as a whole.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "Enter") {
        e.preventDefault();
        void handleRun();
        return;
      }
      if (mod && (e.key === "s" || e.key === "S")) {
        // ⌘S is muscle memory for "save", and it used to export a file here.
        e.preventDefault();
        void saveNow();
        return;
      }
      if (mod && e.shiftKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        exportJson();
        return;
      }
      if (mod && (e.key === "z" || e.key === "Z")) {
        if (typing) return;
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
        return;
      }
      if (mod && (e.key === "y" || e.key === "Y")) {
        if (typing) return;
        e.preventDefault();
        history.redo();
        return;
      }
      if (typing) return;
      if (mod && (e.key === "d" || e.key === "D")) {
        if (!selectedId) return;
        e.preventDefault();
        duplicateNode(selectedId);
        return;
      }
      // Some keyboard layouts report the unshifted key, so accept both.
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `duplicateNode` and `exportJson` close over the current workflow, which
    // is already in the dependency list through `handleRun`.
  }, [handleRun, history, selectedId, saveNow]); // eslint-disable-line react-hooks/exhaustive-deps

  const nodeCount = workflow.nodes.length;
  const statusLabel =
    persistence.state === "error"
      ? "Save failed"
      : persistence.state === "saving"
        ? "Saving…"
        : persistence.state === "unsaved"
          ? "Unsaved changes"
          : cloud
            ? "Saved to your account"
            : "Saved in this browser";

  return (
    // The studio is an app shell, not a document: it claims the viewport under
    // the navbar and scrolls its panels internally, so the canvas never fights
    // the page for the scroll gesture. `dvh` keeps that honest on phones where
    // the browser chrome comes and goes.
    <div
      // Also the signal tests wait on: before this flips, the canvas is still
      // the empty seed rather than the visitor's actual workflow.
      data-hydrated={hydrated ? "true" : "false"}
      className="studio-root flex h-[calc(100dvh-4rem)] min-h-[520px] w-full flex-col"
    >
      <TouchDebugHUD />

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Named for what it is: nothing here reaches a real system, and a
              visitor should know that before they wire up a Postgres node. */}
          <Badge
            variant="outline"
            className="hidden sm:inline-flex"
            title="Sandbox — runs are simulated and your draft stays in this browser."
          >
            <Sparkles className="h-3 w-3" />
            Sandbox
          </Badge>
          <input
            value={workflow.name}
            onChange={(e) =>
              commit((w) => ({ ...w, name: e.target.value }), "name")
            }
            className="min-w-0 flex-1 truncate rounded-md bg-transparent px-1 py-1 text-sm font-medium text-foreground focus:bg-accent focus:outline-none"
            aria-label="Workflow name"
          />
          {/* Counts yield to the save status when the bar gets tight — knowing
              whether work is saved matters more than knowing it has 6 nodes. */}
          <span className="hidden font-mono text-[11px] whitespace-nowrap text-muted-foreground xl:inline">
            {nodeCount} nodes · {workflow.edges.length} edges
          </span>
          {/* Says three things at once: whether there is unsaved work, whether
              a save is in flight, and where "saved" actually means — this
              browser, or the account. */}
          <span
            // Visible at every width — this used to be `hidden md:inline-flex`,
            // so on a phone there was no way to tell that a save had failed.
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
            title={
              cloud
                ? "Saved to your account — this workflow follows you between devices."
                : "Saved in this browser only. Sign in to keep it in your account."
            }
          >
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (persistence.state === "error"
                  ? "bg-red-500"
                  : persistence.state === "saving"
                    ? "bg-amber-500 animate-pulse"
                    : persistence.state === "unsaved"
                      ? "bg-amber-500"
                      : "bg-emerald-500")
              }
            />
            {/* One element, not two: below `md` the wording is available to
                assistive tech but takes no space, and from `md` up it shows. */}
            <span className="sr-only md:not-sr-only">{statusLabel}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full border border-border bg-card px-1 py-1 md:flex">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => loadTemplate(t.id)}
                className="inline-flex h-7 items-center rounded-full px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title={t.description}
              >
                <FileCode2 className="mr-1.5 h-3 w-3" />
                {t.name}
              </button>
            ))}
          </div>

          {/* Editing cluster — icon-only to keep the bar breathable. */}
          <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-1">
            <IconButton
              label="Undo (⌘Z)"
              onClick={history.undo}
              disabled={!history.canUndo}
            >
              <Undo2 className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              label="Redo (⇧⌘Z)"
              onClick={history.redo}
              disabled={!history.canRedo}
            >
              <Redo2 className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              label="Tidy layout"
              onClick={tidy}
              disabled={nodeCount === 0}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              label="Import JSON"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton label="Export JSON (⌘S)" onClick={exportJson}>
              <Download className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              label="Keyboard shortcuts (?)"
              onClick={() => setShowShortcuts(true)}
            >
              <Keyboard className="h-3.5 w-3.5" />
            </IconButton>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            // The text label is hidden below `sm`, which left this button
            // nameless to a screen reader on a phone.
            aria-label="Reset canvas"
            title="Clear the canvas and start over"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void saveNow()}
            disabled={persistence.state === "saving"}
            aria-label="Save workflow"
            title={
              cloud
                ? "Save to your account (⌘S)"
                : "Save in this browser (⌘S)"
            }
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">
              {persistence.state === "saving"
                ? "Saving…"
                : persistence.dirty
                  ? "Save"
                  : "Saved"}
            </span>
          </Button>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={nodeCount === 0 || (errorCount > 0 && run.status !== "running")}
            title={
              errorCount > 0
                ? "Fix the errors in the Issues panel first"
                : "Run the simulation (⌘⏎)"
            }
          >
            {run.status === "running" ? (
              <>
                <Square className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importJson(file);
          // Reset so picking the same file twice still fires a change event.
          e.target.value = "";
        }}
      />

      {/* Workspace */}
      {/* `grid-rows-[minmax(0,1fr)]` is what keeps the workspace inside the
          shell: without an explicit constrained row the palette's natural
          height (taller than the viewport) would stretch the row and push the
          canvas past the fold. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        {/* Palette */}
        <aside className="hidden min-h-0 overflow-hidden border-r border-border bg-card lg:block">
          <Palette onAdd={(kind) => addNode(kind)} />
        </aside>

        {/* Canvas */}
        <main className="relative min-h-0 p-3">
          <Canvas
            workflow={workflow}
            selectedId={selectedId}
            draftEdge={draftEdge}
            runningNodeId={runningNodeId}
            finishedNodeIds={finishedNodeIds}
            skippedNodeIds={skippedNodeIds}
            onSelectNode={setSelectedId}
            onMoveNode={moveNode}
            onDeleteNode={deleteNode}
            onDeleteEdge={deleteEdge}
            onSetEdgeBranch={setEdgeBranch}
            onStartConnect={startConnect}
            onUpdateDraft={updateDraft}
            onCompleteConnect={completeConnect}
            onAddNode={addNode}
            onViewportChange={handleViewportChange}
            fitSignal={fitSignal}
          />

          {/* Loading an account's workflow takes a round trip, and an empty
              canvas in the meantime reads as "my work is gone". */}
          {!hydrated ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading your workflow…
              </div>
            </div>
          ) : null}

          {/* Empty-state CTA: only render when canvas is empty. */}
          {hydrated && nodeCount === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
              <div className="pointer-events-auto max-w-sm rounded-2xl border border-border bg-card/90 p-6 text-center shadow-sm backdrop-blur">
                <span className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-accent text-foreground">
                  <Wand2 className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">
                  Build your first workflow
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add nodes from the palette, connect them by dragging from one
                  node’s output port to another, then hit Run to simulate.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {TEMPLATES.filter((t) => t.id !== "blank").map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => loadTemplate(t.id)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs text-foreground transition-colors hover:bg-accent"
                    >
                      <FileCode2 className="h-3 w-3" />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Toast — connection rejections, import results, tidy confirmation. */}
          {toast ? (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-sm">
                {toast}
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  aria-label="Dismiss"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : null}
        </main>

        {/* Right: inspector on top, run log / issues below */}
        <aside className="hidden min-h-0 overflow-hidden border-l border-border bg-card lg:flex lg:flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            <Inspector
              node={selectedNode}
              onChangeLabel={(label) =>
                selectedNode && changeNodeLabel(selectedNode.id, label)
              }
              onChangeConfig={(key, value) =>
                selectedNode && changeNodeConfig(selectedNode.id, key, value)
              }
              onDuplicate={() => selectedNode && duplicateNode(selectedNode.id)}
              onDelete={() => selectedNode && deleteNode(selectedNode.id)}
              onClose={() => setSelectedId(null)}
            />
          </div>
          {/* Proportional rather than fixed: on a short laptop screen a 288px
              log panel left the inspector too cramped to edit in. */}
          <div className="flex h-[34%] min-h-[184px] flex-col border-t border-border">
            <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
              <PanelTab
                active={sidePanel === "run"}
                onClick={() => setSidePanel("run")}
              >
                <ScrollText className="h-3.5 w-3.5" />
                Run log
              </PanelTab>
              <PanelTab
                active={sidePanel === "issues"}
                onClick={() => setSidePanel("issues")}
              >
                <ListTree className="h-3.5 w-3.5" />
                Issues
                {issues.length > 0 ? (
                  <span
                    className={
                      "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] " +
                      (errorCount > 0
                        ? "bg-red-500/15 text-red-600 dark:text-red-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400")
                    }
                  >
                    {issues.length}
                  </span>
                ) : null}
              </PanelTab>
            </div>
            <div className="min-h-0 flex-1">
              {sidePanel === "run" ? (
                <RunLog run={run} />
              ) : (
                <IssuesPanel
                  issues={issues}
                  onSelectNode={(id) => setSelectedId(id)}
                />
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Mobile controls ───────────────────────────────────────────────── */}
      {/* Below `lg` the side rails are hidden, so the palette, inspector and
          run log move into a bottom sheet driven by this bar. */}
      <div className="sticky bottom-0 z-50 flex items-center gap-2 border-t border-border bg-background px-3 py-2 lg:hidden">
        <MobileTab
          active={sheet === "palette"}
          onClick={() => setSheet(sheet === "palette" ? null : "palette")}
        >
          <Plus className="h-4 w-4" />
          Add
        </MobileTab>
        <MobileTab
          active={sheet === "inspector"}
          onClick={() => setSheet(sheet === "inspector" ? null : "inspector")}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {selectedNode ? "Edit" : "Inspect"}
        </MobileTab>
        <MobileTab
          active={sheet === "run"}
          onClick={() => setSheet(sheet === "run" ? null : "run")}
        >
          <ScrollText className="h-4 w-4" />
          Run log
          {issues.length > 0 ? (
            <AlertTriangle
              className={
                "h-3 w-3 " +
                (errorCount > 0 ? "text-red-500" : "text-amber-500")
              }
            />
          ) : null}
        </MobileTab>
      </div>

      {sheet ? (
        // Padded so the sheet stacks *above* the tab bar rather than burying
        // it — switching panels stays one tap away.
        <div className="fixed inset-x-0 bottom-0 z-40 pb-[52px] lg:hidden">
          <div
            // Inline colour on purpose: the `gfx-lite` rules force any
            // `bg-*/opacity` class inside the studio to full opacity, which
            // would turn this scrim into a solid wall.
            style={{ background: "rgb(var(--foreground) / 0.25)" }}
            className="absolute inset-x-0 bottom-full h-screen"
            onClick={() => setSheet(null)}
            role="presentation"
          />
          <div
            data-testid="studio-sheet"
            className="relative max-h-[65vh] overflow-hidden rounded-t-2xl border border-border bg-card shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {sheet === "palette"
                  ? "Add a node"
                  : sheet === "inspector"
                    ? "Inspector"
                    : "Run"}
              </p>
              <button
                type="button"
                onClick={() => setSheet(null)}
                aria-label="Close panel"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(65vh-2.5rem)] overflow-y-auto">
              {sheet === "palette" ? (
                <div className="flex flex-col">
                  <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          loadTemplate(t.id);
                          setSheet(null);
                        }}
                        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground"
                      >
                        <FileCode2 className="h-3 w-3" />
                        {t.name}
                      </button>
                    ))}
                  </div>
                  <Palette
                    onAdd={(kind) => {
                      addNode(kind);
                      setSheet(null);
                    }}
                  />
                </div>
              ) : sheet === "inspector" ? (
                <div className="min-h-[16rem]">
                  <Inspector
                    node={selectedNode}
                    onChangeLabel={(label) =>
                      selectedNode && changeNodeLabel(selectedNode.id, label)
                    }
                    onChangeConfig={(key, value) =>
                      selectedNode &&
                      changeNodeConfig(selectedNode.id, key, value)
                    }
                    onDuplicate={() =>
                      selectedNode && duplicateNode(selectedNode.id)
                    }
                    onDelete={() => {
                      if (!selectedNode) return;
                      deleteNode(selectedNode.id);
                      setSheet(null);
                    }}
                    onClose={() => setSheet(null)}
                  />
                </div>
              ) : (
                <div className="flex h-[50vh] flex-col">
                  <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
                    <PanelTab
                      active={sidePanel === "run"}
                      onClick={() => setSidePanel("run")}
                    >
                      Run log
                    </PanelTab>
                    <PanelTab
                      active={sidePanel === "issues"}
                      onClick={() => setSidePanel("issues")}
                    >
                      Issues {issues.length > 0 ? `(${issues.length})` : ""}
                    </PanelTab>
                  </div>
                  <div className="min-h-0 flex-1">
                    {sidePanel === "run" ? (
                      <RunLog run={run} />
                    ) : (
                      <IssuesPanel
                        issues={issues}
                        onSelectNode={(id) => {
                          setSelectedId(id);
                          setSheet("inspector");
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showShortcuts ? (
        <ShortcutsDialog onClose={() => setShowShortcuts(false)} />
      ) : null}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function PanelTab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors " +
        (active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function MobileTab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border text-xs font-medium transition-colors " +
        (active
          ? "border-border bg-accent text-foreground"
          : "border-transparent text-muted-foreground")
      }
    >
      {children}
    </button>
  );
}
