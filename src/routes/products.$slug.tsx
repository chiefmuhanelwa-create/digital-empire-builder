import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
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
import { TurnstileGate } from "@/components/TurnstileGate";
import { toast } from "sonner";
import { ProCohortBreakdown, VipTierBreakdown } from "@/components/PremiumProgramBreakdown";
import { Lock, ShieldCheck, X } from "lucide-react";

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
    return data;
  },
  head: ({ params, loaderData }) => {
    const p = loaderData;
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
        <h1 className="font-display text-5xl">Product not found.</h1>
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
  const product = Route.useLoaderData();
  const country = useCountry();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const priceLabel = formatPrice(product.price_cents, product.currency, product.is_free, product.slug, country);
  // Plain one-off purchase (not free, not application-gated) is the only path
  // that opens the popup checkout — free products link straight to signup,
  // and application-gated tiers keep their own inline qualification flow.
  const isModalCheckout = !product.is_free && !product.requires_application;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <Link to="/products" className="font-mono text-xs text-muted-foreground hover:text-banana">
          ← All products
        </Link>
        <div className="mt-6 font-mono text-xs tracking-[0.25em] uppercase text-banana">
          {product.tagline}
        </div>
        <h1 className="mt-3 font-display text-3xl sm:text-5xl md:text-6xl leading-[1.05]">{product.title}</h1>


        <div className="mt-10 flex items-baseline gap-4 flex-wrap">
          <div className="font-display text-4xl sm:text-5xl text-banana">{priceLabel}</div>
          {!product.is_free && !product.requires_application && (
            <div className="font-mono text-xs text-muted-foreground">one-time payment · instant download · billed in ZAR at checkout</div>
          )}
          {product.requires_application && (
            <div className="font-mono text-xs text-muted-foreground">/ by application</div>
          )}
        </div>

        {isModalCheckout && (
          <button
            onClick={() => setCheckoutOpen(true)}
            className="cta-glow mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm"
          >
            Get instant access → {priceLabel}
          </button>
        )}

        {product.cover_image_url && (
          <div className="mt-10 border border-border bg-muted/20 p-6 flex items-center justify-center">
            <img
              src={product.cover_image_url}
              alt={product.title}
              className="max-h-[420px] w-auto object-contain"
              loading="lazy"
            />
          </div>
        )}

        {product.description && (
          <p className="mt-10 text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        )}

        {/* Premium Program breakdowns (etz_pri tier) */}
        {product.slug === "contentpreneur-90day-cohort" && <ProCohortBreakdown />}
        {product.slug === "contentpreneur-vip-tier" && <VipTierBreakdown />}

        {/* Primary CTA — free/application-gated flows render inline; a plain
            purchase opens the popup checkout modal instead. */}
        <div id="buy" />
        {isModalCheckout ? (
          <div className="mt-12 border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-banana/10 text-banana shrink-0">
                <Lock className="size-4" />
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Secure checkout</div>
                <div className="font-display text-xl">{priceLabel} · instant download</div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => setCheckoutOpen(true)}
              className="bg-banana text-banana-foreground hover:bg-banana/90 w-full sm:w-auto"
            >
              Buy now →
            </Button>
          </div>
        ) : (
          <BuyBlock product={product} priceLabel={priceLabel} />
        )}
        {isModalCheckout && checkoutOpen && (
          <CheckoutModal product={product} priceLabel={priceLabel} onClose={() => setCheckoutOpen(false)} />
        )}

        {/* Long-form sales copy */}
        {product.long_description && (
          <div className="mt-16 border-t border-border pt-12">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              Why this exists
            </div>
            <div className="mt-6 text-base leading-relaxed whitespace-pre-line text-foreground/90">
              {product.long_description}
            </div>
          </div>
        )}

        {/* Benefits */}
        {Array.isArray(product.benefits) && product.benefits.length > 0 && (
          <div className="mt-12 border border-banana/30 bg-banana/5 p-8">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              What you get
            </div>
            <ul className="mt-5 space-y-3">
              {(product.benefits as string[]).map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-base">
                  <span className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-banana" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata strip */}
        <dl className="mt-12 grid gap-px bg-border border border-border md:grid-cols-2">
          {product.format && (
            <div className="bg-background p-5">
              <dt className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Format</dt>
              <dd className="mt-2 text-sm">{product.format}</dd>
            </div>
          )}
          {product.target_audience && (
            <div className="bg-background p-5">
              <dt className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Built for</dt>
              <dd className="mt-2 text-sm">{product.target_audience}</dd>
            </div>
          )}
          {product.cohort_capacity && (
            <div className="bg-background p-5 md:col-span-2">
              <dt className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Group size</dt>
              <dd className="mt-2 text-sm">{product.cohort_capacity} seats per intake</dd>
            </div>
          )}
        </dl>

        {/* Secondary CTA */}
        {isModalCheckout && (
          <div className="mt-12 border-t border-border pt-10 text-center">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              Ready when you are
            </div>
            <h3 className="mt-3 font-display text-3xl">Get it for {priceLabel}</h3>
            <p className="mt-3 text-sm text-muted-foreground">Instant download. No subscription. No fluff.</p>
            <button
              onClick={() => setCheckoutOpen(true)}
              className="mt-6 inline-flex items-center gap-2 bg-banana text-banana-foreground hover:bg-banana/90 px-8 py-4 rounded-md font-medium text-base transition-colors"
            >
              Buy now → {priceLabel}
            </button>
          </div>
        )}
      </article>
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

  const mut = useMutation({
    mutationFn: isSubscription ? initSub : useStripe ? initStripe : initCheckout,
    onSuccess: (res: any) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: any) => toast.error(e.message ?? "Could not start checkout"),
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
            <TurnstileGate onToken={setTsToken} />
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
    return (
      <div className="mt-12">
        <Link to="/signup">
          <Button size="lg" className="bg-banana text-banana-foreground">
            Create a free account to access
          </Button>
        </Link>
      </div>
    );
  }

  return <ApplicationGate product={product} priceLabel={priceLabel} />;
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

  const mut = useMutation({
    mutationFn: initFn,
    onSuccess: (res: any) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: any) => toast.error(e.message ?? "Could not start checkout"),
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
        <TurnstileGate onToken={setTsToken} />
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
