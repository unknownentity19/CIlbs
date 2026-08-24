"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { GitHubIcon, GoogleIcon } from "@/components/auth/social-icons";

/**
 * OAuth sign-in buttons.
 *
 * These used to be decorative — clicking one popped an alert saying OAuth
 * "would start here". They now start a real Auth.js flow, and they render only
 * for providers the deployment actually has credentials for: asking Auth.js
 * for an unconfigured provider is a 500, and a button that cannot work is
 * worse than no button.
 *
 * The list arrives as a prop from the server. Fetching it here cost a request
 * per mount and left the page in a loading state that looked broken.
 */

const LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  google: { label: "Continue with Google", icon: <GoogleIcon /> },
  github: { label: "Continue with GitHub", icon: <GitHubIcon /> },
};

export function SocialButtons({
  oauth,
  callbackUrl = "/dashboard",
}: {
  oauth: string[];
  callbackUrl?: string;
}) {
  const [pending, setPending] = React.useState<string | null>(null);

  if (!oauth.length) return null;

  return (
    <div className="mt-8 grid grid-cols-1 gap-2">
      {oauth.map((id) => (
        <button
          key={id}
          type="button"
          disabled={pending !== null}
          onClick={() => {
            setPending(id);
            void signIn(id, { callbackUrl });
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
        >
          {pending === id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            LABELS[id]!.icon
          )}
          {LABELS[id]!.label}
        </button>
      ))}
    </div>
  );
}
