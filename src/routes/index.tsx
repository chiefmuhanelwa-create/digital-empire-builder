import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { TurnstileGate } from "@/components/TurnstileGate";
import { initializeCheckout } from "@/lib/checkout.functions";
import { getUtm } from "@/lib/utm";
import { trackLead } from "@/lib/track";
import { formatPrice } from "@/lib/gardens";
import { supabase } from "@/integrations/supabase/client";
import { X, ArrowRight } from "lucide-react";
import { useCountry } from "@/lib/currency";

const PRODUCT_SLUG = "called-expert-foundation-kit";
const INTRO_VIDEO_ID = ""; // Paste YouTube video ID here
// Meta Youth Summit talk (YouTube Short — vertical).
const META_VIDEO_ID = "_JYjzFDrSgs";
// Real testimonials replace the proof-badge row automatically once added: { quote, name }
const TESTIMONIALS: { quote: string; name: string }[] = [];

// Glow helpers — inline so Tailwind purge never strips them
const GOLD_GLOW = {
  boxShadow: "0 0 24px rgba(245,158,11,0.55), 0 0 56px rgba(245,158,11,0.25)",
} as const;

const GOLD_GLOW_SOFT = {
  boxShadow: "0 0 16px rgba(245,158,11,0.35), 0 0 36px rgba(245,158,11,0.12)",
} as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Called Expert Foundation Kit — Turn Your Expertise Into Income Without Quitting Your Job" },
      {
        name: "description",
        content:
          "The 7-framework system for professionals, teachers, and specialists ready to earn from their knowledge — without quitting your job. Instant access.",
      },
      { property: "og:title", content: "Called Expert Foundation Kit — $97" },
      {
        property: "og:description",
        content:
          "PAIDS · DARES · 4E Content Calendar · SEEDS Pipeline · Niche Clarity · Knowledge Audit. Package and sell what you already know — without quitting first.",
      },
    ],
  }),
  component: Landing,
});

// ── Checkout Modal ──────────────────────────────────────────────────────────

function CheckoutModal({
  onClose,
  displayPrice,
  comparePrice,
  savings,
}: {
  onClose: () => void;
  displayPrice: string;
  comparePrice: string;
  savings: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tsToken, setTsToken] = useState<string | null>(null);
  const [addBump, setAddBump] = useState(false);
  const country = useCountry();
  const bumpPrice = formatPrice(29000, "ZAR", false, "creator-swipe-vault", country);

  const initFn = useServerFn(initializeCheckout);
  const mut = useMutation({
    mutationFn: initFn,
    onSuccess: (res) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: Error) =>
      toast.error(e.message ?? "Could not start checkout. Please try again."),
  });

  const inputCls =
    "w-full bg-white border border-[#CBD5E1] px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors rounded-none";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-sm relative my-4 border border-[#F59E0B]"
        style={GOLD_GLOW}
      >
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 z-10 inline-flex items-center justify-center h-11 w-11 text-[#475569] hover:text-[#0F172A]"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="bg-white px-6 pt-7 pb-5 text-center border-b border-[#E2E8F0]">
          <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-banana mb-2">
            INSTANT ACCESS — LIMITED OFFER
          </div>
          <h3 className="font-display text-xl text-[#0F172A] leading-snug">
            Called Expert Foundation Kit
          </h3>
          <div className="mt-4">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-[#64748B] text-sm line-through font-mono">
                {comparePrice}
              </span>
              <span className="bg-green-600 text-white text-[11px] font-bold px-2 py-0.5">
                Save {savings}!
              </span>
            </div>
            <div className="font-display text-5xl text-banana">
              {displayPrice}
              <span className="text-base text-[#475569] font-mono ml-1">
                today
              </span>
            </div>
          </div>
          <p className="text-[#475569] text-xs mt-2">
            Delivered instantly. Start in the next 2 minutes.
          </p>
          <p className="text-[#64748B] text-[11px] mt-1">
            Shown in USD · charged in Rand (ZAR) at today's live rate.
          </p>
        </div>

        {/* Form */}
        <form
          className="px-6 py-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            trackLead();
            mut.mutate({
              data: {
                productSlug: PRODUCT_SLUG,
                email,
                fullName: firstName,
                phone: phone || undefined,
                turnstileToken: tsToken ?? undefined,
                bumpSlugs: addBump ? ["creator-swipe-vault"] : undefined,
                ...getUtm(),
              },
            });
          }}
        >
          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1.5 tracking-widest uppercase">
              First Name
            </label>
            <input
              type="text"
              required
              placeholder="Your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1.5 tracking-widest uppercase">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1.5 tracking-widest uppercase">
              Mobile Number
            </label>
            <input
              type="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
            />
          </div>
          {/* Order bump */}
          <label className="flex items-start gap-3 border-2 border-dashed border-[#F59E0B]/60 bg-[#F59E0B]/5 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={addBump}
              onChange={(e) => setAddBump(e.target.checked)}
              className="mt-0.5 size-5 accent-[#F59E0B] shrink-0"
            />
            <span className="text-[13px] leading-snug text-[#333]">
              <strong className="text-[#0F172A]">Yes — add The Creator Swipe Vault for just {bumpPrice}.</strong>{" "}
              Plug-and-play hooks, captions & DM scripts so you can start posting today. One-time add-on.
            </span>
          </label>
          <TurnstileGate onToken={setTsToken} />
          <button
            type="submit"
            disabled={mut.isPending || !tsToken}
            className="w-full bg-[#F59E0B] text-[#111] font-display font-black text-base py-4 tracking-[0.06em] uppercase hover:bg-[#D97706] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            style={mut.isPending || !tsToken ? undefined : GOLD_GLOW}
          >
            {mut.isPending ? "Redirecting…" : "GET INSTANT ACCESS NOW"}
          </button>
        </form>

        {/* Trust row */}
        <div className="border-t border-[#E2E8F0] px-6 py-4 text-center">
          <p className="text-[#64748B] text-[11px] mb-1">
            🔒 256-Bit Encrypted Secure Checkout
          </p>
          <p className="text-[#64748B] text-[11px]">
            Backed by our{" "}
            <strong className="text-banana">
              100% 30-Day Money-Back Guarantee
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── CTA Button ──────────────────────────────────────────────────────────────

function CtaButton({
  onClick,
  label,
  sub,
  size = "normal",
}: {
  onClick: () => void;
  label: string;
  sub?: string;
  size?: "normal" | "large";
}) {
  return (
    <div className="text-center">
      <div className="relative inline-block w-full max-w-lg">
        {size === "large" && (
          <div
            className="absolute -inset-[3px] animate-pulse"
            style={{ background: "linear-gradient(90deg, #F59E0B, #B45309, #F59E0B)", opacity: 0.6 }}
          />
        )}
        <button
          onClick={onClick}
          className={`relative inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-[#111] font-display font-black uppercase tracking-[0.04em] hover:bg-[#D97706] active:scale-[0.99] transition-all w-full ${
            size === "large"
              ? "text-lg sm:text-xl py-5 sm:py-6 px-6 sm:px-12"
              : "text-base sm:text-lg py-4 sm:py-5 px-6 sm:px-10"
          }`}
          style={size === "large" ? { boxShadow: "0 0 32px rgba(245,158,11,0.7), 0 0 80px rgba(245,158,11,0.35)" } : GOLD_GLOW}
        >
          {label}
          <ArrowRight className="size-5 sm:size-6 shrink-0" />
        </button>
      </div>
      {sub && <p className="mt-3 text-[#475569] text-xs sm:text-sm">{sub}</p>}
    </div>
  );
}

// ── FAQ Accordion ───────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E2E8F0] last:border-0">
      <button
        className="w-full text-left py-4 sm:py-5 flex items-center justify-between gap-4"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-display text-base sm:text-lg text-[#0F172A] leading-snug">
          {q}
        </span>
        <span
          className={`shrink-0 size-6 flex items-center justify-center border border-[#F59E0B] text-banana font-bold text-lg leading-none transition-transform ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm sm:text-base text-[#475569] leading-relaxed pr-8">
          {a}
        </p>
      )}
    </div>
  );
}

// ── FAQ Data ────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "What exactly do I get for $97?",
    a: "Six digital workbooks: the PAIDS Framework (your income map), DARES Asset Model (build income that doesn't need you to show up every day), 4E Content Calendar (30 days of strategy pre-built), SEEDS Pipeline Template (your first sales funnel, step by step), Niche Clarity Workbook (lock your niche in one afternoon), and the Knowledge Audit (find the product hiding in your expertise in 2 hours). Plus three bonuses. All instant download.",
  },
  {
    q: "Do I need to quit my job first?",
    a: "No. That is the biggest lie in the industry. This system was built specifically for people who are currently employed. The PAIDS Framework maps income streams that work in the margins of your existing schedule. It was built in 4-hour windows between night shifts at an air traffic control centre. You build first. You quit — if you want to — later.",
  },
  {
    q: "Who is this for?",
    a: "Professionals, teachers, healthcare workers, academics, corporate employees, and freelancers who have spent years building expertise — and who have never been paid what that expertise is actually worth. If your knowledge is deeper than your salary, this is for you.",
  },
  {
    q: "Do I need a large following for this to work?",
    a: "No. Your first income stream from your expertise does not require a large audience. It requires the right packaging, the right positioning, and the right pipeline — all of which the Foundation Kit gives you. The system works from a standing start of zero followers.",
  },
  {
    q: "How fast can I see results?",
    a: "The Knowledge Audit takes 2 hours. The Niche Clarity Workbook takes one afternoon. The 4E Content Calendar gives you 30 days of strategy in a single sitting. Some people move from 'no idea' to 'first income stream mapped' in a weekend.",
  },
  {
    q: "What if I don't know my niche yet?",
    a: "That is exactly what the Niche Clarity Workbook is for. You will walk out of it with one specific niche locked in — built from your actual story, your actual skills, and the gap the market has right now. Not guesswork. A structured process that gives you a clear answer.",
  },
  {
    q: "Is this just a motivational PDF?",
    a: "No. There is no motivation in this kit. PAIDS is a working framework with fillable exercises. SEEDS is a funnel template. The 4E Calendar is a 30-day strategy you fill in and execute. These are working documents — not reading material.",
  },
  {
    q: "I've tried other courses and systems. Why would this be different?",
    a: "Most courses give you inspiration. This gives you a system. The difference is that you finish each workbook with a specific deliverable — a niche statement, an income map, a content calendar, a sales pipeline. You don't finish inspired and directionless. You finish with something you can execute tomorrow morning.",
  },
  {
    q: "What if it doesn't work for me?",
    a: "If you work through the Foundation Kit and don't feel like you have a clear system for your first income stream, I will refund every cent. No questions asked. 30 days. The risk is entirely mine.",
  },
  {
    q: "What are the 7 stages of the Called Expert system?",
    a: "Stage 1: Foundation (MS×TS×SS — Mindset × Toolset × Skillset). Stage 2: Self-Awareness (SWOT Analysis). Stage 3: Content Strategy (4Es — Educate, Entertain, Encourage, Earn). Stage 4: Audience Building (Social Media). Stage 5: Community (3Cs — Create, Collaborate, Contribute). Stage 6: Business Model (DARES — Digital, Automated, Recurring, Evergreen, Scalable). Stage 7: Revenue System (PAIDS — Products, Ads & Affiliates, Information, Deals, Services). The Foundation Kit gives you the core frameworks from Stages 1, 3, 5, and 7 so you can start immediately. The 90-Day Accelerator PRO takes you through all 7 in sequence with live coaching and direct access.",
  },
  {
    q: "Is CHKPLT a Christian platform?",
    a: "The founder is Christian and the frameworks are rooted in kingdom principles — stewardship, calling, fruitfulness, generational legacy. But the system works for anyone whose expertise was given to them for a purpose beyond a salary. If you believe your knowledge is a calling — this is for you.",
  },
];

// ── Before/After rows ───────────────────────────────────────────────────────

const BEFORE_AFTER: [string, string][] = [
  [
    "Posting without a strategy and getting nothing back",
    "A 30-day content calendar with the exact ratio that converts",
  ],
  [
    "Expertise that your salary doesn't reflect",
    "A clear income map across 5 revenue streams built from what you know",
  ],
  [
    "No idea how to package or sell what you know",
    "A defined niche, a clear offer, and a working sales pipeline",
  ],
  [
    "Watching others earn from knowledge less deep than yours",
    "Understanding exactly how professionals like you build income",
  ],
  [
    "Random courses that gave inspiration but no system",
    "Six working frameworks you complete and execute — not just read",
  ],
  [
    "Building for a platform that can disappear overnight",
    "A system you own — independent of any algorithm or employer",
  ],
  [
    "Expertise that dies with your career",
    "A legacy income stream for your children's children",
  ],
];

// ── Landing Page ────────────────────────────────────────────────────────────

function Landing() {
  const [showModal, setShowModal] = useState(false);
  const open = () => setShowModal(true);

  const { data: product } = useQuery({
    queryKey: ["homepage-product-price"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("price_cents, currency")
        .eq("slug", PRODUCT_SLUG)
        .eq("status", "published")
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const country = useCountry();
  const priceCents = product?.price_cents ?? 9700;
  const currency = product?.currency ?? "USD";
  // Headline price: always USD ($97 via USD_DISPLAY), charged in ZAR at checkout.
  const displayPrice = formatPrice(priceCents, currency, false, PRODUCT_SLUG, country);
  // Value anchors tie to the value stack below: $820 value − $97 = $723 saved.
  const comparePrice = "$820";
  const savings = "$723";

  const RECEIPTS = ["Meta", "Netflix", "Capitec", "Standard Bank", "SA Tourism", "Showmax", "ABSA"];

  const STATS = [
    ["R600,000+", "in a single year"],
    ["50+", "brand deals · 23 agencies"],
    ["3M+", "followers at peak"],
    ["SAMA31", "judge · Meta speaker"],
  ];

  const VALUE_STACK: [string, string][] = [
    ["Niche Clarity Workbook", "$97"],
    ["Knowledge Audit", "$97"],
    ["PAIDS Framework (income map)", "$97"],
    ["DARES Asset Model", "$97"],
    ["4E Content Calendar", "$97"],
    ["SEEDS Pipeline Template", "$97"],
    ["MS×TS×SS Foundation Assessment", "$97"],
    ["BONUS: Called Expert Cheat Sheet", "$47"],
    ["BONUS: 90-Day First Income Planner", "$47"],
    ["BONUS: 30-Day Accountability Tracker", "$47"],
  ];

  return (
    <div className="min-h-screen bg-white text-[#0F172A] overflow-x-hidden pb-20 sm:pb-0">
      {showModal && (
        <CheckoutModal
          onClose={() => setShowModal(false)}
          displayPrice={displayPrice}
          comparePrice={comparePrice}
          savings={savings}
        />
      )}

      {/* ── Sticky mobile buy bar — CTA always one tap away ─────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0F172A] border-t border-[#F59E0B]/40 px-4 py-3 flex items-center justify-between gap-3">
        <div className="leading-tight">
          <div className="font-display text-lg text-white">{displayPrice}</div>
          <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FCD34D]">Foundation Kit · instant access</div>
        </div>
        <button
          onClick={open}
          className="rounded-full bg-[#F59E0B] text-[#0F172A] font-bold text-sm px-5 py-3 whitespace-nowrap hover:bg-[#D97706] transition-colors"
        >
          Get Access
        </button>
      </div>

      <SiteHeader />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="nx-hero-orb border-b border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-20 text-center">
          <p className="nx-label mb-4">Called Expert Foundation Kit</p>
          <h1 className="mb-5">
            Your knowledge is worth more than your salary.{" "}
            <strong>You don't have to quit first.</strong>
          </h1>
          <p className="nx-body max-w-xl mx-auto mb-8">
            The 7-framework system that turns years of professional expertise into income you own —
            built for people who still have a job. No following required. Built in 4-hour windows
            between shifts.
          </p>

          <CtaButton
            onClick={open}
            label={`Get Instant Access — ${displayPrice}`}
            sub="Instant download · 30-day money-back guarantee · billed in ZAR at checkout"
            size="large"
          />

          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-[var(--text-subtle)]">
            <span className="line-through">{comparePrice} value</span>
            <span className="rounded-full bg-[#16A34A]/10 text-[#15803D] font-bold px-3 py-1 text-xs">
              Save {savings} today
            </span>
          </div>
        </div>
      </section>

      {/* ── RECEIPTS — credibility above the fold ────────────────────────── */}
      <section className="bg-[#0F172A]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-center text-xs font-bold tracking-[0.2em] uppercase text-[#FCD34D] mb-5">
            Built on real receipts — not theory
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-8">
            {RECEIPTS.map((r) => (
              <span key={r} className="font-display text-lg sm:text-xl font-bold text-slate-200/90">
                {r}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-xl overflow-hidden">
            {STATS.map(([big, small]) => (
              <div key={big} className="bg-[#0F172A] p-4 text-center">
                <div className="font-display text-2xl sm:text-3xl text-[#FCD34D]">{big}</div>
                <div className="text-xs text-slate-400 mt-1">{small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF VIDEO ──────────────────────────────────────────────────── */}
      {META_VIDEO_ID && (
        <section className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-14 text-center">
            <p className="nx-label mb-3">As seen on</p>
            <h2 className="mb-6">From sleeping in university bathrooms to the Meta stage.</h2>
            <div className="nx-video-wrapper mx-auto aspect-video max-w-sm">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${META_VIDEO_ID}?rel=0&modestbranding=1`}
                title="Meta Youth Summit"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* ── THE REFRAME — stewardship, not side hustle ───────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <p className="nx-label mb-3">You've stayed long enough on this mountain</p>
          <h2 className="mb-6">This isn't a side hustle. It's your parallel assignment.</h2>
          <div className="nx-body space-y-4">
            <p>
              You've spent 10, 15, 20 years building real expertise. A profession. A specialty. A
              calling. And the market still pays you a salary that has nothing to do with what you
              actually know.
            </p>
            <p>
              You don't need another qualification. You don't need to quit and gamble your family's
              security on a leap. You need a <strong className="text-[var(--foreground)]">system</strong> to
              package what you already carry — and the time-respecting way to build it in the margins
              of the job you still have.
            </p>
            <p>
              Build first. Quit later — if you ever want to. Your expertise was never meant to die
              with your career. It's meant to become an asset for your children's children.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["Time poverty", "Built in 4-hour windows between night shifts — not 20 hours a week you don't have."],
              ["No following needed", "Your first income stream comes from packaging, not from going viral."],
              ["Own the asset", "Build on land you own — not a platform that can suspend you overnight."],
            ].map(([t, d]) => (
              <div key={t} className="nx-card !p-5">
                <div className="font-display text-lg text-[var(--foreground)]">{t}</div>
                <p className="text-sm text-[var(--text-dim)] mt-1 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUE STACK ──────────────────────────────────────────────────── */}
      <section className="bg-[var(--bg-surface)] border-y border-[var(--border)]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
          <p className="nx-label text-center mb-3">Everything you get</p>
          <h2 className="text-center mb-8">7 working frameworks. 3 bonuses. One system.</h2>

          <div className="nx-card !p-6 sm:!p-8">
            <div className="space-y-2 mb-6">
              {VALUE_STACK.map(([name, val]) => (
                <div key={name} className="flex items-center justify-between text-sm border-b border-[var(--border)] pb-2 last:border-0">
                  <span className="text-[var(--text-body)]">{name}</span>
                  <span className="font-mono font-bold text-[var(--text-subtle)]">{val}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[var(--text-dim)] text-sm">Total value</span>
              <span className="font-mono text-lg line-through text-[var(--text-subtle)]">$820</span>
            </div>
            <div className="flex items-center justify-between border-t-2 border-[var(--nx-gold)] pt-3 mb-6">
              <span className="font-display text-xl">Your price today</span>
              <span className="font-display text-4xl sm:text-5xl text-banana">{displayPrice}</span>
            </div>
            <CtaButton
              onClick={open}
              label={`Yes — Get Instant Access for ${displayPrice}`}
            />
            <p className="text-center text-xs text-[var(--text-subtle)] mt-3">
              Instant download · billed in ZAR at checkout · 30-day money-back guarantee
            </p>
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ───────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-center mb-8">Where you are now → where this takes you</h2>
          <div className="space-y-3">
            {BEFORE_AFTER.map(([before, after]) => (
              <div key={before} className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-dim)]">
                  {before}
                </div>
                <div className="rounded-xl border border-[var(--nx-gold)]/40 bg-[#16A34A]/5 p-4 text-sm text-[var(--text-body)] font-medium">
                  {after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUARANTEE ────────────────────────────────────────────────────── */}
      <section className="bg-[var(--bg-surface)] border-y border-[var(--border)]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-14 text-center">
          <p className="nx-label mb-3">The risk is entirely mine</p>
          <h2 className="mb-4">30-day money-back guarantee.</h2>
          <p className="nx-body max-w-xl mx-auto">
            Work through the Foundation Kit. If you don't walk away with a clear system for your first
            income stream, email me and I'll refund every cent. No questions. No forms. 30 days.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-center mb-8">Questions, answered</h2>
          <div>
            {FAQS.slice(0, 8).map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="bg-[#0F172A]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-white mb-4">Do it for your children. Leave them a story.</h2>
          <p className="text-slate-300 max-w-lg mx-auto mb-8">
            You were given this knowledge for a purpose bigger than a salary. The Foundation Kit is
            where you start turning it into something you own.
          </p>
          <CtaButton
            onClick={open}
            label={`Get the Foundation Kit — ${displayPrice}`}
            sub="Instant access · 30-day money-back guarantee"
            size="large"
          />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
