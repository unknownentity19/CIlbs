import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Web app manifest. The studio is the part worth installing — it behaves like
 * an app, and a standalone window drops the browser chrome that eats vertical
 * space on the canvas.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.shortDescription}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/studio",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    categories: ["developer", "productivity", "utilities"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/logo-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/logo.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
