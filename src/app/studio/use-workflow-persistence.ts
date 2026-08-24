"use client";

import * as React from "react";
import { STORAGE_KEY } from "./constants";
import { saveWorkflow } from "./actions";
import { FALLBACK_NAME, serializeWorkflow } from "./serialize";
import type { Workflow } from "./types";
import { setUnsavedGuard } from "@/lib/unsaved-guard";

export { FALLBACK_NAME, serializeWorkflow };

/**
 * Keeping a draft safe.
 *
 * Three things have to be true at once, and they pull in different directions:
 *
 *   1. Editing should never require remembering to save, so there's autosave.
 *   2. Saving should still be something you can *do*, because "did that save?"
 *      is a question people want answered, not inferred — hence `saveNow`,
 *      a visible state, and ⌘S.
 *   3. Closing the tab must not lose the last few seconds. Autosave runs on a
 *      debounce, so at any moment there can be an edit that no sink has yet;
 *      `flush` handles that on the way out.
 *
 * The unsaved flag is what the navigation guard reads, so it deliberately
 * stays true after a *failed* save: work that didn't reach the server is
 * exactly what somebody should be warned about before leaving.
 */

export type SaveState = "saved" | "unsaved" | "saving" | "error";

/** Where the draft is being kept, which decides what "saved" means. */
export type SaveScope = "local" | "cloud";

const LOCAL_DEBOUNCE_MS = 400;
const CLOUD_DEBOUNCE_MS = 1500;

function writeLocal(workflow: Workflow) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
    return true;
  } catch {
    // Quota exceeded, or storage blocked in private browsing.
    return false;
  }
}

export function useWorkflowPersistence({
  workflow,
  hydrated,
  cloud,
}: {
  workflow: Workflow;
  hydrated: boolean;
  /** True when the account can store workflows server-side. */
  cloud: boolean;
}) {
  const [state, setState] = React.useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  /** Why the last save failed, so the UI can say more than "failed". */
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Payload last known to have reached the active sink. State, not a ref: it
   * is one half of the dirty comparison, and a ref read during render doesn't
   * re-render when it changes, so the indicator and the navigation guard would
   * both go stale the moment a save completed.
   */
  const [savedPayload, setSavedPayload] = React.useState<string | null>(null);
  const payload = hydrated ? serializeWorkflow(workflow) : null;
  const dirty = hydrated && payload !== null && payload !== savedPayload;

  // Live mirrors for the handlers that run outside React's render cycle: the
  // pagehide flush and the explicit save both need the newest values without
  // re-binding a listener on every keystroke.
  const latest = React.useRef({ workflow, cloud, dirty });
  React.useEffect(() => {
    latest.current = { workflow, cloud, dirty };
  }, [workflow, cloud, dirty]);

  /** Called after hydration or a template load: this is the baseline. */
  const markPersisted = React.useCallback((wf: Workflow) => {
    setSavedPayload(serializeWorkflow(wf));
    setState("saved");
  }, []);

  // Reflect dirtiness in the visible state without clobbering "saving".
  React.useEffect(() => {
    setState((current) => {
      if (current === "saving") return current;
      if (dirty) return "unsaved";
      return current === "error" ? "error" : "saved";
    });
  }, [dirty]);

  // The navigation guard asks a predicate; re-registering it whenever the
  // answer changes keeps that predicate free of ref reads.
  React.useEffect(() => setUnsavedGuard(() => dirty), [dirty]);

  // ── Local autosave ────────────────────────────────────────────────────────
  // Runs regardless of where the canonical copy lives: even for a signed-in
  // user the browser copy is a useful cache if the network is down.
  React.useEffect(() => {
    if (!hydrated || payload === null) return;
    const timer = setTimeout(() => {
      const ok = writeLocal(latest.current.workflow);
      if (latest.current.cloud) return;
      if (ok) {
        setSavedPayload(payload);
        setLastSavedAt(Date.now());
        setError(null);
        setState("saved");
      } else {
        setError(
          "This browser refused to store the draft — private browsing or a full disk.",
        );
        setState("error");
      }
    }, LOCAL_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [payload, hydrated]);

  // ── Cloud autosave ────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!hydrated || !cloud || payload === null) return;
    if (payload === savedPayload) return;

    const timer = setTimeout(async () => {
      setState("saving");
      const result = await saveWorkflow(JSON.parse(payload));
      if (result.ok) {
        setSavedPayload(payload);
        setLastSavedAt(result.savedAt);
        setError(null);
        // The user may have carried on editing while the request was in
        // flight, in which case this is already out of date again.
        setState(
          serializeWorkflow(latest.current.workflow) === payload
            ? "saved"
            : "unsaved",
        );
      } else {
        // Leave `savedPayload` alone: the work is still only in this browser,
        // and the guard should keep warning about it.
        setError(result.error);
        setState("error");
      }
    }, CLOUD_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [payload, savedPayload, hydrated, cloud]);

  // ── Explicit save ─────────────────────────────────────────────────────────
  const saveNow = React.useCallback(async () => {
    const { workflow: wf, cloud: toCloud } = latest.current;
    const current = serializeWorkflow(wf);
    const localOk = writeLocal(wf);

    if (!toCloud) {
      if (localOk) {
        setSavedPayload(current);
        setLastSavedAt(Date.now());
        setError(null);
      } else {
        setError(
          "This browser refused to store the draft — private browsing or a full disk.",
        );
      }
      setState(localOk ? "saved" : "error");
      return localOk;
    }

    setState("saving");
    const result = await saveWorkflow(JSON.parse(current));
    if (result.ok) {
      setSavedPayload(current);
      setLastSavedAt(result.savedAt);
      setError(null);
      setState(
        serializeWorkflow(latest.current.workflow) === current
          ? "saved"
          : "unsaved",
      );
    } else {
      setError(result.error);
      setState("error");
    }
    return result.ok;
  }, []);

  // ── Leaving the page ──────────────────────────────────────────────────────
  // `pagehide` is the last event a browser reliably delivers — unmount effects
  // don't run when a tab is closed, and `unload` is ignored on mobile Safari.
  // The local write is synchronous so it always lands; the server write goes
  // through sendBeacon, which the browser keeps alive after the page is gone.
  // A server action can't be used here: those need a live React tree, so the
  // beacon posts to /api/workflows/save instead.
  React.useEffect(() => {
    function flush() {
      const { workflow: wf, cloud: toCloud, dirty: isDirty } = latest.current;
      if (!isDirty) return;
      writeLocal(wf);
      if (!toCloud) return;
      try {
        const body = new Blob([serializeWorkflow(wf)], {
          type: "application/json",
        });
        navigator.sendBeacon?.("/api/workflows/save", body);
      } catch {
        // Nothing else to try at this point in the page's life.
      }
    }

    function onVisibilityChange() {
      // Backgrounding a tab on mobile is often the last moment before the OS
      // discards it, so this is treated the same as leaving.
      if (document.visibilityState === "hidden") flush();
    }

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // Leaving the studio within React's lifetime: flush too, since the
      // debounce timers are about to be cleared by their own cleanups.
      flush();
    };
  }, []);

  return { state, dirty, error, lastSavedAt, saveNow, markPersisted };
}
