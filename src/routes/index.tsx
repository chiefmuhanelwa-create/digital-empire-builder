import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { MarketplaceHome, fetchMarketplaceProducts } from "@/components/MarketplaceHome";

// Rebuilt 2026-07-28: CHKPLT's homepage is now the digital products
// marketplace (replicating the real, live Shopify storefront design), not
// the old single-product Foundation Kit funnel. That funnel's entire content
// (984 lines: hero, definition, founder-story proof, the 7-stage system,
// value stack, before/after, testimonials, guarantee, FAQ, final CTA, and a
// dedicated CheckoutModal) has been removed per explicit founder instruction
// — Foundation Kit, Starter Kit, and Accelerator now live entirely on
// contentpreneur.africa (see that project's /foundation, /starterkit,
// /accelerator), not chkplt.com. CHKPLT sells assets; it doesn't sell the
// transformation funnel anymore.
const STRUCTURED_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://chkplt.com/#org",
      name: "CHKPLT",
      legalName: "NOCHILL PTY LTD",
      url: "https://chkplt.com",
      description: "A digital products marketplace for African content creators and Contentpreneurs.",
      founder: { "@type": "Person", name: "Ndivhuwo Muhanelwa", alternateName: "NoChill" },
      areaServed: [
        { "@type": "Country", name: "South Africa" },
        { "@type": "Continent", name: "Africa" },
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://chkplt.com/#website",
      url: "https://chkplt.com",
      name: "CHKPLT",
      inLanguage: "en-ZA",
      publisher: { "@id": "https://chkplt.com/#org" },
    },
  ],
});

export const Route = createFileRoute("/")({
  loader: () => fetchMarketplaceProducts(),
  head: () => ({
    meta: [
      { title: "CHKPLT — Digital Products for African Creators" },
      {
        name: "description",
        content:
          "Workbooks, guides, and tools for African content creators and Contentpreneurs — instant digital download.",
      },
      { property: "og:title", content: "CHKPLT — Digital Products for African Creators" },
      {
        property: "og:description",
        content: "Workbooks, guides, and tools for African content creators and Contentpreneurs.",
      },
      { property: "og:locale", content: "en_ZA" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const products = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />
      <SiteHeader />
      <MarketplaceHome initialProducts={products} />
      <SiteFooter />
    </div>
  );
}
