import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CommandPaletteProvider } from "@/components/command/command-palette";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { NavigationGuard } from "@/components/navigation-guard";
import { PageTransition } from "@/components/motion/page-transition";
import { SITE } from "@/lib/site";
import { GFX_LITE_SCRIPT } from "@/lib/inline-scripts";

// Bricolage Grotesque is a humanist sans with a tech edge — pairs well with
// Cilbs's gradient hero and feels distinct from the default Geist used by
// most Next.js starters.
const bricolage = Bricolage_Grotesque({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.shortDescription}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "AI workflow builder",
    "AI agents",
    "automation",
    "no-code AI",
    "agentic workflows",
    "Cilbs",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.shortDescription}`,
    description: SITE.description,
    images: [
      {
        url: SITE.ogImage,
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.shortDescription}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    creator: SITE.twitter,
    title: `${SITE.name} — ${SITE.shortDescription}`,
    description: SITE.description,
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // One colour: the site is light regardless of the visitor's system setting.
  themeColor: SITE.themeColor,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Flag real touch hardware before first paint. The studio drops its
            frosted-glass blur on touch devices (see `.gfx-lite .studio-root`
            in globals.css): stacked backdrop-filter layers crash some Android
            GPU drivers when the studio is opened in Chrome's "Desktop site"
            mode, where width/pointer media queries no longer match. Running
            synchronously here avoids a first-frame composite with blur on. */}
        <script dangerouslySetInnerHTML={{ __html: GFX_LITE_SCRIPT }} />
        {/* Scroll reveals start hidden and are un-hidden by an observer once
            React mounts. With JavaScript disabled that never happens, so
            every revealed section would render blank — this puts the page
            back to plain, fully visible HTML in that case. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}.page-transition{animation:none !important}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Keyboard users land here first: one Tab, one Enter, past the nav. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-foreground"
        >
          Skip to content
        </a>
          <AuthProvider>
            <CommandPaletteProvider>
              {/* Warns before unsaved editor work is thrown away, whether the
                  visitor leaves the site or just moves to another page. */}
              <NavigationGuard />
              <Navbar />
              <main id="main" className="flex-1">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer />
            </CommandPaletteProvider>
          </AuthProvider>
      </body>
    </html>
  );
}
