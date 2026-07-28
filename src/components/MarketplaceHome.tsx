import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProfileHero } from "@/components/ProfileHero";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/gardens";
import { useCountry } from "@/lib/currency";

// The actual marketplace grid, shared by "/" and "/products" — CHKPLT is now a
// digital products marketplace (2026-07-28), replacing the old Foundation-Kit-
// only landing page that used to live at "/". Design replicates the real,
// live Shopify storefront (contentcreatorhub.online), fetched and parsed
// directly — not a guess.
export function MarketplaceHome() {
  const country = useCountry();
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "catalog-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .eq("show_in_marketplace", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <ProfileHero />
      <section style={{ backgroundColor: "#f5f5f5" }} className="pb-10">
        <span className="block px-4 pt-5 pb-2 font-mono text-[11px] font-bold uppercase tracking-[1px] text-[#000] sm:px-8 md:px-10">
          Shop
        </span>

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:px-8 md:grid-cols-4 md:px-10">
          {isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[280px] animate-pulse rounded-[10px] bg-white" />
            ))}

          {products?.map((p) => {
            const priceLabel = formatPrice(p.price_cents, p.currency, p.is_free, p.slug, country);
            const compareLabel =
              p.compare_at_price_cents != null
                ? formatPrice(p.compare_at_price_cents, p.currency, false, undefined, country)
                : null;
            return (
              <Link
                key={p.id}
                to="/products/$slug"
                params={{ slug: p.slug }}
                className="flex flex-col overflow-hidden rounded-[10px] bg-white"
              >
                <div className="aspect-square w-full overflow-hidden bg-[#f0f0f0]">
                  {p.cover_image_url ? (
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[#999]">
                      No image
                    </div>
                  )}
                </div>
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
                    View Details
                  </span>
                </div>
              </Link>
            );
          })}

          {products && products.length === 0 && (
            <div className="col-span-full rounded-[10px] bg-white p-12 text-center text-[#999]">
              No products published yet.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
