import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { MarketplaceHome, fetchMarketplaceProducts } from "@/components/MarketplaceHome";

export const Route = createFileRoute("/products/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
  }),
  loader: () => fetchMarketplaceProducts(),
  head: () => ({
    meta: [
      { title: "Products — CHKPLT" },
      { name: "description", content: "Digital products for African content creators and Contentpreneurs." },
      { property: "og:title", content: "Products — CHKPLT" },
      { property: "og:description", content: "Every tool. Every framework. Every system." },
    ],
  }),
  component: Catalog,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background text-foreground p-8">
      <SiteHeader />
      <div className="mx-auto max-w-3xl py-32">
        <h1 className="font-display text-4xl">Couldn't load the shop.</h1>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    </div>
  ),
});

function Catalog() {
  const products = Route.useLoaderData();
  const { q } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <MarketplaceHome initialProducts={products} initialSearch={q ?? ""} />
      <SiteFooter />
    </div>
  );
}
