import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { GARDENS, GARDEN_ORDER, type Garden } from "@/lib/gardens";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "The 4 Gardens — CHKPLT" },
      { name: "description", content: "Free products, paid digital tools, premium courses, and books. The CHKPLT product ecosystem, organised by Genesis 1:11–12." },
      { property: "og:title", content: "The 4 Gardens — CHKPLT" },
      { property: "og:description", content: "Deshe, Esev, Etz Pri, Devarim. The complete CHKPLT product ecosystem." },
    ],
  }),
  component: Gardens,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background text-foreground p-8">
      <SiteHeader />
      <div className="mx-auto max-w-3xl py-32">
        <h1 className="font-display text-4xl">Couldn't load gardens.</h1>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground p-8">
      <SiteHeader />
      <div className="mx-auto max-w-3xl py-32 text-center">
        <h1 className="font-display text-4xl">Not found.</h1>
        <Link to="/" className="mt-6 inline-block text-banana">← Home</Link>
      </div>
    </div>
  ),
});

function Gardens() {
  const { data: counts } = useQuery({
    queryKey: ["product-counts-by-garden"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("garden")
        .eq("status", "published");
      if (error) throw error;
      const tally: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.garden) tally[row.garden] = (tally[row.garden] ?? 0) + 1;
      }
      return tally;
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          ◆ The Product Ecosystem
        </div>
        <h1 className="mt-4 font-display text-5xl md:text-7xl leading-[1.05] max-w-3xl">
          Four gardens.<br />
          <em className="text-banana not-italic">One ascension.</em>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">
          On Day 3 of creation, God made three kinds of vegetation — each with a different
          economic function. CHKPLT mirrors that pattern. Every product is a seed pointing to
          the next.
        </p>

        <div className="mt-20 grid gap-px bg-border md:grid-cols-2">
          {GARDEN_ORDER.map((g: Garden) => {
            const meta = GARDENS[g];
            const count = counts?.[g] ?? 0;
            return (
              <Link
                key={g}
                to="/products/garden/$garden"
                params={{ garden: g }}
                className="group relative bg-background p-10 transition-colors hover:bg-card min-h-[280px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
                        Garden — {meta.priceRange}
                      </div>
                      <h2 className="mt-3 font-display text-5xl group-hover:text-banana transition-colors">
                        {meta.name}
                      </h2>
                      <div className="mt-1 font-display text-2xl text-muted-foreground/60">
                        {meta.hebrew}
                      </div>
                    </div>
                    <ArrowUpRight className="size-6 text-muted-foreground group-hover:text-banana transition-colors" />
                  </div>
                  <p className="mt-6 text-sm italic text-muted-foreground">{meta.tagline}</p>
                  <p className="mt-3 text-base text-foreground/80 leading-relaxed">
                    {meta.description}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between font-mono text-xs">
                  <span className="text-muted-foreground">{meta.scripture}</span>
                  <span className="text-banana">{count} {count === 1 ? "product" : "products"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
