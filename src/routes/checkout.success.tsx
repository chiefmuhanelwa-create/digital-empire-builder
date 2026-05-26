import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { verifyCheckout, initializeCheckout } from "@/lib/checkout.functions";
import { getDownloadUrl } from "@/lib/products.functions";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/gardens";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Download } from "lucide-react";


export const Route = createFileRoute("/checkout/success")({
  head: () => ({ meta: [{ title: "Order received — Christ Kingdom Platform" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    reference: (s.reference as string) || (s.trxref as string) || "",
  }),
  component: CheckoutSuccess,
});

// Upsell chain that runs after a Niche Clarity purchase.
// Order: highest-price first.
const NICHE_CLARITY_UPSELLS = [
  "paids-framework",
  "9-modules-personal-branding",
  "tax-guide-content-creators",
] as const;

function CheckoutSuccess() {
  const { reference } = useSearch({ from: "/checkout/success" });
  const verify = useServerFn(verifyCheckout);

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
  const isNicheClarity = purchasedSlug === "niche-clarity-workbook";

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

            {purchasedSlug && (
              <DownloadCard slug={purchasedSlug} reference={reference} />
            )}

            {isNicheClarity ? (
              <UpsellFlow buyerEmail={q.data?.email ?? ""} />
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
                        {formatPrice(q.data.nextSeed.price_cents, q.data.nextSeed.currency, false)}
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

function UpsellFlow({ buyerEmail }: { buyerEmail: string }) {
  const [step, setStep] = useState(0);

  // Load each upsell product
  const products = useQuery({
    queryKey: ["upsell-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug,title,tagline,description,price_cents,currency")
        .in("slug", NICHE_CLARITY_UPSELLS as unknown as string[]);
      if (error) throw error;
      // Re-order to match our intended sequence
      const map = new Map(data.map((p) => [p.slug, p]));
      return NICHE_CLARITY_UPSELLS.map((s) => map.get(s)).filter(Boolean) as Array<{
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

  const priceLabel = formatPrice(current.price_cents, current.currency, false);

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
