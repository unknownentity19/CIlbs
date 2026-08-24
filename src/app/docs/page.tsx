import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { DocsSidebar, type DocSection } from "@/components/docs/docs-sidebar";
import { CodeBlock } from "@/components/docs/code-block";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  // The root layout applies the `%s — Cilbs` template, so this is just
  // the segment name — spelling out the suffix here rendered it twice.
  title: "Docs",
  description:
    "Learn how to build with Cilbs. Getting started, authentication, workflows, AI agents, the API, and webhooks.",
};

const SECTIONS: DocSection[] = [
  {
    id: "getting-started",
    label: "Getting started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "quickstart", label: "Quickstart" },
      { id: "concepts", label: "Core concepts" },
    ],
  },
  {
    id: "guides",
    label: "Guides",
    items: [
      { id: "authentication", label: "Authentication" },
      { id: "creating-workflows", label: "Creating workflows" },
      { id: "ai-agent-setup", label: "AI agent setup" },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    items: [
      { id: "api-reference", label: "API reference" },
      { id: "webhooks", label: "Webhooks" },
    ],
  },
];

export default function DocsPage() {
  return (
    <Section className="relative pt-12 pb-20">
      <Container className="max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[14rem_1fr]">
          <DocsSidebar sections={SECTIONS} />

          <div className="min-w-0">
            <Reveal>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Documentation</Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  v1.0
                </span>
              </div>
              <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
                Build with Cilbs.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Everything you need to design, deploy, and operate intelligent
                workflows in production.
              </p>
            </Reveal>

            <div className="mt-14 flex flex-col gap-16">
              <DocBlock id="introduction" title="Introduction">
                <p>
                  Cilbs is a visual builder for AI workflows. You compose
                  triggers, agents, integrations, and logic on a single canvas,
                  and Cilbs turns it into a production-ready service with an
                  authenticated API endpoint, observability, and version
                  control.
                </p>
                <p>
                  This guide assumes you have a Cilbs account and a workspace.
                  If you don&apos;t, sign up at{" "}
                  <a
                    href="/pricing"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    cilbs.com
                  </a>{" "}
                  — the free tier is enough to follow along.
                </p>
              </DocBlock>

              <DocBlock id="quickstart" title="Quickstart">
                <p>
                  Install the CLI to scaffold a project and connect it to your
                  workspace.
                </p>
                <CodeBlock language="bash">
                  {`# Install the Cilbs CLI
npm install -g @cilbs/cli

# Authenticate
cilbs login

# Create a workflow from a template
cilbs new lead-router --template starter

# Deploy
cd lead-router && cilbs deploy`}
                </CodeBlock>
                <p>
                  After <code className="font-mono text-foreground">cilbs deploy</code>, your
                  workflow is live at{" "}
                  <code className="font-mono text-foreground">
                    https://api.cilbs.com/v1/workflows/lead-router/run
                  </code>
                  .
                </p>
              </DocBlock>

              <DocBlock id="concepts" title="Core concepts">
                <p>
                  Three primitives power Cilbs: <strong>workflows</strong>,{" "}
                  <strong>nodes</strong>, and <strong>agents</strong>.
                </p>
                <ul>
                  <li>
                    <strong>Workflow</strong> — a versioned graph of nodes. Each
                    workflow is callable as an API endpoint and observable via
                    the run inspector.
                  </li>
                  <li>
                    <strong>Node</strong> — a single step. Triggers, HTTP calls,
                    database queries, conditions, loops, and agent calls are
                    all nodes.
                  </li>
                  <li>
                    <strong>Agent</strong> — a special node that reasons,
                    selects tools, and produces structured outputs. Agents have
                    memory, guardrails, and a configurable model backend.
                  </li>
                </ul>
              </DocBlock>

              <DocBlock id="authentication" title="Authentication">
                <p>
                  Cilbs uses bearer tokens. Each workspace exposes one or more
                  API keys with scopes. Generate keys from{" "}
                  <code className="font-mono text-foreground">
                    Settings → API keys
                  </code>
                  .
                </p>
                <CodeBlock language="bash">
                  {`curl https://api.cilbs.com/v1/whoami \\
  -H "Authorization: Bearer $CILBS_API_KEY"`}
                </CodeBlock>
                <p>
                  All endpoints expect <code className="font-mono">Authorization: Bearer …</code>{" "}
                  unless explicitly marked public. Webhook signatures are validated separately
                  via the <code className="font-mono">X-Cilbs-Signature</code> header.
                </p>
              </DocBlock>

              <DocBlock id="creating-workflows" title="Creating workflows">
                <p>
                  Workflows can be authored visually in the canvas or
                  declaratively in YAML. The two are isomorphic — every change
                  in one updates the other.
                </p>
                <CodeBlock language="yaml">
                  {`name: lead-router
trigger:
  type: webhook
  path: /lead

steps:
  - id: classify
    type: agent
    agent: support-triage
    input: \${trigger.body}

  - id: branch
    type: condition
    when: \${classify.priority == "high"}
    then: notify
    else: archive

  - id: notify
    type: slack
    channel: "#sales"
    text: "🚨 New high-priority lead from \${trigger.body.email}"`}
                </CodeBlock>
                <p>
                  You can deploy this workflow with{" "}
                  <code className="font-mono">cilbs deploy</code> and call it
                  immediately at the path defined in <code className="font-mono">trigger</code>.
                </p>
              </DocBlock>

              <DocBlock id="ai-agent-setup" title="AI agent setup">
                <p>
                  Define an agent with a role, a model, the tools it can use,
                  and optional memory. Agents can be referenced by any node in
                  any workflow inside the workspace.
                </p>
                <CodeBlock language="yaml">
                  {`name: support-triage
model: anthropic/claude-opus
role: |
  You are a senior support engineer.
  Classify tickets, draft replies, and escalate
  when you are not confident.

tools:
  - search_kb
  - create_ticket
  - send_email

memory:
  scope: per_user
  ttl: 180d

guardrails:
  max_tokens: 8000
  max_cost_per_run_usd: 0.25`}
                </CodeBlock>
                <p>
                  Agents emit structured reasoning traces by default. Open any
                  run in the inspector to see the plan, tool calls, and final
                  output side-by-side.
                </p>
              </DocBlock>

              <DocBlock id="api-reference" title="API reference">
                <p>
                  Every workflow you deploy is exposed as a typed REST endpoint.
                  Below are the core endpoints supported across all workspaces.
                </p>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Method</th>
                        <th className="px-4 py-3 font-medium">Path</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-foreground">
                      {[
                        ["POST", "/v1/workflows/:name/run", "Execute a workflow synchronously"],
                        ["POST", "/v1/workflows/:name/runs", "Queue an asynchronous run"],
                        ["GET", "/v1/runs/:id", "Fetch run status, output, and trace"],
                        ["GET", "/v1/agents/:name", "Inspect an agent's config"],
                        ["GET", "/v1/integrations", "List available connectors"],
                      ].map(([method, path, desc]) => (
                        <tr key={path} className="border-t border-border">
                          <td className="px-4 py-3 font-mono text-xs">
                            <span className="rounded bg-accent border border-border px-1.5 py-0.5">
                              {method}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {path}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <CodeBlock language="bash">
                  {`curl https://api.cilbs.com/v1/workflows/lead-router/run \\
  -H "Authorization: Bearer $CILBS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "ada@cilbs.com" }'`}
                </CodeBlock>
              </DocBlock>

              <DocBlock id="webhooks" title="Webhooks">
                <p>
                  Cilbs sends webhooks for run lifecycle events. You can use
                  these to keep external systems in sync, or to trigger
                  downstream workflows.
                </p>
                <ul>
                  <li>
                    <code className="font-mono text-foreground">run.started</code> — a
                    workflow run has begun.
                  </li>
                  <li>
                    <code className="font-mono text-foreground">run.succeeded</code> — a run
                    completed without errors.
                  </li>
                  <li>
                    <code className="font-mono text-foreground">run.failed</code> — a run
                    finished with an error.
                  </li>
                  <li>
                    <code className="font-mono text-foreground">run.paused</code> — a run is
                    waiting for a human approval step.
                  </li>
                </ul>
                <p>
                  Verify webhooks with the{" "}
                  <code className="font-mono">X-Cilbs-Signature</code> header,
                  which contains an HMAC-SHA256 of the raw body using your
                  endpoint&apos;s signing secret.
                </p>
                <CodeBlock language="ts">
                  {`import crypto from "node:crypto";

export function verify(rawBody: string, header: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(header)
  );
}`}
                </CodeBlock>
              </DocBlock>

              <div className="mt-12 flex items-center justify-between rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
                <span>Need help? Reach the team in your workspace settings.</span>
                <a
                  href="/pricing"
                  className="font-medium text-foreground hover:underline"
                >
                  Upgrade plan →
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function DocBlock({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <article id={id} className="scroll-mt-24">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <div className="prose-doc mt-5 flex flex-col gap-4 text-[15px] leading-relaxed text-muted-foreground">
          {children}
        </div>
      </article>
    </Reveal>
  );
}
