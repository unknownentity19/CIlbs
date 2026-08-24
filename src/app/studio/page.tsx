import { redirect } from "next/navigation";
import { getSession } from "@/auth";
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
  return <StudioView />;
}
