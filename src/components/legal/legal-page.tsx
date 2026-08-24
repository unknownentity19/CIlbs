import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";

/**
 * Shared shell for the policy pages (/privacy, /terms, /security).
 *
 * They're long-form documents rather than marketing pages, so they get a
 * narrower measure, a sticky table of contents on wide screens, and anchored
 * headings — the same reading affordances the docs page has.
 */

export type LegalSection = {
  id: string;
  title: string;
  body: React.ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
  contact,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
  contact: { label: string; email: string };
}) {
  return (
    <>
      <Section className="relative overflow-hidden pt-20 pb-10">
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade" />
        <Container>
          <div className="max-w-3xl">
            <Reveal>
              <Badge variant="outline">{eyebrow}</Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
                {title}
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {intro}
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                Last updated {updated}
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section className="pb-24">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <nav
              aria-label="On this page"
              className="hidden lg:col-span-4 lg:block"
            >
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                  On this page
                </p>
                <ul className="mt-3 flex flex-col gap-0.5 border-l border-border">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="block py-1.5 pl-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-xl border border-border bg-card p-4">
                  <p className="text-[13px] font-medium text-foreground">
                    {contact.label}
                  </p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="mt-1 block break-all font-mono text-[12px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            </nav>

            <div className="lg:col-span-8">
              <div className="prose-doc flex max-w-2xl flex-col gap-10">
                {sections.map((s) => (
                  <section key={s.id} id={s.id} className="scroll-mt-24">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                      {s.title}
                    </h2>
                    <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-muted-foreground">
                      {s.body}
                    </div>
                  </section>
                ))}

                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-medium text-foreground">
                    Questions about this page?
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
                    Write to{" "}
                    <a
                      href={`mailto:${contact.email}`}
                      className="font-mono text-[13px] text-foreground underline underline-offset-4"
                    >
                      {contact.email}
                    </a>
                    . The other policies live at{" "}
                    <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                      Privacy
                    </Link>
                    ,{" "}
                    <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
                      Terms
                    </Link>
                    , and{" "}
                    <Link href="/security" className="underline underline-offset-4 hover:text-foreground">
                      Security
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
