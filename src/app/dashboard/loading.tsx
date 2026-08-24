import { Container, Section } from "@/components/ui/section";

/**
 * The dashboard renders per request (it reads the session), so there is a real
 * gap to fill. A skeleton in the finished layout's shape keeps the page from
 * jumping when the data lands.
 */
export default function DashboardLoading() {
  return (
    <Section className="py-12">
      <Container>
        <div className="animate-pulse">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-3">
              <div className="h-5 w-24 rounded-full bg-muted" />
              <div className="h-9 w-64 rounded-lg bg-muted" />
              <div className="h-4 w-80 rounded bg-muted" />
            </div>
            <div className="h-9 w-40 rounded-full bg-muted" />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-border bg-card"
              />
            ))}
          </div>

          <div className="mt-8 h-72 rounded-2xl border border-border bg-card" />
        </div>
        <span className="sr-only">Loading your workspace…</span>
      </Container>
    </Section>
  );
}
