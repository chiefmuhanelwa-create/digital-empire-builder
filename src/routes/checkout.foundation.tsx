import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { TurnstileGate, type TurnstileGateHandle } from "@/components/TurnstileGate";
import { supabase } from "@/integrations/supabase/client";
import { initializeCheckout, initializeStripeCheckout } from "@/lib/checkout.functions";
import { formatPrice } from "@/lib/gardens";
import { useAuth } from "@/lib/auth-context";
import { useCountry, shouldUseStripe } from "@/lib/currency";
import { FunnelFooter, Orbs } from "@/components/funnel";
import { toast } from "sonner";
import { ArrowLeft, Check, Lock, ShieldCheck } from "lucide-react";

// THE CHECKOUT, ON ITS OWN PAGE.
//
// This form used to sit inline on /foundation, halfway down a long sales page,
// competing with a second CTA above it and a "start free" link below it. The
// founder's note was exact: "the foundation has a generic form and many buttons
// — this should have ONE CTA button."
//
// So the sales page now carries one button, and that button lands here. The
// only thing on this screen is the purchase: no nav, no menu, no alternative
// offer, no way onward except paying or going back. That is the whole design.
const SLUG = "called-expert-foundation-kit";

export const Route = createFileRoute("/checkout/foundation")({
  head: () => ({
    meta: [
      { title: "Checkout — Foundation Kit" },
      // A checkout screen has no business being indexed.
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FoundationCheckout,
});

function FoundationCheckout() {
  const { user } = useAuth();
  const country = useCountry();
  const useStripe = shouldUseStripe(country);
  const initFn = useServerFn(initializeCheckout);
  const initStripeFn = useServerFn(initializeStripeCheckout);

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

  const priceLabel = product
    ? formatPrice(product.price_cents, product.currency, product.is_free, product.slug, country)
    : "$97";

  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [fullName, setFullName] = useState<string>((user?.user_metadata?.full_name as string) ?? "");
  const [tsToken, setTsToken] = useState<string | null>(null);
  // A Turnstile token is single-use — reset after EVERY attempt so a retry gets
  // a fresh one instead of re-sending a spent token, which Cloudflare rejects
  // as `timeout-or-duplicate`.
  const tsRef = useRef<TurnstileGateHandle>(null);

  const mut = useMutation({
    mutationFn: useStripe ? initStripeFn : initFn,
    onSuccess: (res: { authorizationUrl: string }) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not start checkout"),
    onSettled: () => tsRef.current?.reset(),
  });

  return (
    <div className="funnel min-h-screen">
      <Orbs tint="amber" />

      <main className="relative z-10 mx-auto max-w-lg px-5 py-14 sm:py-20">
        <Link
          to="/foundation"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          style={{ textDecoration: "none" }}
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <h1 className="mt-8 text-3xl sm:text-4xl font-black leading-tight">
          You are one step from <span className="grad-gold">naming your number</span>.
        </h1>

        <div className="card-glass mt-8 rounded-3xl p-7">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-amber-300">The Foundation Kit</div>
              <div className="mt-1 text-sm text-slate-400">Lifetime access · instant</div>
            </div>
            <div className="text-4xl font-black grad-gold">{priceLabel}</div>
          </div>

          <ul className="mt-6 space-y-3 border-t border-white/10 pt-6">
            {[
              "The five-step path, ending at money received",
              "The Charge Gate — your number, and the words that defend it",
              "25 tools, 9 workbooks, a 10-video course",
              "Saved across every device you use",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-glass mt-5 rounded-3xl p-7">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">
            Email — where your access is sent
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
          />

          <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-400">
            Your name <span className="font-normal normal-case text-slate-500">(optional)</span>
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="So the tools can talk to you properly"
            className="mt-2 w-full rounded-xl bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
          />

          {/* "allow": a widget that cannot load must never be the reason a sale
              is lost. The server still verifies and alerts — see
              checkTurnstileForCheckout. */}
          <TurnstileGate ref={tsRef} onToken={setTsToken} unavailablePolicy="allow" className="mt-5" />

          <button
            type="button"
            disabled={!email || !tsToken || mut.isPending || !product}
            onClick={() =>
              mut.mutate({
                data: {
                  productSlug: SLUG,
                  email,
                  fullName: fullName || undefined,
                  turnstileToken: tsToken ?? undefined,
                },
              })
            }
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-5 text-lg font-black text-black glow-gold transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            {mut.isPending ? "Starting…" : `Pay ${priceLabel} and start`}
          </button>

          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Lock className="size-3.5" />
            Secure checkout · {useStripe ? "USD via Stripe" : "ZAR via Paystack"}
          </p>
        </div>

        <div className="mt-6 flex items-start gap-3 text-sm text-slate-400">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-400" />
          <p>
            Do all five steps and send your offer to one real person. If you finish without a priced
            offer you would actually put in front of somebody, show me the five steps and I refund you
            in full.
          </p>
        </div>
      </main>

      <FunnelFooter />
    </div>
  );
}
