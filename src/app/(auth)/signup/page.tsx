import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { hasCredentialsAuth, oauthProviders } from "@/lib/env";
import { SignUpForm } from "./signup-form";

/**
 * Provider discovery happens here rather than in the browser — see the note in
 * the sign-in page for why.
 */
export default async function SignUpPage() {
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
