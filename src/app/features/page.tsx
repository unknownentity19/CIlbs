import type { Metadata } from "next";
import {
  ArrowRight,
  Bot,
  Brain,
  Layers,
  Plug,
  Workflow,
} from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MockAgent,
  MockApi,
  MockBuilder,
  MockIntegrations,
  MockReasoning,
  MockSteps,
} from "@/components/visuals/feature-mocks";

export const metadata: Metadata = {
  // The root layout applies the `%s — Cilbs` template, so this is just
  // the segment name — spelling out the suffix here rendered it twice.
  title: "Features",
  description:
    "Visual workflow builder, AI agent creation, multi-step automation, integrations, API, and an AI reasoning layer — every Cilbs feature in detail.",
};

type Feature = {
  id: string;
  icon: React.ReactNode;
  title: string;
  tagline: string;
  description: React.ReactNode;
  bullets: string[];
  useCase: { title: string; body: string };
  mock: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    id: "workflow-builder",
    icon: <Workflow className="h-4 w-4" />,
    title: "Visual Workflow Builder",
    tagline: "A canvas your whole team can make sense of.",
    description: (
      <>
        Map out your workflow on a shared canvas. Each step becomes a node you
        can configure, test, and re-run independently. Collaborators see the
        same diagram in real time, and every step is editable in place.
      </>
    ),
    bullets: [
      "Real-time multiplayer editing",
      "Versioned workflows with branching",
      "Inline run inspector for every node",
      "Node-level permissions and approvals",
    ],
    useCase: {
      title: "Replacing a Zap and a Python script",
      body: "A growth team replaces three Zaps and a Python script with one workflow that classifies inbound leads with an AI agent and writes them straight into HubSpot.",
    },
    mock: <MockBuilder />,
  },
  {
    id: "agents",
    icon: <Bot className="h-4 w-4" />,
    title: "AI Agent Creation",
    tagline: "Configure an agent, give it tools, and let it run.",
    description: (
      <>
        Define a role, give an agent a set of tools, and drop it onto the
        canvas. Cilbs handles memory, tool selection, and retries so you can
        focus on what the agent should actually do.
      </>
    ),
    bullets: [
      "Long-term memory per user, team, or session",
      "Custom tools defined in JS, Python, or HTTP",
      "Guardrails: budgets, rate limits, allowed tools",
      "Hot-swap models from OpenAI, Anthropic, or your own",
    ],
    useCase: {
      title: "Handling first-response support",
      body: "A SaaS support team replaces their first-response queue with an agent that classifies tickets, drafts replies, and escalates only when it isn't sure.",
    },
    mock: <MockAgent />,
  },
  {
    id: "multi-step",
    icon: <Layers className="h-4 w-4" />,
    title: "Multi-step Automation Engine",
    tagline: "Runs that don't fall over when something goes wrong.",
    description: (
      <>
        Underneath the canvas is a durable workflow engine. Steps run with
        exactly-once semantics, branches and loops are first-class, and every
        run is observable end-to-end with a replayable timeline.
      </>
    ),
    bullets: [
      "Durable retries with exponential backoff",
      "Parallel branches and dynamic loops",
      "Per-step timeouts and circuit breakers",
      "Pause, approve, and resume from anywhere",
    ],
    useCase: {
      title: "Running a multi-step onboarding flow",
      body: "An ops team kicks off a 14-step onboarding workflow on every new signup — provisioning, billing checks, and welcome emails — without writing a single cron job.",
    },
    mock: <MockSteps />,
  },
  {
    id: "integrations",
    icon: <Plug className="h-4 w-4" />,
    title: "API & Integrations System",
    tagline: "Native connectors for what you use, HTTP for everything else.",
    description: (
      <>
        Cilbs ships with native integrations for the tools your team already
        uses, and a first-class HTTP node for everything else. Every workflow
        is also automatically exposed as an authenticated API endpoint.
      </>
    ),
    bullets: [
      "200+ pre-built connectors",
      "Generic HTTP, GraphQL, and webhook nodes",
      "OAuth, API keys, and scoped service accounts",
      "Auto-generated REST + SDK for each workflow",
    ],
    useCase: {
      title: "Turning workflows into JSON APIs",
      body: "An internal platform team turns every workflow into a JSON API and embeds them as actions in Retool, Slack, and the company's docs.",
    },
    mock: <MockIntegrations />,
  },
  {
    id: "reasoning",
    icon: <Brain className="h-4 w-4" />,
    title: "AI Reasoning Layer",
    tagline: "Inspect what the agent actually did, step by step.",
    description: (
      <>
        Every agent run produces a full trace — what it planned, which tools it
        called, and why it made each decision. Compare two runs side-by-side
        and replay any trace against historical inputs.
      </>
    ),
    bullets: [
      "Structured plans + tool-call traces",
      "Side-by-side run diffs for prompt iteration",
      "Cost, latency, and token telemetry per node",
      "Safe replay against historical inputs",
    ],
    useCase: {
      title: "Debug AI like a real system",
      body: "An AI startup catches a regression in a fine-tuned classifier in 90 seconds by diffing two runs side-by-side instead of wading through logs.",
    },
    mock: <MockReasoning />,
  },
  {
    id: "api",
    icon: <Plug className="h-4 w-4" />,
    title: "Production-grade API",
    tagline: "Each workflow you deploy gets its own API endpoint.",
    description: (
      <>
        Deploy Cilbs workflows the same way you deploy the rest of your
        backend. Each workflow gets a typed REST endpoint, an SDK, and
        observability — rate limits and audit logs included.
      </>
    ),
    bullets: [
      "Typed REST + TypeScript SDK per workflow",
      "Rate limits, quotas, and per-key permissions",
      "Audit logs and SOC2-ready trails",
      "Bring-your-own-cloud option",
    ],
    useCase: {
      title: "Replacing a fragile Lambda setup",
      body: "A platform team replaces a fragile Lambda + Step Functions setup with a single Cilbs workflow exposed at api.company.com/v1/score.",
    },
    mock: <MockApi />,
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <Section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade" />
        <Container>
          <div className="max-w-3xl">
            <Reveal>
              <Badge variant="outline">Features</Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-4 text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
                The building blocks
                <br />
                <span className="text-gradient">you actually need.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Canvas, agents, workflow engine, integrations, and
                observability — built together so they actually work together.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/signup">
                  Start building <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/product" variant="outline">
                  How it works
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.3} className="mt-16">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              {FEATURES.map((f) => (
                <a
                  key={f.id}
                  href={`#${f.id}`}
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:border-border-strong"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent border border-border text-foreground">
                    {f.icon}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {f.title}
                  </span>
                </a>
              ))}
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Features */}
      <Section className="py-12">
        <Container>
          <div className="flex flex-col gap-28">
            {FEATURES.map((f, i) => (
              <FeatureBlock key={f.id} feature={f} reverse={i % 2 === 1} />
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="py-20">
        <Container>
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-card p-12 text-center">
            <SectionHeader
              title="Ready to get started?"
              description="Everything you need to build and run intelligent workflows is here. Sign up free and start building."
            />
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/signup">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/docs" variant="outline">
                Read the docs
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function FeatureBlock({
  feature,
  reverse,
}: {
  feature: Feature;
  reverse: boolean;
}) {
  return (
    <article
      id={feature.id}
      className="grid scroll-mt-24 grid-cols-1 items-center gap-10 md:grid-cols-12"
    >
      <div className={`md:col-span-6 ${reverse ? "md:order-2" : ""}`}>
        <Reveal>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent border border-border text-foreground">
            {feature.icon}
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <h3 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            {feature.title}
          </h3>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-3 text-lg text-foreground/80">{feature.tagline}</p>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {feature.bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground/60" />
                <span className="text-muted-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="mt-7 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Use case
            </p>
            <p className="mt-1.5 text-sm font-medium text-foreground">
              {feature.useCase.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {feature.useCase.body}
            </p>
          </div>
        </Reveal>
      </div>
      <div className={`md:col-span-6 ${reverse ? "md:order-1" : ""}`}>
        <Reveal delay={0.1}>{feature.mock}</Reveal>
      </div>
    </article>
  );
}
