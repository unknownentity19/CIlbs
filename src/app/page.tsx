import {
  ArrowRight,
  Bot,
  Boxes,
  CheckCircle2,
  Code2,
  Database,
  GitBranch,
  Globe,
  LayoutGrid,
  Lock,
  MessageSquare,
  Quote,
  Shield,
  Sparkles,
  Star,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { WorkflowPreview } from "@/components/visuals/workflow-preview";
import { FloatingNodes } from "@/components/visuals/floating-nodes";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IntegrationIcon } from "@/components/visuals/integration-icons";
import { SyntaxHighlight } from "@/components/docs/syntax-highlight";
import {
  jsonLd,
  organizationSchema,
  softwareSchema,
  websiteSchema,
} from "@/lib/structured-data";

/**
 * Rotating accent tones used by lists across the homepage so each card
 * carries a distinct color identity. Keeping the palette in one spot lets
 * the look stay coherent across sections (value props, how-it-works,
 * features, security) without picking colours by hand at every call site.
 */
/**
 * Per-step accent tones. The light-mode `icon` colours are 700-weight rather
 * than 600: these render as *text* (the step number) on a tinted 10%-opacity
 * plate, where 600 measured about 3:1 — under the AA floor. Dark mode keeps
 * the 400s, which sit on a dark plate and pass comfortably.
 */
const TONES = [
  {
    icon: "text-emerald-700",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    halo: "shadow-[0_0_28px_-14px_rgb(16_185_129/0.55)]",
    accent: "from-emerald-500/12 via-transparent to-transparent",
  },
  {
    icon: "text-violet-700",
    bg: "bg-violet-500/10 border-violet-500/30",
    halo: "shadow-[0_0_28px_-14px_rgb(139_92_246/0.55)]",
    accent: "from-violet-500/12 via-transparent to-transparent",
  },
  {
    icon: "text-amber-700",
    bg: "bg-amber-500/10 border-amber-500/30",
    halo: "shadow-[0_0_28px_-14px_rgb(245_158_11/0.55)]",
    accent: "from-amber-500/12 via-transparent to-transparent",
  },
  {
    icon: "text-sky-700",
    bg: "bg-sky-500/10 border-sky-500/30",
    halo: "shadow-[0_0_28px_-14px_rgb(14_165_233/0.55)]",
    accent: "from-sky-500/12 via-transparent to-transparent",
  },
  {
    icon: "text-rose-700",
    bg: "bg-rose-500/10 border-rose-500/30",
    halo: "shadow-[0_0_28px_-14px_rgb(244_63_94/0.55)]",
    accent: "from-rose-500/12 via-transparent to-transparent",
  },
  {
    icon: "text-indigo-700",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    halo: "shadow-[0_0_28px_-14px_rgb(99_102_241/0.55)]",
    accent: "from-indigo-500/12 via-transparent to-transparent",
  },
] as const;

const tone = (i: number) => TONES[i % TONES.length]!;

const TRUSTED = [
  "Y Combinator",
  "Sequoia",
  "Andreessen Horowitz",
  "Accel",
  "Index Ventures",
  "South Park Commons",
];

const VALUE_PROPS = [
  {
    icon: <Workflow className="h-4 w-4" />,
    title: "Visual canvas",
    desc: "Compose triggers, agents, integrations, and logic on a single surface anyone on your team can read.",
  },
  {
    icon: <Bot className="h-4 w-4" />,
    title: "AI agents as steps",
    desc: "Add an AI agent to any step. Memory, tool-calling, and guardrails are configured in one place — no custom wrapper code.",
  },
  {
    icon: <Zap className="h-4 w-4" />,
    title: "Production runtime",
    desc: "Every workflow gets retries, version history, audit logs, and an API endpoint. No extra setup required.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Design on the canvas",
    desc: "Drag nodes out of the palette and wire them together. Iterate live with your team.",
    icon: <Workflow className="h-4 w-4" />,
  },
  {
    n: "02",
    title: "Plug in intelligence",
    desc: "Configure agents with tools and memory, or call any model from a node. Use our defaults or bring your own API keys.",
    icon: <Bot className="h-4 w-4" />,
  },
  {
    n: "03",
    title: "Ship to production",
    desc: "Every workflow deploys as a versioned API endpoint. Observability, retries, and audit logs are included.",
    icon: <Boxes className="h-4 w-4" />,
  },
];

const FEATURE_CARDS = [
  {
    icon: <Workflow className="h-4 w-4" />,
    title: "Visual workflow builder",
    desc: "A canvas with nodes for triggers, branches, and integrations. Multiplayer by default.",
    href: "/features#workflow-builder",
  },
  {
    icon: <Bot className="h-4 w-4" />,
    title: "AI agent runtime",
    desc: "Agents with tools, memory, and structured reasoning traces. Hot-swap models per workflow.",
    href: "/features#agents",
  },
  {
    icon: <GitBranch className="h-4 w-4" />,
    title: "Durable execution",
    desc: "Retries, parallel branches, and pause-and-resume. Each run executes exactly once, even through failures.",
    href: "/features#multi-step",
  },
  {
    icon: <Globe className="h-4 w-4" />,
    title: "200+ integrations",
    desc: "Native connectors for Slack, Postgres, GitHub, Stripe, and a generic HTTP node for everything else.",
    href: "/features#integrations",
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    title: "Reasoning observability",
    desc: "Replay any agent run, compare two runs side-by-side, and trace exactly where things went wrong.",
    href: "/features#reasoning",
  },
  {
    icon: <Code2 className="h-4 w-4" />,
    title: "Typed API & SDK",
    desc: "Every workflow ships as a typed REST endpoint and a TypeScript SDK with auto-generated types.",
    href: "/features#api",
  },
];

const INTEGRATIONS = [
  "OpenAI",
  "Anthropic",
  "Slack",
  "Postgres",
  "Notion",
  "GitHub",
  "Linear",
  "Stripe",
  "HubSpot",
  "Sendgrid",
  "AWS",
  "HTTP",
];

const STATS = [
  { value: "12k+", label: "Active builders" },
  { value: "3M+", label: "Runs per day" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "184ms", label: "Avg. p95 latency" },
];

const TESTIMONIALS = [
  {
    quote:
      "We replaced three internal tools, two cron jobs, and a Zapier account with a single Cilbs workflow. Our ops team owns it now.",
    name: "Amelia Chen",
    role: "Head of RevOps · Lattice",
    initials: "AC",
  },
  {
    quote:
      "Cilbs is the first agent platform that feels like real software. Versioning, replay, observability — it all just works.",
    name: "Jonas Becker",
    role: "Founding engineer · Modal",
    initials: "JB",
  },
  {
    quote:
      "We went from a notebook prototype to a production API in the same week. I kept waiting for something to break, but it held up.",
    name: "Priya Raman",
    role: "Engineering lead · Linear",
    initials: "PR",
  },
];

const SECURITY = [
  {
    icon: <Shield className="h-4 w-4" />,
    title: "SOC 2 Type II",
    desc: "Audited annually with full controls coverage.",
  },
  {
    icon: <Lock className="h-4 w-4" />,
    title: "Encrypted in transit and at rest",
    desc: "TLS in transit, AES-256 at rest, scoped credentials.",
  },
  {
    icon: <Database className="h-4 w-4" />,
    title: "BYO cloud",
    desc: "Run Cilbs in your AWS, GCP, or Azure VPC.",
  },
  {
    icon: <MessageSquare className="h-4 w-4" />,
    title: "GDPR & DPA ready",
    desc: "Custom DPAs and EU data residency available.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Structured data: tells search engines and assistants that this is a
          software product from an organisation, rather than leaving them to
          infer it from the copy. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            organizationSchema(),
            websiteSchema(),
            softwareSchema(),
          ]),
        }}
      />

      {/* HERO */}
      <Section className="relative overflow-hidden pt-16 pb-24 sm:pt-20">
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade animate-grid" />
        <div
          className="orb -z-10"
          style={{
            background: "rgb(var(--gradient-from))",
            width: 360,
            height: 360,
            left: "10%",
            top: "10%",
          }}
        />
        <div
          className="orb -z-10"
          style={{
            background: "rgb(var(--gradient-to))",
            width: 320,
            height: 320,
            right: "10%",
            top: "5%",
          }}
        />

        <FloatingNodes />

        <Container className="relative">
          <div className="flex flex-col items-center text-center gap-6">
            <Reveal delay={0.1}>
              <h1 className="max-w-4xl text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
                Build AI workflows
                <br />
                <span className="text-gradient">visually.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                Stop stitching together scripts to run AI features. Cilbs
                gives you a canvas to build workflows visually, wire up your
                tools, and ship to production.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button href="/studio" size="lg">
                  <LayoutGrid className="h-4 w-4" />
                  Studio
                </Button>
                <Button href="/signup" size="lg" variant="outline">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <p className="text-xs text-muted-foreground pt-2">
                Free forever for personal use · No credit card required
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.45} className="mt-16 sm:mt-20">
            <div className="relative z-10 mx-auto max-w-5xl">
              <div
                className="absolute -inset-4 -z-10 rounded-3xl opacity-40"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(var(--gradient-from) / 0.18), rgb(var(--gradient-to) / 0.18))",
                  filter: "blur(40px)",
                }}
                aria-hidden
              />
              <WorkflowPreview />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* TRUSTED BY */}
      <Section className="py-10">
        <Container>
          <Reveal>
            <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
              Backed by
            </p>
          </Reveal>
          {/* No wrapper opacity: stacking it on the muted token measured 2.7:1,
              well under the 4.5:1 needed for text this size. */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {TRUSTED.map((name) => (
              <span
                key={name}
                className="text-base font-semibold tracking-tight text-muted-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </Container>
      </Section>

      {/* VALUE PROPS */}
      <Section className="py-20">
        <Container>
          <SectionHeader
            eyebrow="Why Cilbs"
            title="From prototype to production without the mess."
            description="Most teams end up with a Zapier workflow, a Python script, and three dashboards to build one intelligent feature. Cilbs brings it into one canvas that works the same in development and production."
          />
          <StaggerGroup className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
            {VALUE_PROPS.map((v, i) => {
              const t = tone(i);
              return (
                <StaggerItem key={v.title}>
                  <Card className={`h-full ${t.halo}`}>
                    <div
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${t.bg} ${t.icon}`}
                    >
                      {v.icon}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {v.desc}
                    </p>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </Container>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="py-20">
        <Container>
          <SectionHeader
            eyebrow="How it works"
            title="Three steps from idea to deployment."
            description="You can go from a blank canvas to a deployed, working workflow in a few hours."
          />
          <div className="relative mt-14">
            <div
              className="absolute left-0 right-0 top-9 hidden h-px bg-border md:block"
              aria-hidden
            />
            <StaggerGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((step, i) => {
                const t = tone(i);
                return (
                  <StaggerItem key={step.n}>
                    <div
                      className={`relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-6 ${t.halo}`}
                    >
                      <div
                        aria-hidden
                        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${t.accent}`}
                      />
                      <div className="relative flex items-center justify-between">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${t.bg} ${t.icon}`}
                        >
                          {step.icon}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {step.n}
                        </span>
                      </div>
                      <h3 className="relative text-base font-semibold">
                        {step.title}
                      </h3>
                      <p className="relative text-sm leading-relaxed text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </div>
        </Container>
      </Section>

      {/* FEATURE GRID */}
      <Section className="py-20">
        <Container>
          <SectionHeader
            eyebrow="Platform"
            title="Everything in one place."
            description="Each piece is fully built out, not just checked off. Click any to see how it works."
          />
          <StaggerGroup className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CARDS.map((f, i) => {
              const t = tone(i);
              return (
                <StaggerItem key={f.title}>
                  <a href={f.href} className="block h-full">
                    <Card className={`h-full ${t.halo}`}>
                      <div className="flex items-start justify-between">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${t.bg} ${t.icon}`}
                        >
                          {f.icon}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                      <h3 className="mt-5 text-base font-semibold">
                        {f.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {f.desc}
                      </p>
                    </Card>
                  </a>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </Container>
      </Section>

      {/* INTEGRATIONS */}
      <Section className="py-20">
        <Container>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <Reveal>
                <Badge variant="outline">Integrations</Badge>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
                  Connects to what your team already uses.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Native connectors for the tools your team already uses. For
                  anything else, there&apos;s a generic HTTP node. OAuth, API
                  keys, and service accounts are all supported out of the box.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    "OAuth + API key auth",
                    "Generic HTTP / GraphQL",
                    "Scoped service accounts",
                    "Custom JS / Python steps",
                  ].map((l) => (
                    <li
                      key={l}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-foreground" />
                      <span className="text-muted-foreground">{l}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-8 flex gap-3">
                  <Button href="/features#integrations" variant="outline">
                    Browse integrations
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Reveal>
            </div>
            <div className="md:col-span-7">
              <Reveal delay={0.1}>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {INTEGRATIONS.map((name, i) => {
                    const t = tone(i);
                    return (
                      <div
                        key={name}
                        className={`group flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-border-strong ${t.halo}`}
                      >
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${t.bg} transition-colors`}
                        >
                          <IntegrationIcon name={name} className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* STATS */}
      <Section className="py-20">
        <Container>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-start gap-1 bg-card p-6 sm:p-8"
              >
                <span className="text-gradient text-3xl font-semibold tracking-tight sm:text-4xl">
                  {s.value}
                </span>
                <span className="text-sm text-muted-foreground">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* TESTIMONIALS */}
      <Section className="py-20">
        <Container>
          <SectionHeader
            eyebrow="What users say"
            title="From teams actually using it."
            description="A mix of startups, scale-ups, and larger engineering teams."
          />
          <StaggerGroup className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => {
              const t = tone(i);
              return (
                <StaggerItem key={testimonial.name}>
                  <Card className={`h-full flex flex-col gap-5 ${t.halo}`}>
                    <Quote className={`h-5 w-5 ${t.icon} opacity-70`} />
                    <p className="text-[15px] leading-relaxed text-foreground/90">
                      {testimonial.quote}
                    </p>
                    <div className="mt-auto flex items-center gap-3 pt-2">
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${t.bg} ${t.icon}`}
                      >
                        {testimonial.initials}
                      </span>
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          {testimonial.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:justify-center">
              <span className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-foreground text-foreground"
                  />
                ))}
              </span>
              <span>4.9 / 5 across 320+ reviews on G2 and Product Hunt</span>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* SECURITY */}
      <Section className="py-20">
        <Container>
          <SectionHeader
            eyebrow="Security & compliance"
            title="Security and compliance baked in."
            description="If your team works in healthcare, finance, or just takes security seriously, Cilbs covers the requirements without extra configuration."
          />
          <StaggerGroup className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {SECURITY.map((s, i) => {
              const t = tone(i);
              return (
                <StaggerItem key={s.title}>
                  <Card className={`h-full ${t.halo}`} hover={false}>
                    <div
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${t.bg} ${t.icon}`}
                    >
                      {s.icon}
                    </div>
                    <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {s.desc}
                    </p>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </Container>
      </Section>

      {/* DEVELOPER FRIENDLY */}
      <Section className="py-20">
        <Container>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 items-center">
            <div className="md:col-span-6">
              <Reveal>
                <Badge variant="outline">For developers</Badge>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
                  Visual canvas. Real code underneath.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Every workflow is a versioned artifact. Define it visually,
                  in YAML, or both — they always stay in sync. Each deploy
                  produces a typed REST endpoint and a TypeScript SDK.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <ul className="mt-6 flex flex-col gap-3">
                  {[
                    "Typed REST + TypeScript SDK per workflow",
                    "Custom JS or Python in any node",
                    "CLI for local dev, deploys, and rollbacks",
                    "Bring-your-own model providers",
                  ].map((l) => (
                    <li
                      key={l}
                      className="flex items-start gap-3 text-sm text-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-foreground" />
                      <span className="text-muted-foreground">{l}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-8 flex gap-3">
                  <Button href="/docs">
                    Read the docs
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Reveal>
            </div>
            <div className="md:col-span-6">
              <Reveal delay={0.1}>
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                    <span className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                      <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                      <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      lead-router.ts
                    </span>
                  </div>
                  <pre
                    tabIndex={0}
                    className="overflow-x-auto px-5 py-5 text-[12.5px] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                  >
<SyntaxHighlight
  language="ts"
  code={`import { cilbs } from "@cilbs/sdk";

const client = cilbs({ apiKey: process.env.CILBS_API_KEY! });

const result = await client.workflows
  .leadRouter
  .run({
    email: "ada@cilbs.com",
    source: "website",
  });

console.log(result.priority);   // "high"
console.log(result.assignedTo); // "sales-east"`}
/>
                  </pre>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* FINAL CTA */}
      <Section className="pt-10 pb-4">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 sm:p-16 text-center">
            <div
              className="absolute inset-0 -z-10 opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 0%, rgb(var(--gradient-via) / 0.4) 0%, transparent 60%)",
              }}
              aria-hidden
            />
            <div className="absolute inset-0 -z-20 bg-grid bg-grid-fade" aria-hidden />
            <div className="flex flex-col items-center gap-5 max-w-2xl mx-auto">
              <Badge variant="outline">Get started</Badge>
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
                Build your first workflow today.
              </h2>
              <p className="text-muted-foreground">
                Open the studio, drop in a trigger, and have a working AI
                workflow running in a few minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button href="/studio" size="lg">
                  <LayoutGrid className="h-4 w-4" />
                  Open Studio
                </Button>
                <Button href="/pricing" size="lg" variant="outline">
                  See pricing
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                No credit card · Cancel anytime · SOC 2 Type II
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
