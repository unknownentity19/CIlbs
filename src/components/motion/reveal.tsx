"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight scroll-reveal primitives backed by a single
 * IntersectionObserver per element and CSS transitions (see `.reveal` in
 * globals.css). This replaces the previous framer-motion implementation so
 * marketing pages ship no animation runtime — the effect is identical but
 * costs a few hundred bytes instead of ~40KB.
 */
function useInView<T extends Element>(
  amount: number,
  once: boolean,
): [React.RefObject<T | null>, boolean] {
  const ref = React.useRef<T | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Respect environments without IntersectionObserver: reveal immediately
    // as a safe fallback so content is never stuck hidden.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    // Anything already on screen at mount is revealed straight away rather
    // than waiting for the observer's first callback. Browsers pause that
    // callback in a background tab, which left above-the-fold content blank
    // for anyone who opened the site in a new tab and switched to it later.
    const rect = node.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 0;
    if (rect.top < viewportHeight && rect.bottom > 0) {
      setInView(true);
      if (once) return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold: Math.min(Math.max(amount, 0), 1) },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [amount, once]);

  return [ref, inView];
}

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  amount = 0.2,
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
  amount?: number;
  once?: boolean;
}) {
  const [ref, inView] = useInView<HTMLElement>(amount, once);
  return React.createElement(
    as,
    {
      ref,
      className: cn("reveal", inView && "is-visible", className),
      style: { "--reveal-delay": `${delay * 1000}ms` } as React.CSSProperties,
    },
    children,
  );
}

const StaggerContext = React.createContext(false);

export function StaggerGroup({
  children,
  className,
  delay = 0,
  staggerChildren = 0.08,
  amount = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  amount?: number;
}) {
  const [ref, inView] = useInView<HTMLDivElement>(amount, true);

  let index = 0;
  const items = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const i = index++;
    const element = child as React.ReactElement<{ style?: React.CSSProperties }>;
    return React.cloneElement(element, {
      style: {
        ...element.props.style,
        "--reveal-delay": `${delay * 1000 + i * staggerChildren * 1000}ms`,
      } as React.CSSProperties,
    });
  });

  return (
    <StaggerContext.Provider value={inView}>
      <div ref={ref} className={className}>
        {items}
      </div>
    </StaggerContext.Provider>
  );
}

export function StaggerItem({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const inView = React.useContext(StaggerContext);
  return (
    <div
      className={cn("reveal", inView && "is-visible", className)}
      style={style}
    >
      {children}
    </div>
  );
}
