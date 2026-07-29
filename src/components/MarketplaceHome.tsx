import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProfileHero } from "@/components/ProfileHero";
import { ProductQuickView } from "@/components/ProductQuickView";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, GARDENS, GARDEN_ORDER, type Garden } from "@/lib/gardens";
import { useCountry } from "@/lib/currency";
import type { Tables } from "@/integrations/supabase/types";

export const MARKETPLACE_QUERY_KEY = ["products", "catalog-all"];

// Plain query (no auth/context needed) — safe to call from a route `loader`
// for real SSR content, and reused client-side as the queryFn below so the
// cache shape matches exactly.
export async function fetchMarketplaceProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .eq("show_in_marketplace", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

// The actual marketplace grid, shared by "/" and "/products" — CHKPLT is now a
// digital products marketplace (2026-07-28), replacing the old Foundation-Kit-
// only landing page that used to live at "/". Design replicates the real,
// live Shopify storefront (contentcreatorhub.online), fetched and parsed
// directly — not a guess.
//
// `initialProducts` comes from the route's `loader` (real SSR fetch) so the
// grid paints in the initial HTML response instead of waiting for JS to
// hydrate and then fire a client-side fetch — this was the single biggest
// contributor to "takes seconds to show products" on a cold load.
export function MarketplaceHome({
  initialProducts,
  initialSearch = "",
}: {
  initialProducts?: Tables<"products">[];
  initialSearch?: string;
}) {
  const country = useCountry();
  const [search, setSearch] = useState(initialSearch);
  const [activeGarden, setActiveGarden] = useState<Garden | "all">("all");
  const [quickView, setQuickView] = useState<Tables<"products"> | null>(null);
  const { data: products, isLoading } = useQuery({
    queryKey: MARKETPLACE_QUERY_KEY,
    queryFn: fetchMarketplaceProducts,
    initialData: initialProducts,
  });

  // Only show category pills for gardens that actually have a live product —
  // no point offering a tab that opens to an empty grid.
  const availableGardens = useMemo(
    () => GARDEN_ORDER.filter((g) => (products ?? []).some((p) => p.garden === g)),
    [products],
  );

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (activeGarden !== "all") list = list.filter((p) => p.garden === activeGarden);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((p) =>
        `${p.title} ${p.tagline ?? ""} ${p.description ?? ""}`.toLowerCase().includes(term),
      );
    }
    return list;
  }, [products, activeGarden, search]);

  return (
    <>
      <ProfileHero />
      <section style={{ backgroundColor: "#f5f5f5" }} className="pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-8 md:px-10">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[1px] text-[#000]">
            Shop
          </span>
          <div className="relative w-full max-w-xs sm:w-56">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="h-9 w-full rounded-full border border-[#e0e0e0] bg-white px-4 text-xs text-[#000] outline-none focus:border-[#c9a84c]"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 px-4 sm:px-8 md:px-10">
          {availableGardens.length > 1 && (
            <>
              <button
                onClick={() => setActiveGarden("all")}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors ${
                  activeGarden === "all" ? "bg-[#111] text-white" : "bg-white text-[#666] hover:bg-[#eee]"
                }`}
              >
                All
              </button>
              {availableGardens.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGarden(g)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors ${
                    activeGarden === g ? "bg-[#111] text-white" : "bg-white text-[#666] hover:bg-[#eee]"
                  }`}
                >
                  {GARDENS[g].name}
                </button>
              ))}
            </>
          )}
          {/* Not a grid filter like the pills above — this one navigates to the
              interactive tools hub (calculators/generators), a different
              destination from the purchasable PDF products these pills filter.
              Deliberately NOT gated on availableGardens.length so it always
              shows regardless of how many product categories are live. */}
          <Link
            to="/tools"
            className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] bg-white hover:bg-[#eee] transition-colors"
            style={{ border: "1px solid sienna", color: "sienna" }}
          >
            Tools
          </Link>
        </div>

        <div className="mx-auto mt-4 grid max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:px-8 md:grid-cols-4 md:px-10">
          {isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[280px] animate-pulse rounded-[10px] bg-white" />
            ))}

          {filtered.map((p) => {
            const priceLabel = formatPrice(p.price_cents, p.currency, p.is_free, p.slug, country);
            const compareLabel =
              p.compare_at_price_cents != null
                ? formatPrice(p.compare_at_price_cents, p.currency, false, undefined, country)
                : null;
            const onSale = compareLabel != null;
            // Free lead magnets have no cart line to add — go straight to the
            // page. Everything else opens the quick-view popup first, same as
            // the real store's product-tile click behavior.
            const canQuickView = !p.is_free;

            const media = (
              <div className="relative w-full overflow-hidden bg-[#f8f6f3] p-2" style={{ aspectRatio: "3/4" }}>
                {onSale && (
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-[#111] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Sale
                  </span>
                )}
                {p.cover_image_url ? (
                  <img
                    src={p.cover_image_url}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#999]">
                    No image
                  </div>
                )}
              </div>
            );

            const body = (
              <div className="flex flex-1 flex-col p-3">
                <p
                  className="mb-1.5 flex-1 text-xs font-medium leading-snug text-[#000]"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {p.title}
                </p>
                <div className="mb-2.5 mt-auto flex flex-wrap items-baseline gap-1">
                  <span className="text-[13px] font-semibold text-[#000]">{priceLabel}</span>
                  {compareLabel && (
                    <span className="text-[11px] text-[#999] line-through">{compareLabel}</span>
                  )}
                  {p.requires_application && (
                    <span className="text-[10px] text-[#999]">/ application</span>
                  )}
                </div>
                <span
                  className="flex h-11 w-full shrink-0 items-center justify-center rounded-[6px] text-[11px] font-semibold uppercase tracking-[0.3px] text-white transition-colors"
                  style={{ backgroundColor: "sienna" }}
                >
                  {canQuickView ? "Quick View" : "View Details"}
                </span>
              </div>
            );

            if (canQuickView) {
              return (
                <button
                  key={p.id}
                  onClick={() => setQuickView(p)}
                  className="flex flex-col overflow-hidden rounded-[10px] bg-white text-left"
                >
                  {media}
                  {body}
                </button>
              );
            }
            return (
              <Link
                key={p.id}
                to="/products/$slug"
                params={{ slug: p.slug }}
                className="flex flex-col overflow-hidden rounded-[10px] bg-white"
              >
                {media}
                {body}
              </Link>
            );
          })}

          {!isLoading && filtered.length === 0 && (
            <div className="col-span-full rounded-[10px] bg-white p-12 text-center text-[#999]">
              {search.trim() ? `No products match "${search}".` : "No products published yet."}
            </div>
          )}
        </div>
      </section>

      {quickView && <ProductQuickView product={quickView} onClose={() => setQuickView(null)} />}
    </>
  );
}
