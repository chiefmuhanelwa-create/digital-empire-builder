import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CHKPLT" },
      {
        name: "description",
        content:
          "How CHKPLT collects, uses, and protects your personal information under POPIA and GDPR.",
      },
      { property: "og:title", content: "Privacy Policy — CHKPLT" },
      {
        property: "og:description",
        content:
          "POPIA- and GDPR-aligned privacy practices for the CHKPLT.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pt-20 pb-24 prose prose-invert prose-headings:font-display">
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          Legal · Last updated June 2026
        </p>
        <h1 className="font-display text-5xl leading-[1.05] mt-3">
          Privacy Policy
        </h1>

        <p>
          This policy explains what personal information CHKPLT collects, why
          we collect it, and the rights you have under the Protection of
          Personal Information Act (POPIA, South Africa) and the General Data
          Protection Regulation (GDPR, EU/UK).
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> email address, full name, phone
            number (optional), authentication tokens.
          </li>
          <li>
            <strong>Order data:</strong> products purchased, amounts, currency,
            VAT/tax allocations, payment provider reference.
          </li>
          <li>
            <strong>Application data:</strong> answers you submit in the
            Stewardship Application (audience metrics, income streams, content
            cadence).
          </li>
          <li>
            <strong>Learning data:</strong> lesson completion, last position in
            video lessons.
          </li>
          <li>
            <strong>Technical data:</strong> IP address, browser, device type
            (for security and abuse prevention only).
          </li>
        </ul>

        <h2>Why we collect it</h2>
        <ul>
          <li>To deliver products and grant access to your purchases.</li>
          <li>To process payments and meet tax reporting obligations.</li>
          <li>To send transactional emails (receipts, magic links, course updates).</li>
          <li>To improve our products and detect fraud.</li>
        </ul>

        <h2>Who we share data with</h2>
        <ul>
          <li>
            <strong>Paystack</strong> — payment processing.
          </li>
          <li>
            <strong>CHKPLT infrastructure</strong> — Cloudflare Workers (hosting), Supabase (database), Resend (email).
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> — bot protection on forms.
          </li>
        </ul>
        <p>We do not sell personal information to third parties.</p>

        <h2>Your rights</h2>
        <p>
          You may request a copy, correction, or deletion of your data at any
          time by emailing{" "}
          <a href="mailto:privacy@chkplt.com" className="text-banana">
            privacy@chkplt.com
          </a>
          . We will respond within 30 days. You may also lodge a complaint with
          the South African Information Regulator or your local supervisory
          authority.
        </p>

        <h2>Retention</h2>
        <p>
          Account and order records are retained for at least 5 years to meet
          tax law requirements. You may close your account at any time, but
          financial records will be retained as required by law.
        </p>

        <h2>Cookies</h2>
        <p>
          We use strictly necessary cookies for authentication and session
          management. We do not use third-party advertising cookies.
        </p>

        <h2>Contact</h2>
        <p>
          Data Protection contact:{" "}
          <a href="mailto:privacy@chkplt.com" className="text-banana">
            privacy@chkplt.com
          </a>
          .
        </p>
      </article>
      <SiteFooter />
    </div>
  );
}
