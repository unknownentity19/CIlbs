import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-stretch">
      {/* Left content side */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-16">
        <div
          className="absolute inset-0 -z-10 bg-grid bg-grid-fade"
          aria-hidden
        />
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* Right brand panel */}
      <aside className="relative hidden lg:flex lg:w-[40%] xl:w-[44%] items-center justify-center overflow-hidden border-l border-border bg-muted/40">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 70% 30%, rgb(var(--gradient-via) / 0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 30% 80%, rgb(var(--gradient-from) / 0.2) 0%, transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-md px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <LogoMark />
            <span className="font-semibold tracking-tight text-foreground">
              Cilbs
            </span>
          </Link>
          <blockquote className="mt-10 text-2xl font-medium leading-snug tracking-tight text-foreground">
            “We replaced three internal tools, two cron jobs, and a Zapier
            account with a single Cilbs workflow. Our ops team owns it now.”
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold">
              AC
            </span>
            <div className="text-sm">
              <p className="text-foreground font-medium">Amelia Chen</p>
              <p className="text-muted-foreground">Head of RevOps · Lattice</p>
            </div>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-border pt-8">
            {[
              { v: "12k+", l: "Builders" },
              { v: "3M+", l: "Runs / day" },
              { v: "99.99%", l: "Uptime" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="text-2xl font-semibold tracking-tight text-foreground">
                  {s.v}
                </dt>
                <dd className="mt-0.5 text-xs text-muted-foreground">
                  {s.l}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
