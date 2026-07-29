import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { fetchMarketplaceProducts } from "@/components/MarketplaceHome";
import { formatPrice } from "@/lib/gardens";
import { useCountry } from "@/lib/currency";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
  }),
  head: () => ({ meta: [{ title: "Search — CHKPLT" }] }),
  component: SearchPage,
});

// A dedicated search page (matching the real store's own /search route)
// rather than folding search into the header — this is what the header's
// search icon links to now, replacing the old inline header search box.
function SearchPage() {
  const { q } = Route.useSearch();
  const country = useCountry();
  const [term, setTerm] = useState(q ?? "");
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "catalog-all"],
    queryFn: fetchMarketplaceProducts,
  });

  const results = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    return (products ?? []).filter((p) =>
      `${p.title} ${p.tagline ?? ""} ${p.description ?? ""}`.toLowerCase().includes(t),
    );
  }, [products, term]);

  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ fontFamily: "Inter, sans-serif" }}>
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-5 pt-12 pb-4 text-center sm:px-6">
        <h1 className="text-[26px] font-normal text-[#000]" style={{ fontFamily: "Georgia, serif" }}>
          Search
        </h1>
        <div className="relative mt-6">
          <input
            autoFocus
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search"
            className="h-12 w-full rounded-full border border-[#ddd] bg-white px-5 pr-12 text-[15px] text-[#000] outline-none focus:border-[#000]"
          />
          <SearchIcon className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#999]" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16 sm:px-6">
        {term.trim() && isLoading && (
          <p className="mt-8 text-center text-sm text-[#999]">Searching…</p>
        )}
        {term.trim() && !isLoading && results.length === 0 && (
          <p className="mt-8 text-center text-sm text-[#999]">No results for &ldquo;{term}&rdquo;.</p>
        )}
        {results.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {results.map((p) => {
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
                  <div className="relative w-full overflow-hidden bg-[#f8f6f3] p-2" style={{ aspectRatio: "3/4" }}>
                    {compareLabel && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-[#111] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        Sale
                      </span>
                    )}
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.title} loading="lazy" className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#999]">No image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-[#000]">{p.title}</p>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold text-[#000]">{priceLabel}</span>
                      {compareLabel && <span className="text-[11px] text-[#999] line-through">{compareLabel}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
