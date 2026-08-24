import { hasCredentialsAuth, oauthProviders } from "@/lib/env";
import { SignUpForm } from "./signup-form";

/**
 * Provider discovery happens here rather than in the browser — see the note in
 * the sign-in page for why.
 */
export default async function SignUpPage() {
  const configured = oauthProviders();
  return (
    <SignUpForm
      providers={{
        oauth: [
          ...(configured.github ? ["github"] : []),
          ...(configured.google ? ["google"] : []),
        ],
        credentials: hasCredentialsAuth(),
      }}
    />
  );
}
