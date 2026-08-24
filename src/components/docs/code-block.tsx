import { cn } from "@/lib/utils";
import { SyntaxHighlight, type Language } from "./syntax-highlight";

/** Maps the loose language strings used in MDX-style markup to the
 * highlighter's known set. Anything else falls through unhighlighted. */
function normalizeLanguage(input: string): Language | null {
  switch (input.toLowerCase()) {
    case "ts":
    case "typescript":
      return "ts";
    case "tsx":
      return "tsx";
    case "js":
    case "javascript":
      return "js";
    case "json":
      return "json";
    case "bash":
    case "sh":
    case "shell":
    case "zsh":
      return "bash";
    default:
      return null;
  }
}

export function CodeBlock({
  children,
  language = "bash",
  className,
}: {
  children: string;
  language?: string;
  className?: string;
}) {
  const lang = normalizeLanguage(language);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-muted/40",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="font-mono">{language}</span>
        <span className="font-mono">copy</span>
      </div>
      {/* tabIndex: wide code scrolls sideways on a narrow screen, and a
          scrollable region with nothing focusable inside can't be scrolled
          from the keyboard at all. */}
      <pre
        tabIndex={0}
        className="overflow-x-auto px-4 py-4 text-[12.5px] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
      >
        {lang ? (
          <SyntaxHighlight code={children} language={lang} />
        ) : (
          <code className="font-mono text-foreground">{children}</code>
        )}
      </pre>
    </div>
  );
}
