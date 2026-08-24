"use client";

import * as React from "react";
import { getProviders } from "next-auth/react";

/**
 * What sign-in methods this deployment actually offers.
 *
 * Auth.js already knows — it exposes the configured providers at
 * /api/auth/providers — so the UI asks rather than guessing from public env
 * vars. That matters because the two halves are independent: OAuth runs with
 * no database at all (JWT sessions), while email and password need somewhere
 * to keep the hash, so a database-less deployment offers only the former.
 */

const OAUTH_IDS = ["github", "google"] as const;

export type AuthProviders = {
  /** Configured OAuth provider ids, in display order. */
  oauth: string[];
  /** Whether email + password sign-in is available. */
  credentials: boolean;
  /** False until the answer is known, so nothing flashes into place wrongly. */
  ready: boolean;
};

export function useAuthProviders(): AuthProviders {
  const [state, setState] = React.useState<AuthProviders>({
    oauth: [],
    credentials: false,
    ready: false,
  });

  React.useEffect(() => {
    let cancelled = false;
    void getProviders()
      .then((providers) => {
        if (cancelled) return;
        const list = Object.values(providers ?? {});
        setState({
          oauth: OAUTH_IDS.filter((id) => list.some((p) => p.id === id)),
          credentials: list.some((p) => p.id === "credentials"),
          ready: true,
        });
      })
      .catch(() => {
        // Auth isn't configured at all.
        if (cancelled) return;
        setState({ oauth: [], credentials: false, ready: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
