import type { Metadata } from "next";
import {
  ArrowRight,
  Boxes,
  Code2,
  Rocket,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  // The root layout applies the `%s — Cilbs` template, so this is just
  // the segment name — spelling out the suffix here rendered it twice.
  title: "Solutions",
  description:
    "How SaaS startups, e-commerce, ops teams, developer tooling, and AI startups use Cilbs to ship intelligent workflows.",
};

type Solution = {
  id: string;
  industry: string;
  icon: React.ReactNode;
  problem: string;
  approach: string;
  workflow: { title: string; steps: string[] };
  metrics: { label: string; value: string }[];
};

const SOLUTIONS: Solution[] = [
  {
    id: "saas",
    industry: "SaaS startups",
    icon: <Rocket className="h-4 w-4" />,
    problem:
      "Early-stage teams spend weeks gluing together prompts, cron jobs, and Zaps to ship one AI feature — and none of it is easy to debug or hand off.",
    approach:
      "With Cilbs, you prototype the feature on the canvas, expose it as an API, and embed it in the product. You iterate on the same thing that runs in production — no separate staging script.",
    workflow: {
      title: "AI-powered onboarding assistant",
      steps: [
        "Trigger: user signs up via webhook",
        "Agent: classify ICP and recommended setup",
        "Branch: high-intent → schedule call, else → drip email",
        "Update: write enrichment back into Postgres + HubSpot",
      ],
    },
    metrics: [
      { label: "Time to ship", value: "−87%" },
      { label: "Engineers required", value: "1" },
    ],
  },
  {
    id: "ecommerce",
    industry: "E-commerce automation",
    icon: <ShoppingBag className="h-4 w-4" />,
    problem:
      "Merchandising, support, and fulfillment teams operate across a dozen tools — and every \"AI feature\" lives in a separate app with its own dashboard, billing, and on-call page.",
    approach:
      "Cilbs unifies product, support, and ops automations into one canvas. Trigger workflows from Shopify, fan out to inventory, generate listings with an agent, and notify merchants — all in one place.",
    workflow: {
      title: "Auto-generated product listings",
      steps: [
        "Trigger: new SKU added in Shopify",
        "Agent: write title, description, alt-text from images",
        "Translate: localize copy into 6 markets",
        "Publish: push to Shopify + Meta catalog + email merch team",
      ],
    },
    metrics: [
      { label: "Time per listing", value: "12s" },
      { label: "Markets covered", value: "6" },
    ],
  },
  {
    id: "ops",
    industry: "Internal ops teams",
    icon: <Users className="h-4 w-4" />,
    problem:
      "Ops teams own the long tail of business logic — invoicing edge cases, onboarding exceptions, vendor approvals — and figuring out how something works means finding the right person.",
    approach:
      "Cilbs gives ops a visual canvas they own end-to-end. Agents handle the judgment calls — classification, drafting — deterministic steps handle the writes and approvals, and every run is logged.",
    workflow: {
      title: "Vendor invoice triage",
      steps: [
        "Trigger: invoice email arrives",
        "Agent: extract line items and PO match candidates",
        "Branch: matched → auto-approve, else → human-in-loop",
        "Action: write to NetSuite + post status to Slack",
      ],
    },
    metrics: [
      { label: "Manual review rate", value: "−72%" },
      { label: "Audit trail", value: "100%" },
    ],
  },
  {
    id: "devtools",
    industry: "Developer tooling",
    icon: <Code2 className="h-4 w-4" />,
    problem:
      "Dev tools teams want to ship AI features — PR review, code search, error triage — but maintaining the prompt + retrieval + evaluation stack pulls engineers off the core product.",
    approach:
      "Cilbs acts as the AI backend for dev tools. Put retrieval, agents, and evaluations on a canvas, expose them as endpoints, and call them from the IDE, CLI, or dashboard.",
    workflow: {
      title: "Pull request reviewer",
      steps: [
        "Trigger: GitHub PR opened webhook",
        "Fetch: diff, related files, prior reviews",
        "Agent: review for correctness, perf, and style",
        "Comment: post inline suggestions + summary",
      ],
    },
    metrics: [
      { label: "Coverage", value: "Every PR" },
      { label: "Avg review time", value: "9s" },
    ],
  },
  {
    id: "ai-startups",
    industry: "AI startups",
    icon: <Sparkles className="h-4 w-4" />,
    problem:
      "AI-native startups outgrow notebooks fast — but going from a working agent in Jupyter to a production endpoint usually means rewriting everything in TypeScript.",
    approach:
      "Cilbs lets you run that notebook agent in production without rewriting it. Prototype on the canvas, ship to the same endpoint, and use the trace viewer to debug it when something behaves unexpectedly.",
    workflow: {
      title: "Multi-agent research assistant",
      steps: [
        "Trigger: user asks a question via API",
        "Planner agent: decompose into subtasks",
        "Parallel: research, summarize, fact-check agents",
        "Synthesize: combine + stream answer to client",
      ],
    },
    metrics: [
      { label: "Notebook → prod", value: "Same day" },
      { label: "Replays per debug", value: "∞" },
    ],
  },
];

export default function SolutionsPage() {
  return (
    <>
      {/* Hero */}
      <Section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade" />
        <Container>
          <div className="max-w-3xl">
            <Reveal>
              <Badge variant="outline">Solutions</Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-4 text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
                Real workflows
                <br />
                <span className="text-gradient">for real teams.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                SaaS teams, ops teams, and AI engineers use Cilbs to replace
                brittle scripts and patchwork tools with workflows they can
                actually read and maintain.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.25} className="mt-12">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {SOLUTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:border-border-strong"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent border border-border text-foreground">
                    {s.icon}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {s.industry}
                  </span>
                </a>
              ))}
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Solutions */}
      <Section className="py-12">
        <Container>
          <div className="flex flex-col gap-24">
            {SOLUTIONS.map((s, i) => (
              <SolutionBlock key={s.id} solution={s} reverse={i % 2 === 1} />
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="py-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 sm:p-14">
            <div
              className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgb(var(--gradient-from)) 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <div className="relative flex flex-col-reverse items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <SectionHeader
                  align="left"
                  title="Don&apos;t see your industry?"
                  description="Cilbs works for any workflow that involves APIs, agents, or human decisions. If your use case isn&apos;t listed, it probably still fits."
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/signup">
                  Talk to us <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/features" variant="outline">
                  Explore features
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function SolutionBlock({
  solution,
  reverse,
}: {
  solution: Solution;
  reverse: boolean;
}) {
  return (
    <article
      id={solution.id}
      className="grid scroll-mt-24 grid-cols-1 gap-10 md:grid-cols-12"
    >
      <div className={`md:col-span-7 ${reverse ? "md:order-2" : ""}`}>
        <Reveal>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent border border-border text-foreground">
              {solution.icon}
            </span>
            <Badge variant="outline">{solution.industry}</Badge>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <h3 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">
            <span className="text-muted-foreground">The problem:</span>{" "}
            <span className="text-foreground">
              {solution.problem.split(" — ")[0]}.
            </span>
          </h3>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            {solution.problem}
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <h4 className="mt-8 text-sm font-semibold text-foreground">
            How Cilbs solves it
          </h4>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            {solution.approach}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
            {solution.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-border bg-background p-4"
              >
                <p className="text-2xl font-semibold tracking-tight">
                  {m.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <div className={`md:col-span-5 ${reverse ? "md:order-1" : ""}`}>
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                <Boxes className="h-3.5 w-3.5" />
                Example workflow
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {solution.workflow.steps.length} steps
              </span>
            </div>
            <div className="p-5">
              <p className="text-sm font-medium text-foreground">
                {solution.workflow.title}
              </p>
              <ol className="mt-4 space-y-2">
                {solution.workflow.steps.map((step, idx) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] leading-relaxed"
                  >
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent text-foreground text-[10px] font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </div>
    </article>
  );
}
