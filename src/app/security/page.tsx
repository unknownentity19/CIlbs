import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Cilbs protects workflow data: encryption, tenant isolation, credential handling, access control, backups, and how to report a vulnerability.",
};

const UPDATED = "19 August 2026";

const SECTIONS: LegalSection[] = [
  {
    id: "reporting",
    title: "Reporting a vulnerability",
    body: (
      <>
        <p>
          Send anything you find to{" "}
          <a
            href="mailto:security@cilbs.com"
            className="font-mono text-[13px] text-foreground underline underline-offset-4"
          >
            security@cilbs.com
          </a>
          . Include the steps to reproduce it and what you were able to reach. We
          acknowledge reports within one business day and keep you updated until
          the issue is closed.
        </p>
        <p>
          Test against your own workspace only. Don&apos;t run denial-of-service
          attacks, don&apos;t access or modify other people&apos;s data, and give
          us a reasonable window to fix an issue before publishing it. Research
          conducted that way is welcome, and we won&apos;t pursue legal action
          over it.
        </p>
      </>
    ),
  },
  {
    id: "architecture",
    title: "Infrastructure",
    body: (
      <>
        <p>
          Cilbs runs on managed cloud infrastructure in the United States and
          the European Union. Production is isolated from development and
          staging, and is reachable only through audited entry points.
        </p>
        <p>
          Infrastructure is defined as code and deployed through a reviewed
          pipeline — there are no ad-hoc changes to production hosts.
        </p>
      </>
    ),
  },
  {
    id: "encryption",
    title: "Encryption",
    body: (
      <p>
        Traffic is encrypted in transit with TLS 1.2 or better, with HSTS on all
        Cilbs domains. Data at rest is encrypted with AES-256. Connected
        credentials are encrypted with per-workspace keys and decrypted only in
        the moment a run needs them.
      </p>
    ),
  },
  {
    id: "isolation",
    title: "Tenant isolation",
    body: (
      <p>
        Every record carries its workspace, and access is scoped at the query
        layer rather than in application logic alone. Workflow execution is
        sandboxed per run: transform code cannot reach the host, the network
        beyond its declared calls, or another workspace&apos;s data.
      </p>
    ),
  },
  {
    id: "access",
    title: "Access control",
    body: (
      <>
        <p>
          Internal access follows least privilege, is granted by role, requires
          multi-factor authentication and a company-managed device, and is
          reviewed quarterly. Access to customer content requires a documented
          reason — typically a support request from you — and is logged.
        </p>
        <p>
          On your side, workspaces support role-based permissions and audit
          logs; enterprise plans add SSO and SCIM provisioning.
        </p>
      </>
    ),
  },
  {
    id: "development",
    title: "Secure development",
    body: (
      <>
        <p>
          Every change is peer reviewed and passes automated type checks, tests,
          and dependency scanning before it can be merged. Dependencies are
          updated on a regular cadence, and security patches jump the queue.
        </p>
        <p>
          Secrets never live in the repository; they are injected at deploy time
          from a managed secret store.
        </p>
      </>
    ),
  },
  {
    id: "resilience",
    title: "Backups and resilience",
    body: (
      <p>
        Databases are backed up continuously with point-in-time recovery, and
        restores are exercised on a schedule rather than assumed to work.
        Workflow runs are durable: a run that is interrupted resumes or fails
        loudly, and never silently half-executes.
      </p>
    ),
  },
  {
    id: "monitoring",
    title: "Monitoring and incident response",
    body: (
      <>
        <p>
          Application errors, latency, and anomalous access patterns are
          monitored continuously and page an on-call engineer. Incidents follow a
          written runbook: contain, fix, then review.
        </p>
        <p>
          If an incident affects your data we notify you without undue delay —
          and within 72 hours where the law requires it — with what happened,
          what we did, and what you should do.
        </p>
      </>
    ),
  },
  {
    id: "your-part",
    title: "What we need from you",
    body: (
      <p>
        Use a unique password and turn on multi-factor authentication. Give
        connected credentials the narrowest scope a workflow needs, rotate them
        periodically, and remove workspace members when they leave. Most
        real-world incidents start with an over-scoped API key.
      </p>
    ),
  },
];

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="Security"
      title="Security at Cilbs"
      intro="Workflows hold credentials and customer data, so the boring parts — encryption, isolation, access control, and a real disclosure process — matter more than the features."
      updated={UPDATED}
      sections={SECTIONS}
      contact={{ label: "Report a vulnerability", email: "security@cilbs.com" }}
    />
  );
}
