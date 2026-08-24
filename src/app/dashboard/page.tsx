import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/auth";
import { DashboardView } from "./dashboard-view";

/**
 * Session-dependent, so it must never be prerendered: at build time there is
 * no request and no session, and Next would happily bake the "redirect to
 * sign-in" result into a static page that even a signed-in visitor receives.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Workspace overview, recent runs, and workflow health.",
};

/**
 * The gate lives here, in a server component: the previous version checked the
 * session in a `useEffect` and redirected on the client, which meant the page
 * and its data rendered for anyone who asked for it. Now an unauthenticated
 * request never receives the dashboard at all.
 */
export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/signin?next=/dashboard");
  }
  return <DashboardView />;
}
