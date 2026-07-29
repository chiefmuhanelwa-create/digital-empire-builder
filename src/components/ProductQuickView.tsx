import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/gardens";
import { useCountry } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import type { Tables } from "@/integrations/supabase/types";

// Matches the real Shopify store's "quick view" popup — click a product tile,
// get mockup + short pitch + Add to Cart + a link through to the full page,
// without leaving the grid. Only shown for paid products; free lead magnets
// skip straight to their own page since there's no cart line to add.
export function ProductQuickView({
  product,
  onClose,
}: {
  product: Tables<"products">;
  onClose: () => void;
}) {
  const country = useCountry();
  const { add, has } = useCart();
  const priceLabel = formatPrice(product.price_cents, product.currency, product.is_free, product.slug, country);
  const compareLabel =
    product.compare_at_price_cents != null
      ? formatPrice(product.compare_at_price_cents, product.currency, false, undefined, country)
      : null;
  const benefits = Array.isArray(product.benefits) ? (product.benefits as string[]).slice(0, 5) : [];
  const inCart = has(product.slug);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Close button lives at the top level (fixed to the viewport, not inside
          the scrolling card) so it's ALWAYS reachable regardless of scroll
          position — the earlier version nested it inside the card, which on a
          mobile screen shorter than the card's content meant it (and the Add
          to Cart button at the other end) could scroll out of reach with no
          way back, since nothing on the page was actually scrollable. */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed right-4 top-4 z-[60] flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <X className="size-4" />
      </button>

      {/* min-h-full + a centering flex wrapper (rather than items-center on the
          scrolling container itself) — on a container that scrolls, items-center
          clips whichever end overflows first since centering happens against the
          viewport, not the content; this pattern centers when it fits and just
          lets the outer div scroll when it doesn't, so a tall card on a short
          mobile screen is always fully reachable. */}
      <div className="flex min-h-full items-center justify-center">
        <div
          className="relative flex w-full max-w-3xl flex-col overflow-y-auto rounded-xl bg-white shadow-2xl sm:max-h-[85vh] sm:flex-row sm:overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="relative shrink-0 bg-[#f8f6f3] p-6 sm:w-[45%]">
          <span className="absolute left-3 top-3 rounded-full bg-[#f0e6d2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#000]">
            Digital
          </span>
          <div className="mx-auto max-w-[240px]" style={{ aspectRatio: "3/4" }}>
            {product.cover_image_url ? (
              <img src={product.cover_image_url} alt={product.title} className="h-full w-full object-contain" />
            ) : null}
          </div>
        </div>

        {/* Mobile: no independent scroll here — the CARD itself scrolls as one
            unit (image + text together), which is the natural "scroll from top
            to bottom" behavior the founder asked for. Desktop (sm+): the card
            is height-capped and this pane scrolls on its own instead, while the
            image column stays fixed-width alongside it — the standard
            side-by-side modal pattern. */}
        <div className="flex-1 p-6 sm:overflow-y-auto" style={{ fontFamily: "Inter, sans-serif" }}>
          <h2 className="text-[19px] font-bold uppercase leading-snug text-[#000]">{product.title}</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-[#000]">{priceLabel}</span>
            {compareLabel && <span className="text-[15px] text-[#999] line-through">{compareLabel}</span>}
          </div>

          <div className="mt-4 border-t border-[#eee] pt-4">
            {product.tagline && <p className="text-[14px] font-medium text-[#333]">{product.tagline}</p>}
            {product.description && (
              <p className="mt-3 text-[14px] leading-[1.6] text-[#333] whitespace-pre-line">{product.description}</p>
            )}
          </div>

          {benefits.length > 0 && (
            <div className="mt-4">
              <p className="text-[13px] font-bold text-[#000]">Inside:</p>
              <ul className="mt-2 space-y-1.5">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-[#333]">
                    <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-[#000]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className="mt-5 inline-block text-[13px] font-semibold underline"
            style={{ color: "sienna" }}
          >
            View full product page ↗
          </Link>

          <button
            onClick={() => {
              if (!inCart) {
                add(product.slug);
                toast.success("Added to cart", {
                  action: { label: "View cart", onClick: () => (window.location.href = "/cart") },
                });
              }
              onClose();
            }}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-lg text-[14px] font-semibold uppercase tracking-wide text-white transition-colors"
            style={{ backgroundColor: inCart ? "#666" : "sienna" }}
          >
            {inCart ? "Already in cart" : "Add to Cart"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
