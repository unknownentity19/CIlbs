import { describe, expect, it } from "vitest";
import { historyReducer, type HistoryState } from "@/app/studio/history";

type Doc = { value: number };

const initial: HistoryState<Doc> = {
  past: [],
  present: { value: 0 },
  future: [],
  tag: null,
  at: 0,
};

function commit(
  state: HistoryState<Doc>,
  value: number,
  tag: string | null = null,
  at = 1000,
) {
  return historyReducer<Doc>(state, {
    type: "commit",
    value: { value },
    tag,
    at,
    coalesceMs: 600,
  });
}

describe("historyReducer", () => {
  it("pushes the previous value onto the past", () => {
    const next = commit(initial, 1);
    expect(next.present.value).toBe(1);
    expect(next.past).toHaveLength(1);
  });

  it("accepts a function updater", () => {
    const next = historyReducer<Doc>(initial, {
      type: "commit",
      value: (prev) => ({ value: prev.value + 5 }),
      tag: null,
      at: 1,
      coalesceMs: 600,
    });
    expect(next.present.value).toBe(5);
  });

  it("merges rapid commits that share a tag", () => {
    const a = commit(initial, 1, "move:n1", 1000);
    const b = commit(a, 2, "move:n1", 1200);
    expect(b.present.value).toBe(2);
    expect(b.past).toHaveLength(1); // still one undo step for the whole drag
  });

  it("starts a new entry once the coalesce window lapses", () => {
    const a = commit(initial, 1, "move:n1", 1000);
    const b = commit(a, 2, "move:n1", 2000);
    expect(b.past).toHaveLength(2);
  });

  it("keeps different tags separate", () => {
    const a = commit(initial, 1, "move:n1", 1000);
    const b = commit(a, 2, "move:n2", 1050);
    expect(b.past).toHaveLength(2);
  });

  it("ignores a commit that changes nothing", () => {
    const same = historyReducer<Doc>(initial, {
      type: "commit",
      value: (prev) => prev,
      tag: null,
      at: 1,
      coalesceMs: 600,
    });
    expect(same).toBe(initial);
  });

  it("undoes and redoes", () => {
    const a = commit(initial, 1);
    const undone = historyReducer<Doc>(a, { type: "undo" });
    expect(undone.present.value).toBe(0);
    expect(undone.future).toHaveLength(1);
    const redone = historyReducer<Doc>(undone, { type: "redo" });
    expect(redone.present.value).toBe(1);
    expect(redone.future).toHaveLength(0);
  });

  it("drops the redo stack once a new edit lands", () => {
    const a = commit(initial, 1);
    const undone = historyReducer<Doc>(a, { type: "undo" });
    const branched = commit(undone, 9, null, 5000);
    expect(branched.future).toHaveLength(0);
  });

  it("is a no-op at the ends of the stack", () => {
    expect(historyReducer<Doc>(initial, { type: "undo" })).toBe(initial);
    expect(historyReducer<Doc>(initial, { type: "redo" })).toBe(initial);
  });

  it("caps how much history it keeps", () => {
    let state = initial;
    for (let i = 1; i <= 200; i++) state = commit(state, i, null, i * 10_000);
    expect(state.past.length).toBeLessThanOrEqual(80);
    expect(state.present.value).toBe(200);
  });

  it("wipes history on reset", () => {
    const a = commit(commit(initial, 1), 2, null, 9000);
    const reset = historyReducer<Doc>(a, {
      type: "reset",
      value: { value: 42 },
    });
    expect(reset.present.value).toBe(42);
    expect(reset.past).toHaveLength(0);
    expect(reset.future).toHaveLength(0);
  });
});
