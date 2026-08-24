import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A tiny dependency-free syntax highlighter for the small set of languages
 * the marketing site actually shows: TypeScript / JavaScript, JSON, and
 * shell. We deliberately avoid pulling in shiki / prism here — the snippets
 * are short, the cost of a 2 MB highlighter on every page would be bigger
 * than the value, and our visual goal is "looks like a real editor", not
 * "perfectly faithful TS grammar".
 *
 * Colours come from the site's theme tokens, not hard-coded hex values, so
 * the highlight respects light/dark mode and stays on-brand.
 */

export type Language = "ts" | "tsx" | "js" | "json" | "bash";

type Token = { kind: TokenKind; value: string };

type TokenKind =
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "type"
  | "builtin"
  | "fn"
  | "punct"
  | "operator"
  | "boolean"
  | "ident"
  | "default";

const TS_KEYWORDS = new Set([
  "import",
  "from",
  "export",
  "const",
  "let",
  "var",
  "function",
  "return",
  "await",
  "async",
  "new",
  "if",
  "else",
  "for",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "default",
  "try",
  "catch",
  "finally",
  "throw",
  "type",
  "interface",
  "extends",
  "implements",
  "as",
  "in",
  "of",
  "do",
  "void",
  "yield",
  "this",
  "typeof",
  "instanceof",
]);

const TS_BUILTINS = new Set([
  "console",
  "process",
  "globalThis",
  "Math",
  "JSON",
  "Object",
  "Array",
  "Number",
  "String",
  "Boolean",
  "Date",
  "Promise",
  "Map",
  "Set",
  "Symbol",
  "Error",
  "window",
  "document",
]);

const TS_BOOLEANS = new Set(["true", "false", "null", "undefined"]);

/** Tokenise a TypeScript-ish snippet. Not a full grammar — just enough to
 * paint the common cases nicely. */
function tokenizeTs(input: string): Token[] {
  const out: Token[] = [];
  let i = 0;

  function push(kind: TokenKind, value: string) {
    if (!value) return;
    out.push({ kind, value });
  }

  while (i < input.length) {
    const ch = input[i]!;

    // Line comment
    if (ch === "/" && input[i + 1] === "/") {
      const start = i;
      while (i < input.length && input[i] !== "\n") i++;
      push("comment", input.slice(start, i));
      continue;
    }
    // Block comment
    if (ch === "/" && input[i + 1] === "*") {
      const start = i;
      i += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) i++;
      i = Math.min(input.length, i + 2);
      push("comment", input.slice(start, i));
      continue;
    }
    // Strings (', ", `)
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      const start = i;
      i++;
      while (i < input.length) {
        if (input[i] === "\\") {
          i += 2;
          continue;
        }
        if (input[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      push("string", input.slice(start, i));
      continue;
    }
    // Numbers
    if (/[0-9]/.test(ch)) {
      const start = i;
      while (i < input.length && /[0-9_.eE+-]/.test(input[i]!)) i++;
      push("number", input.slice(start, i));
      continue;
    }
    // Identifiers / keywords
    if (/[A-Za-z_$]/.test(ch)) {
      const start = i;
      while (i < input.length && /[A-Za-z0-9_$]/.test(input[i]!)) i++;
      const word = input.slice(start, i);
      if (TS_KEYWORDS.has(word)) {
        push("keyword", word);
      } else if (TS_BOOLEANS.has(word)) {
        push("boolean", word);
      } else if (TS_BUILTINS.has(word)) {
        push("builtin", word);
      } else if (/^[A-Z]/.test(word)) {
        // Heuristic: capitalised words read as types/classes (Promise, Map, …
        // user-defined too).
        push("type", word);
      } else if (input[i] === "(") {
        push("fn", word);
      } else {
        push("ident", word);
      }
      continue;
    }
    // Punctuation / operators
    if (/[{}\[\]()<>,;:.]/.test(ch)) {
      push("punct", ch);
      i++;
      continue;
    }
    if (/[=+\-*/%!&|^~?]/.test(ch)) {
      const start = i;
      while (i < input.length && /[=+\-*/%!&|^~?]/.test(input[i]!)) i++;
      push("operator", input.slice(start, i));
      continue;
    }
    // Whitespace & everything else falls through as default.
    push("default", ch);
    i++;
  }

  return out;
}

/** Naive JSON tokenizer. Same colour palette as TS but only the relevant kinds. */
function tokenizeJson(input: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i]!;
    if (ch === '"') {
      const start = i;
      i++;
      while (i < input.length) {
        if (input[i] === "\\") {
          i += 2;
          continue;
        }
        if (input[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      // Heuristic: a string immediately followed by ':' is an object key.
      let j = i;
      while (j < input.length && /\s/.test(input[j]!)) j++;
      const isKey = input[j] === ":";
      out.push({ kind: isKey ? "ident" : "string", value: input.slice(start, i) });
      continue;
    }
    if (/[-0-9]/.test(ch)) {
      const start = i;
      while (i < input.length && /[-0-9.eE+]/.test(input[i]!)) i++;
      out.push({ kind: "number", value: input.slice(start, i) });
      continue;
    }
    if (/[a-z]/i.test(ch)) {
      const start = i;
      while (i < input.length && /[a-z]/i.test(input[i]!)) i++;
      const word = input.slice(start, i);
      out.push({
        kind: TS_BOOLEANS.has(word) ? "boolean" : "ident",
        value: word,
      });
      continue;
    }
    if (/[{}\[\],:]/.test(ch)) {
      out.push({ kind: "punct", value: ch });
      i++;
      continue;
    }
    out.push({ kind: "default", value: ch });
    i++;
  }
  return out;
}

/** Bash: comments, strings, flags, and the rest. Intentionally simple. */
function tokenizeBash(input: string): Token[] {
  const out: Token[] = [];
  for (const line of input.split(/(\n)/)) {
    if (line === "\n") {
      out.push({ kind: "default", value: "\n" });
      continue;
    }
    const trimmed = line.trimStart();
    if (trimmed.startsWith("#")) {
      out.push({ kind: "comment", value: line });
      continue;
    }
    let i = 0;
    while (i < line.length) {
      const ch = line[i]!;
      if (ch === "'" || ch === '"') {
        const quote = ch;
        const start = i++;
        while (i < line.length && line[i] !== quote) {
          if (line[i] === "\\") i++;
          i++;
        }
        i = Math.min(line.length, i + 1);
        out.push({ kind: "string", value: line.slice(start, i) });
        continue;
      }
      if (ch === "-" && /[A-Za-z]/.test(line[i + 1] ?? "")) {
        const start = i;
        while (i < line.length && /[-A-Za-z0-9]/.test(line[i]!)) i++;
        out.push({ kind: "keyword", value: line.slice(start, i) });
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        const start = i;
        while (i < line.length && /[A-Za-z0-9_]/.test(line[i]!)) i++;
        const word = line.slice(start, i);
        out.push({
          kind: out.length === 0 || out[out.length - 1]!.kind === "default"
            ? "fn"
            : "ident",
          value: word,
        });
        continue;
      }
      out.push({ kind: "default", value: ch });
      i++;
    }
  }
  return out;
}

/**
 * Token colours. Comments and punctuation used to be drawn at 55-70% opacity,
 * which measured at 2.6:1 against the code block's background — below the 4.5:1
 * WCAG AA floor for text this small. They now use the full muted token, which
 * still reads as secondary without disappearing.
 */
const COLOR: Record<TokenKind, string> = {
  comment: "text-muted-foreground italic",
  string: "text-emerald-700 dark:text-emerald-400",
  number: "text-amber-700 dark:text-amber-400",
  keyword: "text-violet-700 dark:text-violet-400 font-medium",
  type: "text-sky-700 dark:text-sky-400",
  builtin: "text-rose-700 dark:text-rose-400",
  fn: "text-indigo-700 dark:text-indigo-400",
  punct: "text-muted-foreground",
  operator: "text-fuchsia-700 dark:text-fuchsia-400",
  boolean: "text-amber-700 dark:text-amber-400",
  ident: "text-foreground",
  default: "text-foreground",
};

function tokenize(code: string, lang: Language): Token[] {
  switch (lang) {
    case "ts":
    case "tsx":
    case "js":
      return tokenizeTs(code);
    case "json":
      return tokenizeJson(code);
    case "bash":
      return tokenizeBash(code);
    default:
      return [{ kind: "default", value: code }];
  }
}

/** Render syntax-highlighted code. The component is purely presentational
 * — the consumer decides whether to wrap it in a frame, header, etc. */
export function SyntaxHighlight({
  code,
  language = "ts",
  className,
}: {
  code: string;
  language?: Language;
  className?: string;
}) {
  const tokens = React.useMemo(
    () => tokenize(code, language),
    [code, language],
  );
  return (
    <code className={cn("font-mono", className)}>
      {tokens.map((t, i) => (
        <span key={i} className={COLOR[t.kind]}>
          {t.value}
        </span>
      ))}
    </code>
  );
}
