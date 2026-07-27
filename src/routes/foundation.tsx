import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initializeCheckout, initializeStripeCheckout } from "@/lib/checkout.functions";
import { formatPrice } from "@/lib/gardens";
import { useAuth } from "@/lib/auth-context";
import { useCountry, shouldUseStripe } from "@/lib/currency";
import { toast } from "sonner";

// Full standalone sales page for the Foundation Kit, reachable at
// contentpreneur.africa/foundation with checkout INLINE on this page (not a
// hand-off to chkplt.com/products/$slug) — per the founder's instruction to
// remove chkplt.com entirely from this product's customer journey. Copy ported
// from contentpreneur-africa-site's app/foundation/page.tsx; checkout logic
// reused as-is from niche-clarity.tsx's proven BuyForm pattern.
const SLUG = "called-expert-foundation-kit";

export const Route = createFileRoute("/foundation")({
  head: () => ({
    meta: [
      { title: "Foundation Kit — $97 — Contentpreneur Africa" },
      {
        name: "description",
        content:
          "The 7-step interactive Clarity System, 9 diagnostic tools, and 10 workbooks that take you from having expertise to running a real plan.",
      },
    ],
  }),
  component: FoundationPage,
});

function FoundationPage() {
  const { data: product } = useQuery({
    queryKey: ["product", SLUG],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug,title,price_cents,currency,is_free,description")
        .eq("slug", SLUG)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const priceLabel = product ? formatPrice(product.price_cents, product.currency, product.is_free) : "$97";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto max-w-2xl px-6 pt-20 pb-16 text-center">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Step 2 of 3 · {priceLabel}</div>
        <h1 className="mt-6 font-display text-4xl sm:text-5xl leading-[1.05]">Now I Know What To Do.</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          The Foundation Kit turns clarity into a real, working system — the 7-step interactive Clarity System,
          9 diagnostic tools, and 10 workbooks that take you from "I have expertise" to "I have a plan I'm
          actually running."
        </p>
        <a
          href="#buy"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-banana px-8 py-4 font-display text-lg text-banana-foreground hover:bg-banana/90 transition-colors"
        >
          Get Instant Access — {priceLabel} →
        </a>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl">Why Most Experts Never Get Here</h2>
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            {[
              "No positioning — can't say in one sentence who they help",
              "No audience — knowledge with nobody to reach",
              "No offer — nothing specific someone could actually buy",
              "No system — every week starts from zero",
            ].map((r) => (
              <div key={r} className="border border-border bg-background p-5 text-sm text-muted-foreground">{r}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="font-display text-3xl">What's Inside</h2>
        <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
          <div className="border border-border bg-background p-6">
            <div className="font-display text-2xl font-black text-banana">7</div>
            <div className="mt-1 text-sm font-bold">Step Clarity System</div>
            <p className="mt-2 text-xs text-muted-foreground">An interactive walkthrough, not a static PDF.</p>
          </div>
          <div className="border border-border bg-background p-6">
            <div className="font-display text-2xl font-black text-banana">9</div>
            <div className="mt-1 text-sm font-bold">Interactive Tools</div>
            <p className="mt-2 text-xs text-muted-foreground">Auto-scored diagnostics — positioning, offer, audience.</p>
          </div>
          <div className="border border-border bg-background p-6">
            <div className="font-display text-2xl font-black text-banana">10</div>
            <div className="mt-1 text-sm font-bold">PDFs</div>
            <p className="mt-2 text-xs text-muted-foreground">Workbook, framework cards, templates, content calendar.</p>
          </div>
        </div>
      </section>

      <section id="buy" className="border-t border-border bg-card/30 scroll-mt-20">
        <div className="mx-auto max-w-2xl px-6 py-20">
          <div className="text-center">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Get instant access</div>
            <h2 className="mt-3 font-display text-4xl">Ready For The System?</h2>
          </div>
          <BuyForm priceLabel={priceLabel} disabled={!product} />
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Already went through the free Starter Kit? This is Step 2. Not there yet?{" "}
            <Link to="/starterkit" className="text-banana underline">Start free</Link>.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function BuyForm({ priceLabel, disabled }: { priceLabel: string; disabled: boolean }) {
  const { user } = useAuth();
  const country = useCountry();
  const useStripe = shouldUseStripe(country);
  const initFn = useServerFn(initializeCheckout);
  const initStripeFn = useServerFn(initializeStripeCheckout);
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [fullName, setFullName] = useState<string>((user?.user_metadata?.full_name as string) ?? "");

  const mut = useMutation({
    mutationFn: useStripe ? initStripeFn : initFn,
    onSuccess: (res: { authorizationUrl: string }) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not start checkout"),
  });

  return (
    <div className="mt-10 border border-border bg-background p-6">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="you@example.com" />
        </div>
        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Full name</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" placeholder="Optional" />
        </div>
      </div>
      <Button
        size="lg"
        disabled={!email || mut.isPending || disabled}
        onClick={() => mut.mutate({ data: { productSlug: SLUG, email, fullName: fullName || undefined } })}
        className="mt-6 w-full bg-banana text-banana-foreground hover:bg-banana/90"
      >
        {mut.isPending ? "Starting…" : `Get Instant Access — ${priceLabel} →`}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Secure checkout · {useStripe ? "USD" : "ZAR"} · Instant access
      </p>
    </div>
  );
}
