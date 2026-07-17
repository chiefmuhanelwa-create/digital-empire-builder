import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { GARDENS, GARDEN_ORDER, type Garden } from "@/lib/gardens";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Products — Christ Kingdom Platform" },
      { name: "description", content: "Workbooks, courses, and the Contentpreneur Accelerator. Pick your level." },
      { property: "og:title", content: "Products — Christ Kingdom Platform" },
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
          Products
        </div>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-7xl leading-[1.05] max-w-3xl">
          Every tool.{" "}
          <em className="text-banana not-italic">Every framework. Every system.</em>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">
          Workbooks, courses, and the Contentpreneur Accelerator. Pick your level.
        </p>

        {/* Entry offer spotlight */}
        <div className="mt-12 border-2 border-banana/40 bg-banana/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-banana">Start here</div>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl text-foreground">Contentpreneur Foundation Kit</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
              Frameworks, templates, content calendar. The complete starting system — $97, instant access.
            </p>
          </div>
          <Button asChild className="cta-glow shrink-0 h-11 px-6 font-bold text-sm">
            <Link to="/products/$slug" params={{ slug: "called-expert-foundation-kit" }}>
              Get the Kit — $97 →
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {GARDEN_ORDER.map((g: Garden) => {
            const meta = GARDENS[g];
            const count = counts?.[g] ?? 0;
            return (
              <Link
                key={g}
                to="/products/garden/$garden"
                params={{ garden: g }}
                className="nx-card group flex min-h-[260px] flex-col justify-between !p-8"
              >
                <div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h2 className="font-display text-3xl sm:text-4xl text-foreground group-hover:text-banana transition-colors">
                        {meta.name}
                      </h2>
                    </div>
                    <ArrowUpRight className="size-6 text-muted-foreground group-hover:text-banana transition-colors" />
                  </div>
                  <p className="mt-6 text-base text-muted-foreground leading-relaxed">
                    {meta.description}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-end font-mono text-xs">
                  <span className="nx-status-live">
                    <span className="nx-live-dot" aria-hidden />
                    {count} {count === 1 ? "item" : "items"}
                  </span>
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
