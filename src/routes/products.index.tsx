import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { GARDENS, GARDEN_ORDER, type Garden } from "@/lib/gardens";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Shop — Christ Kingdom Platform" },
      { name: "description", content: "Free tools, paid workbooks and courses, premium programs, and books for Kingdom Contentpreneurs." },
      { property: "og:title", content: "Shop — Christ Kingdom Platform" },
      { property: "og:description", content: "Everything we offer, in one place." },
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

function Catalog() {
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
          Shop
        </div>
        <h1 className="mt-4 font-display text-5xl md:text-7xl leading-[1.05] max-w-3xl">
          Everything you need<br />
          <em className="text-banana not-italic">to grow as a Kingdom Contentpreneur.</em>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">
          Free tools to get started. Paid workbooks and courses when you're ready to level up.
          Premium programs when you go full-time.
        </p>

        <div className="mt-20 grid gap-px bg-border md:grid-cols-2 border border-border">
          {GARDEN_ORDER.map((g: Garden) => {
            const meta = GARDENS[g];
            const count = counts?.[g] ?? 0;
            return (
              <Link
                key={g}
                to="/products/garden/$garden"
                params={{ garden: g }}
                className="group relative bg-background p-10 transition-colors hover:bg-card min-h-[260px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
                        {meta.priceRange}
                      </div>
                      <h2 className="mt-3 font-display text-4xl group-hover:text-banana transition-colors">
                        {meta.name}
                      </h2>
                    </div>
                    <ArrowUpRight className="size-6 text-muted-foreground group-hover:text-banana transition-colors" />
                  </div>
                  <p className="mt-6 text-base text-foreground/80 leading-relaxed">
                    {meta.description}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-end font-mono text-xs">
                  <span className="text-banana">{count} {count === 1 ? "item" : "items"}</span>
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
