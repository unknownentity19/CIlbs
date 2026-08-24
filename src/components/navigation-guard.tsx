"use client";

import * as React from "react";
import {
  confirmDiscard,
  hasUnsavedWork,
  subscribeUnsaved,
} from "@/lib/unsaved-guard";

/**
 * Stops unsaved work from disappearing on the way out.
 *
 * Two exits to cover, and they need different mechanisms:
 *
 *   - Leaving the site entirely (closing the tab, reloading, typing a new URL)
 *     can only be intercepted with `beforeunload`, which shows the browser's
 *     own wording — the message is not ours to choose, and browsers only honour
 *     it at all if the visitor has interacted with the page.
 *   - Moving between pages *inside* the app never fires `beforeunload`, because
 *     the document doesn't unload. Those are client-side transitions, caught
 *     here by listening for link clicks in the capture phase before the router
 *     sees them.
 *
 * The `beforeunload` listener is attached only while there is something to
 * lose: registering one unconditionally opts the page out of the back/forward
 * cache in several browsers, which would make every ordinary navigation slower
 * for a warning that would never fire.
 */
export function NavigationGuard() {
  React.useEffect(() => {
    let detachBeforeUnload: (() => void) | null = null;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedWork()) return;
      event.preventDefault();
      // Legacy browsers key off a non-empty returnValue.
      event.returnValue = "";
    };

    const unsubscribe = subscribeUnsaved((dirty) => {
      if (dirty && !detachBeforeUnload) {
        window.addEventListener("beforeunload", onBeforeUnload);
        detachBeforeUnload = () =>
          window.removeEventListener("beforeunload", onBeforeUnload);
      } else if (!dirty && detachBeforeUnload) {
        detachBeforeUnload();
        detachBeforeUnload = null;
      }
    });

    return () => {
      unsubscribe();
      detachBeforeUnload?.();
    };
  }, []);

  // In-app navigation: intercept the click before the router acts on it.
  React.useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      // Modified clicks open a new tab, which leaves this one alone.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (!hasUnsavedWork()) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Staying on the same page (a hash or an identical path) loses nothing.
      if (url.pathname === window.location.pathname) return;

      if (!confirmDiscard()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    // Capture phase: Next's Link handles the click on bubble, so this has to
    // run first to be able to cancel it.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
