import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GARDENS, formatPrice, type Garden } from "@/lib/gardens";
import { useAuth } from "@/lib/auth-context";
import { initializeCheckout } from "@/lib/checkout.functions";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

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
        <Link to="/products" className="mt-6 inline-block text-banana">← Back to gardens</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <SiteHeader />
        <div className="mx-auto max-w-3xl py-32">
          <h1 className="font-display text-3xl">Couldn't load product.</h1>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          <Button onClick={() => { router.invalidate(); reset(); }} className="mt-6">Try again</Button>
        </div>
      </div>
    );
  },
});

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

  const { data: seedProduct } = useQuery({
    queryKey: ["product-seed", product?.seed_to_product_id],
    enabled: !!product?.seed_to_product_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug, title, tagline, price_cents, currency, is_free, garden")
        .eq("id", product!.seed_to_product_id!)
        .maybeSingle();
      if (error) throw error;
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

  const gardenMeta = product.garden ? GARDENS[product.garden as Garden] : null;
  const priceLabel = formatPrice(product.price_cents, product.currency, product.is_free);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        {gardenMeta && (
          <Link
            to="/products/garden/$garden"
            params={{ garden: gardenMeta.slug }}
            className="font-mono text-xs text-muted-foreground hover:text-banana"
          >
            ← {gardenMeta.name} garden
          </Link>
        )}
        <div className="mt-6 font-mono text-xs tracking-[0.25em] uppercase text-banana">
          {product.tagline}
        </div>
        <h1 className="mt-3 font-display text-5xl md:text-6xl leading-[1.05]">{product.title}</h1>

        <div className="mt-10 flex items-baseline gap-4 flex-wrap">
          <div className="font-display text-5xl text-banana">{priceLabel}</div>
          {!product.is_free && !product.requires_application && (
            <div className="font-mono text-xs text-muted-foreground">one-time</div>
          )}
          {product.requires_application && (
            <div className="font-mono text-xs text-muted-foreground">/ by application</div>
          )}
        </div>

        {product.description && (
          <p className="mt-10 text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        )}

        {/* Metadata strip */}
        <dl className="mt-12 grid gap-px bg-border border border-border md:grid-cols-2">
          {product.format && (
            <div className="bg-background p-5">
              <dt className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Format</dt>
              <dd className="mt-2 text-sm">{product.format}</dd>
            </div>
          )}
          {product.target_audience && (
            <div className="bg-background p-5">
              <dt className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">For</dt>
              <dd className="mt-2 text-sm">{product.target_audience}</dd>
            </div>
          )}
          {product.cohort_capacity && (
            <div className="bg-background p-5">
              <dt className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Capacity</dt>
              <dd className="mt-2 text-sm">{product.cohort_capacity} seats per cohort</dd>
            </div>
          )}
          {product.scripture_root && (
            <div className="bg-background p-5 md:col-span-2">
              <dt className="font-mono text-xs tracking-[0.2em] uppercase text-banana">Scripture root</dt>
              <dd className="mt-2 text-sm italic">{product.scripture_root}</dd>
            </div>
          )}
        </dl>

        {/* CTA */}
        <BuyBlock product={product} priceLabel={priceLabel} />


        {/* Seed to next */}
        {seedProduct && (
          <Link
            to="/products/$slug"
            params={{ slug: seedProduct.slug }}
            className="group mt-20 block border-t border-border pt-10"
          >
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              Next seed →
            </div>
            <div className="mt-4 flex items-end justify-between gap-6">
              <div>
                <div className="font-mono text-xs text-muted-foreground">{seedProduct.tagline}</div>
                <h3 className="mt-2 font-display text-3xl group-hover:text-banana transition-colors">
                  {seedProduct.title}
                </h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <span>{formatPrice(seedProduct.price_cents, seedProduct.currency, seedProduct.is_free)}</span>
                <ArrowRight className="size-4 group-hover:text-banana transition-colors" />
              </div>
            </div>
          </Link>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}
