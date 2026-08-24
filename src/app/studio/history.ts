"use client";

import * as React from "react";

/**
 * Undo/redo for a single piece of state.
 *
 * The studio mutates one big `Workflow` object, so history is just a stack of
 * past/future snapshots around a `present` value. Two details make it feel
 * right in an editor:
 *
 *   - **Coalescing.** Dragging a node or typing in the inspector fires dozens
 *     of commits a second. Passing a `tag` merges consecutive commits that
 *     share it (within `coalesceMs`) into one history entry, so one ⌘Z undoes
 *     the whole drag rather than one pixel of it.
 *   - **Bounded depth.** The past is capped so a long session can't grow the
 *     heap without bound.
 */

const LIMIT = 80;
const DEFAULT_COALESCE_MS = 600;

export type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
  /** Tag of the commit that produced `present`, used for coalescing. */
  tag: string | null;
  /** Timestamp of that commit. */
  at: number;
};

export type HistoryAction<T> =
  | {
      type: "commit";
      value: T | ((prev: T) => T);
      tag: string | null;
      at: number;
      coalesceMs: number;
    }
  | { type: "reset"; value: T }
  | { type: "undo" }
  | { type: "redo" };

/** Exported for unit tests — the hook below is the supported entry point. */
export function historyReducer<T>(
  state: HistoryState<T>,
  action: HistoryAction<T>,
): HistoryState<T> {
  switch (action.type) {
    case "commit": {
      const next =
        typeof action.value === "function"
          ? (action.value as (prev: T) => T)(state.present)
          : action.value;
      if (Object.is(next, state.present)) return state;
      const canCoalesce =
        action.tag !== null &&
        action.tag === state.tag &&
        action.at - state.at < action.coalesceMs;
      if (canCoalesce) {
        // Same logical edit still in progress: swap the present in place so
        // the history stack keeps a single entry for the whole interaction.
        return { ...state, present: next, future: [], at: action.at };
      }
      const past = [...state.past, state.present].slice(-LIMIT);
      return { past, present: next, future: [], tag: action.tag, at: action.at };
    }
    case "reset":
      return {
        past: [],
        present: action.value,
        future: [],
        tag: null,
        at: 0,
      };
    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (previous === undefined) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        tag: null,
        at: 0,
      };
    }
    case "redo": {
      const next = state.future[0];
      if (next === undefined) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
        tag: null,
        at: 0,
      };
    }
  }
}

export type History<T> = {
  present: T;
  /** Commit a new value. Pass a `tag` to merge rapid consecutive edits. */
  commit: (
    value: T | ((prev: T) => T),
    tag?: string,
    coalesceMs?: number,
  ) => void;
  /** Replace the value and wipe history (loading a template, importing). */
  reset: (value: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export function useHistory<T>(initial: T): History<T> {
  const [state, dispatch] = React.useReducer(
    historyReducer as React.Reducer<HistoryState<T>, HistoryAction<T>>,
    { past: [], present: initial, future: [], tag: null, at: 0 },
  );

  const commit = React.useCallback(
    (
      value: T | ((prev: T) => T),
      tag?: string,
      coalesceMs: number = DEFAULT_COALESCE_MS,
    ) => {
      dispatch({
        type: "commit",
        value,
        tag: tag ?? null,
        at: Date.now(),
        coalesceMs,
      });
    },
    [],
  );

  const reset = React.useCallback((value: T) => {
    dispatch({ type: "reset", value });
  }, []);

  const undo = React.useCallback(() => dispatch({ type: "undo" }), []);
  const redo = React.useCallback(() => dispatch({ type: "redo" }), []);

  return {
    present: state.present,
    commit,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
