import type { Metadata } from "next";
import { ArrowRight, Bot, Boxes, Check, Minus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { ArchitectureDiagram } from "@/components/visuals/architecture-diagram";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  // The root layout applies the `%s — Cilbs` template, so this is just
  // the segment name — spelling out the suffix here rendered it twice.
  title: "Product",
  description:
    "Cilbs is the visual AI workflow builder. Learn how it works, why it exists, and how it compares to other automation tools.",
};

const PRINCIPLES = [
  {
    icon: <Workflow className="h-4 w-4" />,
    title: "Visual first",
    desc: "A canvas that any builder can read at a glance. Workflows are wires, not config files.",
  },
  {
    icon: <Bot className="h-4 w-4" />,
    title: "Agents as primitives",
    desc: "Drop AI agents into your workflows like any other step. They reason, plan, and call tools.",
  },
  {
    icon: <Boxes className="h-4 w-4" />,
    title: "Built for production",
    desc: "Versioning, observability, retries, and rollouts are part of the runtime — not afterthoughts you bolt on later.",
  },
];

const COMPARISON: {
  label: string;
  cilbs: boolean | "partial";
  nocode: boolean | "partial";
  automation: boolean | "partial";
  agents: boolean | "partial";
}[] = [
  {
    label: "Visual workflow canvas",
    cilbs: true,
    nocode: true,
    automation: true,
    agents: false,
  },
  {
    label: "Native AI agents",
    cilbs: true,
    nocode: false,
    automation: false,
    agents: true,
  },
  {
    label: "Multi-step branching & loops",
    cilbs: true,
    nocode: "partial",
    automation: "partial",
    agents: false,
  },
  {
    label: "API + SDK access",
    cilbs: true,
    nocode: false,
    automation: "partial",
    agents: "partial",
  },
  {
    label: "Self-hostable",
    cilbs: true,
    nocode: false,
    automation: false,
    agents: false,
  },
  {
    label: "Reasoning observability",
    cilbs: true,
    nocode: false,
    automation: false,
    agents: "partial",
  },
];

function Cell({ value }: { value: boolean | "partial" }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-foreground" />;
  }
  if (value === "partial") {
    return (
      <span className="mx-auto inline-block h-1 w-3 rounded-full bg-muted-foreground/40" />
    );
  }
  return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
}

export default function ProductPage() {
  return (
    <>
      {/* Hero */}
      <Section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade" />
        <Container>
          <div className="max-w-3xl">
            <Reveal>
              <Badge variant="outline">The Product</Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-4 text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
                One canvas for every
                <br />
                <span className="text-gradient">intelligent workflow.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Build your workflow on a canvas, test it in the same
                environment, and deploy when it&apos;s ready. Triggers, agents,
                integrations, and logic all live in one place.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/signup">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/docs" variant="outline">
                  Read the docs
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* What Cilbs is */}
      <Section className="py-20">
        <Container>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <Reveal>
                <Badge variant="outline">What Cilbs is</Badge>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
                  A workflow builder where every step can think.
                </h2>
              </Reveal>
            </div>
            <div className="md:col-span-7 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
              <Reveal delay={0.1}>
                <p>
                  Most automation tools were built for a deterministic world:
                  if-this-then-that. Cilbs is different. Every node on the
                  canvas can call an AI model, run an agent, or branch on
                  reasoning — without leaving the workflow.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <p>
                  You can wire a webhook into an agent that classifies a
                  message, then route it through deterministic steps that
                  update a database, post to Slack, and stream a response back.
                  Each step is observable, retryable, and versioned.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <p>
                  The result is a single tool that replaces the patchwork of
                  Zapier-like automations, custom backends, and prompt scripts
                  most teams duct-tape together today.
                </p>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* Principles */}
      <Section className="py-16">
        <Container>
          <SectionHeader
            eyebrow="Principles"
            title="What we actually care about."
          />
          <StaggerGroup className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <StaggerItem key={p.title}>
                <Card className="h-full">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent border border-border text-foreground">
                    {p.icon}
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {p.desc}
                  </p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* Architecture */}
      <Section className="py-20">
        <Container>
          <SectionHeader
            eyebrow="Architecture"
            title="How it works under the hood."
            description="Cilbs runs as four layers: triggers kick things off, the reasoning layer handles agent calls, the workflow engine manages execution, and integrations handle the actual work."
          />
          <Reveal delay={0.1} className="mt-12">
            <ArchitectureDiagram />
          </Reveal>
        </Container>
      </Section>

      {/* Why Cilbs exists */}
      <Section className="py-20">
        <Container>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <Reveal>
                <Badge variant="outline">Why we exist</Badge>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
                  Building with AI shouldn&apos;t feel like wiring up scripts at
                  midnight.
                </h2>
              </Reveal>
            </div>
            <div className="md:col-span-7 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
              <Reveal delay={0.1}>
                <p>
                  Every team we&apos;ve worked with hits the same wall: the
                  prototype is exciting, but production is brutal. Prompts
                  drift, integrations break, edge cases multiply, and nobody
                  agrees on where the &ldquo;source of truth&rdquo; lives.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <p>
                  Cilbs exists because automation tools weren&apos;t built for
                  agents, and agent frameworks weren&apos;t built for
                  production. We give teams a single canvas where the prototype
                  and the production system are the same artifact.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <p>
                  Anyone on the team can read the canvas. Ops can tweak steps
                  without filing a ticket. Engineers can drop in custom code
                  nodes where needed. And every run is logged, replayable, and
                  versioned.
                </p>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* Comparison */}
      <Section className="py-20">
        <Container>
          <SectionHeader
            eyebrow="Comparison"
            title="How Cilbs compares."
            description="No-code tools don't handle agents well. Agent frameworks don't handle production well. Cilbs was built to handle both."
          />
          <Reveal delay={0.1} className="mt-12">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {/* Focusable + labelled: the table is wider than a phone, and a
                  scrollable region with nothing focusable inside cannot be
                  scrolled from the keyboard. */}
              <div
                tabIndex={0}
                role="region"
                aria-label="Comparison table"
                className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
              >
                <table className="w-full text-left">
                  <thead className="bg-muted/40">
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-4 font-medium">Capability</th>
                      <th className="px-5 py-4 font-medium text-center">
                        Cilbs
                      </th>
                      <th className="px-5 py-4 font-medium text-center">
                        No-code
                      </th>
                      <th className="px-5 py-4 font-medium text-center">
                        Zapier-style
                      </th>
                      <th className="px-5 py-4 font-medium text-center">
                        Agent platforms
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, i) => (
                      <tr
                        key={row.label}
                        className={i !== 0 ? "border-t border-border" : ""}
                      >
                        <td className="px-5 py-4 text-sm">{row.label}</td>
                        <td className="px-5 py-4 text-center">
                          <Cell value={row.cilbs} />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Cell value={row.nocode} />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Cell value={row.automation} />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Cell value={row.agents} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="py-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 sm:p-14">
            <div
              className="absolute -top-20 -right-20 h-72 w-72 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgb(var(--gradient-via)) 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <div className="relative flex flex-col items-start gap-5 max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Want to try it?
              </h2>
              <p className="text-muted-foreground">
                Create a free workspace, build your first workflow, and run it.
                Takes about five minutes.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button href="/signup">
                  Start free <ArrowRight className="h-4 w-4" />
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
