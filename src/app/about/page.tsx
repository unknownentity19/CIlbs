import type { Metadata } from "next";
import { ArrowRight, Coins, Compass, HeartHandshake, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About — Hypero",
  description:
    "Hypero is a bootstrapped, independently funded company. No VCs, no board, no growth-at-all-costs — just a small team building software we're proud of.",
};

const VALUES = [
  {
    icon: <Coins className="h-4 w-4" />,
    title: "Bootstrapped, on purpose",
    body: "We funded Hypero ourselves and pay the bills with revenue from people who actually use the product. There are no investors to answer to and no clock ticking toward an exit — which means we get to make decisions that are good for the long run instead of good for the next funding round.",
  },
  {
    icon: <Compass className="h-4 w-4" />,
    title: "Customers, not a board",
    body: "When you're bootstrapped, your customers are your only source of truth. If something we ship doesn't earn its keep, we hear about it fast. That feedback loop keeps us honest and keeps the roadmap grounded in real work rather than a pitch deck.",
  },
  {
    icon: <Sprout className="h-4 w-4" />,
    title: "Sustainable pace",
    body: "We grow at the speed the business can actually support. That sometimes means we say no to shiny things, but it also means we're still going to be here in a few years — running the same workflows you built on day one.",
  },
  {
    icon: <HeartHandshake className="h-4 w-4" />,
    title: "Small team, direct line",
    body: "There's no support tier that hides us from you. When you email Hypero, someone who actually builds the thing reads it. We like it that way, and we intend to keep it that way for as long as we can.",
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
                We built Hypero the
                <br />
                <span className="text-gradient">bootstrapped way.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Hypero is a small, independent company. We didn&apos;t raise a
                round — we started with our own savings, shipped something people
                were willing to pay for, and reinvested from there. That single
                decision shapes almost everything about how we work.
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
                  title="No investors. No hype cycle. Just the work."
                />
              </Reveal>
            </div>
            <div className="md:col-span-7">
              <Reveal delay={0.1}>
                <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-muted-foreground">
                  <p>
                    Hypero started as a tool we needed ourselves. We were tired
                    of stitching together prompts, cron jobs, and half-finished
                    scripts every time we wanted to ship something with AI in it.
                    So we built a canvas that let us design, run, and debug those
                    workflows in one place.
                  </p>
                  <p>
                    When it worked well enough that other people wanted it, we
                    had a choice: chase a big round and grow as fast as possible,
                    or fund it ourselves and grow at a pace we could stand behind.
                    We chose the second one. Every feature you see here was paid
                    for by customers, not by venture capital.
                  </p>
                  <p>
                    Being bootstrapped isn&apos;t a badge we wear for its own
                    sake — it&apos;s just the setup that lets us keep our
                    priorities straight. Fewer meetings about valuations, more
                    time spent making the product better for the people who
                    actually use it.
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
                  description="If a small, independent team that answers to its customers sounds like your kind of software, give Hypero a try. We think you'll feel the difference."
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
