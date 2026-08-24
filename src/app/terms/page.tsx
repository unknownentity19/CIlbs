import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The agreement between you and Cilbs Labs Inc. — accounts, plans and billing, acceptable use, ownership of your content, and the limits of our liability.",
};

const UPDATED = "19 August 2026";

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "The agreement",
    body: (
      <>
        <p>
          These terms are a contract between you and Cilbs Labs Inc. By creating
          an account or using the service you accept them. If you are agreeing on
          behalf of a company, you confirm you are allowed to bind it.
        </p>
        <p>
          If you don&apos;t accept these terms, don&apos;t use the service — the
          marketing pages are free to read either way.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <>
        <p>
          You are responsible for the accuracy of your account details, for
          keeping your credentials secret, and for everything that happens under
          your account. Tell us promptly if you suspect unauthorised access.
        </p>
        <p>
          You must be at least 16 years old, and you must not use the service if
          a law that applies to you prohibits it.
        </p>
      </>
    ),
  },
  {
    id: "plans",
    title: "Plans, billing, and renewals",
    body: (
      <>
        <p>
          Paid plans are billed in advance on the interval you choose and renew
          automatically until cancelled. Cancel any time; the change takes effect
          at the end of the current period, and you keep access until then.
        </p>
        <p>
          Usage above your plan&apos;s included limits is billed at the rates
          shown on the pricing page at the time of use. Prices can change with 30
          days&apos; notice, never mid-period. Fees are exclusive of taxes.
        </p>
        <p>
          Refunds are handled case by case — write to us and we will be
          reasonable about it.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>Don&apos;t use Cilbs to:</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>break the law, or help someone else break it;</li>
          <li>
            send unsolicited bulk messages, or scrape or harvest data you have no
            right to;
          </li>
          <li>
            attack, overload, or probe our infrastructure or anyone else&apos;s;
          </li>
          <li>
            build systems that surveil, profile, or make consequential decisions
            about people without a lawful basis;
          </li>
          <li>
            generate content that harasses, defames, or sexualises minors, or
            that infringes someone&apos;s rights.
          </li>
        </ul>
        <p>
          We may suspend an account that puts the service or other customers at
          risk. Where we can, we warn first.
        </p>
      </>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    body: (
      <>
        <p>
          Your workflows, prompts, data, and outputs are yours. You grant us only
          the licence we need to host and run them for you, and it ends when you
          delete the content or close your account.
        </p>
        <p>
          You are responsible for having the rights to the data you put into the
          service and for how you use what comes out of it — including checking
          model output before acting on it.
        </p>
      </>
    ),
  },
  {
    id: "our-content",
    title: "Our content",
    body: (
      <p>
        The service, the site, and our trademarks stay ours. You may not copy,
        resell, or reverse engineer the service, or use our branding without
        written permission. Feedback you send us is fair game for us to use
        without obligation.
      </p>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party services and models",
    body: (
      <p>
        Workflows can call services we don&apos;t operate — model providers,
        SaaS APIs, your own endpoints. Their terms govern their side, their
        outages are outside our control, and their charges are between you and
        them. We are not liable for what a third-party service does with data
        your workflow sends it.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and support",
    body: (
      <p>
        We aim to keep the service available and to give notice before planned
        maintenance. Uptime commitments, response times, and remedies, where they
        apply, are the ones set out in your plan or order form.
      </p>
    ),
  },
  {
    id: "warranty",
    title: "Warranty disclaimer",
    body: (
      <p>
        Except where your plan says otherwise, the service is provided &ldquo;as
        is&rdquo; and without warranties of any kind — including merchantability,
        fitness for a particular purpose, and non-infringement. Automated systems
        and language models make mistakes; keep a human in the loop for decisions
        that matter.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the extent the law allows, neither party is liable for indirect,
        incidental, or consequential damages, or for lost profits or data. Our
        total liability for any claim is capped at the fees you paid us in the 12
        months before the claim arose. Nothing here limits liability that cannot
        be limited by law.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <p>
        You can close your account at any time. We can suspend or terminate an
        account for a material breach of these terms, for non-payment, or if
        required by law. On termination your right to use the service ends and we
        delete your data on the schedule described in the privacy policy — export
        anything you need first.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        We may update these terms as the product evolves. Material changes are
        announced at least 14 days before they take effect; continuing to use the
        service after that means you accept the new version.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of the State of Delaware, without
        regard to its conflict-of-laws rules, and the state and federal courts
        located there have exclusive jurisdiction. Nothing in this section
        removes a consumer protection you have where you live.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Service"
      intro="What you can expect from us, what we expect from you, and how this ends if either of us wants it to."
      updated={UPDATED}
      sections={SECTIONS}
      contact={{ label: "Legal questions", email: "legal@cilbs.com" }}
    />
  );
}
