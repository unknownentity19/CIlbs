"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Database,
  GitBranch,
  Loader2,
  Plus,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { prefetchFor } from "@/lib/gated-routes";

const SAMPLE_WORKFLOWS = [
  {
    name: "lead-router",
    runs24h: 184,
    p95: "210ms",
    status: "healthy" as const,
    last: "2m ago",
    icon: <Webhook className="h-3.5 w-3.5" />,
  },
  {
    name: "support-triage",
    runs24h: 1240,
    p95: "1.4s",
    status: "healthy" as const,
    last: "just now",
    icon: <Bot className="h-3.5 w-3.5" />,
  },
  {
    name: "invoice-extract",
    runs24h: 56,
    p95: "920ms",
    status: "degraded" as const,
    last: "11m ago",
    icon: <Database className="h-3.5 w-3.5" />,
  },
];

const QUICK_LINKS = [
  {
    title: "Create a workflow",
    desc: "Start from a blank canvas or a template.",
    href: "/studio",
    icon: <Plus className="h-4 w-4" />,
  },
  {
    title: "Build an AI agent",
    desc: "Define a role, tools, and memory.",
    href: "/features#agents",
    icon: <Bot className="h-4 w-4" />,
  },
  {
    title: "Read the docs",
    desc: "Quickstart, API reference, webhooks.",
    href: "/docs",
    icon: <ArrowUpRight className="h-4 w-4" />,
  },
];

export function DashboardView() {
  const { user, ready, signOut } = useAuth();
  const router = useRouter();

  // No client-side redirect here. The server component and the proxy gate this
  // route, and a guard that fires the moment the session clears also fires
  // during an intentional sign-out — racing the "go home" navigation and
  // winning, so signing out landed on the sign-in page instead.

  if (!ready || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading workspace…
      </div>
    );
  }

  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <Section className="py-12">
      <Container>
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="outline">Dashboard</Badge>
            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-2 text-muted-foreground">
              You&apos;re signed in to the{" "}
              <span className="font-mono text-foreground">{user.workspace}</span>{" "}
              workspace.
            </p>
          </div>
          <div className="flex gap-2">
            <Button href="/studio" variant="outline" size="md">
              <Plus className="h-4 w-4" /> New workflow
            </Button>
            <Button
              size="md"
              variant="ghost"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              Sign out
            </Button>
          </div>
        </header>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Workflows", value: "3", sub: "2 active" },
            { label: "Runs (24h)", value: "1,480", sub: "+18% vs yesterday" },
            { label: "Avg latency", value: "612ms", sub: "p95: 1.4s" },
            { label: "Spend (mo)", value: "$0.00", sub: "Free tier" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Workflows + activity */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h2 className="text-sm font-semibold">Your workflows</h2>
                <Link
                  href="/features"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {SAMPLE_WORKFLOWS.map((w) => (
                  <li
                    key={w.name}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent border border-border text-foreground">
                        {w.icon}
                      </span>
                      <div>
                        <p className="text-sm font-medium font-mono text-foreground">
                          {w.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {w.runs24h.toLocaleString()} runs · p95 {w.p95} ·
                          last run {w.last}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${
                        w.status === "healthy"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          w.status === "healthy"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {w.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-sm font-semibold">Quick start</h2>
              </div>
              <ul className="flex flex-col">
                {QUICK_LINKS.map((q) => (
                  <li key={q.title}>
                    <Link
                      href={q.href}
                      prefetch={prefetchFor(q.href)}
                      className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-accent"
                    >
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent border border-border text-foreground">
                        {q.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {q.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {q.desc}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4" />
                Live activity
              </div>
              <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
                {[
                  ["lead-router", "succeeded", "2m"],
                  ["support-triage", "succeeded", "3m"],
                  ["invoice-extract", "retried", "11m"],
                  ["lead-router", "succeeded", "14m"],
                ].map(([name, status, ts], i) => (
                  <li
                    key={`${name}-${i}`}
                    className="flex items-center justify-between"
                  >
                    <span className="inline-flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      <span className="font-mono text-foreground">{name}</span>
                      <span>· {status}</span>
                    </span>
                    <span>{ts} ago</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
