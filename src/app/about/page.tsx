import type { Metadata } from "next";
import { ArrowRight, Coins, Gauge, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  // The root layout applies the `%s · Cilbs` template, so this is just
  // the segment name — spelling out the suffix here rendered it twice.
  title: "About",
  description:
    "Cilbs is an early-stage, investor-backed company building AI workflow infrastructure teams run in production, with 3M+ runs a day behind a 99.99% uptime SLA.",
};

const VALUES = [
  {
    icon: <Gauge className="h-4 w-4" />,
    title: "Production-grade by default",
    body: "Cilbs carries 3M+ runs a day behind a 99.99% uptime SLA. Versioned workflows, replayable runs, and no silent failures aren't roadmap items for us. They're the bar we had to clear before asking anyone to put real work on the platform.",
  },
  {
    icon: <Coins className="h-4 w-4" />,
    title: "Backed for the long build",
    body: "We raised from investors who fund infrastructure and understand that it takes years to get right. The capital buys engineering time and the room to do things properly, not a growth number we have to hit by the end of the quarter.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "The unglamorous parts first",
    body: "SOC 2 Type II, encryption, access control, audit logs. A lot of young companies leave this for the day a big customer asks. We did it up front, because retrofitting security onto a system people already depend on usually breaks both.",
  },
  {
    icon: <HeartHandshake className="h-4 w-4" />,
    title: "Small team, direct line",
    body: "There's no support tier that hides us from you. When you email Cilbs, someone who actually builds the thing reads it. We like it that way, and we intend to keep it that way for as long as we can.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <Section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade" />
        <Container>
          <div className="max-w-3xl">
            <Reveal>
              <Badge variant="outline">About</Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-4 text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
                Early company,
                <br />
                <span className="text-gradient">production software.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Cilbs is a young, well-funded company, and we&apos;re careful
                about which of those two facts shows up in your workflows.
                Teams run millions of executions a day on this platform. It
                gets held to that standard, not to our age.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Story */}
      <Section className="py-12">
        <Container>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <Reveal>
                <SectionHeader
                  align="left"
                  eyebrow="Our story"
                  title="Built like infrastructure, not a demo."
                />
              </Reveal>
            </div>
            <div className="md:col-span-7">
              <Reveal delay={0.1}>
                <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-muted-foreground">
                  <p>
                    Cilbs started as a tool we needed ourselves. We were tired
                    of stitching together prompts, cron jobs, and half-finished
                    scripts every time we wanted to ship something with AI in it.
                    So we built a canvas that let us design, run, and debug those
                    workflows in one place.
                  </p>
                  <p>
                    When it worked well enough that other people wanted it, we
                    raised from Y Combinator, Sequoia, Andreessen Horowitz,
                    Accel, Index Ventures, and South Park Commons, investors
                    who back infrastructure rather than cycles. That money went
                    somewhere unglamorous: isolation between runs, retries that
                    don&apos;t duplicate work, audit trails, and the security
                    review behind our SOC 2 Type II report.
                  </p>
                  <p>
                    Being early isn&apos;t an excuse we get to use. Nobody
                    running onboarding or billing on Cilbs cares how much we
                    raised. They care that the 3am run behaves exactly like
                    the 3pm one. So we size the roadmap to what we can support
                    properly, and ship fewer things we&apos;d have to caveat.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section className="py-12">
        <Container>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-border bg-card p-6">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent border border-border text-foreground">
                    {v.icon}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    {v.body}
                  </p>
                </div>
              </Reveal>
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
                  title="Want to build with us?"
                  description="If a focused team shipping infrastructure you can actually put production work on sounds like your kind of software, give Cilbs a try. We think you'll feel the difference."
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/signup">
                  Get started <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/product" variant="outline">
                  See the product
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
