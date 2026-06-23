import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { GARDENS, type Garden } from "@/lib/gardens";
import { formatPrice } from "@/lib/gardens";
import { useCountry } from "@/lib/currency";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function isGarden(v: string): v is Garden {
  return v === "deshe" || v === "esev" || v === "etz_pri" || v === "devarim";
}

export const Route = createFileRoute("/products/garden/$garden")({
  head: ({ params }) => {
    const meta = isGarden(params.garden) ? GARDENS[params.garden] : null;
    const title = meta ? `${meta.name} — ${meta.tagline} — Christ Kingdom Platform` : "Collection — Christ Kingdom Platform";
    const desc = meta?.description ?? "Christ Kingdom Platform products.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: GardenPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-display text-5xl">Collection not found.</h1>
        <Link to="/products" className="mt-6 inline-block text-banana">← All collections</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <SiteHeader />
        <div className="mx-auto max-w-3xl py-32">
          <h1 className="font-display text-4xl">Couldn't load this collection.</h1>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          <Button onClick={() => { router.invalidate(); reset(); }} className="mt-6">Try again</Button>
        </div>
      </div>
    );
  },
});

function GardenPage() {
  const { garden } = Route.useParams();
  const country = useCountry();
  if (!isGarden(garden)) throw notFound();
  const meta = GARDENS[garden];

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "garden", garden],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .eq("garden", garden)
        .order("sort_order", { ascending: true })
        .order("price_cents", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-8">
        <Link to="/products" className="font-mono text-xs text-muted-foreground hover:text-banana">
          ← All collections
        </Link>
        <div className="mt-8">
          <h1 className="font-display text-6xl md:text-7xl">{meta.name}</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{meta.tagline}</p>
          <p className="mt-3 max-w-2xl text-base text-foreground/80 leading-relaxed">
            {meta.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-muted h-56 animate-pulse" />
          ))}
          {products?.map((p) => (
            <Link
              key={p.id}
              to="/products/$slug"
              params={{ slug: p.slug }}
              className="nx-card group flex min-h-56 flex-col justify-between !p-8"
            >
              <div>
                <div className="font-mono text-xs text-muted-foreground">{p.tagline}</div>
                <h2 className="mt-3 font-display text-2xl sm:text-3xl text-foreground group-hover:text-banana transition-colors">
                  {p.title}
                </h2>
                {p.target_audience && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{p.target_audience}</p>
                )}
              </div>
              <div className="mt-8 flex items-end justify-between">
                <div className="font-mono text-sm text-foreground">
                  {formatPrice(p.price_cents, p.currency, p.is_free, p.slug, country)}
                  {p.requires_application && (
                    <span className="ml-2 text-xs text-muted-foreground">/ application</span>
                  )}
                </div>
                <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-banana transition-colors" />
              </div>
            </Link>
          ))}
          {products && products.length === 0 && (
            <div className="rounded-2xl border border-border bg-muted p-12 col-span-full text-center text-muted-foreground">
              No products published in this garden yet.
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
