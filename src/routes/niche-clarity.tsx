import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { initializeCheckout } from "@/lib/checkout.functions";
import { formatPrice } from "@/lib/gardens";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";

const SLUG = "niche-clarity-workbook";

export const Route = createFileRoute("/niche-clarity")({
  head: () => ({
    meta: [
      { title: "Niche Clarity Workbook — $16 — CHKPLT" },
      {
        name: "description",
        content:
          "Stop guessing what to post. In a single afternoon, lock in the one niche that fits your story, your skills, and your calling — for $16.",
      },
      { property: "og:title", content: "Niche Clarity Workbook — $16" },
      {
        property: "og:description",
        content:
          "Lock in the one niche that fits your story, skills and calling — in a single afternoon.",
      },
    ],
  }),
  component: NicheClarityPage,
});

function NicheClarityPage() {
  const { data: product } = useQuery({
    queryKey: ["product", SLUG],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug,title,price_cents,currency,is_free,description,format")
        .eq("slug", SLUG)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const priceLabel = product
    ? formatPrice(product.price_cents, product.currency, product.is_free)
    : "$16";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.25em] uppercase text-banana">
          <Sparkles className="size-3.5" /> The Niche Clarity Workbook
        </div>
        <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-7xl leading-[1.02]">
          You don't have a content problem.<br />
          <em className="not-italic text-banana">You have a niche problem.</em>
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          In one focused afternoon, lock in the <strong className="text-foreground">one niche</strong> that
          actually fits your story, your skills, and your calling — so you stop second-guessing every
          post and start building an audience that pays.
        </p>

        <div className="mt-10 flex flex-wrap items-baseline gap-4">
          <div className="font-display text-5xl sm:text-6xl text-banana">{priceLabel}</div>
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">
            one-time · instant download
          </div>
        </div>

        <div className="mt-8">
          <a
            href="#buy"
            className="inline-flex items-center justify-center rounded-md bg-banana px-8 py-4 font-display text-lg text-banana-foreground hover:bg-banana/90 transition-colors"
          >
            Get the workbook — {priceLabel} →
          </a>
        </div>
      </section>

      {/* Outcomes */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">What changes</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">
            By the time you put the pen down, you'll have:
          </h2>
          <ul className="mt-12 grid gap-px bg-border border border-border md:grid-cols-2">
            {[
              "One clearly named niche — written in a sentence you can defend",
              "A profile of the exact person you're talking to (and the ones you're not)",
              "A 30-day content map built around your niche, not random trends",
              "Three offer ideas your niche is already willing to pay for",
              "A simple test to know if a post belongs on your feed or doesn't",
              "Confidence to stop apologising for what you do",
            ].map((o) => (
              <li key={o} className="flex items-start gap-3 bg-background p-6">
                <Check className="mt-1 size-4 shrink-0 text-banana" />
                <span className="text-base">{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Who for / not for */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid gap-px bg-border border border-border md:grid-cols-2">
          <div className="bg-background p-8">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">This is for</div>
            <ul className="mt-5 space-y-3 text-base">
              <li>— Creators posting consistently but not growing.</li>
              <li>— Coaches and consultants who feel "too broad."</li>
              <li>— Christian creators tired of copying the secular playbook.</li>
              <li>— Anyone earning R0–R10K/month who knows there's more.</li>
            </ul>
          </div>
          <div className="bg-background p-8">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-muted-foreground">This is NOT for</div>
            <ul className="mt-5 space-y-3 text-base text-muted-foreground">
              <li>— People looking for a "viral hack."</li>
              <li>— Creators who refuse to pick a lane.</li>
              <li>— Anyone unwilling to spend an afternoon thinking honestly.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* What's inside */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">What's inside</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">A 6-step path to your niche.</h2>
          <ol className="mt-12 space-y-6">
            {[
              ["01", "Story Audit", "Mine your own journey for the niches hiding in plain sight."],
              ["02", "Skill Stack", "Stack what you're good at into something only you can offer."],
              ["03", "Calling Filter", "Cross-check every idea against the work you were actually called to."],
              ["04", "Audience Profile", "Name the one person you serve — and the ones you won't."],
              ["05", "Niche Statement", "Write the single sentence that defines everything you post."],
              ["06", "30-Day Map", "Plan a month of content built around your locked-in niche."],
            ].map(([n, title, body]) => (
              <li key={n} className="flex gap-6 border-t border-border pt-6">
                <div className="font-mono text-xs tracking-[0.2em] text-banana">{n}</div>
                <div>
                  <h3 className="font-display text-2xl">{title}</h3>
                  <p className="mt-2 text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          {product?.format && (
            <p className="mt-12 font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">
              Format: {product.format}
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Common questions</div>
        <h2 className="mt-3 font-display text-4xl">Before you buy.</h2>
        <Accordion type="single" collapsible className="mt-10">
          <AccordionItem value="q1">
            <AccordionTrigger>How long does it take to finish?</AccordionTrigger>
            <AccordionContent>
              One focused afternoon — about 3 to 4 hours if you go through every prompt honestly.
              You can also work through one section per day across a week.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>I've tried niching down before and it didn't work. Why is this different?</AccordionTrigger>
            <AccordionContent>
              Most niche advice tells you to "pick a topic." This walks you through your story, skills,
              and calling first — so the niche you land on is one you can actually sustain for years.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>Is this only for Christian creators?</AccordionTrigger>
            <AccordionContent>
              The framework works for anyone, but it's written from a Christian worldview — calling
              and conviction are part of the conversation, not bolted on at the end.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4">
            <AccordionTrigger>What if I'm already established?</AccordionTrigger>
            <AccordionContent>
              Even better. Use it to sharpen what you're already doing and cut the content that's
              dragging your growth down.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q5">
            <AccordionTrigger>How do I get it after I pay?</AccordionTrigger>
            <AccordionContent>
              Instant access — you'll be taken to a confirmation page right after checkout, and your
              account will show the download in your dashboard.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Buy block */}
      <section id="buy" className="border-t border-border bg-card/30 scroll-mt-20">
        <div className="mx-auto max-w-2xl px-6 py-20">
          <div className="text-center">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Get instant access</div>
            <h2 className="mt-3 font-display text-5xl">Lock in your niche today.</h2>
            <p className="mt-4 text-muted-foreground">
              One-time payment. Lifetime access. No upsells unless you want them.
            </p>
          </div>
          <BuyForm priceLabel={priceLabel} disabled={!product} />
        </div>
      </section>

      <SiteFooter />

      {/* Sticky mobile CTA */}
      <a
        href="#buy"
        className="fixed bottom-4 left-4 right-4 z-30 inline-flex items-center justify-center rounded-md bg-banana px-6 py-4 font-display text-base text-banana-foreground shadow-lg md:hidden"
      >
        Buy the workbook — {priceLabel} →
      </a>
    </div>
  );
}

function BuyForm({ priceLabel, disabled }: { priceLabel: string; disabled: boolean }) {
  const { user } = useAuth();
  const initFn = useServerFn(initializeCheckout);
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [fullName, setFullName] = useState<string>(
    (user?.user_metadata?.full_name as string) ?? "",
  );

  const mut = useMutation({
    mutationFn: initFn,
    onSuccess: (res: { authorizationUrl: string }) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not start checkout"),
  });

  return (
    <div className="mt-10 border border-border bg-background p-6">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            Full name
          </label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1"
            placeholder="Optional"
          />
        </div>
      </div>
      <Button
        size="lg"
        disabled={!email || mut.isPending || disabled}
        onClick={() =>
          mut.mutate({
            data: {
              productSlug: SLUG,
              email,
              fullName: fullName || undefined,
            },
          })
        }
        className="mt-6 w-full bg-banana text-banana-foreground hover:bg-banana/90"
      >
        {mut.isPending ? "Starting…" : `Pay ${priceLabel} →`}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Secure checkout · ZAR · Powered by Paystack
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Not sure? <Link to="/products" className="underline">Browse other products</Link>
      </p>
    </div>
  );
}
