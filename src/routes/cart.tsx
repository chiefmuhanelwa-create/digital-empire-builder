import { useState, useRef} from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchMarketplaceProducts } from "@/components/MarketplaceHome";
import { formatPrice } from "@/lib/gardens";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart";
import { useCountry, shouldUseStripe } from "@/lib/currency";
import { initializeCheckout, initializeStripeCheckout } from "@/lib/checkout.functions";
import { getUtm } from "@/lib/utm";
import { trackLead } from "@/lib/track";
import { TurnstileGate, type TurnstileGateHandle } from "@/components/TurnstileGate";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — CHKPLT" }] }),
  component: CartPage,
});

async function fetchCartProducts(slugs: string[]) {
  if (slugs.length === 0) return [];
  const { data, error } = await supabase.from("products").select("*").in("slug", slugs);
  if (error) throw error;
  // Preserve add-order, not whatever order Postgres returns.
  return slugs.map((s) => data?.find((p) => p.slug === s)).filter((p): p is Tables<"products"> => !!p);
}

function CartPage() {
  const { slugs, remove } = useCart();
  const country = useCountry();
  const { data: items } = useQuery({
    queryKey: ["cart-products", slugs],
    queryFn: () => fetchCartProducts(slugs),
    enabled: slugs.length > 0,
  });
  // The cart itself lives in localStorage, invisible to SSR — `slugs` is
  // always [] on the server and for the first client paint, then flips to
  // the real list once useCart's mount effect reads it. Gating the
  // empty/full split on `slugs.length` (sync, no fetch) instead of the
  // product-details query's isLoading means the common case (empty cart on
  // a fresh visit) renders correctly in the initial SSR HTML instead of
  // showing nothing until hydration resolves.

  const { data: allProducts } = useQuery({
    queryKey: ["products", "catalog-all"],
    queryFn: fetchMarketplaceProducts,
  });
  const upsells = (allProducts ?? []).filter((p) => !slugs.includes(p.slug)).slice(0, 4);

  const subtotalCents = (items ?? []).reduce((sum, p) => {
    // Mixed-currency carts don't occur in practice (single-storefront ZAR
    // catalog with a USD marketing overlay) — sum raw price_cents.
    return sum + p.price_cents;
  }, 0);

  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ fontFamily: "Inter, sans-serif" }}>
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-5 pt-10 pb-16 sm:px-6">
        <BackNav to="/products" label="Continue shopping" className="mb-4" />
        <h1 className="text-center text-[26px] font-normal text-[#000]" style={{ fontFamily: "Georgia, serif" }}>
          Your Cart
        </h1>

        {slugs.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-[15px] text-[#333]">Your cart is empty</p>
            <Link
              to="/products"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg px-6 text-[13px] font-semibold text-white"
              style={{ backgroundColor: "#111" }}
            >
              Continue shopping
            </Link>
            <p className="mt-8 text-[14px] text-[#333]">
              Have an account?{" "}
              <Link to="/login" className="font-semibold text-[#000] underline">
                Log in
              </Link>{" "}
              to check out faster.
            </p>
          </div>
        )}

        {(items ?? []).length > 0 && (
          <div className="mt-8">
            <div className="divide-y divide-[#eee] border-y border-[#eee]">
              {items!.map((p) => {
                const priceLabel = formatPrice(p.price_cents, p.currency, p.is_free, p.slug, country);
                return (
                  <div key={p.slug} className="flex items-center gap-4 py-4">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-[#f8f6f3] p-1">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-contain" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to="/products/$slug" params={{ slug: p.slug }} className="text-[14px] font-medium text-[#000] hover:underline">
                        {p.title}
                      </Link>
                      <div className="mt-1 text-[13px] text-[#666]">{priceLabel}</div>
                    </div>
                    <button
                      onClick={() => remove(p.slug)}
                      aria-label={`Remove ${p.title}`}
                      className="shrink-0 text-[#999] hover:text-[#000] transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-[14px] text-[#666]">Subtotal</span>
              <span className="text-[18px] font-semibold text-[#000]">
                {formatPrice(subtotalCents, items![0].currency, false, undefined, country)}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-[#999]">Taxes included. Instant digital delivery.</p>

            <CartCheckout items={items!} subtotalCents={subtotalCents} />
          </div>
        )}

        {upsells.length > 0 && (
          <div className="mt-16">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#000]">
              Complete your Creator System
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {upsells.map((p) => {
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
                    <div className="w-full overflow-hidden bg-[#f8f6f3] p-2" style={{ aspectRatio: "3/4" }}>
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
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

// Cart checkout reuses initializeCheckout/initializeStripeCheckout's existing
// productSlug + bumpSlugs mechanism (built for order-bump upsells) — the
// first cart item is "the product," the rest ride as bumps. That schema caps
// bumps at 3, so a cart supports up to 4 paid items total, which is already
// generous for a digital-info-product catalog with no per-item quantity.
function CartCheckout({ items, subtotalCents }: { items: Tables<"products">[]; subtotalCents: number }) {
  const { user } = useAuth();
  const country = useCountry();
  const useStripe = shouldUseStripe(country);
  const initCheckout = useServerFn(initializeCheckout);
  const initStripe = useServerFn(initializeStripeCheckout);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState((user?.user_metadata?.full_name as string) ?? "");
  const [whatsapp, setWhatsapp] = useState("");
  const [tsToken, setTsToken] = useState<string | null>(null);
  // A Turnstile token is single-use — reset after EVERY attempt so a retry
  // (or a second run of this tool) gets a fresh one instead of re-sending a
  // spent token, which Cloudflare rejects as `timeout-or-duplicate`.
  const tsRef = useRef<TurnstileGateHandle>(null);

  const priceLabel = formatPrice(subtotalCents, items[0]?.currency ?? "ZAR", false, undefined, country);

  const mut = useMutation({
    mutationFn: useStripe ? initStripe : initCheckout,
    onSuccess: (res: any) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: any) => toast.error(e.message ?? "Could not start checkout"),
    onSettled: () => tsRef.current?.reset(),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-6 h-12 w-full rounded-lg text-[14px] font-semibold text-white transition-colors"
        style={{ backgroundColor: "sienna" }}
      >
        Checkout → {priceLabel}
      </button>
    );
  }

  const [mainSlug, ...bumpSlugs] = items.map((p) => p.slug);

  function submit() {
    if (!email) {
      toast.error("Enter your email to continue.");
      return;
    }
    trackLead();
    mut.mutate({
      data: {
        productSlug: mainSlug,
        bumpSlugs: bumpSlugs.slice(0, 3),
        email,
        fullName: fullName || undefined,
        phone: whatsapp || undefined,
        turnstileToken: tsToken ?? undefined,
        ...getUtm(),
      },
    });
  }

  return (
    <div className="mt-6 rounded-lg border border-[#e8e0d4] bg-[#FBFAF8] p-5">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#000]">
        <Lock className="size-4" style={{ color: "sienna" }} />
        Secure checkout — {priceLabel}
      </div>
      <div className="mt-4 grid gap-3">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-[#999]">Full name</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" placeholder="Your name" />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-[#999]">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-[#999]">WhatsApp number</label>
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-1" placeholder="+27 XX XXX XXXX" />
        </div>
      </div>
      <div className="mt-4">
        {/* See foundation.tsx — a broken widget never blocks a payment. */}
        <TurnstileGate ref={tsRef} onToken={setTsToken} unavailablePolicy="allow" />
      </div>
      <Button
        size="lg"
        disabled={!tsToken || mut.isPending}
        onClick={submit}
        className="mt-4 w-full text-white"
        style={{ backgroundColor: "sienna" }}
      >
        {mut.isPending ? "Starting…" : `Pay ${priceLabel} securely →`}
      </Button>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-[#999]">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="size-3.5" /> 256-bit encrypted
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" /> Powered by {useStripe ? "Stripe" : "Paystack"}
        </span>
      </div>
    </div>
  );
}
