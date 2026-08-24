import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { hasCredentialsAuth, oauthProviders } from "@/lib/env";
import { SignInForm } from "./signin-form";

/**
 * Which sign-in methods exist is decided here, on the server, rather than
 * discovered by the browser.
 *
 * The client used to ask `/api/auth/providers` on mount, which cost two
 * requests per page — and until they answered, the page rendered neither the
 * form nor an explanation, so on a cold serverless start it looked like an
 * empty page for several seconds.
 */
export default async function SignInPage() {
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
