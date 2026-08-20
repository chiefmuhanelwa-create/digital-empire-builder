import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef} from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/gardens";
import { useAuth } from "@/lib/auth-context";
import { initializeCheckout, initializeStripeCheckout, initializeSubscription } from "@/lib/checkout.functions";

const SUBSCRIPTION_SLUGS = ["called-expert-inner-circle", "contentpreneur-community"];
import { getUtm } from "@/lib/utm";
import { trackLead } from "@/lib/track";
import { useCountry, shouldUseStripe } from "@/lib/currency";
import { checkQualification } from "@/lib/qualification.functions";
import { TurnstileGate, type TurnstileGateHandle } from "@/components/TurnstileGate";
import { toast } from "sonner";
import { ProCohortBreakdown, VipTierBreakdown } from "@/components/PremiumProgramBreakdown";
import { Lock, ShieldCheck, X, Mail, Download } from "lucide-react";
import { claimFreeProduct } from "@/lib/products.functions";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error) {
      // Surface the real Supabase error in worker logs (auth/RLS/connection) instead of a blind 500.
      console.error("[product loader]", params.slug, error.code, error.message);
      throw error;
    }
    if (!data) throw notFound();

    // Related products: same garden first, backfilled with other live items —
    // fetched server-side alongside the product itself so "you might also
    // like" is in the initial HTML, not a second client-side round trip.
    const { data: related } = await supabase
      .from("products")
      .select("slug,title,price_cents,compare_at_price_cents,currency,is_free,cover_image_url,garden")
      .eq("status", "published")
      .eq("show_in_marketplace", true)
      .neq("slug", params.slug)
      .order("sort_order", { ascending: true })
      .limit(12);

    const sameGarden = (related ?? []).filter((r) => r.garden === data.garden);
    const rest = (related ?? []).filter((r) => r.garden !== data.garden);
    const relatedProducts = [...sameGarden, ...rest].slice(0, 4);

    return { product: data, relatedProducts };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.title} — CHKPLT` : `${params.slug} — CHKPLT`;
    const description = (p?.description?.slice(0, 200)) ?? p?.tagline ?? "Tools for Contentpreneurs.";
    const image = p?.cover_image_url ?? undefined;
    const url = `/products/${params.slug}`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    return { meta, links: [{ rel: "canonical", href: url }] };
  },
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Product not found.</h1>
        <Link to="/products" className="mt-6 inline-block text-banana">← Back to shop</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <SiteHeader />
        <div className="mx-auto max-w-3xl py-32">
          <h1 className="font-display text-3xl">Couldn't load product.</h1>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          <Button onClick={() => { router.invalidate(); reset(); }} className="mt-6">Try again</Button>
        </div>
      </div>
    );
  },
});

function ProductDetail() {
  // Product comes from the route loader (which throws notFound() when missing),
  // so it is always present here — no conditional hooks, no SSR throw.
  const { product, relatedProducts } = Route.useLoaderData();
  const country = useCountry();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { add, has } = useCart();
  const inCart = has(product.slug);

  const priceLabel = formatPrice(product.price_cents, product.currency, product.is_free, product.slug, country);
  // Plain one-off purchase (not free, not application-gated) is the only path
  // that opens the popup checkout — free products link straight to signup,
  // and application-gated tiers keep their own inline qualification flow.
  const isModalCheckout = !product.is_free && !product.requires_application;

  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ fontFamily: "Inter, sans-serif" }}>
      <SiteHeader />
      <article className="mx-auto max-w-2xl px-5 sm:px-6 pt-10 pb-16">
        <Link to="/products" className="text-[13px] text-[#666] hover:text-[sienna] transition-colors">
          ← All products
        </Link>

        {product.cover_image_url && (
          <div className="mt-6 w-full max-w-[280px] mx-auto overflow-hidden rounded-xl bg-[#f8f6f3] p-3" style={{ aspectRatio: "3/4" }}>
            <img
              src={product.cover_image_url}
              alt={product.title}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        )}

        <h1 className="mt-6 text-[22px] font-semibold leading-[1.3] text-[#000]">{product.title}</h1>

        {/* Price row + Add to Cart positioned immediately after price, matching
            the real store's own product-page layout exactly (compare price →
            current price → Sale badge → tax/delivery note → the button) —
            not buried further down inside a separate "secure checkout" box. */}
        <div className="mt-3 flex items-baseline gap-2 flex-wrap">
          {product.compare_at_price_cents != null && (
            <span className="text-[14px] text-[#999] line-through">
              {formatPrice(product.compare_at_price_cents, product.currency, false, undefined, country)}
            </span>
          )}
          <span className="text-[19px] font-bold text-[#000]">{priceLabel}</span>
          {product.compare_at_price_cents != null && (
            <span className="rounded-full bg-[#111] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Sale
            </span>
          )}
          {product.requires_application && (
            <span className="text-[12px] text-[#999]">/ by application</span>
          )}
        </div>
        {!product.is_free && !product.requires_application && (
          <p className="mt-1.5 text-[13px] text-[#999]">Taxes included. Instant digital delivery.</p>
        )}

        <div id="buy" />
        {isModalCheckout ? (
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => {
                if (!inCart) {
                  add(product.slug);
                  toast.success("Added to cart");
                }
              }}
              className="h-12 flex-1 rounded-lg border-2 text-[14px] font-semibold transition-colors"
              style={{ borderColor: "sienna", color: inCart ? "#666" : "sienna" }}
            >
              {inCart ? "In cart ✓" : "Add to Cart"}
            </button>
            <button
              onClick={() => setCheckoutOpen(true)}
              className="h-12 flex-1 rounded-lg text-[14px] font-semibold text-white transition-colors"
              style={{ backgroundColor: "sienna" }}
            >
              Buy now →
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <BuyBlock product={product} priceLabel={priceLabel} />
          </div>
        )}
        {isModalCheckout && checkoutOpen && (
          <CheckoutModal product={product} priceLabel={priceLabel} onClose={() => setCheckoutOpen(false)} />
        )}

        {/* Premium Program breakdowns (etz_pri tier) */}
        {product.slug === "contentpreneur-90day-cohort" && <ProCohortBreakdown />}
        {product.slug === "contentpreneur-vip-tier" && <VipTierBreakdown />}

        {/* Everything below flows as one continuous read — description, the
            longer pitch, then the "Inside:" bullets as a plain list — matching
            the real store's plain editorial layout instead of boxed/labelled
            sections. */}
        <div className="mt-8 text-[14px] leading-[1.7] text-[#333] space-y-4">
          {product.description && <p className="whitespace-pre-line">{product.description}</p>}
          {product.long_description && <p className="whitespace-pre-line">{product.long_description}</p>}
        </div>

        {Array.isArray(product.benefits) && product.benefits.length > 0 && (
          <div className="mt-4">
            <p className="text-[14px] font-bold text-[#000]">Inside:</p>
            <ul className="mt-2 space-y-2">
              {(product.benefits as string[]).map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] leading-[1.6] text-[#333]">
                  <span className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-[#333]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(product.format || product.target_audience) && (
          <p className="mt-4 text-[13px] text-[#666]">
            {product.format}
            {product.format && product.target_audience && " · "}
            {product.target_audience}
          </p>
        )}

        {product.cohort_capacity && (
          <p className="mt-4 text-[13px] text-[#666]">{product.cohort_capacity} seats per intake.</p>
        )}

        {isModalCheckout && (
          <p className="mt-6 text-[15px] font-bold text-[#000]">
            {priceLabel}. Download instantly. {product.is_free ? "" : "No subscription. No fluff."}
          </p>
        )}
      </article>

      {relatedProducts.length > 0 && (
        <section className="border-t border-[#eee] bg-[#f5f5f5] py-10" style={{ fontFamily: "Inter, sans-serif" }}>
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#000]">
              You may also like
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {relatedProducts.map((r) => {
                const rCompare =
                  r.compare_at_price_cents != null
                    ? formatPrice(r.compare_at_price_cents, r.currency, false, undefined, country)
                    : null;
                return (
                  <Link
                    key={r.slug}
                    to="/products/$slug"
                    params={{ slug: r.slug }}
                    className="group flex flex-col overflow-hidden rounded-[10px] bg-white"
                  >
                    <div className="relative w-full overflow-hidden bg-[#f8f6f3] p-2" style={{ aspectRatio: "3/4" }}>
                      {rCompare && (
                        <span className="absolute left-2 top-2 z-10 rounded-full bg-[#111] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          Sale
                        </span>
                      )}
                      {r.cover_image_url ? (
                        <img
                          src={r.cover_image_url}
                          alt={r.title}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[#999]">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-[#000]">
                        {r.title}
                      </p>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold text-[#000]">
                          {formatPrice(r.price_cents, r.currency, r.is_free, r.slug, country)}
                        </span>
                        {rCompare && <span className="text-[11px] text-[#999] line-through">{rCompare}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

function CheckoutModal({
  product,
  priceLabel,
  onClose,
}: {
  product: any;
  priceLabel: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const isSubscription = SUBSCRIPTION_SLUGS.includes(product.slug);
  const priceText = isSubscription ? `${priceLabel}/mo` : priceLabel;
  const initCheckout = useServerFn(initializeCheckout);
  const initStripe = useServerFn(initializeStripeCheckout);
  const initSub = useServerFn(initializeSubscription);
  const useStripe = shouldUseStripe(useCountry());
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [fullName, setFullName] = useState<string>(
    (user?.user_metadata?.full_name as string) ?? "",
  );
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [tsToken, setTsToken] = useState<string | null>(null);
  // A Turnstile token is single-use — reset after EVERY attempt so a retry
  // (or a second run of this tool) gets a fresh one instead of re-sending a
  // spent token, which Cloudflare rejects as `timeout-or-duplicate`.
  const tsRef = useRef<TurnstileGateHandle>(null);

  const mut = useMutation({
    mutationFn: isSubscription ? initSub : useStripe ? initStripe : initCheckout,
    onSuccess: (res: any) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: any) => toast.error(e.message ?? "Could not start checkout"),
    onSettled: () => tsRef.current?.reset(),
  });

  function submit() {
    if (!email) {
      toast.error("Enter your email to continue.");
      return;
    }
    trackLead();
    mut.mutate({
      data: {
        productSlug: product.slug,
        email,
        fullName: fullName || undefined,
        phone: whatsapp || undefined,
        turnstileToken: tsToken ?? undefined,
        ...getUtm(),
      },
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gateway-style header */}
        <div className="flex items-center justify-between gap-4 rounded-t-2xl bg-[#0F172A] px-6 py-5">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="size-5 text-banana" />
            <span className="font-mono text-xs tracking-[0.2em] uppercase">Secure Checkout</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Order summary */}
          <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                {isSubscription ? "Subscribing to" : "Buying"}
              </div>
              <div className="mt-1 font-display text-lg leading-snug">{product.title}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display text-2xl text-banana">{priceText}</div>
              <div className="text-[10px] text-muted-foreground">{useStripe && !isSubscription ? "USD" : "ZAR"}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Full name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" placeholder="Your name" />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" placeholder="you@example.com" />
              <p className="mt-1 text-[11px] text-muted-foreground">Your product will be delivered here instantly.</p>
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">WhatsApp number</label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-1.5" placeholder="+27 XX XXX XXXX" />
            </div>
          </div>

          <div className="mt-4">
            {/* See foundation.tsx — a broken widget never blocks a payment. */}
            <TurnstileGate ref={tsRef} onToken={setTsToken} unavailablePolicy="allow" />
          </div>

          <Button
            size="lg"
            disabled={mut.isPending}
            onClick={submit}
            className="mt-5 w-full bg-banana text-banana-foreground hover:bg-banana/90 text-base py-6 h-auto"
          >
            {mut.isPending ? "Starting…" : isSubscription ? `Subscribe — ${priceText} →` : `Pay ${priceLabel} securely →`}
          </Button>

          {/* Trust row — the "real payment gateway" feel */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5" /> 256-bit encrypted
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> Powered by {useStripe && !isSubscription ? "Stripe" : "Paystack"}
            </span>
            <span>Instant digital delivery</span>
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            You'll be sent to our secure payment page, then straight back here — check your email right after for your download.
          </p>
        </div>
      </div>
    </div>
  );
}

// Only reached for free products (signup link) or application-gated tiers
// (inline qualification flow) — plain one-off purchases use CheckoutModal.
function BuyBlock({ product, priceLabel }: { product: any; priceLabel: string }) {
  if (product.is_free) {
    return <FreeLeadMagnet product={product} />;
  }

  return <ApplicationGate product={product} priceLabel={priceLabel} />;
}

// Free products: email-only lead-magnet capture — no account/password wall.
// Delivers the same way a paid purchase does: instant in-page download +
// the file emailed to them.
function FreeLeadMagnet({ product }: { product: any }) {
  const { user } = useAuth();
  const claimFn = useServerFn(claimFreeProduct);
  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState((user?.user_metadata?.full_name as string) ?? "");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: claimFn,
    onSuccess: (res: { url: string }) => {
      setDownloadUrl(res.url);
      toast.success("It's yours — check your email too.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (downloadUrl) {
    return (
      <div className="mt-8 rounded-lg border-2 p-6 text-center" style={{ borderColor: "sienna", backgroundColor: "#FBF0E8" }}>
        <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "sienna" }}>You're in</div>
        <p className="mt-2 text-[13px] text-[#666]">
          We've also emailed a copy to {email} — check your inbox (or spam).
        </p>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg px-6 text-[13px] font-semibold text-white"
          style={{ backgroundColor: "sienna" }}
        >
          <Download className="size-4" />
          Download now
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-[#e8e0d4] p-6">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[#000]">Free download</div>
      <h3 className="mt-2 text-[18px] font-semibold text-[#000]">Get {product.title}</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-[#999]">Full name</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" placeholder="Your name" />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-[#999]">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="you@example.com" />
        </div>
      </div>
      <button
        disabled={mut.isPending}
        onClick={() => {
          if (!email) {
            toast.error("Enter your email to continue.");
            return;
          }
          trackLead();
          mut.mutate({ data: { productSlug: product.slug, email, fullName: fullName || undefined, ...getUtm() } });
        }}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg px-6 text-[13px] font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: "sienna" }}
      >
        <Mail className="size-4" />
        {mut.isPending ? "Sending…" : "Send it to me — free"}
      </button>
      <p className="mt-3 text-[12px] text-[#999]">No card required. Instant download.</p>
    </div>
  );
}

function ApplicationGate({ product, priceLabel }: { product: any; priceLabel: string }) {
  const { user } = useAuth();
  const checkFn = useServerFn(checkQualification);
  const email = user?.email;

  const { data, isLoading } = useQuery({
    queryKey: ["qualification", email],
    enabled: !!email,
    queryFn: () => checkFn({ data: { email: email! } }),
    staleTime: 60_000,
  });

  // Not signed in → must apply first (we need their email to check qualification)
  if (!user) {
    return (
      <div className="mt-12 border border-border bg-muted/20 p-6">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          By application only
        </div>
        <h3 className="mt-2 font-display text-2xl">Take the assessment first</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Premium Programs are gated by our in-depth Contentpreneur diagnostic. Complete it to unlock checkout.
        </p>
        <Link
          to="/apply"
          className="cta-glow mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm"
        >
          Start the assessment →
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-12 border border-border p-6 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="mt-3 h-3 w-64 bg-muted rounded" />
      </div>
    );
  }

  // Qualified → show checkout
  if (data?.qualified) {
    return (
      <div className="mt-12">
        <div className="border border-banana/40 bg-banana/5 p-4 mb-4">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
            ✓ Qualified for Premium Programs
          </div>
          <p className="mt-1 text-sm text-foreground/80">
            Your assessment cleared you for this tier. Secure your seat below.
          </p>
        </div>
        <CheckoutForm product={product} priceLabel={priceLabel} />
      </div>
    );
  }

  // Has application but not qualified, OR no application yet → redirect to /apply
  return (
    <div className="mt-12 border border-border bg-muted/20 p-6">
      <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
        By application only
      </div>
      <h3 className="mt-2 font-display text-2xl">
        {data?.hasApplication ? "Not cleared for this tier yet" : "Take the assessment first"}
      </h3>
      <p className="mt-3 text-sm text-muted-foreground">
        {data?.hasApplication
          ? "Your latest assessment routed you to a different starting point. Re-take the diagnostic when your numbers change, or browse the recommended standalone package."
          : "Premium Programs are gated by our in-depth Contentpreneur diagnostic. Complete it to unlock checkout."}
      </p>
      <Link
        to="/apply"
        className="cta-glow mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm"
      >
        {data?.hasApplication ? "Re-take the assessment →" : "Start the assessment →"}
      </Link>
    </div>
  );
}

function CheckoutForm({ product, priceLabel }: { product: any; priceLabel: string }) {
  const { user } = useAuth();
  const isSubscription = SUBSCRIPTION_SLUGS.includes(product.slug);
  const priceText = isSubscription ? `${priceLabel}/mo` : priceLabel;
  const initFn = useServerFn(initializeCheckout);
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [fullName, setFullName] = useState<string>(
    (user?.user_metadata?.full_name as string) ?? "",
  );
  const [phone, setPhone] = useState<string>("");
  const [tsToken, setTsToken] = useState<string | null>(null);
  const tsRef = useRef<TurnstileGateHandle>(null);

  const mut = useMutation({
    mutationFn: initFn,
    onSuccess: (res: any) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: any) => toast.error(e.message ?? "Could not start checkout"),
    onSettled: () => tsRef.current?.reset(),
  });

  return (
    <div className="border border-border p-6">
      <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Secure checkout · ZAR</div>
      <h3 className="mt-2 font-display text-2xl">Secure your seat — {product.title}</h3>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="you@example.com" />
        </div>
        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Full name</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" placeholder="Optional" />
        </div>
        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">WhatsApp number</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="Optional" />
        </div>
      </div>
      <div className="mt-5">
        {/* See foundation.tsx — a broken widget never blocks a payment. */}
        <TurnstileGate ref={tsRef} onToken={setTsToken} unavailablePolicy="allow" />
      </div>
      <Button
        size="lg"
        disabled={mut.isPending}
        onClick={() => {
          if (!email) {
            toast.error("Enter your email above to continue.");
            return;
          }
          trackLead();
          mut.mutate({
            data: {
              productSlug: product.slug,
              email,
              fullName: fullName || undefined,
              phone: phone || undefined,
              turnstileToken: tsToken ?? undefined,
              ...getUtm(),
            },
          });
        }}
        className="mt-6 bg-banana text-banana-foreground hover:bg-banana/90"
      >
        {mut.isPending ? "Starting…" : isSubscription ? `Subscribe — ${priceText} →` : `Pay ${priceLabel} →`}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        You'll be sent to our secure checkout, then brought back here once payment is complete.
      </p>
    </div>
  );
}
