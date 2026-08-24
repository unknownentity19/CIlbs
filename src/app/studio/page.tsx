import { redirect } from "next/navigation";
import { getSession } from "@/auth";
import { hasDatabase } from "@/lib/env";
import { StudioView } from "./studio-view";

/**
 * Reads the session, so it must never be prerendered — at build time there is
 * no request, and Next would bake the redirect into a static page that even a
 * signed-in visitor would then receive.
 */
export const dynamic = "force-dynamic";

/**
 * The editor is behind the gate.
 *
 * It used to be open to anyone, saving to browser storage, on the theory that
 * letting visitors try it was worth more than requiring an account. For a tool
 * with one owner that trade is backwards: an ungated editor is an open door to
 * whatever the deployment can reach.
 *
 * It fails closed on purpose. With no database or session secret configured
 * nobody can sign in, so nobody gets the editor either — the sign-in page
 * explains that rather than quietly leaving the door open.
 */
export default async function StudioPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/signin?next=/studio");
  }
  // Told to the client rather than rediscovered there. The browser only learns
  // it has a session once `useSession` finishes its own request, and in that
  // gap the editor would decide it had no server storage, save to the browser,
  // then change its mind — which showed up as "Saved in this browser" for a
  // signed-in visitor and a spurious "unsaved changes" warning when the sink
  // switched underneath the dirty check.
  return <StudioView cloudAvailable={hasDatabase()} />;
}
