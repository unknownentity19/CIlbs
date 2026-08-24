import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSession } from "@/auth";
import { hasCredentialsAuth, oauthProviders } from "@/lib/env";
import { safeDestination } from "@/lib/post-auth-navigation";
import { SignUpForm } from "./signup-form";

/** Same reason as the sign-in page: it reads the session. */
export const dynamic = "force-dynamic";

/**
 * Provider discovery happens here rather than in the browser — see the note in
 * the sign-in page for why.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // See the sign-in page: nine marketing CTAs point at /signup, and they
  // render identically for signed-in visitors. One of them showed an
  // already-signed-in visitor a "Create your account" form.
  const session = await getSession();
  if (session?.user?.id) {
    const { next } = await searchParams;
    redirect(safeDestination(typeof next === "string" ? next : null));
  }

  const configured = oauthProviders();
  return (
    // The form reads `?next=` from the URL, which needs a boundary to
    // prerender around.
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      }
    >
      <SignUpForm
        providers={{
          oauth: [
            ...(configured.github ? ["github"] : []),
            ...(configured.google ? ["google"] : []),
          ],
          credentials: hasCredentialsAuth(),
        }}
      />
    </Suspense>
  );
}
