import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GARDENS, formatPrice, type Garden } from "@/lib/gardens";
import { useAuth } from "@/lib/auth-context";
import { initializeCheckout, initializeSubscription } from "@/lib/checkout.functions";

const SUBSCRIPTION_SLUGS = ["called-expert-inner-circle"];
import { getUtm } from "@/lib/utm";
import { trackLead } from "@/lib/track";
import { useCountry } from "@/lib/currency";
import { checkQualification } from "@/lib/qualification.functions";
import { TurnstileGate } from "@/components/TurnstileGate";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { ProCohortBreakdown, VipTierBreakdown } from "@/components/PremiumProgramBreakdown";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("products")
      .select("title, tagline, description, cover_image_url")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error) throw error;
    return { meta: data };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.meta;
    const title = p ? `${p.title} — Christ Kingdom Platform` : `${params.slug} — Christ Kingdom Platform`;
    const description = (p?.description?.slice(0, 200)) ?? p?.tagline ?? "Tools for Kingdom Contentpreneurs.";
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
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: seedProduct } = useQuery({
    queryKey: ["product-seed", product?.seed_to_product_id],
    enabled: !!product?.seed_to_product_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug, title, tagline, price_cents, currency, is_free, garden")
        .eq("id", product!.seed_to_product_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-32 animate-pulse">
          <div className="h-12 w-2/3 bg-muted rounded" />
          <div className="mt-6 h-4 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }
  if (!product) return null;

  const country = useCountry();
  const gardenMeta = product.garden ? GARDENS[product.garden as Garden] : null;
  const priceLabel = formatPrice(product.price_cents, product.currency, product.is_free, product.slug, country);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        {gardenMeta && (
          <Link
            to="/products/garden/$garden"
            params={{ garden: gardenMeta.slug }}
            className="font-mono text-xs text-muted-foreground hover:text-banana"
          >
            ← {gardenMeta.name}
          </Link>
        )}
        <div className="mt-6 font-mono text-xs tracking-[0.25em] uppercase text-banana">
          {product.tagline}
        </div>
        <h1 className="mt-3 font-display text-5xl md:text-6xl leading-[1.05]">{product.title}</h1>


        <div className="mt-10 flex items-baseline gap-4 flex-wrap">
          <div className="font-display text-5xl text-banana">{priceLabel}</div>
          {!product.is_free && !product.requires_application && (
            <div className="font-mono text-xs text-muted-foreground">one-time payment · instant download · billed in ZAR at checkout</div>
          )}
          {product.requires_application && (
            <div className="font-mono text-xs text-muted-foreground">/ by application</div>
          )}
        </div>

        {!product.is_free && !product.requires_application && (
          <a
            href="#buy"
            className="cta-glow mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm"
          >
            Get instant access → {priceLabel}
          </a>
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

        {/* Primary CTA */}
        <div id="buy" />
        <BuyBlock product={product} priceLabel={priceLabel} />

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
        {!product.is_free && !product.requires_application && (
          <div className="mt-12 border-t border-border pt-10 text-center">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              Ready when you are
            </div>
            <h3 className="mt-3 font-display text-3xl">Get it for {priceLabel}</h3>
            <p className="mt-3 text-sm text-muted-foreground">Instant download. No subscription. No fluff.</p>
            <a
              href="#buy"
              className="mt-6 inline-flex items-center gap-2 bg-banana text-banana-foreground hover:bg-banana/90 px-8 py-4 rounded-md font-medium text-base transition-colors"
            >
              Buy now → {priceLabel}
            </a>
          </div>
        )}



        {/* Seed to next */}
        {seedProduct && (
          <Link
            to="/products/$slug"
            params={{ slug: seedProduct.slug }}
            className="group mt-20 block border-t border-border pt-10"
          >
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              You might also like →
            </div>
            <div className="mt-4 flex items-end justify-between gap-6">
              <div>
                <div className="font-mono text-xs text-muted-foreground">{seedProduct.tagline}</div>
                <h3 className="mt-2 font-display text-3xl group-hover:text-banana transition-colors">
                  {seedProduct.title}
                </h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <span>{formatPrice(seedProduct.price_cents, seedProduct.currency, seedProduct.is_free, seedProduct.slug, country)}</span>
                <ArrowRight className="size-4 group-hover:text-banana transition-colors" />
              </div>
            </div>
          </Link>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}

function BuyBlock({ product, priceLabel }: { product: any; priceLabel: string }) {
  const { user } = useAuth();
  const isSubscription = SUBSCRIPTION_SLUGS.includes(product.slug);
  const priceText = isSubscription ? `${priceLabel}/mo` : priceLabel;
  const initCheckout = useServerFn(initializeCheckout);
  const initSub = useServerFn(initializeSubscription);
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [fullName, setFullName] = useState<string>(
    (user?.user_metadata?.full_name as string) ?? "",
  );
  const [phone, setPhone] = useState<string>("");
  const [tsToken, setTsToken] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: isSubscription ? initSub : initCheckout,
    onSuccess: (res: any) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: any) => toast.error(e.message ?? "Could not start checkout"),
  });

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

  if (product.requires_application) {
    return <ApplicationGate product={product} priceLabel={priceLabel} />;
  }

  return (
    <div className="mt-12 border border-border p-6">
      <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Secure checkout · ZAR</div>
      <h3 className="mt-2 font-display text-2xl">{isSubscription ? "Join" : "Buy"} {product.title}</h3>
      {Array.isArray(product.benefits) && product.benefits.length > 0 && (
        <div className="mt-4 rounded-md bg-banana/5 border border-banana/20 p-4">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-banana mb-2">What you get for {priceText}</div>
          <ul className="space-y-1.5">
            {product.benefits.map((b: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="text-banana shrink-0">✓</span><span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="Optional" />
        </div>
      </div>
      <div className="mt-5">
        <TurnstileGate onToken={setTsToken} />
      </div>
      <Button
        size="lg"
        disabled={!email || !tsToken || mut.isPending}
        onClick={() => {
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
          Premium Programs are gated by our 23-point Contentpreneur diagnostic. Complete it to unlock checkout.
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
          : "Premium Programs are gated by our 23-point Contentpreneur diagnostic. Complete it to unlock checkout."}
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
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="Optional" />
        </div>
      </div>
      <div className="mt-5">
        <TurnstileGate onToken={setTsToken} />
      </div>
      <Button
        size="lg"
        disabled={!email || !tsToken || mut.isPending}
        onClick={() => {
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
