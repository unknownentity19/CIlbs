import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSession } from "@/auth";
import { hasCredentialsAuth, oauthProviders } from "@/lib/env";
import { safeDestination } from "@/lib/post-auth-navigation";
import { SignInForm } from "./signin-form";

/**
 * Reads the session to turn signed-in visitors away, so it can't be
 * prerendered — a static page would bake in "no session" for everyone.
 */
export const dynamic = "force-dynamic";

/**
 * Which sign-in methods exist is decided here, on the server, rather than
 * discovered by the browser.
 *
 * The client used to ask `/api/auth/providers` on mount, which cost two
 * requests per page — and until they answered, the page rendered neither the
 * form nor an explanation, so on a cold serverless start it looked like an
 * empty page for several seconds.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // Every marketing page has a "Get Started" or "Start building" button
  // pointing here, and they render the same for everyone — the pages are
  // static, so they cannot know who is reading them. Without this a
  // signed-in visitor who clicked one was asked to sign in again, while the
  // navbar above the form showed them signed in.
  //
  // The session is verified rather than sniffed from the cookie. Redirecting
  // on cookie *presence* would loop forever against a stale or expired one:
  // /signin sends you to /dashboard, whose gate sends you back here.
  const session = await getSession();
  if (session?.user?.id) {
    const { next } = await searchParams;
    redirect(safeDestination(typeof next === "string" ? next : null));
  }

  const configured = oauthProviders();
  const providers = {
    oauth: [
      ...(configured.github ? ["github"] : []),
      ...(configured.google ? ["google"] : []),
    ],
    credentials: hasCredentialsAuth(),
  };

  return (
    // The form reads `?next=` and `?error=` from the URL, which needs a
    // boundary to prerender around.
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      }
    >
      <SignInForm providers={providers} />
    </Suspense>
  );
}
