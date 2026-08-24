"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { goAfterAuth, safeDestination } from "@/lib/post-auth-navigation";
import { SocialButtons } from "@/components/auth/social-buttons";
import type { AuthProviders } from "@/components/auth/use-providers";

/** Readable text for the error codes Auth.js puts in the query string. */
const OAUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email already has an account. Sign in the way you did the first time, then connect this provider.",
  OAuthSignin: "Couldn't start sign-in with that provider.",
  OAuthCallback: "That provider didn't complete the sign-in.",
  AccessDenied: "That account isn't allowed to sign in.",
  Configuration: "Sign-in isn't configured on this deployment yet.",
  Verification: "That sign-in link has expired.",
};

export function SignInForm({ providers }: { providers: AuthProviders }) {
  const { signIn } = useAuth();
  const params = useSearchParams();
  // Only allow same-origin relative paths to avoid open-redirect attacks
  // (e.g. ?next=//evil.com or ?next=https://evil.com).
  const next = safeDestination(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Which sign-in methods exist here. OAuth needs no database; email and
  // password do, so a database-less deployment offers only the buttons.

  // Auth.js reports a failed OAuth round trip by sending the visitor back here
  // with ?error=..., which otherwise renders as a silently unchanged form.
  const oauthError = params.get("error");
  const oauthMessage = oauthError
    ? (OAUTH_ERRORS[oauthError] ?? "That sign-in attempt didn't complete.")
    : null;
  const [pending, setPending] = useState(false);
  // Until React has hydrated, this form has no submit handler — and a click on
  // a submit button in a form with no `action` makes the browser do a native
  // GET to the same URL, which silently reloads the page and discards whatever
  // was typed. On a cold start that window is seconds long and looks exactly
  // like "nothing happened", so the button waits for its handler.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signIn({ email, password });
      goAfterAuth(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Cilbs workspace.
        </p>
      </div>

      <SocialButtons oauth={providers.oauth} callbackUrl={next} />

      {providers.oauth.length > 0 && providers.credentials ? (
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or continue with email</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      ) : (
        <div className="mt-8" />
      )}

      {!providers.credentials ? (
        <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
          {providers.oauth.length > 0
            ? "This deployment signs in through the buttons above. Email and password sign-in needs a database, which isn't configured here."
            : "Sign-in isn't configured on this deployment yet, so the editor can't be opened. Set DATABASE_URL and AUTH_SECRET to enable accounts."}
        </p>
      ) : null}

      {providers.credentials ? (
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ada@cilbs.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/signin"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FieldHint>Minimum 6 characters.</FieldHint>
          </div>

          {(error ?? oauthMessage) ? (
            <FieldError>{error ?? oauthMessage}</FieldError>
          ) : null}

          <Button
            type="submit"
            size="md"
            className="w-full mt-1"
            disabled={pending || !hydrated}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      ) : null}

      {/* An OAuth failure has no form to render into when credentials are off,
          so it gets its own slot here. */}
      {!providers.credentials && oauthMessage ? (
        <p className="mt-4">
          <FieldError>{oauthMessage}</FieldError>
        </p>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Sign up free
        </Link>
      </p>
    </>
  );
}
