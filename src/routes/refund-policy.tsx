import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — CHKPLT" },
      {
        name: "description",
        content:
          "CHKPLT's refund policy for digital downloads, workbooks, and Premium Programs.",
      },
      { property: "og:title", content: "Refund Policy — CHKPLT" },
      {
        property: "og:description",
        content:
          "Refund rules for digital products, courses, and gated cohorts on CHKPLT.",
      },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pt-20 pb-24 prose prose-invert prose-headings:font-display">
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          Legal · Last updated June 2026
        </p>
        <h1 className="font-display text-5xl leading-[1.05] mt-3">
          Refund Policy
        </h1>

        <h2>Foundation Kit — the 7-Day Roadmap Guarantee</h2>
        <p>
          We stand behind the Foundation Kit on results, not just access.
          Complete the <strong>Niche Clarity Workbook</strong> and the{" "}
          <strong>Knowledge Audit</strong>, and if you do not walk away with a
          defined asset roadmap within 7 days of purchase, email{" "}
          <a href="mailto:support@chkplt.com" className="text-banana">
            support@chkplt.com
          </a>{" "}
          with your completed work and we will refund 100% of your order. The
          completed work is required so we can see you gave the frameworks a
          genuine attempt — this protects the guarantee for everyone.
        </p>

        <h2>Other digital downloads and workbooks</h2>
        <p>
          Other workbooks, ebooks, and template packs are delivered instantly
          and cannot be returned, so those sales are final once the download
          link has been issued. If you experience a technical issue accessing
          any file you paid for, email{" "}
          <a href="mailto:support@chkplt.com" className="text-banana">
            support@chkplt.com
          </a>{" "}
          within 7 days and we will repair access or refund the order.
        </p>

        <h2>Courses with video content</h2>
        <p>
          For self-paced courses with video lessons, you may request a refund
          within 7 days of purchase, provided you have completed less than 25%
          of the lessons. Refund requests after that window or beyond that
          progress threshold will not be granted.
        </p>

        <h2>Premium Programs (Pro Cohort & VIP Tier)</h2>
        <p>
          The 90-Day Pro Cohort and VIP Tier are gated, capacity-limited
          enrollments. Once your seat is confirmed and onboarding materials
          have been issued, your enrollment is non-refundable. If you withdraw
          before the cohort officially begins (kickoff call), you may receive
          a 50% refund or a full credit toward a future cohort, at your
          choice. After kickoff, no refunds are issued — the implementation
          guarantee applies instead (see your enrollment confirmation).
        </p>

        <h2>Failed or duplicate charges</h2>
        <p>
          If Paystack charges you twice for the same order or you were charged
          but never received product access, contact us within 14 days and we
          will refund or grant access immediately.
        </p>

        <h2>How to request a refund</h2>
        <p>
          Email{" "}
          <a href="mailto:support@chkplt.com" className="text-banana">
            support@chkplt.com
          </a>{" "}
          with your order reference (visible in your receipt). We respond
          within 2 business days.
        </p>
      </article>
      <SiteFooter />
    </div>
  );
}
