import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/gardens";
import { BookOpen } from "lucide-react";

type Row = {
  slug: string;
  title: string;
  tagline: string | null;
  cover_image_url: string | null;
  price_cents: number;
  currency: string;
  is_free: boolean;
};

export function DashboardProducts({ mode }: { mode: "free" | "paid" }) {
  const q = useQuery({
    queryKey: ["dashboard-products", mode],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("slug,title,tagline,cover_image_url,price_cents,currency,is_free,requires_application,status")
        .eq("status", "published");
      query = mode === "free" ? query.eq("is_free", true) : query.eq("is_free", false).eq("requires_application", false);
      const { data, error } = await query.order("price_cents", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const isFree = mode === "free";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/dashboard" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">
          ← Back to dashboard
        </Link>

        {/* Free / Paid switch */}
        <div className="mt-4 mb-6 inline-flex rounded-full border-2 border-[var(--border)] p-1">
          <Link
            to="/dashboard/products/free"
            className="rounded-full px-5 py-2 text-sm font-semibold text-[var(--text-dim)] [&.active]:bg-[var(--nx-gold)] [&.active]:text-[#0F172A]"
            activeProps={{ className: "active" }}
          >
            Free
          </Link>
          <Link
            to="/dashboard/products/paid"
            className="rounded-full px-5 py-2 text-sm font-semibold text-[var(--text-dim)] [&.active]:bg-[var(--nx-gold)] [&.active]:text-[#0F172A]"
            activeProps={{ className: "active" }}
          >
            Paid
          </Link>
        </div>

        <h1 className="mb-2">{isFree ? "Free Resources" : "Paid Products"}</h1>
        <p className="nx-body max-w-2xl mb-10">
          {isFree
            ? "Lead magnets, workbooks, and starter guides — yours at no cost. Start here, build the base."
            : "Self-paced workbooks, mini-courses, and frameworks. Buy once, own forever."}
        </p>

        {q.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="nx-card !p-5 animate-pulse h-28" />
            ))}
          </div>
        )}

        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <div className="nx-card !p-10 text-center">
            <BookOpen className="size-10 text-muted-foreground/40 mx-auto" />
            <h3 className="mt-4 font-display text-xl">Nothing here yet.</h3>
            <p className="mt-2 text-sm text-muted-foreground">New {isFree ? "free resources" : "products"} are on the way.</p>
          </div>
        )}

        {(q.data?.length ?? 0) > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {q.data!.map((p) => (
              <Link
                key={p.slug}
                to="/products/$slug"
                params={{ slug: p.slug }}
                className="nx-card group !p-5 flex gap-4 items-start"
              >
                {p.cover_image_url ? (
                  <img
                    src={p.cover_image_url}
                    alt=""
                    className="size-20 rounded-lg object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="size-20 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                    <BookOpen className="size-7 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg leading-snug group-hover:text-[var(--nx-gold-text)] transition-colors line-clamp-2">
                    {p.title}
                  </div>
                  {p.tagline && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.tagline}</p>}
                  <div className="mt-3 text-sm font-bold text-[var(--nx-gold-text)]">
                    {formatPrice(p.price_cents, p.currency, p.is_free, p.slug)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
