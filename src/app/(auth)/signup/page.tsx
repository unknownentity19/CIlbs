"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { SocialButtons } from "@/components/auth/social-buttons";
import { useAuthProviders } from "@/components/auth/use-providers";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Creating an account with email needs a database; OAuth doesn't. The form
  // is hidden entirely when this deployment can't store a user.
  const providers = useAuthProviders();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signUp({ email, password, name, workspace });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start free. No credit card required.
        </p>
      </div>

      <SocialButtons />

      {providers.oauth.length > 0 && providers.credentials ? (
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or sign up with email</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      ) : (
        <div className="mt-8" />
      )}

      {providers.ready && !providers.credentials ? (
        <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
          {providers.oauth.length > 0
            ? "Create your account with one of the buttons above. Email sign-up needs a database, which isn't configured on this deployment."
            : "Accounts aren't available on this deployment yet, so the editor can't be opened. Set DATABASE_URL and AUTH_SECRET to enable them."}
        </p>
      ) : null}

      {providers.credentials ? (
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Work email</Label>
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
            <Label htmlFor="workspace">Workspace name</Label>
            <Input
              id="workspace"
              placeholder="acme"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
            />
            <FieldHint>
              Used in URLs and API calls. You can change it later.
            </FieldHint>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordStrength value={password} />
          </div>

          {error ? <FieldError>{error}</FieldError> : null}

          <Button
            type="submit"
            size="md"
            className="w-full mt-1"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create free account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center mt-1">
            By creating an account, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

function PasswordStrength({ value }: { value: string }) {
  const checks = [
    { label: "8+ characters", ok: value.length >= 8 },
    {
      label: "Letter and number",
      ok: /[a-zA-Z]/.test(value) && /\d/.test(value),
    },
    { label: "Special character", ok: /[^a-zA-Z0-9]/.test(value) },
  ];
  return (
    <ul className="mt-1 grid grid-cols-1 gap-1">
      {checks.map((c) => (
        <li
          key={c.label}
          className={`flex items-center gap-2 text-[11px] ${
            c.ok ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <span
            className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
              c.ok
                ? "border-foreground bg-foreground text-background"
                : "border-border"
            }`}
          >
            {c.ok ? <Check className="h-2.5 w-2.5" /> : null}
          </span>
          {c.label}
        </li>
      ))}
    </ul>
  );
}
