import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { verifyCheckout, initializeCheckout, chargeUpsell } from "@/lib/checkout.functions";
import { getDownloadUrl } from "@/lib/products.functions";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/gardens";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { trackPurchase } from "@/lib/track";
import { useCountry } from "@/lib/currency";
import { Check, Download } from "lucide-react";


export const Route = createFileRoute("/checkout/success")({
  head: () => ({ meta: [{ title: "Order received — Christ Kingdom Platform" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    reference: (s.reference as string) || (s.trxref as string) || "",
  }),
  component: CheckoutSuccess,
});

// Upsell chains per product. Order: most relevant first.
const NICHE_CLARITY_UPSELLS = [
  "paids-framework",
  "9-modules-personal-branding",
  "tax-guide-content-creators",
] as const satisfies readonly string[];

// After Foundation Kit purchase: bump at R299, then upgrade to full course.
const FOUNDATION_KIT_UPSELLS = [
  "called-expert-foundation-kit-bonus",
  "called-expert-foundations",
] as const satisfies readonly string[];

function CheckoutSuccess() {
  const { reference } = useSearch({ from: "/checkout/success" });
  const verify = useServerFn(verifyCheckout);
  const country = useCountry();

  const attempts = useRef(0);
  const q = useQuery({
    queryKey: ["verify", reference],
    enabled: !!reference,
    queryFn: () => verify({ data: { reference } }),
    refetchInterval: (query) => {
      attempts.current += 1;
      const s = query.state.data?.status;
      if (s === "paid" || s === "failed" || s === "cancelled") return false;
      return attempts.current > 10 ? false : 2000;
    },
  });

  const status = q.data?.status;
  const purchasedSlug = q.data?.purchasedSlug;
  const KIT_SLUGS = ["called-expert-foundation-kit", "called-expert-starter-bundle"];
  const isKit = !!purchasedSlug && KIT_SLUGS.includes(purchasedSlug);

  const purchaseFired = useRef(false);
  useEffect(() => {
    if (status === "paid" && !purchaseFired.current) {
      purchaseFired.current = true;
      trackPurchase((q.data?.total_cents ?? 0) / 100, q.data?.currency ?? "ZAR");
    }
  }, [status, q.data?.total_cents, q.data?.currency]);

  const upsellSlugs =
    purchasedSlug === "niche-clarity-workbook"
      ? NICHE_CLARITY_UPSELLS
      : purchasedSlug === "called-expert-foundation-kit"
        ? FOUNDATION_KIT_UPSELLS
        : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-6 pt-24 pb-24">
        {!reference && (
          <div className="text-center">
            <h1 className="font-display text-4xl">No reference found.</h1>
            <p className="mt-4 text-muted-foreground">Return to the catalog and try again.</p>
          </div>
        )}

        {reference && (q.isLoading || status === "pending" || status === undefined) && (
          <div className="text-center">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Confirming</div>
            <h1 className="mt-4 font-display text-5xl">Verifying payment…</h1>
            <p className="mt-4 text-muted-foreground">Hold tight — Paystack is talking to us.</p>
            <div className="mt-8 inline-flex h-2 w-48 overflow-hidden bg-muted">
              <div className="h-full w-1/3 animate-pulse bg-banana" />
            </div>
          </div>
        )}

        {status === "paid" && (
          <>
            <div className="text-center">
              <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Confirmed</div>
              <h1 className="mt-4 font-display text-5xl">Thank you.</h1>
              <p className="mt-4 text-muted-foreground">
                Payment received
                {q.data?.total_cents && q.data?.currency
                  ? `: ${formatPrice(q.data.total_cents, q.data.currency, false)}`
                  : ""}
                . Access has been granted to {q.data?.email}.
              </p>
            </div>

            {isKit ? (
              <KitOnboarding email={q.data?.email ?? ""} />
            ) : (
              purchasedSlug && <DownloadCard slug={purchasedSlug} reference={reference} />
            )}
            {(q.data?.bumpSlugs ?? []).map((bs: string) => (
              <DownloadCard key={bs} slug={bs} reference={reference} />
            ))}

            {isKit && (
              <OneClickUpsell email={q.data?.email ?? ""} country={country} />
            )}

            {upsellSlugs ? (
              <UpsellFlow buyerEmail={q.data?.email ?? ""} slugs={upsellSlugs} />
            ) : (
              <>
                <div className="mt-10 flex justify-center gap-3">
                  <Button asChild className="bg-banana text-banana-foreground hover:bg-banana/90">
                    <Link to="/dashboard">Open dashboard →</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/products">Keep exploring</Link>
                  </Button>
                </div>


                {q.data?.nextSeed && (
                  <div className="mt-16 border border-banana/40 bg-banana/5 p-8 text-left">
                    <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">
                      You might also like →
                    </div>
                    <h2 className="mt-3 font-display text-3xl">{q.data.nextSeed.title}</h2>
                    {q.data.nextSeed.tagline && (
                      <p className="mt-3 text-muted-foreground">{q.data.nextSeed.tagline}</p>
                    )}
                    <div className="mt-6 flex items-center justify-between gap-4">
                      <div className="font-display text-2xl">
                        {formatPrice(q.data.nextSeed.price_cents, q.data.nextSeed.currency, false, q.data.nextSeed.slug, country)}
                      </div>
                      <Button
                        asChild
                        className="bg-foreground text-background hover:bg-foreground/90"
                      >
                        <Link to="/products/$slug" params={{ slug: q.data.nextSeed.slug }}>
                          See it →
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {(status === "failed" || status === "cancelled") && (
          <div className="text-center">
            <h1 className="font-display text-5xl">Payment {status}.</h1>
            <p className="mt-4 text-muted-foreground">No charge was made. You can try again any time.</p>
            <Button asChild className="mt-8"><Link to="/products">Back to products</Link></Button>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function UpsellFlow({ buyerEmail, slugs }: { buyerEmail: string; slugs: readonly string[] }) {
  const [step, setStep] = useState(0);
  const isFoundationChain = slugs === FOUNDATION_KIT_UPSELLS;

  // Load each upsell product
  const products = useQuery({
    queryKey: ["upsell-products", slugs],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug,title,tagline,description,price_cents,currency")
        .in("slug", slugs as unknown as string[]);
      if (error) throw error;
      // Re-order to match our intended sequence
      const map = new Map(data.map((p) => [p.slug, p]));
      return slugs.map((s) => map.get(s)).filter(Boolean) as Array<{
        slug: string;
        title: string;
        tagline: string | null;
        description: string | null;
        price_cents: number;
        currency: string;
      }>;
    },
  });

  const initFn = useServerFn(initializeCheckout);
  const mut = useMutation({
    mutationFn: initFn,
    onSuccess: (res: { authorizationUrl: string }) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not start checkout"),
  });

  if (products.isLoading) {
    return (
      <div className="mt-12 animate-pulse">
        <div className="h-48 w-full bg-muted" />
      </div>
    );
  }

  const list = products.data ?? [];
  const current = list[step];
  const done = step >= list.length;

  if (done || !current) {
    if (isFoundationChain) {
      return (
        <div className="mt-12 border-2 border-banana/40 bg-banana/5 p-8 text-center">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Now take it further.</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">You have the frameworks.</h2>
          <p className="mt-4 text-muted-foreground max-w-sm mx-auto leading-relaxed">
            The next step is applying them inside the live 90-day cohort —
            weekly sessions, accountability, and direct access to the full curriculum.
          </p>
          <Button asChild size="lg" className="cta-glow mt-8 text-base px-10 py-6 h-auto w-full sm:w-auto">
            <Link to="/apply">Apply for the Accelerator PRO →</Link>
          </Button>
          <div className="mt-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Go to my dashboard →</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-12 border border-banana/40 bg-banana/5 p-8 text-center">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">You're all set</div>
        <h2 className="mt-3 font-display text-3xl">Time to do the work.</h2>
        <p className="mt-3 text-muted-foreground">
          Everything you bought is in your dashboard, ready to download.
        </p>
        <Button asChild className="mt-8 bg-banana text-banana-foreground hover:bg-banana/90">
          <Link to="/dashboard">Open dashboard →</Link>
        </Button>
      </div>
    );
  }

  const priceLabel = formatPrice(current.price_cents, current.currency, false, current.slug, useCountry());

  return (
    <div className="mt-12">
      <div className="text-center font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
        One-time offer · {step + 1} of {list.length}
      </div>
      <div className="mt-4 border-2 border-banana bg-banana/5 p-8">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          Add this to your order?
        </div>
        <h3 className="mt-3 font-display text-3xl md:text-4xl">{current.title}</h3>
        {current.tagline && (
          <p className="mt-3 text-base text-foreground/80">{current.tagline}</p>
        )}
        {current.description && (
          <p className="mt-4 text-sm text-muted-foreground line-clamp-4 whitespace-pre-line">
            {current.description}
          </p>
        )}

        <div className="mt-6 flex items-baseline gap-3">
          <div className="font-display text-4xl text-banana">{priceLabel}</div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            one-time
          </div>
        </div>

        <ul className="mt-6 space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-banana" />
            Instant access — added to your dashboard
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-banana" />
            One-time offer · not available at this price later
          </li>
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            disabled={mut.isPending || !buyerEmail}
            onClick={() =>
              mut.mutate({
                data: { productSlug: current.slug, email: buyerEmail },
              })
            }
            className="bg-banana text-banana-foreground hover:bg-banana/90 sm:flex-1"
          >
            {mut.isPending ? "Starting…" : `Yes — add for ${priceLabel}`}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => setStep((s) => s + 1)}
            className="sm:flex-1"
          >
            No thanks, continue →
          </Button>
        </div>
      </div>
    </div>
  );
}

function OneClickUpsell({ email, country }: { email: string; country: string | null }) {
  const charge = useServerFn(chargeUpsell);
  const [state, setState] = useState<"offer" | "working" | "added" | "declined">("offer");
  const [upRef, setUpRef] = useState<string | null>(null);
  const price = formatPrice(360000, "ZAR", false, "asset-accelerator", country);

  if (state === "declined") return null;
  if (state === "added" && upRef) {
    return (
      <div className="mt-8">
        <div className="text-center font-display text-xl text-banana mb-3">✓ Added — The Asset Accelerator Vault</div>
        <DownloadCard slug="asset-accelerator" reference={upRef} />
      </div>
    );
  }

  async function take() {
    setState("working");
    try {
      const res: any = await charge({ data: { email, productSlug: "asset-accelerator" } });
      if (res.ok) {
        setUpRef(res.reference);
        setState("added");
      } else if (res.reason === "no_authorization") {
        window.location.href = "/products/asset-accelerator"; // no card on file → normal checkout
      } else {
        toast.error(res.message || "Card was declined. You can grab it from the catalog.");
        setState("offer");
      }
    } catch (e) {
      toast.error((e as Error).message);
      setState("offer");
    }
  }

  return (
    <div className="mt-10 border-2 border-banana bg-banana/5 p-6 sm:p-8 text-left">
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">One-time offer · add in 1 click</div>
      <h3 className="mt-2 font-display text-2xl sm:text-3xl">The Asset Accelerator Vault — {price}</h3>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        You have the frameworks. Now watch me <strong className="text-foreground">build the income assets</strong> step by step —
        unreleased PAIDS-engine walkthroughs + the DARES asset model, built live. Charged to the card you just used.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button onClick={take} disabled={state === "working"} className="bg-banana text-banana-foreground hover:bg-banana/90">
          {state === "working" ? "Adding…" : `Yes — add for ${price} (1 click)`}
        </Button>
        <Button variant="outline" onClick={() => setState("declined")}>No thanks, I'll pass</Button>
      </div>
    </div>
  );
}

function KitOnboarding({ email }: { email: string }) {
  return (
    <div className="mt-10 border-2 border-banana bg-banana/5 p-6 sm:p-8 text-left">
      <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana text-center">Your Foundation Kit is live</div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Everything is inside your workspace — videos, interactive apps, and workbooks. Here's how to start:
      </p>
      <ol className="mt-5 mx-auto max-w-md space-y-2 text-sm text-foreground">
        <li><strong>1.</strong> Tap “Open my Foundation Kit” below — you're already signed in.</li>
        <li><strong>2.</strong> Start with <strong>Introduction to Personal Branding</strong> (10 short videos).</li>
        <li><strong>3.</strong> Open the <strong>Niche Clarity Builder</strong> to lock your lane.</li>
        <li><strong>4.</strong> Download the fillable workbooks as you work.</li>
      </ol>
      <div className="mt-6 flex flex-col items-center gap-2">
        <Button asChild className="bg-banana text-banana-foreground hover:bg-banana/90">
          <Link to="/dashboard/foundation-kit">Open my Foundation Kit →</Link>
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          We also emailed {email || "you"} a one-click sign-in link. If you ever get signed out, use{" "}
          <Link to="/login" className="underline">chkplt.com/login</Link> with this email.
        </p>
      </div>
    </div>
  );
}

function DownloadCard({ slug, reference }: { slug: string; reference: string }) {
  const dl = useServerFn(getDownloadUrl);
  const mut = useMutation({
    mutationFn: dl,
    onSuccess: (res: { url: string; title: string }) => {
      window.open(res.url, "_blank", "noopener,noreferrer");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-10 border-2 border-banana bg-banana/5 p-6 text-center">
      <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Your download</div>
      <p className="mt-2 text-sm text-muted-foreground">
        Click below to download your file. The link is valid for 24 hours — you can always grab a fresh one from your dashboard.
      </p>
      <Button
        onClick={() => mut.mutate({ data: { productSlug: slug, reference } })}
        disabled={mut.isPending}
        className="mt-5 bg-banana text-banana-foreground hover:bg-banana/90"
      >
        <Download className="size-4 mr-2" />
        {mut.isPending ? "Preparing…" : "Download now"}
      </Button>
    </div>
  );
}
