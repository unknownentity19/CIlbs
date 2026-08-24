"use client";

/**
 * A tiny store for "there is unsaved work on this page".
 *
 * Deliberately a module, not React context: the things that need to ask are
 * not all React children of the editor — a capture-phase click listener on the
 * document, the command palette's `router.push`, and the navbar's sign-out all
 * consult it, and a couple of them run outside the React tree entirely.
 *
 * The editor registers a predicate rather than a boolean so the answer is
 * always computed from live state at the moment of the question, instead of a
 * flag that can be stale by a render.
 */

type Guard = () => boolean;

let guard: Guard | null = null;
const listeners = new Set<(dirty: boolean) => void>();

/** Register the current page's "do I have unsaved work?" predicate. */
export function setUnsavedGuard(fn: Guard) {
  guard = fn;
  notify();
  return () => {
    if (guard === fn) {
      guard = null;
      notify();
    }
  };
}

/** Tell subscribers the answer may have changed (call after state changes). */
export function notifyUnsavedChanged() {
  notify();
}

function notify() {
  const dirty = hasUnsavedWork();
  for (const listener of listeners) listener(dirty);
}

export function subscribeUnsaved(listener: (dirty: boolean) => void) {
  listeners.add(listener);
  listener(hasUnsavedWork());
  return () => {
    listeners.delete(listener);
  };
}

export function hasUnsavedWork() {
  try {
    return guard?.() ?? false;
  } catch {
    // A broken predicate must never block navigation outright.
    return false;
  }
}

/**
 * Ask before throwing work away. Returns true when it's fine to continue.
 *
 * `window.confirm` on purpose: this has to be able to block a navigation that
 * is already in flight, and a custom modal cannot answer synchronously.
 */
export function confirmDiscard(
  message = "You have unsaved changes in the studio. Leave and lose them?",
) {
  if (!hasUnsavedWork()) return true;
  return window.confirm(message);
}
