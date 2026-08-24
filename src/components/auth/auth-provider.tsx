"use client";

import {
  SessionProvider,
  signIn as authSignIn,
  signOut as authSignOut,
  useSession,
} from "next-auth/react";
import { createContext, useContext, useMemo } from "react";
import { createAccount } from "@/app/(auth)/actions";

/**
 * Auth context.
 *
 * This used to be a mock that kept a fabricated user in `localStorage` —
 * meaning anyone could grant themselves a session by editing one key. It now
 * wraps Auth.js: sessions are signed httpOnly cookies, credentials are checked
 * on the server, and passwords are bcrypt hashes in Postgres.
 *
 * The `useAuth()` shape is unchanged so the navbar, dashboard, and auth forms
 * keep working against the same interface.
 */

export type User = {
  id: string;
  email: string;
  name: string;
  workspace: string;
};

type AuthContextValue = {
  user: User | null;
  /** False until the session has been resolved, so UI can hold its shape. */
  ready: boolean;
  /** Resolves once the session cookie is set. Throws with a readable message
   * if the credentials are refused. */
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    name: string;
    workspace?: string;
  }) => Promise<void>;
  /**
   * Resolves once the session is actually gone. Awaiting it matters: the
   * fire-and-forget version let callers navigate first, so a visitor could
   * land on the home page still holding a valid session — and still open the
   * dashboard — until the request caught up.
   */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthBridge({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();

  // Derived from the individual fields, not the session object: next-auth
  // refetches the session on every window focus and hands back a new object
  // each time. Rebuilding `user` from that identity made consumers re-run
  // effects on every tab switch — which, in the studio, re-ran hydration and
  // wiped the undo stack.
  const id = session?.user?.id;
  const email = session?.user?.email ?? "";
  const name = session?.user?.name ?? "";
  const workspace = session?.user?.workspace ?? "personal";

  const user = useMemo<User | null>(
    () => (id ? { id, email, name: name || email, workspace } : null),
    [id, email, name, workspace],
  );

  const value = useMemo<AuthContextValue>(() => {

    async function signIn(input: { email: string; password: string }) {
      const result = await authSignIn("credentials", {
        ...input,
        redirect: false,
      });
      if (!result || result.error) {
        // 503 is the route handler saying auth isn't configured at all, which
        // is a very different problem from a wrong password.
        throw new Error(
          result?.status === 503
            ? "Accounts aren't available yet — this deployment has no database or session secret configured."
            : "That email and password don't match an account.",
        );
      }

      // The session cookie is set by the response above; that is the thing
      // that matters, and the server reads it on the very next navigation.
      //
      // This used to gate success on `update()` returning a user, which is a
      // race it frequently loses: `update()` kicks off a refetch and resolves
      // with the session it has *now*, which is still null. A successful
      // sign-in was then reported as "Could not start a session" and the
      // caller never navigated — the visitor stayed on the form while being,
      // in fact, signed in.
      //
      // The refresh still happens, so client components see the new session;
      // it just no longer decides whether sign-in worked.
      void update();
    }

    return {
      user,
      ready: status !== "loading",
      signIn,
      async signUp(input) {
        const result = await createAccount(input);
        if (!result.ok) throw new Error(result.error);
        // Creating the account signs you straight in — no second form.
        await signIn({ email: input.email, password: input.password });
      },
      async signOut() {
        await authSignOut({ redirect: false });
      },
    };
  }, [user, status, update]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthBridge>{children}</AuthBridge>
    </SessionProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
