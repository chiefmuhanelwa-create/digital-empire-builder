import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — CHKPLT` },
      { name: "description", content: "CHKPLT product details and checkout." },
    ],
  }),
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-display text-5xl">Product not found.</h1>
        <Link to="/products" className="mt-6 inline-block text-banana">← Back to catalog</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="font-display text-3xl">Couldn't load product.</h1>
      <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
    </div>
  ),
});

function formatPrice(cents: number, currency: string) {
  const v = (cents / 100).toLocaleString("en-NG");
  return `${currency === "NGN" ? "₦" : currency + " "}${v}`;
}

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-32 animate-pulse">
          <div className="h-12 w-2/3 bg-muted rounded" />
          <div className="mt-6 h-4 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }
  if (!product) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <Link to="/products" className="font-mono text-xs text-muted-foreground hover:text-banana">← Catalog</Link>
        <div className="mt-6 font-mono text-xs tracking-[0.25em] uppercase text-banana">{product.tagline}</div>
        <h1 className="mt-3 font-display text-5xl md:text-6xl">{product.title}</h1>

        <div className="mt-10 flex items-baseline gap-4">
          <div className="font-display text-4xl text-banana">{formatPrice(product.price_cents, product.currency)}</div>
          <div className="font-mono text-xs text-muted-foreground">one-time</div>
        </div>

        <p className="mt-10 text-lg text-muted-foreground leading-relaxed">{product.description}</p>

        <div className="mt-12 flex gap-3">
          <Button size="lg" disabled className="bg-banana text-banana-foreground">
            Checkout — coming in Phase 02
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
