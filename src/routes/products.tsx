import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Catalog — CHKPLT" },
      { name: "description", content: "Browse CHKPLT digital products, courses, and cohorts." },
      { property: "og:title", content: "CHKPLT Catalog" },
      { property: "og:description", content: "Courses, cohorts, and digital products." },
    ],
  }),
  component: Catalog,
});

function formatPrice(cents: number, currency: string) {
  const v = (cents / 100).toLocaleString("en-NG");
  return `${currency === "NGN" ? "₦" : currency + " "}${v}`;
}

function Catalog() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Catalog</div>
        <h1 className="mt-4 font-display text-5xl md:text-6xl">Everything we sell.</h1>

        <div className="mt-16 grid gap-px bg-border md:grid-cols-2">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-background p-8 h-64 animate-pulse" />
          ))}
          {products?.map((p) => (
            <Link
              key={p.id}
              to="/products/$slug"
              params={{ slug: p.slug }}
              className="group relative bg-background p-8 transition-colors hover:bg-card flex flex-col justify-between min-h-64"
            >
              <div>
                <div className="font-mono text-xs text-muted-foreground">{p.tagline}</div>
                <h2 className="mt-3 font-display text-3xl group-hover:text-banana transition-colors">{p.title}</h2>
              </div>
              <div className="mt-8 flex items-end justify-between">
                <div className="font-mono text-sm">{formatPrice(p.price_cents, p.currency)}</div>
                <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-banana transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
