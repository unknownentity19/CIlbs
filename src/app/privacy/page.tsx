import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What data Cilbs collects, why we collect it, how long we keep it, who we share it with, and the controls you have over it.",
};

const UPDATED = "19 August 2026";

const SECTIONS: LegalSection[] = [
  {
    id: "scope",
    title: "Scope",
    body: (
      <>
        <p>
          This policy covers cilbs.com, the Cilbs web application, and the API.
          It explains what we collect, why, and what you can do about it. It does
          not cover third-party services you connect to a workflow — those are
          governed by their own policies, and the connection is yours to revoke.
        </p>
        <p>
          Cilbs Labs Inc. is the controller of the personal data described here.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <p>
          <strong>Account data.</strong> Your name, email address, workspace
          name, and authentication metadata. You give us this when you sign up.
        </p>
        <p>
          <strong>Workflow content.</strong> The workflows you build — nodes,
          configuration, prompts, and connected credentials — plus the run
          history those workflows produce.
        </p>
        <p>
          <strong>Usage data.</strong> Pages viewed, features used, and
          performance timings, recorded in aggregate so we can tell which parts
          of the product are working. We do not build advertising profiles and we
          do not sell any of it.
        </p>
        <p>
          <strong>Technical data.</strong> IP address, browser and device type,
          and error diagnostics, retained for security and debugging.
        </p>
        <p>
          The public marketing site works without an account. The studio at{" "}
          <code>/studio</code> requires one, and keeps a copy of your working
          draft in your own browser&apos;s local storage as well as in your
          account.
        </p>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we use it",
    body: (
      <>
        <p>
          To run the service you asked for: executing workflows, storing drafts,
          showing run history, and providing support. To keep the service safe:
          detecting abuse, rate-limiting, and investigating incidents. To bill
          you, where a paid plan applies. And to improve the product, using
          aggregated usage data rather than the contents of your workflows.
        </p>
        <p>
          Where the GDPR applies, our legal bases are performance of a contract
          (running the service), legitimate interests (security, product
          improvement), and consent (optional communications).
        </p>
      </>
    ),
  },
  {
    id: "workflow-content",
    title: "Your workflow content",
    body: (
      <>
        <p>
          Workflow content belongs to you. We access it only to operate the
          service, to fix a problem you have reported, or where the law requires
          it. We do not use it to train models, and we do not share it with other
          customers.
        </p>
        <p>
          Credentials you connect are encrypted at rest and are only decrypted at
          the moment a run needs them.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>
          Infrastructure and tooling providers acting on our instructions —
          hosting, database, email delivery, error monitoring, and payment
          processing. Each is bound by a data-processing agreement and receives
          only what it needs.
        </p>
        <p>
          Model providers, when your workflow includes an AI step: that step&apos;s
          input is sent to the provider you selected for that node, and nowhere
          else.
        </p>
        <p>
          We disclose data to authorities only when compelled by valid legal
          process, and we tell you unless we are legally prohibited from doing
          so.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <>
        <p>
          We use a small number of first-party cookies and local-storage keys:
          your session, your theme preference, and your studio draft. There are
          no third-party advertising or cross-site tracking cookies on this site.
        </p>
        <p>
          Clearing site data in your browser removes all of them; the studio
          draft is gone for good at that point, so export anything you want to
          keep first.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <p>
          Account and workflow data live as long as your account does. Delete a
          workflow and it leaves active systems immediately and backups within 30
          days. Close your account and we delete or anonymise your data within 30
          days, except records we must keep for tax and accounting purposes.
        </p>
        <p>Run logs are retained according to your plan&apos;s retention window.</p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          You can access, correct, export, or delete your data — most of it
          directly in the product, and the rest by writing to us. You can object
          to processing based on legitimate interests, and you can withdraw
          consent for optional messages at any time.
        </p>
        <p>
          If you are in the EEA or the UK you may complain to your local
          supervisory authority. If you are in California, we do not sell or
          share personal information as those terms are defined by the CCPA.
        </p>
        <p>We answer rights requests within 30 days.</p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: (
      <p>
        Our infrastructure runs in the United States and the European Union.
        Where data leaves the EEA or the UK we rely on Standard Contractual
        Clauses with the receiving provider. Enterprise plans can pin processing
        to a single region.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Cilbs is not directed at children under 16, and we do not knowingly
        collect their data. If you believe a child has given us personal data,
        write to us and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We update this page when the product changes. Material changes are
        announced by email or in the product at least 14 days before they take
        effect, and the date at the top always reflects the current version.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="The short version: we collect what the product needs to work, we don't sell it, we don't train on your workflows, and you can take it with you or delete it whenever you want."
      updated={UPDATED}
      sections={SECTIONS}
      contact={{ label: "Privacy questions", email: "privacy@cilbs.com" }}
    />
  );
}
