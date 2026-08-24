import {
  Bot,
  Braces,
  Database,
  GitBranch,
  Globe,
  Sparkles,
  Webhook,
} from "lucide-react";
import { IntegrationIcon } from "@/components/visuals/integration-icons";
import { SyntaxHighlight } from "@/components/docs/syntax-highlight";

function Frame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
        <span className="text-[11px] font-mono text-muted-foreground">
          {title}
        </span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/15" />
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/15" />
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/15" />
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function MockBuilder() {
  return (
    <Frame title="canvas.tsx">
      <div className="relative h-44 bg-grid rounded-lg overflow-hidden">
        <NodeChip
          label="Webhook"
          icon={<Webhook className="h-3 w-3" />}
          className="left-2 top-3"
        />
        <NodeChip
          label="Agent"
          icon={<Bot className="h-3 w-3" />}
          accent
          className="left-1/2 top-12 -translate-x-1/2"
        />
        <NodeChip
          label="Postgres"
          icon={<Database className="h-3 w-3" />}
          className="right-2 top-3"
        />
        <NodeChip
          label="If/else"
          icon={<GitBranch className="h-3 w-3" />}
          className="left-6 bottom-3"
        />
        <NodeChip
          label="HTTP"
          icon={<Globe className="h-3 w-3" />}
          className="right-6 bottom-3"
        />
        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          <line
            x1="22%" y1="22%" x2="48%" y2="50%"
            stroke="rgb(var(--border-strong))" strokeWidth="1"
          />
          <line
            x1="78%" y1="22%" x2="52%" y2="50%"
            stroke="rgb(var(--border-strong))" strokeWidth="1"
          />
          <line
            x1="48%" y1="60%" x2="22%" y2="80%"
            stroke="rgb(var(--border-strong))" strokeWidth="1"
          />
          <line
            x1="52%" y1="60%" x2="78%" y2="80%"
            stroke="rgb(var(--border-strong))" strokeWidth="1"
          />
        </svg>
      </div>
    </Frame>
  );
}

function NodeChip({
  label,
  icon,
  className,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`absolute inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] ${
        accent
          ? "border-foreground/40 bg-accent text-foreground"
          : "border-border bg-card text-foreground"
      } ${className}`}
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </div>
  );
}

export function MockAgent() {
  return (
    <Frame title="agent: support-triage">
      <div className="space-y-2 text-[12px] font-mono text-muted-foreground">
        <p>
          <span className="text-foreground">role</span>: senior support agent
        </p>
        <p>
          <span className="text-foreground">tools</span>: search_kb,
          create_ticket, send_email
        </p>
        <p>
          <span className="text-foreground">memory</span>: per_user (180d)
        </p>
        <div className="mt-3 rounded-lg border border-border bg-background p-3">
          <p className="text-[11px] text-muted-foreground">
            ↳ reasoning trace
          </p>
          <ul className="mt-1.5 space-y-1 text-[11px]">
            <li className="text-foreground">
              ✓ classify(intent) → billing_dispute
            </li>
            <li className="text-foreground">
              ✓ search_kb(&quot;refund policy&quot;) → 3 results
            </li>
            <li className="text-foreground">
              ✓ create_ticket(priority=high)
            </li>
            <li className="animate-soft-pulse text-muted-foreground">
              … drafting customer reply
            </li>
          </ul>
        </div>
      </div>
    </Frame>
  );
}

export function MockSteps() {
  return (
    <Frame title="multi-step.run">
      <ol className="space-y-2">
        {[
          "Receive webhook",
          "Validate signature",
          "Branch on payload.type",
          "Run agent: enrich",
          "Update Postgres row",
          "Notify Slack channel",
        ].map((s, i) => (
          <li
            key={s}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-[12px]"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-accent text-foreground text-[10px] font-mono">
              {i + 1}
            </span>
            <span className="text-foreground">{s}</span>
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">
              {(120 + i * 38)}ms
            </span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

export function MockIntegrations() {
  const items = [
    "OpenAI",
    "Anthropic",
    "Slack",
    "Postgres",
    "Notion",
    "GitHub",
    "Linear",
    "Stripe",
    "HubSpot",
    "Sendgrid",
    "AWS",
    "HTTP",
  ];
  return (
    <Frame title="integrations">
      <div className="grid grid-cols-3 gap-2">
        {items.map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-[11px]"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-accent border border-border text-foreground">
              <IntegrationIcon name={i} className="h-3 w-3" />
            </span>
            <span className="text-foreground">{i}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function MockReasoning() {
  return (
    <Frame title="reasoning.json">
      <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
        <SyntaxHighlight
          language="json"
          code={`{
  "thought": "user wants refund for double charge",
  "plan": [
     "lookup_charges(user_id)",
     "verify_duplicate()",
     "issue_refund()"
  ],
  "confidence": 0.94
}`}
        />
      </pre>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-foreground" />
        traced · replayable
      </div>
    </Frame>
  );
}

export function MockApi() {
  return (
    <Frame title="POST /v1/workflows/run">
      <pre className="text-[11px] leading-relaxed whitespace-pre-wrap break-all">
        <SyntaxHighlight
          language="bash"
          code={`curl https://api.cilbs.com/v1/workflows/run \\
  -H "Authorization: Bearer $HYP" \\
  -d '{
    "workflow": "lead-router",
    "input": { "email": "ada@cilbs.com" }
  }'`}
        />
      </pre>
      <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-accent border border-border px-2 py-1 text-[10px] font-mono text-foreground">
        <Braces className="h-3 w-3" />
        200 OK · 184ms
      </div>
    </Frame>
  );
}
