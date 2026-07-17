import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — CHKPLT" },
      {
        name: "description",
        content:
          "The terms governing your use of CHKPLT, our digital products, cohorts, and learning portal.",
      },
      { property: "og:title", content: "Terms of Service — CHKPLT" },
      {
        property: "og:description",
        content:
          "Terms governing CHKPLT digital products, cohorts, and learning portal.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pt-20 pb-24 prose prose-invert prose-headings:font-display">
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          Legal · Last updated June 2026
        </p>
        <h1 className="font-display text-5xl leading-[1.05] mt-3">
          Terms of Service
        </h1>

        <h2>1. Who we are</h2>
        <p>
          CHKPLT (“we”, “us”) is operated from the
          Republic of South Africa and provides digital products, downloadable
          assets, online courses, cohorts, and mentorship programs to creators
          and entrepreneurs worldwide.
        </p>

        <h2>2. Accounts</h2>
        <p>
          You must provide accurate information when creating an account. You
          are responsible for activity that happens under your account. We
          reserve the right to suspend accounts that abuse the platform,
          attempt to share paid content, or violate these terms.
        </p>

        <h2>3. Purchases and access</h2>
        <p>
          When you purchase a product, you receive a non-transferable license
          to access that product for personal use. Premium Programs (the 90-Day
          Pro Cohort and VIP Tier) require qualification through our
          application process before checkout is unlocked. We may refuse,
          revoke, or defer enrollment at our sole discretion if a buyer does
          not meet the published prerequisites.
        </p>

        <h2>4. Payments</h2>
        <p>
          All payments are processed by Paystack. Prices are displayed in South
          African Rand (ZAR) and include applicable VAT where required. By
          completing a purchase you authorize the charge and agree to the
          payment processor’s terms.
        </p>

        <h2>5. Intellectual property</h2>
        <p>
          All content — workbooks, videos, frameworks, templates, and software —
          is owned by CHKPLT or its licensors. You may not redistribute,
          resell, publish, or share login credentials. Violations result in
          immediate access revocation without refund.
        </p>

        <h2>6. Acceptable use</h2>
        <p>
          You agree not to attempt to bypass access controls, scrape content,
          or use the platform to harm others. Reverse engineering or
          circumvention of paywalls is prohibited.
        </p>

        <h2>7. Disclaimers</h2>
        <p>
          The platform is provided “as is.” We make no guarantee of specific
          income, audience growth, or business results. Outcomes depend on
          your effort, market conditions, and execution. Our Foundation Kit
          “7-Day Roadmap Guarantee” is a satisfaction-based refund term (you
          complete the workbooks and receive a defined roadmap, or your money
          back) — it is not a promise of income, and its full conditions are
          set out in the <a href="/refund-policy" className="text-banana">Refund Policy</a>.
        </p>

        <h2>8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, CHKPLT’s total liability for
          any claim relating to the platform is limited to the amount you paid
          us in the twelve (12) months preceding the claim.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may update these terms from time to time. Material changes will be
          announced on the site or by email. Continued use after changes means
          you accept the updated terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions? Email{" "}
          <a href="mailto:support@chkplt.com" className="text-banana">
            support@chkplt.com
          </a>
          .
        </p>
      </article>
      <SiteFooter />
    </div>
  );
}
