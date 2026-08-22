import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef} from "react";
import { ContentpreneurHeader, ContentpreneurFooter } from "@/components/contentpreneur-header";
import { TurnstileGate, type TurnstileGateHandle } from "@/components/TurnstileGate";
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
          "Five steps that end the day somebody pays you. The Charge Gate, 25 tools, 9 workbooks and a 10-video course — for the expert who has never named a price.",
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
  // formatPrice NEEDS the slug and the buyer's country. Without them (the bug
  // this replaces) it fell through to the generic ZAR→USD conversion and
  // rendered "$94" — the raw R1,565 divided by the fallback rate — to everyone,
  // including South Africans, who are then charged in rand by Paystack.
  //   • slug    → USD_DISPLAY's clean marketing price, $97, for international.
  //   • country → "ZA" renders the actual rand amount the card will be debited.
  const country = useCountry();
  const priceLabel = product
    ? formatPrice(product.price_cents, product.currency, product.is_free, product.slug, country)
    : "$97";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ContentpreneurHeader />

      {/* The hook is a real prospect's message, word for word. A medical
          professional building something around her career. Profession only. */}
      <section className="mx-auto max-w-2xl px-6 pt-20 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          Step 2 of 3 · {priceLabel}
        </div>
        <h1 className="mt-6 font-display text-4xl sm:text-5xl leading-[1.05]">
          “At what point do I start charging?”
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          That is the message, word for word, from a medical professional building something around
          her career.
        </p>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Not <em>how do I get more followers</em>. Not <em>what should I post</em>.
        </p>
        <p className="mt-4 font-display text-2xl leading-snug">At what point do I start charging.</p>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Nobody answers that with a number. They answer with encouragement — which is worse, because
          encouragement can be nodded at and then ignored.
        </p>
        <a
          href="#buy"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-banana px-8 py-4 font-display text-lg text-banana-foreground hover:bg-banana/90 transition-colors"
        >
          Get Instant Access — {priceLabel} →
        </a>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-3xl">Be honest about what has happened since the free kit</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            You have a positioning sentence and a first offer written on a page.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            And then? Nothing. The page is in a downloads folder. You went back to work on Monday, and
            the person who asked you in March asked somebody else in June.
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            That is not a discipline problem. It is what happens when a plan has no next mechanical
            step. <em>“Go and price it”</em> is not an instruction. It is a wish.
          </p>
        </div>
      </section>

      {/* Cost of inaction, run forward twelve months. */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="font-display text-3xl">What another year of this costs</h2>
        <p className="mt-3 text-muted-foreground">Run it forward twelve months from today, changing nothing.</p>
        <div className="mt-8 space-y-6">
          {[
            ["The money", "Another year of work given away — compounding, because the people you help for free tell other people you help for free."],
            ["The position", "Every free delivery teaches your market what you cost. A reputation for generosity is almost impossible to re-price later. You are not starting from zero next year; you are starting from below it."],
            ["The window", "Somebody with half your experience is charging triple your rate in your field right now. They are not better. They just did not wait."],
            ["The evidence", "Nothing you did this year is quotable. No permission asked, no result recorded. Twelve more months of proof evaporating in real time."],
            ["And the quiet one", "You will still be answering the same WhatsApp question in 2027, still for nothing — and you will have started to believe that is what your knowledge is worth."],
          ].map(([h, b]) => (
            <div key={h} className="border-l-2 border-banana pl-5">
              <div className="font-display text-lg">{h}</div>
              <p className="mt-1 text-muted-foreground leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The path. Five steps, each with the benefit stated, not the feature. */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-3xl">Five steps. It ends when money moves.</h2>
          <div className="mt-8 space-y-8">
            <div>
              <div className="font-display text-xl">1 · The Knowledge Audit</div>
              <p className="mt-1 font-display text-sm italic text-banana">
                You stop calling it “just helping out.”
              </p>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Everything people come to you for, listed as inventory instead of favours.
              </p>
            </div>
            <div>
              <div className="font-display text-xl">2 · The Leak</div>
              <p className="mt-1 font-display text-sm italic text-banana">
                The page that ends the debate with yourself.
              </p>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                What giving it away has cost, in rand, counted — using an hourly rate worked out from
                what your own industry pays for your qualification. Most people stop reading their own
                answer halfway down.
              </p>
            </div>
            <div>
              <div className="font-display text-xl">3 · The Offer Blueprint</div>
              <p className="mt-1 font-display text-sm italic text-banana">
                A favour becomes a thing with a name.
              </p>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                A package with a promise and something that actually changes hands. It ends in a
                printable one-pager — name, promise, what they get — that you can send today.
              </p>
            </div>
            <div>
              <div className="font-display text-xl">4 · The Charge Gate</div>
              <p className="mt-1 font-display text-sm italic text-banana">
                A number you can defend without your voice going up at the end.
              </p>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Four checkable conditions, not feelings:
              </p>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>· Has more than one person asked you for this?</li>
                <li>· Did you deliver it once, and can you quote what changed?</li>
                <li>· Is the output a thing, or a feeling?</li>
                <li>· Can you say what it costs them <em>not</em> to have it?</li>
              </ul>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Three or four yes — charge now. Two — a founding price for the first three, with the
                sentence that ends it. Zero or one — deliver once more <em>on purpose</em>, collect a
                quotable result, then charge.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Then the number: the highest of three floors — what your time actually costs, what the
                result is worth to your buyer, and whether it breaks the rest of your pricing. The
                highest, never the average. Averaging lets your weakest input drag the price down.
              </p>
            </div>
            <div>
              <div className="font-display text-xl">5 · The Send</div>
              <p className="mt-1 font-display text-sm italic text-banana">You find out. This week.</p>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                One person. One date. One message. Not a list — a list lets you hide, and building the
                perfect one feels like work the entire time you are not sending anything.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="font-display text-3xl">Everything you get</h2>
        <div className="mt-8 divide-y divide-border border border-border bg-background">
          {[
            ["The five-step path, saved across devices", "Start on your phone at lunch, finish on the laptop at 21:00. Your answers carry forward — nothing is typed twice."],
            ["The Charge Gate", "The number, and the sentence that defends it."],
            ["25 tools in total", "Five are the path. The other twenty are the library for after your first delivery — hooks, voice, audience, income."],
            ["Sale scripts, four objections answered", "You know what to say when they say “that is expensive.”"],
            ["The 4E content calendar", "Thirty prompts about your offer — not generic content ideas."],
            ["The Money Split", "You get paid properly and keep what is SARS's aside, before you spend it."],
            ["9 workbooks", "The printed version, for the people who think on paper."],
            ["A 10-video course", "Personal Branding, start to finish. All ten open on day one — no drip."],
            ["Lifetime access, all future updates", "Including everything added later."],
          ].map(([t, b]) => (
            <div key={t} className="p-5">
              <div className="font-display text-sm font-bold">{t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{b}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-3xl">What it costs, in perspective</h2>
          <div className="mt-6 font-display text-5xl text-banana">{priceLabel}</div>
          <ul className="mt-6 space-y-3 text-muted-foreground">
            <li>· One hour of the consultant you would hire to answer this instead</li>
            <li>· Less than the course you bought last year and did not finish</li>
            <li>
              ·{" "}
              <strong className="text-foreground">
                If your first sale is R2,500, it pays for itself once.
              </strong>{" "}
              If it is R9,000, it paid for itself six times before lunch.
            </li>
          </ul>
          <p className="mt-6 text-lg leading-relaxed">
            You have already spent more than this on qualifications that made you better at the thing.
            This is the first money you would spend on getting paid for it.
          </p>
        </div>
      </section>

      {/* Conditional guarantee — deliberately. An unconditional refund on a
          digital product attracts people who never open it, and makes the
          promise unbelievable to a professional. */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="font-display text-3xl">My guarantee, and what it asks of you</h2>
        <p className="mt-5 text-muted-foreground leading-relaxed">
          Do all five steps. Send your offer to one real person.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          If you get to the end and do not have a priced offer you would actually put in front of
          somebody — email me, show me the five steps completed, and I will refund you in full.
        </p>
        <p className="mt-4 text-lg leading-relaxed">
          I will not refund someone who bought it and never opened it. That is not a risk I can carry
          for you, and pretending otherwise would make this page like every other one you have read.
        </p>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-3xl">Three objections, answered</h2>
          <div className="mt-8 space-y-6">
            <div>
              <div className="font-display text-sm font-bold text-banana">“I do not have time.”</div>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                One step an evening, saved between sessions. You have spent longer than that this
                month answering questions for free.
              </p>
            </div>
            <div>
              <div className="font-display text-sm font-bold text-banana">
                “What if my field is different?”
              </div>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                Every tool asks for your profession and works from your answers, not a template. The
                Leak prices your hour from what your own industry pays for your qualification — an
                auditor and a nurse get different numbers because they should.
              </p>
            </div>
            <div>
              <div className="font-display text-sm font-bold text-banana">
                “I am not ready to charge yet.”
              </div>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                Step four is literally a test for that. If you are not ready it tells you so, and tells
                you exactly what to do first. That answer alone is worth the price.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="buy" className="scroll-mt-20">
        <div className="mx-auto max-w-2xl px-6 py-20">
          <div className="text-center">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Get instant access</div>
            <h2 className="mt-3 font-display text-4xl">Name the number.</h2>
          </div>
          <BuyForm priceLabel={priceLabel} disabled={!product} />
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Instant access · lifetime · full refund if you do the work and it fails you
          </p>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Already went through the free Starter Kit? This is Step 2. Not there yet?{" "}
            <Link to="/starterkit" className="text-banana underline">Start free</Link>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-20">
        <p className="text-sm italic leading-relaxed text-muted-foreground">
          P.S. — Step two asks you to count what the free version has cost you. Do that page even if
          you buy nothing else. Most people have never added it up, and the number is almost always
          larger than every course they have ever bought, combined.
        </p>
      </section>

      <ContentpreneurFooter />
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
  // initializeCheckout/initializeStripeCheckout BOTH call assertTurnstile as their
  // first statement. This form never rendered a widget and never sent a token, so
  // with TURNSTILE_SECRET_KEY set in production every purchase attempt died on
  // "Verification failed — please refresh the page and try again." Ported from the
  // pattern products.$slug.tsx and cart.tsx already use correctly.
  const [tsToken, setTsToken] = useState<string | null>(null);
  // A Turnstile token is single-use — reset after EVERY attempt so a retry
  // (or a second run of this tool) gets a fresh one instead of re-sending a
  // spent token, which Cloudflare rejects as `timeout-or-duplicate`.
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
      {/* "allow": a widget that cannot load must never be the reason a sale is
          lost. The server still verifies and alerts — see checkTurnstileForCheckout. */}
      <TurnstileGate ref={tsRef} onToken={setTsToken} unavailablePolicy="allow" className="mt-5" />
      <Button
        size="lg"
        disabled={!email || !tsToken || mut.isPending || disabled}
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
