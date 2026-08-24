"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BookOpen,
  Boxes,
  Code2,
  Info,
  LayoutGrid,
  Layers,
  LayoutDashboard,
  LineChart,
  LogIn,
  LogOut,
  Moon,
  Search,
  Sparkles,
  Sun,
  UserPlus,
  Workflow,
} from "lucide-react";
import { confirmDiscard } from "@/lib/unsaved-guard";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth/auth-provider";

type Ctx = { open: () => void; close: () => void; isOpen: boolean };
const CommandPaletteContext = createContext<Ctx | undefined>(undefined);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used inside provider");
  }
  return ctx;
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((o) => !o);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // While the palette is open: freeze the page behind it (it used to scroll
  // under the dialog) and hand focus back to whatever opened it on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    // Compensate for the vanishing scrollbar so the layout doesn't jump.
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  const ctx = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  const go = (href: string) => {
    // `router.push` bypasses the document click listener in NavigationGuard,
    // so this asks directly.
    if (!confirmDiscard()) return;
    setIsOpen(false);
    router.push(href);
  };

  return (
    <CommandPaletteContext.Provider value={ctx}>
      {children}
      {isOpen ? (
          <div className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]">
            <div
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
              onClick={close}
              aria-hidden
            />
            <div className="animate-dialog-in relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              <Command label="Cilbs Command Palette" className="w-full">
                <div className="flex items-center gap-3 border-b border-border px-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Command.Input
                    placeholder="Search pages, docs, features…"
                    className="h-12 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <kbd className="hidden md:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    ESC
                  </kbd>
                </div>
                <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                  <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No results found.
                  </Command.Empty>

                  <Command.Group
                    heading="Navigation"
                    className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-wide text-muted-foreground"
                  >
                    <Item
                      icon={<LayoutDashboard className="h-4 w-4" />}
                      label="Home"
                      onSelect={() => go("/")}
                    />
                    <Item
                      icon={<Sparkles className="h-4 w-4" />}
                      label="Product"
                      onSelect={() => go("/product")}
                    />
                    <Item
                      icon={<Layers className="h-4 w-4" />}
                      label="Features"
                      onSelect={() => go("/features")}
                    />
                    <Item
                      icon={<LayoutGrid className="h-4 w-4" />}
                      label="Studio"
                      onSelect={() => go("/studio")}
                    />
                    <Item
                      icon={<LineChart className="h-4 w-4" />}
                      label="Solutions"
                      onSelect={() => go("/solutions")}
                    />
                    <Item
                      icon={<BookOpen className="h-4 w-4" />}
                      label="Docs"
                      onSelect={() => go("/docs")}
                    />
                    <Item
                      icon={<Boxes className="h-4 w-4" />}
                      label="Pricing"
                      onSelect={() => go("/pricing")}
                    />
                    <Item
                      icon={<Info className="h-4 w-4" />}
                      label="About"
                      onSelect={() => go("/about")}
                    />
                  </Command.Group>

                  <Command.Group
                    heading="Quick links"
                    className="px-2 pb-2 pt-3 text-[11px] uppercase tracking-wide text-muted-foreground"
                  >
                    <Item
                      icon={<Workflow className="h-4 w-4" />}
                      label="Visual workflow builder"
                      onSelect={() => go("/features#workflow-builder")}
                    />
                    <Item
                      icon={<Code2 className="h-4 w-4" />}
                      label="API reference"
                      onSelect={() => go("/docs#api-reference")}
                    />
                  </Command.Group>

                  <Command.Group
                    heading="Account"
                    className="px-2 pb-2 pt-3 text-[11px] uppercase tracking-wide text-muted-foreground"
                  >
                    {user ? (
                      <>
                        <Item
                          icon={<LayoutDashboard className="h-4 w-4" />}
                          label="Open dashboard"
                          onSelect={() => go("/dashboard")}
                        />
                        <Item
                          icon={<LogOut className="h-4 w-4" />}
                          label="Sign out"
                          onSelect={async () => {
                            // The palette opens over the studio, so signing
                            // out from here can discard unsaved canvas work.
                            // Both navbar sign-out buttons ask first; this one
                            // didn't, and dropped it silently.
                            if (!confirmDiscard()) return;
                            setIsOpen(false);
                            await signOut();
                            router.push("/");
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <Item
                          icon={<UserPlus className="h-4 w-4" />}
                          label="Create an account"
                          onSelect={() => go("/signup")}
                        />
                        <Item
                          icon={<LogIn className="h-4 w-4" />}
                          label="Sign in"
                          onSelect={() => go("/signin")}
                        />
                      </>
                    )}
                  </Command.Group>

                  <Command.Group
                    heading="Settings"
                    className="px-2 pb-1 pt-3 text-[11px] uppercase tracking-wide text-muted-foreground"
                  >
                    <Item
                      icon={
                        theme === "dark" ? (
                          <Sun className="h-4 w-4" />
                        ) : (
                          <Moon className="h-4 w-4" />
                        )
                      }
                      label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                      onSelect={() => {
                        toggleTheme();
                      }}
                    />
                  </Command.Group>
                </Command.List>
                <div className="flex items-center justify-between border-t border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                  <span>Cilbs · v0.1</span>
                  <span className="flex items-center gap-2">
                    <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">
                      ↵
                    </kbd>
                    to select
                  </span>
                </div>
              </Command>
            </div>
          </div>
        ) : null}
    </CommandPaletteContext.Provider>
  );
}

function Item({
  icon,
  label,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors data-[selected=true]:bg-accent"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </Command.Item>
  );
}
