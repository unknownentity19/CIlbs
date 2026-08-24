"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Boxes,
  ChevronDown,
  Code2,
  Info,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sparkles,
  Sun,
  UserPlus,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { confirmDiscard } from "@/lib/unsaved-guard";
import { cn } from "@/lib/utils";

/**
 * Navbar architecture
 * -------------------
 * Top-level nav buttons in the navbar are **categories**, not links. Hovering
 * or clicking a category opens a dropdown of related links with leading icons
 * — so the only purpose of the top bar is to surface the menus, never to
 * navigate by itself. The previous flat structure (Product, Features,
 * Solutions, Docs, Pricing) and the search bar both lived here; both have
 * been retired in favour of grouped menus that mirror the command palette's
 * sections.
 */

type SubMenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

type MenuGroup = {
  label: string;
  items: SubMenuItem[];
};

/** Direct top-level link that doesn't open a menu. Sits alongside the
 * category buttons in the navbar. */
type DirectLink = {
  label: string;
  href: string;
};

const DIRECT_LINKS: DirectLink[] = [{ label: "Home", href: "/" }];

const NAV_MENUS: MenuGroup[] = [
  {
    label: "Product",
    items: [
      {
        label: "Product",
        href: "/product",
        icon: Sparkles,
        description: "What Cilbs is and who it's for.",
      },
      {
        label: "Features",
        href: "/features",
        icon: Layers,
        description: "Every primitive in detail.",
      },
      {
        label: "Studio",
        href: "/studio",
        icon: LayoutGrid,
        description: "Build a real workflow on the canvas.",
      },
      {
        label: "Visual workflow builder",
        href: "/features#workflow-builder",
        icon: Workflow,
        description: "Drag, connect, deploy.",
      },
    ],
  },
  {
    label: "Resources",
    items: [
      {
        label: "Docs",
        href: "/docs",
        icon: BookOpen,
        description: "Quickstart, guides, and API reference.",
      },
      {
        label: "API reference",
        href: "/docs#api-reference",
        icon: Code2,
        description: "Endpoints, SDKs, and webhooks.",
      },
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Workspace overview and runs.",
      },
    ],
  },
  {
    label: "Company",
    items: [
      {
        label: "About",
        href: "/about",
        icon: Info,
        description: "Independent and bootstrapped — the team behind Cilbs.",
      },
      {
        label: "Solutions",
        href: "/solutions",
        icon: LineChart,
        description: "Use-cases and customer stories.",
      },
      {
        label: "Pricing",
        href: "/pricing",
        icon: Boxes,
        description: "Plans for solo builders to enterprise.",
      },
      {
        label: "Security",
        href: "/security",
        icon: Shield,
        description: "How we protect workflow data.",
      },
    ],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, ready } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menusRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);

  // Track scroll for the sticky-bar visual treatment.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close any open menu when the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setAccountMenuOpen(false);
  }, [pathname]);

  // Click-outside: closes the open desktop menu (category or account).
  // Each ref is checked independently — the previous version required *both*
  // to exist, so while auth was still resolving (no account menu rendered yet)
  // `accountRef.current` was null and the whole condition short-circuited,
  // leaving an open nav menu stuck until the next route change.
  useEffect(() => {
    if (!openMenu && !accountMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const insideMenus = menusRef.current?.contains(target) ?? false;
      const insideAccount = accountRef.current?.contains(target) ?? false;
      if (insideMenus || insideAccount) return;
      setOpenMenu(null);
      setAccountMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpenMenu(null);
      setAccountMenuOpen(false);
    }
    // `pointerdown` so a touch outside closes the menu too — `mousedown`
    // never fires for the first tap on some mobile browsers.
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openMenu, accountMenuOpen]);

  const initials = user
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-background/0",
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-6">
        {/* Left region — logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center" aria-label="Cilbs home">
            <Logo size="lg" />
          </Link>
        </div>

        {/* Centre region — nav items absolutely centred to the bar so the
            menus stay in the middle even when the logo or right-side
            controls grow / shrink. */}
        <nav
          className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
          ref={menusRef}
        >
          {/* Menus open on hover, so the close belongs on the subtree that
              holds both the triggers and the panels. Closing only on the
              panel's own mouseleave left a menu stuck open whenever the
              pointer left sideways without entering it. */}
          <ul
            className="pointer-events-auto flex items-center gap-1"
            onMouseLeave={() => setOpenMenu(null)}
          >
            {DIRECT_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex h-8 items-center rounded-full px-3 text-sm transition-colors",
                      active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              {NAV_MENUS.map((menu) => (
                <li key={menu.label} className="relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={openMenu === menu.label}
                    onClick={() =>
                      setOpenMenu((cur) => (cur === menu.label ? null : menu.label))
                    }
                    onMouseEnter={() => setOpenMenu(menu.label)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm transition-colors",
                      openMenu === menu.label || isMenuActive(menu, pathname)
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {menu.label}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        openMenu === menu.label && "rotate-180",
                      )}
                    />
                  </button>
                  {openMenu === menu.label ? (
                      // The outer div's top padding is a transparent bridge:
                      // with a plain `mt-2` the pointer crossed dead space on
                      // its way down and the menu closed under the cursor.
                      <div className="absolute left-0 top-full z-30 pt-2">
                      <div
                        role="menu"
                        className="animate-pop-down w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
                      >
                        <ul className="p-1.5">
                          {menu.items.map((item) => {
                            const Icon = item.icon;
                            const active =
                              pathname === item.href ||
                              pathname.startsWith(`${item.href}/`);
                            return (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  role="menuitem"
                                  onClick={() => setOpenMenu(null)}
                                  className={cn(
                                    "flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                                    active
                                      ? "bg-accent text-foreground"
                                      : "text-foreground hover:bg-accent",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border",
                                      active ? "bg-background" : "bg-accent",
                                    )}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[13px] font-medium">
                                      {item.label}
                                    </span>
                                    {item.description ? (
                                      <span className="block text-[11px] leading-snug text-muted-foreground">
                                        {item.description}
                                      </span>
                                    ) : null}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      </div>
                    ) : null}
                </li>
              ))}
            </ul>
          </nav>

        {/* Right region — theme toggle + auth menu, pushed to the end. */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Auth / account menu */}
          {!ready ? (
            <div className="hidden md:block h-8 w-24" aria-hidden />
          ) : user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((s) => !s)}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                className="hidden md:inline-flex h-8 items-center gap-2 rounded-full border border-border bg-background pl-1 pr-3 text-sm text-foreground transition-colors hover:bg-accent"
                aria-label="Account menu"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-semibold">
                  {initials || "U"}
                </span>
                <span className="font-medium text-[13px] max-w-[8rem] truncate">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-muted-foreground transition-transform",
                    accountMenuOpen && "rotate-180",
                  )}
                />
              </button>
              {accountMenuOpen ? (
                  <div
                    role="menu"
                    className="animate-pop-down absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
                  >
                    <div className="border-b border-border px-3 py-3">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <p className="mt-2 inline-flex rounded-md bg-accent border border-border px-1.5 py-0.5 text-[10px] font-mono text-foreground">
                        ws: {user.workspace}
                      </p>
                    </div>
                    <ul className="p-1.5">
                      <AccountMenuItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        description="Workspace overview and runs."
                        href="/dashboard"
                        onClick={() => setAccountMenuOpen(false)}
                      />
                      <AccountMenuItem
                        icon={LayoutGrid}
                        label="Studio"
                        description="Open the workflow canvas."
                        href="/studio"
                        onClick={() => setAccountMenuOpen(false)}
                      />
                      <AccountMenuItem
                        icon={BookOpen}
                        label="Documentation"
                        description="API reference and guides."
                        href="/docs"
                        onClick={() => setAccountMenuOpen(false)}
                      />
                    </ul>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirmDiscard()) return;
                        setAccountMenuOpen(false);
                        await signOut();
                        router.push("/");
                      }}
                      className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-sm text-foreground hover:bg-accent"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-accent">
                        <LogOut className="h-3.5 w-3.5" />
                      </span>
                      Sign out
                    </button>
                  </div>
                ) : null}
            </div>
          ) : (
            <div className="relative hidden md:block" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((s) => !s)}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm transition-colors",
                  accountMenuOpen
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Account
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    accountMenuOpen && "rotate-180",
                  )}
                />
              </button>
              {accountMenuOpen ? (
                  <div
                    role="menu"
                    className="animate-pop-down absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
                  >
                    <ul className="p-1.5">
                      <AccountMenuItem
                        icon={UserPlus}
                        label="Create an account"
                        description="Free forever for personal use."
                        href="/signup"
                        onClick={() => setAccountMenuOpen(false)}
                      />
                      <AccountMenuItem
                        icon={LogIn}
                        label="Sign in"
                        description="Welcome back to your workspace."
                        href="/signin"
                        onClick={() => setAccountMenuOpen(false)}
                      />
                    </ul>
                  </div>
                ) : null}
            </div>
          )}

          <button
            type="button"
            className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => setMobileOpen((s) => !s)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile expanded menu */}
      {mobileOpen ? (
          <div
            className="animate-pop-down md:hidden border-t border-border bg-background max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain"
          >
            <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-5">
              <ul className="flex flex-col gap-1">
                {DIRECT_LINKS.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors block",
                          active
                            ? "bg-accent text-foreground"
                            : "text-foreground hover:bg-accent",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {NAV_MENUS.map((menu) => (
                <div key={menu.label}>
                  <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {menu.label}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {menu.items.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-start gap-3 rounded-xl px-2.5 py-2 transition-colors",
                              active
                                ? "bg-accent text-foreground"
                                : "text-foreground hover:bg-accent",
                            )}
                          >
                            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[13px] font-medium">
                                {item.label}
                              </span>
                              {item.description ? (
                                <span className="block text-[11px] leading-snug text-muted-foreground">
                                  {item.description}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <div className="border-t border-border pt-4">
                <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Account
                </p>
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Button href="/dashboard" size="md" className="w-full">
                      Open dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full"
                      onClick={async () => {
                        if (!confirmDiscard()) return;
                        await signOut();
                        router.push("/");
                      }}
                    >
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button href="/signup" size="md" className="w-full">
                      Get Started
                    </Button>
                    <Button
                      href="/signin"
                      variant="outline"
                      size="md"
                      className="w-full"
                    >
                      Sign in
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
    </header>
  );
}

function AccountMenuItem({
  icon: Icon,
  label,
  description,
  href,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  href: string;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        role="menuitem"
        className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-foreground transition-colors hover:bg-accent"
      >
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-accent">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-medium">{label}</span>
          {description ? (
            <span className="block text-[11px] leading-snug text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

function isMenuActive(menu: MenuGroup, pathname: string) {
  return menu.items.some(
    (item) =>
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
  );
}
