import { NODE_META, STORAGE_KEY } from "./constants";
import { TEMPLATES } from "./templates";
import type { Edge, Workflow, WorkflowNode } from "./types";

/**
 * Reading and writing the studio draft.
 *
 * Everything that crosses the trust boundary — localStorage, an imported file
 * — goes through `sanitizeWorkflow` first. Kept in its own module (rather than
 * inline in the page) so the parsing rules can be unit tested without mounting
 * React.
 */

/** Build a fresh workflow from a template id, falling back to the first one. */
export function buildTemplate(id: string): Workflow {
  const t = TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
  return t.build();
}

/** Validate a workflow loaded from storage or an imported file. Drops nodes
 * whose kind we no longer support (e.g. after a schema change) and edges that
 * reference missing nodes, so a stale draft can never crash the studio. */
export function sanitizeWorkflow(input: unknown): Workflow | null {
  if (!input || typeof input !== "object") return null;
  const wf = input as Partial<Workflow>;
  if (typeof wf.id !== "string" || typeof wf.name !== "string") return null;
  if (!Array.isArray(wf.nodes) || !Array.isArray(wf.edges)) return null;
  const validKinds = new Set(Object.keys(NODE_META));
  const nodes: WorkflowNode[] = [];
  for (const raw of wf.nodes as WorkflowNode[]) {
    if (!raw || typeof raw !== "object") continue;
    if (typeof raw.id !== "string") continue;
    if (!validKinds.has(raw.kind as string)) continue;
    if (typeof raw.x !== "number" || typeof raw.y !== "number") continue;
    nodes.push({
      ...raw,
      label: typeof raw.label === "string" ? raw.label : NODE_META[raw.kind].label,
      // Re-merge default config so nodes saved before a schema bump keep
      // working: existing keys win, missing keys fall back to defaults.
      config: {
        ...(NODE_META[raw.kind].defaultConfig as object),
        ...(raw.config as object),
      } as WorkflowNode["config"],
    });
  }
  const ids = new Set(nodes.map((n) => n.id));
  const edges: Edge[] = [];
  for (const raw of wf.edges as Edge[]) {
    if (!raw || typeof raw.id !== "string") continue;
    if (!ids.has(raw.from) || !ids.has(raw.to)) continue;
    const edge: Edge = { id: raw.id, from: raw.from, to: raw.to };
    // Only carry a branch we recognise; anything else falls back to "true"
    // at read time, which is how pre-branching drafts keep working.
    if (raw.branch === "true" || raw.branch === "false") edge.branch = raw.branch;
    edges.push(edge);
  }
  return { id: wf.id, name: wf.name, nodes, edges };
}

/** The key drafts lived under before the product was renamed to Cilbs. */
const LEGACY_STORAGE_KEY = "hypero.studio.workflow.v1";

export function loadFromStorage(): Workflow {
  if (typeof window === "undefined") return buildTemplate("lead-router");
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);

    // Adopt a draft saved under the old name, once. Without this, anyone with
    // work in progress would have opened the studio after the rename to find
    // a blank canvas and no way back to it.
    if (!raw) {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        window.localStorage.setItem(STORAGE_KEY, legacy);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        raw = legacy;
      }
    }

    if (!raw) return buildTemplate("lead-router");
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeWorkflow(parsed) ?? buildTemplate("lead-router");
  } catch {
    return buildTemplate("lead-router");
  }
}

