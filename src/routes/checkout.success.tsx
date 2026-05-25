import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { verifyCheckout } from "@/lib/checkout.functions";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/gardens";
import { useRef } from "react";

export const Route = createFileRoute("/checkout/success")({
  head: () => ({ meta: [{ title: "Order received — CHKPLT" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    reference: (s.reference as string) || (s.trxref as string) || "",
  }),
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  const { reference } = useSearch({ from: "/checkout/success" });
  const verify = useServerFn(verifyCheckout);

  // Poll for up to ~20s while webhook confirms
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-6 pt-24 pb-24 text-center">
        {!reference && (
          <>
            <h1 className="font-display text-4xl">No reference found.</h1>
            <p className="mt-4 text-muted-foreground">Return to the catalog and try again.</p>
          </>
        )}

        {reference && (q.isLoading || status === "pending" || status === undefined) && (
          <>
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Confirming</div>
            <h1 className="mt-4 font-display text-5xl">Verifying payment…</h1>
            <p className="mt-4 text-muted-foreground">Hold tight — Paystack is talking to us.</p>
            <div className="mt-8 inline-flex h-2 w-48 overflow-hidden bg-muted">
              <div className="h-full w-1/3 animate-pulse bg-banana" />
            </div>
          </>
        )}

        {status === "paid" && (
          <>
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Confirmed</div>
            <h1 className="mt-4 font-display text-5xl">Thank you.</h1>
            <p className="mt-4 text-muted-foreground">
              Payment received{q.data?.total_cents && q.data?.currency ? `: ${formatPrice(q.data.total_cents, q.data.currency, false)}` : ""}.
              Access has been granted to {q.data?.email}.
            </p>
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
                  Next seed →
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
                      Plant this seed →
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {(status === "failed" || status === "cancelled") && (
          <>
            <h1 className="font-display text-5xl">Payment {status}.</h1>
            <p className="mt-4 text-muted-foreground">No charge was made. You can try again any time.</p>
            <Button asChild className="mt-8"><Link to="/products">Back to products</Link></Button>
          </>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
