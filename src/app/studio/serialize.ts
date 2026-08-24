import type { Workflow } from "./types";

/**
 * The wire form of a workflow.
 *
 * Its own module, free of React and server imports, because three very
 * different callers need it: the persistence hook (as the dirty-check key),
 * the unload beacon, and the unit tests.
 */

/** Used when the name field has been emptied — see `serializeWorkflow`. */
export const FALLBACK_NAME = "Untitled workflow";

/**
 * The exact bytes the server accepts; also the dirty-check key.
 *
 * The name is defaulted here rather than validated in the input, because the
 * server requires a non-empty one: clearing the field otherwise made every
 * subsequent cloud save fail validation, leaving the draft permanently marked
 * unsaved with only "Save failed" to explain it.
 */
export function serializeWorkflow(workflow: Workflow) {
  return JSON.stringify({
    id: workflow.id,
    name: workflow.name.trim() || FALLBACK_NAME,
    nodes: workflow.nodes,
    edges: workflow.edges,
  });
}
