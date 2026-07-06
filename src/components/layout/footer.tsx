import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/product" },
      { label: "Features", href: "/features" },
      { label: "Solutions", href: "/solutions" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/docs#api-reference" },
      { label: "Webhooks", href: "/docs#webhooks" },
      { label: "Changelog", href: "/docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Customers", href: "/solutions" },
      { label: "Careers", href: "/product" },
      { label: "Contact", href: "/product" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Guides", href: "/docs" },
      { label: "Templates", href: "/solutions" },
      { label: "Community", href: "/docs" },
      { label: "Status", href: "/docs" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2 flex flex-col gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The visual AI workflow builder for teams shipping intelligent
              automation in minutes, not months.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col-reverse gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hypero Labs Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/docs" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/docs" className="hover:text-foreground">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
