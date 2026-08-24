import type { Metadata } from "next";
import { Fragment } from "react";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { faqSchema, jsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  // The root layout applies the `%s — Cilbs` template, so this is just
  // the segment name — spelling out the suffix here rendered it twice.
  title: "Pricing",
  description:
    "Simple pricing for every team. Start free, scale to Pro, and get bespoke support on Enterprise.",
};

type Plan = {
  name: string;
  description: string;
  price: string;
  cadence?: string;
  cta: { label: string; href: string };
  features: string[];
  highlighted?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    description: "Everything you need to learn Cilbs and ship a side project.",
    price: "$0",
    cadence: "forever",
    cta: { label: "Start free", href: "/signup" },
    features: [
      "1 workspace",
      "Up to 3 active workflows",
      "1,000 runs / month",
      "Community support",
      "Reasoning trace history (7 days)",
    ],
  },
  {
    name: "Pro",
    description: "For teams shipping AI workflows in production.",
    price: "$29",
    cadence: "per seat / month",
    cta: { label: "Request a trial", href: "mailto:hello@cilbs.com" },
    features: [
      "Unlimited workflows",
      "100,000 runs / month included",
      "Multiplayer canvas",
      "Audit log + trace history (90 days)",
      "Priority email support",
      "Bring-your-own model keys",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For organizations with security, scale, and compliance needs.",
    price: "Custom",
    cta: { label: "Contact sales", href: "mailto:hello@cilbs.com" },
    features: [
      "Unlimited everything",
      "Self-hosted or VPC deployment",
      "SSO, SCIM, SAML",
      "Dedicated support engineer",
      "Custom SLA + DPA",
      "Bring-your-own-cloud option",
    ],
  },
];

const COMPARE_GROUPS = [
  {
    title: "Workflows",
    rows: [
      { label: "Active workflows", values: ["3", "Unlimited", "Unlimited"] },
      { label: "Runs / month", values: ["1,000", "100,000", "Custom"] },
      {
        label: "Multiplayer editing",
        values: [false, true, true],
      },
      {
        label: "Versioning + rollbacks",
        values: ["7d", "90d", "Unlimited"],
      },
    ],
  },
  {
    title: "AI Agents",
    rows: [
      {
        label: "Agent runs",
        values: ["500/mo", "Included", "Custom"],
      },
      {
        label: "Reasoning trace history",
        values: ["7d", "90d", "Unlimited"],
      },
      {
        label: "Bring-your-own model keys",
        values: [false, true, true],
      },
      {
        label: "Run replays + diffs",
        values: [true, true, true],
      },
    ],
  },
  {
    title: "Security & Support",
    rows: [
      { label: "SSO / SAML", values: [false, false, true] },
      { label: "SCIM provisioning", values: [false, false, true] },
      { label: "Audit logs", values: [false, true, true] },
      {
        label: "Support",
        values: ["Community", "Priority email", "Dedicated engineer"],
      },
      { label: "Self-hosted / VPC", values: [false, false, true] },
    ],
  },
];

const FAQ = [
  {
    q: "Can I use my own OpenAI / Anthropic key?",
    a: "Yes. On Pro and Enterprise plans you can bring your own model keys. We'll route all model calls through your provider while still tracking usage in Cilbs's observability layer.",
  },
  {
    q: "What counts as a run?",
    a: "A run is a single execution of a workflow, regardless of how many steps or agent calls it contains. Internal sub-workflows triggered by a parent run share the parent's run ID.",
  },
  {
    q: "Do you offer a free trial of Pro?",
    a: "The Free plan covers most prototyping use cases. If you'd like to evaluate Pro features (multiplayer, longer trace history, bring-your-own keys), reach out and we'll enable a 14-day trial on your workspace.",
  },
  {
    q: "Can Cilbs be self-hosted?",
    a: "Yes — Enterprise customers can deploy Cilbs into their own VPC or on-prem environment. We provide a Helm chart, Terraform modules, and an upgrade path.",
  },
  {
    q: "Do you support educational or non-profit pricing?",
    a: "Yes. Educators, students, and registered non-profits get Pro features at no cost. Email us with verification and we'll set you up.",
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-foreground" />;
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  }
  return (
    <span className="mx-auto block text-center text-sm text-foreground">
      {value}
    </span>
  );
}

export default function PricingPage() {
  return (
    <>
      {/* The FAQ array below the fold is the source of truth; this mirrors it
          into a rich result so the two can't drift apart. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema(FAQ)) }}
      />

      {/* Hero */}
      <Section className="relative overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade" />
        <Container>
          <div className="flex flex-col items-center text-center gap-5 max-w-3xl mx-auto">
            <Reveal>
              <Badge variant="outline">Pricing</Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
                Straightforward pricing.
                <br />
                <span className="text-gradient">Scales with your team.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Start on the free tier and upgrade when you need more. No
                annual commitments, no surprise overages.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Plans */}
      <Section className="pb-16">
        <Container>
          <StaggerGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <StaggerItem key={plan.name}>
                <PlanCard plan={plan} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* Comparison */}
      <Section className="pb-16">
        <Container>
          <SectionHeader
            eyebrow="Compare plans"
            title="A side-by-side look."
            description="Every plan includes the visual canvas, AI agents, integrations, and the runtime. Limits, security features, and support are what change."
          />
          <Reveal delay={0.1} className="mt-12 overflow-hidden rounded-2xl border border-border bg-card">
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
                <thead>
                  <tr className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-4 font-medium">&nbsp;</th>
                    {PLANS.map((p) => (
                      <th
                        key={p.name}
                        className="px-5 py-4 font-medium text-center"
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_GROUPS.map((group) => (
                    <Fragment key={group.title}>
                      <tr className="border-t border-border">
                        <th
                          colSpan={4}
                          className="bg-background px-5 py-3 text-xs uppercase tracking-wide text-foreground font-medium"
                        >
                          {group.title}
                        </th>
                      </tr>
                      {group.rows.map((row) => (
                        <tr
                          key={`${group.title}-${row.label}`}
                          className="border-t border-border"
                        >
                          <td className="px-5 py-3 text-sm text-foreground">
                            {row.label}
                          </td>
                          {row.values.map((v, idx) => (
                            <td
                              key={`${row.label}-${idx}`}
                              className="px-5 py-3 text-center"
                            >
                              <FeatureCell value={v} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="pb-16">
        <Container>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <Reveal>
                <Badge variant="outline">FAQ</Badge>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
                  Frequently asked questions.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-4 text-muted-foreground">
                  Can&apos;t find what you&apos;re looking for? Drop us a line
                  and we&apos;ll reply the same day.
                </p>
              </Reveal>
            </div>
            <div className="md:col-span-8">
              <StaggerGroup className="flex flex-col divide-y divide-border border-y border-border">
                {FAQ.map((item) => (
                  <StaggerItem key={item.q}>
                    <details className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground">
                        {item.q}
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-transform group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </details>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="pb-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 sm:p-14 text-center">
            <div
              className="absolute inset-0 -z-10 opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse 60% 40% at 50% 100%, rgb(var(--gradient-via)) 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <div className="flex flex-col items-center gap-5 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Give it a try.
              </h2>
              <p className="text-muted-foreground">
                Start on the free plan — no credit card needed. Upgrade when
                you need more runs or team features.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button href="/signup">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="mailto:hello@cilbs.com" variant="outline">
                  Talk to sales
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-card p-6 sm:p-8 transition-colors",
        plan.highlighted
          ? "border-foreground/30 shadow-[0_8px_30px_rgb(0_0_0/0.06)]"
          : "border-border",
      )}
    >
      {plan.highlighted ? (
        <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-medium text-background">
          Most popular
        </span>
      ) : null}
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold tracking-tight">{plan.name}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {plan.description}
      </p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">
          {plan.price}
        </span>
        {plan.cadence ? (
          <span className="text-sm text-muted-foreground">
            {plan.cadence}
          </span>
        ) : null}
      </div>
      <Button
        href={plan.cta.href}
        variant={plan.highlighted ? "primary" : "outline"}
        className="mt-6 w-full"
      >
        {plan.cta.label}
        <ArrowRight className="h-4 w-4" />
      </Button>
      <ul className="mt-8 flex flex-col gap-3 border-t border-border pt-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-foreground">
              <Check className="h-3 w-3" />
            </span>
            <span className="text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
