"use server";

import { requireUser } from "@/auth";
import { hasAuth, hasDatabase } from "@/lib/env";
import {
  persistWorkflow,
  readLatestWorkflow,
  removeWorkflow,
  workflowSchema,
  type StoredWorkflow,
} from "./workflow-store";

/**
 * Server actions for workflow storage.
 *
 * Signed-in visitors get their graphs in Postgres; everyone else keeps using
 * the browser-only draft as a local cache. The
 * validation and the write itself live in `workflow-store.ts`, shared with the
 * beacon route the page uses when the tab is closing.
 */

export type { StoredWorkflow };
export type SaveResult =
  | { ok: true; savedAt: number }
  | { ok: false; error: string };

/**
 * What the account has stored, and whether server storage is available at all.
 *
 * The two are reported separately on purpose: a bare `null` couldn't tell the
 * editor apart "you have no saved workflow yet" from "this deployment has no
 * database", and those need different behaviour — the first should push the
 * local draft up, the second should stop trying and say so.
 */
export type StudioStorage = {
  available: boolean;
  workflow: StoredWorkflow | null;
};

export async function loadLatestWorkflow(): Promise<StudioStorage> {
  if (!hasDatabase()) return { available: false, workflow: null };
  try {
    const user = await requireUser();
    return { available: true, workflow: await readLatestWorkflow(user.id) };
  } catch {
    // Not signed in, or the database is unreachable: fall back to local.
    return { available: false, workflow: null };
  }
}

/** Upsert one graph. Called on a debounce, so it stays cheap and idempotent. */
export async function saveWorkflow(input: unknown): Promise<SaveResult> {
  if (!hasAuth()) {
    return {
      ok: false,
      error: "Cloud saving isn't configured on this deployment.",
    };
  }
  const parsed = workflowSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "That workflow isn't valid.",
    };
  }

  try {
    const user = await requireUser();
    const savedAt = await persistWorkflow(user.id, parsed.data);
    return { ok: true, savedAt: savedAt.getTime() };
  } catch (error) {
    if (error instanceof Error && error.message === "Not signed in.") {
      return { ok: false, error: "Sign in to save to your account." };
    }
    console.error("saveWorkflow failed", error);
    return { ok: false, error: "Couldn't reach the database." };
  }
}

export async function deleteWorkflow(id: string): Promise<{ ok: boolean }> {
  if (!hasAuth()) return { ok: false };
  try {
    const user = await requireUser();
    await removeWorkflow(user.id, id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
