"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type DocSection = {
  id: string;
  label: string;
  items: { id: string; label: string }[];
};

/**
 * Sticky docs navigation with a scroll-spy indicator.
 *
 * The sliding rule used to be a framer-motion `layoutId`; it's now measured
 * once per active change and moved with a CSS transform transition, which
 * keeps the same feel without pulling the animation runtime onto the docs
 * page. `prefers-reduced-motion` disables the slide via `.docs-rule`.
 */
export function DocsSidebar({ sections }: { sections: DocSection[] }) {
  const allIds = sections.flatMap((s) => s.items.map((i) => i.id));
  const [active, setActive] = useState<string>(allIds[0] ?? "");
  const listRefs = useRef(new Map<string, HTMLUListElement | null>());
  const [rule, setRule] = useState<{
    sectionId: string;
    top: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    // Track intersection state across callbacks rather than trusting a single
    // batch: `entries` only contains what *changed*, so a fast scroll (or a
    // jump to a deep anchor) could leave the previous section highlighted.
    const intersecting = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target.id);
          else intersecting.delete(entry.target.id);
        }
        // Document order is the reading order, so the first still-visible
        // section wins. With nothing in the band we keep the last one.
        const next = allIds.find((id) => intersecting.has(id));
        if (next) setActive(next);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );
    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Following a link puts the heading at the very top of the viewport, above
    // the observer's band — without this the sidebar wouldn't follow the jump.
    const syncFromHash = () => {
      const id = window.location.hash.slice(1);
      if (id && allIds.includes(id)) setActive(id);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", syncFromHash);
    };
    // `allIds` is derived from `sections` on every render, so keying the
    // effect on `sections` is both correct and stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  // Measure where the indicator belongs whenever the active item changes.
  useLayoutEffect(() => {
    const section = sections.find((s) =>
      s.items.some((i) => i.id === active),
    );
    if (!section) {
      setRule(null);
      return;
    }
    const list = listRefs.current.get(section.id);
    const item = list?.querySelector<HTMLElement>(`[data-doc-item="${active}"]`);
    if (!list || !item) {
      setRule(null);
      return;
    }
    setRule({
      sectionId: section.id,
      top: item.offsetTop,
      height: item.offsetHeight,
    });
  }, [active, sections]);

  return (
    <nav
      aria-label="Docs navigation"
      className="hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-4"
    >
      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.id}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              {section.label}
            </p>
            <ul
              ref={(el) => {
                listRefs.current.set(section.id, el);
              }}
              className="relative mt-2 flex flex-col gap-0.5 border-l border-border"
            >
              {rule && rule.sectionId === section.id ? (
                <span
                  aria-hidden
                  className="docs-rule absolute left-[-1px] w-px bg-foreground"
                  style={{
                    transform: `translateY(${rule.top}px)`,
                    height: rule.height,
                  }}
                />
              ) : null}
              {section.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id} data-doc-item={item.id}>
                    <a
                      href={`#${item.id}`}
                      aria-current={isActive ? "location" : undefined}
                      className={cn(
                        "block py-1.5 pl-3 text-[13px] transition-colors",
                        isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
