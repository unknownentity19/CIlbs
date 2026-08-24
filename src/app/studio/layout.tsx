import type { Metadata } from "next";

/**
 * The studio page itself is a client component (it owns canvas state), so its
 * metadata lives here — otherwise `/studio` would inherit the site-wide title
 * and show up in search and link previews as the generic home page.
 */
export const metadata: Metadata = {
  // The root layout applies the `%s — Cilbs` template, so this is just
  // the segment name — spelling out the suffix here rendered it twice.
  title: "Studio",
  description:
    "Build a workflow on a live canvas: drop in triggers, AI agents, branches, and actions, wire them together, and watch a simulated run step through the graph.",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
