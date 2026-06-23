import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteFooter } from "@/components/site-header";
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
  boxShadow: "0 0 24px rgba(201,168,76,0.55), 0 0 56px rgba(201,168,76,0.25)",
} as const;

const GOLD_GLOW_SOFT = {
  boxShadow: "0 0 16px rgba(201,168,76,0.35), 0 0 36px rgba(201,168,76,0.12)",
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
    "w-full bg-white border border-[#d0d0d0] px-4 py-3 text-sm text-[#1C1C1C] placeholder:text-[#bbb] focus:outline-none focus:border-[#C9A84C] transition-colors rounded-none";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-sm relative my-4 border border-[#C9A84C]"
        style={GOLD_GLOW}
      >
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 z-10 inline-flex items-center justify-center h-11 w-11 text-[#5a5a5a] hover:text-[#1C1C1C]"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="bg-white px-6 pt-7 pb-5 text-center border-b border-[#e0d8cc]">
          <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-banana mb-2">
            INSTANT ACCESS — LIMITED OFFER
          </div>
          <h3 className="font-display text-xl text-[#1C1C1C] leading-snug">
            Called Expert Foundation Kit
          </h3>
          <div className="mt-4">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-[#888] text-sm line-through font-mono">
                {comparePrice}
              </span>
              <span className="bg-green-600 text-white text-[11px] font-bold px-2 py-0.5">
                Save {savings}!
              </span>
            </div>
            <div className="font-display text-5xl text-banana">
              {displayPrice}
              <span className="text-base text-[#5a5a5a] font-mono ml-1">
                today
              </span>
            </div>
          </div>
          <p className="text-[#555] text-xs mt-2">
            Delivered instantly. Start in the next 2 minutes.
          </p>
          <p className="text-[#777] text-[11px] mt-1">
            Prices in USD · billed in ZAR (local equivalent) at checkout.
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
            <label className="block text-[11px] font-semibold text-[#5a5a5a] mb-1.5 tracking-widest uppercase">
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
            <label className="block text-[11px] font-semibold text-[#5a5a5a] mb-1.5 tracking-widest uppercase">
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
            <label className="block text-[11px] font-semibold text-[#5a5a5a] mb-1.5 tracking-widest uppercase">
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
          <label className="flex items-start gap-3 border-2 border-dashed border-[#C9A84C]/60 bg-[#C9A84C]/5 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={addBump}
              onChange={(e) => setAddBump(e.target.checked)}
              className="mt-0.5 size-5 accent-[#C9A84C] shrink-0"
            />
            <span className="text-[13px] leading-snug text-[#333]">
              <strong className="text-[#1C1C1C]">Yes — add The Creator Swipe Vault for just {bumpPrice}.</strong>{" "}
              Plug-and-play hooks, captions & DM scripts so you can start posting today. One-time add-on.
            </span>
          </label>
          <TurnstileGate onToken={setTsToken} />
          <button
            type="submit"
            disabled={mut.isPending || !tsToken}
            className="w-full bg-[#C9A84C] text-[#111] font-display font-black text-base py-4 tracking-[0.06em] uppercase hover:bg-[#b8963e] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            style={mut.isPending || !tsToken ? undefined : GOLD_GLOW}
          >
            {mut.isPending ? "Redirecting…" : "GET INSTANT ACCESS NOW"}
          </button>
        </form>

        {/* Trust row */}
        <div className="border-t border-[#e0d8cc] px-6 py-4 text-center">
          <p className="text-[#777] text-[11px] mb-1">
            🔒 256-Bit Encrypted Secure Checkout
          </p>
          <p className="text-[#777] text-[11px]">
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
            style={{ background: "linear-gradient(90deg, #C9A84C, #8B6B2E, #C9A84C)", opacity: 0.6 }}
          />
        )}
        <button
          onClick={onClick}
          className={`relative inline-flex items-center justify-center gap-2 bg-[#C9A84C] text-[#111] font-display font-black uppercase tracking-[0.04em] hover:bg-[#b8963e] active:scale-[0.99] transition-all w-full ${
            size === "large"
              ? "text-lg sm:text-xl py-5 sm:py-6 px-6 sm:px-12"
              : "text-base sm:text-lg py-4 sm:py-5 px-6 sm:px-10"
          }`}
          style={size === "large" ? { boxShadow: "0 0 32px rgba(201,168,76,0.7), 0 0 80px rgba(201,168,76,0.35)" } : GOLD_GLOW}
        >
          {label}
          <ArrowRight className="size-5 sm:size-6 shrink-0" />
        </button>
      </div>
      {sub && <p className="mt-3 text-[#5a5a5a] text-xs sm:text-sm">{sub}</p>}
    </div>
  );
}

// ── FAQ Accordion ───────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#e0d8cc] last:border-0">
      <button
        className="w-full text-left py-4 sm:py-5 flex items-center justify-between gap-4"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-display text-base sm:text-lg text-[#1C1C1C] leading-snug">
          {q}
        </span>
        <span
          className={`shrink-0 size-6 flex items-center justify-center border border-[#C9A84C] text-banana font-bold text-lg leading-none transition-transform ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm sm:text-base text-[#555] leading-relaxed pr-8">
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
  // Headline price: ZA → R (real charge), elsewhere → "$97" via USD_DISPLAY.
  const displayPrice = formatPrice(priceCents, currency, false, PRODUCT_SLUG, country);
  // Compare/savings: explicit anchor (passing slug to formatPrice ignores `cents`).
  // Show value anchors in the same currency the viewer sees.
  const za = country === "ZA";
  const anchor = za ? 1800 : 97;
  const cur = (n: number) => (za ? `R${(n).toLocaleString("en-ZA")}` : `$${n.toLocaleString("en-US")}`);
  const comparePrice = cur(anchor * 6);
  const savings = cur(anchor * 5);

  return (
    <div className="min-h-screen bg-white text-[#1C1C1C] overflow-x-hidden pb-20 sm:pb-0">
      {showModal && (
        <CheckoutModal
          onClose={() => setShowModal(false)}
          displayPrice={displayPrice}
          comparePrice={comparePrice}
          savings={savings}
        />
      )}

      {/* ── Sticky mobile buy bar — CTA always one tap away ─────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#1C1C1C] border-t border-[#C9A84C]/40 px-4 py-3 flex items-center justify-between gap-3">
        <div className="leading-tight">
          <div className="font-display text-lg text-[#FAF7F0]">{displayPrice}</div>
          <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-banana">Foundation Kit · instant access</div>
        </div>
        <button onClick={open} className="bg-[#C9A84C] text-[#111] font-black text-xs tracking-[0.08em] uppercase px-5 py-3 whitespace-nowrap">
          Get Access
        </button>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="border-b border-[#e0d8cc] bg-white sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="font-display text-sm sm:text-base font-black tracking-[0.22em] uppercase text-[#1C1C1C]">
            CHKPLT
          </span>
          {/* Sign-in — visible with gold border */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 border border-[#C9A84C] text-banana font-mono text-[11px] tracking-[0.18em] uppercase px-3 py-1.5 hover:bg-[#C9A84C] hover:text-[#111] transition-colors"
            style={GOLD_GLOW_SOFT}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── SOUND BANNER (only when a real video is set) ─────────────────── */}
      {INTRO_VIDEO_ID && (
        <div className="bg-[#C9A84C] text-[#111] py-2.5 text-center font-black text-xs sm:text-sm tracking-[0.05em] uppercase">
          🔊 Turn Your Sound ON — Watch The Intro Video Below First
        </div>
      )}

      {/* ── HERO + VIDEO (above the fold) ──────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 text-center">

          {/* Qualifier */}
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-banana mb-4">
            FOR PROFESSIONALS, TEACHERS, SPECIALISTS & HEALTHCARE WORKERS
          </div>

          {/* Transformation headline */}
          <h1 className="font-display text-[2rem] sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.02] tracking-tight text-[#1C1C1C] uppercase">
            Your Knowledge Is Worth More
            <br />
            <span className="text-banana">Than Your Salary</span>
            <br />
            Is Paying You.
          </h1>

          {/* Sub-headline */}
          <p className="mt-5 mx-auto max-w-2xl text-base sm:text-xl text-[#333] leading-relaxed font-medium">
            You've spent years becoming the expert people call for advice — but your income doesn't reflect it.
            There's a system to change that.{" "}
            <strong className="text-[#1C1C1C] underline decoration-[#C9A84C] underline-offset-4">
              Without quitting first.
            </strong>{" "}
            Without a massive following. Without starting over.
          </p>

          {/* No X No Y — sub copy */}
          <p className="mt-3 mx-auto max-w-xl text-sm sm:text-base text-[#777] leading-relaxed">
            No business degree. No huge following. No quitting first.
            <br className="hidden sm:block" />
            A proven 7-framework system to package and monetise what you already know.
          </p>

          {/* ── VIDEO (when set) or product mockup anchor ─────────────────── */}
          <div className="mt-7 sm:mt-8 mx-auto max-w-3xl">
            {INTRO_VIDEO_ID ? (
              <div className="relative w-full aspect-video bg-[#1C1C1C]" style={GOLD_GLOW}>
                <iframe
                  src={`https://www.youtube.com/embed/${INTRO_VIDEO_ID}?rel=0&modestbranding=1`}
                  title="Called Expert Foundation Kit"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <img
                  src="/product-covers/paids-framework-workbook.png"
                  alt="The Called Expert Foundation Kit"
                  className="w-56 sm:w-72 h-auto border border-[#e0d8cc]"
                  style={GOLD_GLOW}
                  width={288}
                  height={384}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>

          {/* Hero CTA — immediately after video */}
          <div className="mt-7 sm:mt-8">
            <CtaButton
              onClick={open}
              label={`GET INSTANT ACCESS — ${displayPrice}`}
              sub="🔒 Secure checkout · 30-day money-back guarantee · Instant download"
              size="large"
            />
          </div>
        </div>
      </section>

      {/* ── WHAT IS IT — 7 pains ──────────────────────────────────────── */}
      <section className="bg-white border-y border-[#e8e0d4]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1C1C1C] text-center uppercase mb-3">
            What Is The Called Expert Foundation Kit?
          </h2>
          <p className="text-center text-[#555] text-base sm:text-lg leading-relaxed mb-3 max-w-2xl mx-auto">
            A proven 7-framework system for professionals, specialists, and
            teachers struggling to{" "}
            <strong className="text-[#1C1C1C]">
              package their expertise, build authority, and create income that
              doesn't depend on their employer
            </strong>{" "}
            — without quitting their job first.
          </p>
          <p className="text-center text-[#5a5a5a] text-sm mb-8">
            Works even if you have zero following, have never sold anything
            online, and feel overwhelmed about where to start.
          </p>

          {/* Called Expert definition — moved from hero */}
          <div className="mb-8 mx-auto max-w-2xl bg-white border border-[#C9A84C]/30 px-5 sm:px-8 py-4">
            <p className="text-xs sm:text-sm text-[#555] leading-relaxed text-center">
              <strong className="text-[#1C1C1C]">A Called Expert</strong> is a professional, teacher, or specialist who was not just trained in their field —
              they were <em className="text-banana not-italic font-semibold">called</em> to it.
              Their knowledge is not just a skill. It is a stewardship.{" "}
              <em>Proverbs 13:22 says the wealth of the sinner is laid up for the just</em> — and that includes the wealth of knowledge.
              And if you think you're too late — read Matthew 20. The 11th hour worker gets the same denarius.
              Your 20 years of expertise is not a disadvantage. <strong className="text-[#1C1C1C]">It is your accelerator.</strong>
            </p>
          </div>

          {/* 7 pains */}
          <p className="text-center font-display text-lg text-[#1C1C1C] mb-5">
            Right now, you might be stuck because:
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 max-w-3xl mx-auto mb-10">
            {[
              "You've been in your field for 10+ years. People come to you for advice — sometimes for free. Your salary hasn't caught up with what you actually know.",
              "You've watched someone younger — with less experience, less depth, sometimes less qualification — earn more from their knowledge than you do from yours. And you couldn't figure out why.",
              "You told yourself: when the kids are older. When I have more time. When the contract ends. But the years keep passing, and the expertise keeps sitting unused.",
              "You believe you need to quit your job before you can build anything real. That's the biggest lie in the industry. This system was built in 4-hour windows between night shifts.",
              "You've tried courses that gave you inspiration and a folder full of notes — but no system you could execute on Monday morning.",
              "You feel like you're on the wrong mountain. Like the years of expertise were supposed to lead somewhere bigger — but you can't see the path.",
              "You know your knowledge could change lives and build a legacy — but you don't know where to start.",
            ].map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3 border-b border-[#f0ebe3] last:border-0"
              >
                <span className="shrink-0 size-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center mt-0.5">
                  ✕
                </span>
                <p className="text-[#444] text-sm sm:text-base leading-relaxed">
                  {p}
                </p>
              </div>
            ))}
          </div>

          {/* Solution bridge */}
          <div className="border border-[#e0d8cc] bg-white p-6 sm:p-8 max-w-3xl mx-auto">
            <p className="text-center font-display text-lg sm:text-xl text-[#1C1C1C] mb-5">
              With the Called Expert Foundation Kit, you'll finally:
            </p>
            <div className="grid sm:grid-cols-2 gap-x-8">
              {[
                "Define your niche and position yourself as the authority your expertise deserves",
                "Identify your ideal audience — the people ready to pay for what you know",
                "Build content that converts to income, not just views that go nowhere",
                "Create your first income stream — without quitting your job first",
                "Replace random guessing with a clear, proven 6-step system",
                "Stop watching others earn from knowledge you know at a deeper level",
                "Build something your children's children will inherit",
              ].map((b, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <span className="shrink-0 size-5 bg-green-500 text-white text-[10px] font-black flex items-center justify-center mt-0.5">
                    ✓
                  </span>
                  <p className="text-[#333] text-sm sm:text-base leading-relaxed">
                    {b}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ORDER CTA #1 ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div
            className="border-2 border-[#C9A84C] bg-white p-7 sm:p-10 max-w-xl mx-auto"
            style={GOLD_GLOW_SOFT}
          >
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-banana mb-2">
              NOW AVAILABLE FOR INSTANT ACCESS
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-[#1C1C1C] mb-4 uppercase">
              Called Expert Foundation Kit
            </h2>
            <div className="flex items-center justify-center gap-4 mb-1">
              <span className="text-[#bbb] text-base line-through font-mono">
                {comparePrice}
              </span>
              <span className="bg-green-100 text-green-700 text-[11px] font-bold px-3 py-1 border border-green-200">
                Save {savings}!
              </span>
            </div>
            <div className="font-display text-6xl sm:text-7xl text-banana mb-1">
              {displayPrice}
            </div>
            <p className="text-[#5a5a5a] text-sm mb-6">
              Once-off · Instant download · Delivered in 2 minutes
            </p>
            <CtaButton onClick={open} label="Click Here To Get Access" />
            <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
              <span className="text-[#bbb] text-xs">🔒 Secure Checkout</span>
              <span className="text-[#bbb] text-xs">🛡️ 30-Day Guarantee</span>
              <span className="text-[#bbb] text-xs">⚡ Instant Download</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IS THIS FOR ──────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1C1C1C] text-center uppercase mb-3">
            Who Can This Work For?
          </h2>
          <p className="text-center text-[#5a5a5a] text-base leading-relaxed mb-8 max-w-xl mx-auto">
            This works even if you're starting from zero and feel completely
            overwhelmed about where to begin.
          </p>
          <div className="divide-y divide-[#e0d8cc]">
            {[
              {
                who: "Professionals & Specialists",
                detail:
                  "whose salary hasn't kept pace with the depth of knowledge they've spent years building.",
              },
              {
                who: "Teachers & Lecturers",
                detail:
                  "whose course material could earn thousands per month from the right audience — outside of the classroom.",
              },
              {
                who: "Healthcare Workers",
                detail:
                  "with clinical and practical knowledge the public needs, trusts, and will pay for.",
              },
              {
                who: "Corporate Employees",
                detail:
                  "who have mastered skills the market will pay a premium for — skills that belong to them, not their employer.",
              },
              {
                who: "Freelancers at Capacity",
                detail:
                  "who are fully booked but trapped trading time for money with no way to scale beyond their own hours.",
              },
              {
                who: "Faith & Community Leaders",
                detail:
                  "who carry wisdom and lived experience their community would invest in — if it were packaged correctly.",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 py-4 sm:py-5">
                <span className="shrink-0 size-5 bg-[#C9A84C] text-[#111] text-[10px] font-black flex items-center justify-center mt-0.5">
                  ✓
                </span>
                <p className="text-[#333] text-sm sm:text-base leading-relaxed">
                  <strong className="text-[#1C1C1C]">{item.who}</strong>{" "}
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[#5a5a5a] text-sm">
            No huge following. No business degree.{" "}
            <strong className="text-[#1C1C1C]">
              No quitting your job first.
            </strong>
          </p>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1C1C1C] uppercase text-center mb-3">
            I Built This From The Receipts — Not The Theory
          </h2>
          <p className="text-[#5a5a5a] text-sm text-center mb-8 italic">
            "Before I built this system, I was exactly where you are. I want to save you the years it cost me."
          </p>

          <div className="space-y-5 text-[#333] text-base sm:text-lg leading-relaxed">
            <p>
              I grew up in Tshikwarani, Venda, Limpopo. My mother picked
              vegetables for a wage that worked out to less than a dollar a day.
              I was the youngest of four brothers. There was no plan B for us.
            </p>
            <p>
              I dropped out of pharmacy. Moved to UP on a REAP bursary.
              Geoinformatics. Failed a module.{" "}
              <strong className="text-[#1C1C1C]">
                Slept in university bathrooms for months
              </strong>{" "}
              because I couldn't afford accommodation. I didn't tell anyone. I
              just kept going.
            </p>
            <p>
              I got a job at Air Traffic Services — night shifts at OR Tambo International Airport. Between
              shifts, I built. With a phone and a data bundle, I
              started creating content.{" "}
              <em>
                That was the weapon. Not a degree. Not capital. A phone and
                discipline at 4am.
              </em>
            </p>

            <div className="border-l-4 border-[#C9A84C] pl-5 bg-white py-4 pr-4 text-[#444]">
              <p className="font-display text-base sm:text-lg text-[#1C1C1C] mb-2">Here is what I didn't know then:</p>
              <p>
                I was a Called Expert the whole time. I just didn't have a system to deploy it.
              </p>
              <p className="mt-3">
                You're probably the same. Your bathroom might not be UP.
                Your night shift might be a hospital ward, a classroom, a boardroom, or a screen at 11pm after the kids are in bed.
                But the frustration is the same: <em>"I know more than this salary reflects."</em>
              </p>
              <p className="mt-3">
                You're not wrong. You're just on the wrong mountain.
              </p>
              <p className="mt-2 text-sm italic text-[#777]">
                "You have stayed long enough on this mountain. Break camp and advance." — Deuteronomy 1:6–7
              </p>
              <p className="mt-3">
                That was God speaking to people who had everything they needed — but were camped where the breakthrough couldn't happen.
              </p>
            </div>

            <p>
              My first brand deal was worth less than a decent dinner. One post.
              500,000 followers. The second deal, same month, was barely more.
              Then came a day where a single affiliate link paid me more in one
              day than my weekly salary at Air Traffic Services at OR Tambo.
            </p>
            <p className="border-l-4 border-red-400 pl-5 text-[#555]">
              Then it crashed. Nearly 80% — two months later. Algorithm change.
              I was building on rented land. No system. Just posts. Just hustle.
              No foundation.
            </p>
            <p>
              Then — August 2025 — Instagram suspended my account.{" "}
              <strong className="text-[#1C1C1C]">
                780,000 followers. Gone overnight.
              </strong>{" "}
              AdSense had been disabled the year before. I lost six figures in
              annual passive income in a single decision I never made.
            </p>
            <p>
              That is when I understood the difference between a creator and a
              Called Expert. A creator depends on platforms. A Called Expert
              owns a system.
            </p>

            <div className="border-l-4 border-[#C9A84C] pl-5 bg-white py-4 pr-4 text-[#444]">
              <p>
                The platforms that disappeared — Instagram, AdSense — were the wrong side of the boat.
                Not bad tools. Just not the foundation.
              </p>
              <p className="mt-3">
                And you? You already have 10, 15, 20 years of expertise.
                You don't start from zero like I did.
                You start from everything you've already built —
                you just need a system to deploy it.
              </p>
            </div>

            <p>
              By then I had already built it: six figures in Meta payouts in a
              single year. 50+ brand deals across Africa. 3 million+ followers
              at peak. A SAMA31 judge seat. A Meta speaker platform. Two
              published books.{" "}
              <strong className="text-[#1C1C1C]">
                Not because of a big break — because of a system I built in
                4-hour windows, between night shifts, without quitting first.
              </strong>
            </p>

            <p className="font-display text-xl sm:text-2xl text-[#1C1C1C] border-l-4 border-[#C9A84C] pl-5">
              The Called Expert Foundation Kit is that system.
              <br />
              <em className="text-banana not-italic">
                You don't need to quit first. Build now. Build here.
              </em>
            </p>
          </div>

          {/* Founder card */}
          <div className="mt-10 bg-white border border-[#e0d8cc] p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <img
              src="/founder.jpg"
              alt="Ndivhuwo Muhanelwa"
              className="size-16 sm:size-20 shrink-0 object-cover object-top border-2 border-[#C9A84C] bg-[#e8e0d4]"
              loading="lazy"
              decoding="async"
              width={80}
              height={80}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <div className="font-display text-lg sm:text-xl text-[#1C1C1C]">
                Ndivhuwo Muhanelwa — "NoChill"
              </div>
              <div className="font-mono text-[10px] tracking-wide uppercase text-[#5a5a5a] mt-1">
                Tshikwarani, Venda → six-figure income · Night shifts at Air Traffic Services, OR Tambo · No degree · No quit
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION: JOHN 21 / RIGHT SIDE ────────────────────────────────── */}
      <section className="bg-[#1C1C1C]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-banana mb-6">The Mission</div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#FAF7F0] leading-[1.05] tracking-tight mb-8">
            This is not just another funnel.
            <br />
            <span className="text-banana">This is the right side of the boat.</span>
          </h2>
          <div className="space-y-5 text-[#5a5a5a] text-base sm:text-lg leading-relaxed">
            <p>
              John 21. The disciples fished all night from the wrong side. Nothing.
              Then Jesus said: <em className="text-[#FAF7F0]">"Cast the net to the right side."</em>
              They did. 153 fish. The net held.
            </p>
            <p>
              Most Called Experts have been fishing from the wrong side their whole career.
              They post on platforms they don't own.
              They build audiences that disappear overnight.
              They give their best expertise to an employer who can retrench them by Friday.
            </p>
            <p>
              I know. In August 2025, I lost 780,000 Instagram followers overnight.
              One year before that, <strong className="text-[#FAF7F0]">R180,000 in annual AdSense income was disabled in a single email.</strong>
              I didn't choose those things. But I wasn't surprised.
              John 21 had already told me the story.
            </p>
            <p>
              CHKPLT is the right side of the boat.
              Email list. Owned curriculum. Your own platform.
              <strong className="text-[#FAF7F0]"> Something no algorithm can suspend. No platform can disable.</strong>
            </p>
            <p>
              This is not a hustle system. It is a stewardship system.
              Built on Proverbs 13:22: the wealth of the sinner is laid up for the just.
              Your knowledge is the wealth. And it belongs on the right side.
            </p>
          </div>
          <blockquote className="mt-8 border-l-4 border-[#C9A84C] pl-5 italic text-banana text-base sm:text-lg">
            "Cast the net to the right side of the boat, and you will find some." — John 21:6
          </blockquote>
        </div>
      </section>

      {/* ── 7-STAGE TRANSFORMATION ───────────────────────────────────────── */}
      <section className="bg-[#111111]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="text-center mb-10">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-banana mb-4">
              The 90-Day Called Expert Accelerator PRO
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#FAF7F0] leading-[1.05] tracking-tight uppercase">
              7 Stages. One Transformation.
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-[#bbb] text-sm sm:text-base leading-relaxed">
              This is the full system — from mindset to money. Every stage builds on the last.
              You don't skip stages. You don't rush them. You complete them.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              {
                num: "01",
                weeks: "Days 1–14",
                label: "Foundation",
                framework: "MS × TS × SS",
                body: "Mindset × Toolset × Skillset. All three must multiply — if one is zero, the result is zero. We start here because most people try to build income on a broken foundation.",
              },
              {
                num: "02",
                weeks: "Days 15–21",
                label: "Self-Awareness",
                framework: "SWOT Analysis",
                body: "Your Called Expert SWOT: the strength you've been undervaluing, the weakness you've been avoiding, the opportunity that's already in front of you, and the threat that will slow you if you ignore it.",
              },
              {
                num: "03",
                weeks: "Days 22–28",
                label: "Content Strategy",
                framework: "4Es Framework",
                body: "Educate. Entertain. Encourage. Earn. The ratio that converts: 35% Educate, 25% Encourage, 25% Entertain, 15% Earn. Most Called Experts post at 90% Earn and wonder why nothing works.",
              },
              {
                num: "04",
                weeks: "Days 29–49",
                label: "Audience Building",
                framework: "Social Media — The Ocean",
                body: "Your content goes into the river (social). It catches fish (audience). But fish live in the ocean — your owned community. Stage 4 moves your audience from their platform to yours.",
              },
              {
                num: "05",
                weeks: "Days 50–63",
                label: "Community",
                framework: "3Cs — Create · Collaborate · Contribute",
                body: "Create (0–10K): produce and publish consistently. Collaborate (10K–50K): partner with other experts. Contribute (50K+): serve at scale. You are always in one of these three stages.",
              },
              {
                num: "06",
                weeks: "Days 64–77",
                label: "Business Model",
                framework: "DARES Asset Model",
                body: "Digital. Automated. Recurring. Evergreen. Scalable. Stop trading time for money. Start building assets that generate income when you're asleep, with your kids, or in a meeting.",
              },
              {
                num: "07",
                weeks: "Days 78–90",
                label: "Revenue System",
                framework: "PAIDS Engine",
                body: "Products. Ads & Affiliates. Information. Deals. Services. Five income streams built from your expertise. No single platform controls more than 40% of your business. This is how you survive what I survived.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`border border-[#C9A84C]/20 bg-[#1C1C1C] p-6 sm:p-7 ${i === 6 ? "sm:col-span-2" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 font-display text-3xl sm:text-4xl text-banana/40 leading-none w-10 tabular-nums">
                    {item.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#555] mb-1">
                      {item.weeks}
                    </div>
                    <div className="font-display text-base sm:text-lg text-[#FAF7F0] mb-0.5">
                      {item.label}
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-banana mb-3">
                      {item.framework}
                    </div>
                    <p className="text-[#5a5a5a] text-sm leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-[#C9A84C]/20 pt-6 text-center">
            <p className="text-[#777] text-sm sm:text-base">
              The <strong className="text-banana">Called Expert Foundation Kit</strong> gives you the frameworks from Stages 1, 3, 5, and 7 —
              so you can start immediately, alone. The <strong className="text-[#FAF7F0]">90-Day Accelerator PRO</strong> walks you through all 7 stages with live coaching and direct access.
            </p>
            <div className="mt-4">
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase text-banana border border-[#C9A84C]/40 px-5 py-2 hover:bg-[#C9A84C]/10 transition-colors"
              >
                Apply for the Accelerator PRO →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TWO-TIER PRICING (removes $/R confusion: different offers, different currencies) ── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1C1C1C] uppercase text-center">
            Two ways in. <span className="text-banana">Same system.</span>
          </h2>
          <p className="mt-3 text-center text-[#777] max-w-xl mx-auto">
            Start alone with the self-paced Kit, or go all-in with live coaching in the Accelerator. Pick your pace.
          </p>
          <div className="mt-10 grid md:grid-cols-2 gap-5 items-stretch">
            {/* Self-Paced Kit */}
            <div className="border border-[#e0d8cc] bg-white p-7 flex flex-col" style={GOLD_GLOW_SOFT}>
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-banana">Self-Paced</div>
              <h3 className="mt-2 font-display text-2xl text-[#1C1C1C]">Foundation Kit</h3>
              <div className="mt-4 font-display text-4xl text-[#1C1C1C]">{displayPrice}</div>
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#5a5a5a] mt-1">Priced in USD · billed at local equivalent</div>
              <ul className="mt-5 space-y-2 flex-1">
                {["All core strategy guides — instant download","PAIDS revenue engine + DARES asset model","Niche clarity + monetisation playbooks","Tax & compliance for creators","Yours for life — start alone today"].map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-[#333]"><span className="text-banana shrink-0">✓</span><span>{b}</span></li>
                ))}
              </ul>
              <button onClick={open} className="mt-6 w-full bg-[#C9A84C] text-[#111] font-black text-sm tracking-[0.08em] uppercase py-4 hover:bg-[#b89740] transition-colors" style={GOLD_GLOW_SOFT}>
                Get Instant Access — {displayPrice}
              </button>
            </div>
            {/* Accelerator PRO */}
            <div className="border-2 border-[#C9A84C] bg-[#1C1C1C] text-[#FAF7F0] p-7 flex flex-col" style={GOLD_GLOW_SOFT}>
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-banana">High-Touch · Application Only</div>
              <h3 className="mt-2 font-display text-2xl">90-Day Accelerator PRO</h3>
              <div className="mt-4 font-display text-4xl">$970 <span className="text-[#bbb] text-lg font-normal">or $350 × 3</span></div>
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#bbb] mt-1">Billed in ZAR at checkout · local equivalent</div>
              <ul className="mt-5 space-y-2 flex-1">
                {["Everything in the Foundation Kit","Weekly live group coaching","Direct messaging access to Ndivhuwo","Peer cohort accountability","Real-time pipeline & content reviews"].map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-[#ccc]"><span className="text-banana shrink-0">✓</span><span>{b}</span></li>
                ))}
              </ul>
              <Link to="/apply" className="mt-6 w-full text-center border border-[#C9A84C] text-banana font-black text-sm tracking-[0.08em] uppercase py-4 hover:bg-[#C9A84C] hover:text-[#111] transition-colors">
                Apply for Accelerator PRO
              </Link>
            </div>
          </div>

          {/* The full ascension ladder — low → high, one system */}
          <div className="mt-12">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#5a5a5a] text-center mb-1">The full ladder</div>
            <p className="text-center text-[#777] text-sm mb-6 max-w-lg mx-auto">Start free. Climb at your own pace. Every rung builds the same owned system — from your first win to a business you run with apps, not labour.</p>
            <div className="flex gap-3 overflow-x-auto pb-3 sm:flex-wrap sm:justify-center sm:overflow-visible">
              {[
                { rung: "01", label: "Free Tools", price: "Free", sub: "Win first, no card", tag: "START HERE", kind: "catalog" as const },
                { rung: "02", label: "Foundation Kit", price: "$97", sub: "6 frameworks, once-off", tag: "", kind: "product" as const, slug: "called-expert-foundation-kit" },
                { rung: "03", label: "Inner Circle", price: "$29/mo", sub: "Recurring community", tag: "RECURRING", kind: "product" as const, slug: "called-expert-inner-circle" },
                { rung: "04", label: "Offer Builder", price: "Free", sub: "Build your offer in 4 min", tag: "NEW · LIVE", kind: "app" as const },
                { rung: "05", label: "Masterclasses", price: "from $49", sub: "Video deep-dives", tag: "", kind: "product" as const, slug: "personal-brand-30-days" },
                { rung: "06", label: "Accelerator PRO", price: "$970", sub: "90-day, live coaching", tag: "MOST POPULAR", kind: "apply" as const },
                { rung: "07", label: "Certified Facilitator", price: "By application", sub: "Done-with-you / licence", tag: "HIGH-TOUCH", kind: "product" as const, slug: "called-expert-facilitator" },
              ].map((t) => {
                const inner = (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display text-lg text-banana/40 tabular-nums leading-none">{t.rung}</span>
                      {t.tag && <span className="font-mono text-[8px] tracking-[0.1em] uppercase bg-[#C9A84C]/15 text-banana px-1.5 py-0.5">{t.tag}</span>}
                    </div>
                    <div className="font-display text-sm text-[#1C1C1C] leading-tight">{t.label}</div>
                    <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-banana mt-1">{t.price}</div>
                    <div className="text-[11px] text-[#888] mt-1 leading-snug">{t.sub}</div>
                  </>
                );
                const cls = "block border border-[#e0d8cc] bg-white p-3.5 text-left hover:border-[#C9A84C] transition-colors shrink-0 w-[150px] sm:w-[160px]";
                if (t.kind === "product") return <Link key={t.label} to="/products/$slug" params={{ slug: t.slug! }} className={cls}>{inner}</Link>;
                if (t.kind === "apply") return <Link key={t.label} to="/apply" className={cls}>{inner}</Link>;
                if (t.kind === "app") return <Link key={t.label} to="/offer-builder" className={cls}>{inner}</Link>;
                return <Link key={t.label} to="/products" className={cls}>{inner}</Link>;
              })}
            </div>
            <p className="text-center text-[#777] text-[11px] mt-4 italic">Rung 04 is live: the <Link to="/offer-builder" className="text-banana underline underline-offset-2">free Offer Builder</Link> turns your skill into a complete, sellable offer in 4 minutes — the first of the interactive apps.</p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1C1C1C] uppercase text-center mb-3">
            Here's How It Works
          </h2>
          <p className="text-center text-[#5a5a5a] text-base leading-relaxed mb-10 max-w-xl mx-auto">
            Three phases. Seven workbooks. One path from unexploited expertise to
            first income stream.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                step: "PHASE 1",
                label: "KNOW",
                topColor: "#C9A84C",
                lc: "text-banana",
                tools: ["Niche Clarity Workbook", "Knowledge Audit"],
                desc: "Lock your niche. Find the product hiding in your expertise. One afternoon.",
              },
              {
                step: "PHASE 2",
                label: "BUILD",
                topColor: "#1C1C1C",
                lc: "text-[#1C1C1C]",
                tools: ["PAIDS Framework", "DARES Asset Model"],
                desc: "Map 5 income streams. Build assets that earn without your daily presence.",
              },
              {
                step: "PHASE 3",
                label: "GROW",
                topColor: "#C9A84C",
                lc: "text-banana",
                tools: ["4E Content Calendar", "SEEDS Pipeline"],
                desc: "30 days of content ready. A sales funnel that moves strangers to buyers.",
              },
            ].map((p, i) => (
              <div
                key={i}
                className="bg-white border border-[#e0d8cc] p-6 sm:p-7"
                style={{
                  borderTop: `4px solid ${p.topColor}`,
                  ...(i === 1 ? GOLD_GLOW_SOFT : {}),
                }}
              >
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#bbb] mb-1">
                  {p.step}
                </div>
                <div className={`font-display text-3xl sm:text-4xl mb-3 ${p.lc}`}>
                  {p.label}
                </div>
                <div className="space-y-1 mb-4">
                  {p.tools.map((t) => (
                    <div
                      key={t}
                      className="text-xs sm:text-sm text-[#555] flex items-center gap-2"
                    >
                      <span className="text-banana font-bold text-base">
                        ›
                      </span>{" "}
                      {t}
                    </div>
                  ))}
                </div>
                <p className="text-[#666] text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ───────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1C1C1C] uppercase text-center mb-3">
            Here's What This Means For You
          </h2>
          <p className="text-center text-[#5a5a5a] text-base mb-8">
            Instead of staying stuck, here's the before and after:
          </p>
          {/* Column headers — hidden on mobile, shown sm+ */}
          <div className="hidden sm:grid sm:grid-cols-2 gap-0 mb-0">
            <div className="bg-red-50 text-red-600 font-display text-sm font-bold py-3 px-4 border border-[#e0d8cc] uppercase">
              Before
            </div>
            <div className="bg-green-50 text-green-700 font-display text-sm font-bold py-3 px-4 border-t border-r border-b border-[#e0d8cc] uppercase">
              After
            </div>
          </div>

          {/* Stacked on mobile, side-by-side on sm+ */}
          <div className="space-y-3 sm:space-y-0">
            {BEFORE_AFTER.map(([before, after], i) => (
              <div
                key={i}
                className={`sm:grid sm:grid-cols-2 sm:gap-0 border border-[#e0d8cc] sm:border-0 ${i % 2 === 0 ? "bg-white" : "bg-white"}`}
              >
                <div className={`px-4 py-3 text-[#555] text-sm leading-relaxed sm:border sm:border-[#e0d8cc] ${i % 2 === 0 ? "sm:bg-white" : "sm:bg-white"}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 font-bold shrink-0 text-base leading-snug">✕</span>
                    <span>{before}</span>
                  </div>
                </div>
                <div className={`px-4 py-3 text-[#333] text-sm leading-relaxed border-t border-[#e0d8cc] sm:border sm:border-l-0 sm:border-[#e0d8cc] ${i % 2 === 0 ? "sm:bg-white" : "sm:bg-white"}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 font-bold shrink-0 text-base leading-snug">✓</span>
                    <span>{after}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF / RECEIPTS (real quotes when available, else verified numbers) ── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <h2 className="font-display text-2xl sm:text-3xl text-[#1C1C1C] uppercase text-center mb-8">
            {TESTIMONIALS.length ? "What Called Experts Are Saying" : "The Receipts"}
          </h2>
          {TESTIMONIALS.length ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="border border-[#e0d8cc] bg-white p-6 text-center">
                  <div className="text-banana text-xl mb-3">★★★★★</div>
                  <p className="italic leading-relaxed text-[#666] text-sm">"{t.quote}"</p>
                  <div className="mt-4 font-mono text-[10px] tracking-[0.2em] uppercase text-[#5a5a5a]">— {t.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "R600K+ Meta payouts (2023)",
                "3M+ peak followers",
                "50+ brand deals",
                "SAMA31 Judge 2026",
                "Meta Speaker",
                "Netflix book 2026",
                "R6K phone → R600K+",
              ].map((b) => (
                <div
                  key={b}
                  className="border-2 border-[#C9A84C]/40 bg-white px-4 py-2 font-mono text-[11px] sm:text-xs tracking-[0.12em] uppercase text-[#1C1C1C]"
                  style={{ boxShadow: "0 0 14px rgba(201,168,76,0.18)" }}
                >
                  {b}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── REAL PROOF — screenshots (DMs, comments, sales, press) ───────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="text-center mb-8">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana mb-2">
              Real DMs · comments · sales · press
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1C1C1C] uppercase">
              Don't take my word. <span className="text-banana">Take theirs.</span>
            </h2>
          </div>
          <div className="columns-2 sm:columns-3 gap-3 sm:gap-4">
            {[
              "t1-monetised-3weeks.png",
              "t9-podcast-insightful.png",
              "t8-meta-summit-riri.jpg",
              "t5-made-47.jpg",
              "t10-automation-demand.png",
              "t3-content-as-business.png",
              "t4-tax-help-dm.png",
            ].map((f) => (
              <img
                key={f}
                src={`/testimonials/${f}`}
                alt="Real proof from the community"
                loading="lazy"
                decoding="async"
                className="w-full mb-3 sm:mb-4 border border-[#e0d8cc] break-inside-avoid"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── META YOUTH SUMMIT — global-stage credibility ─────────────────── */}
      <section className="bg-[#1C1C1C] text-[#FAF7F0] border-b border-[#C9A84C]/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="text-center mb-8">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana mb-2">
              As seen on the global stage
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase">
              Invited by <span className="text-banana">Meta</span> to teach this.
            </h2>
            <p className="mt-3 text-[#bbb] max-w-2xl mx-auto leading-relaxed">
              June 2025 — on the main stage at the Meta Youth Summit, teaching the exact frameworks
              inside this Kit: PAIDS, DARES, and the 3 E's.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            {META_VIDEO_ID ? (
              <div className="relative mx-auto w-full max-w-[340px] aspect-[9/16] bg-black" style={GOLD_GLOW}>
                <iframe
                  src={`https://www.youtube.com/embed/${META_VIDEO_ID}?rel=0&modestbranding=1`}
                  title="Ndivhuwo at the Meta Youth Summit"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : (
              <img
                src="/meta-summit-stage.jpg"
                alt="Ndivhuwo Muhanelwa speaking at the Meta Youth Summit, June 2025"
                className="w-full border border-[#C9A84C]/30"
                style={GOLD_GLOW}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        </div>
      </section>

      {/* ── EVERYTHING INCLUDED ──────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1C1C1C] uppercase text-center mb-3">
            Here's Everything Included
          </h2>
          <p className="text-center text-[#5a5a5a] text-base mb-10 max-w-xl mx-auto">
            Seven workbooks. Seven frameworks. One complete system.
          </p>

          <div className="space-y-3 mb-10">
            {[
              {
                n: "Module 1",
                title: "Defining Your Niche & Expertise",
                sub: "Niche Clarity Workbook + Knowledge Audit",
                val: "Value: $194",
                cover: "/product-covers/niche-clarity-workbook.png",
                body: "Lock your niche in one afternoon. The Knowledge Audit reveals the product already hiding in your expertise — in 2 hours.",
              },
              {
                n: "Module 2",
                title: "Building Your Income Map",
                sub: "PAIDS Framework",
                val: "Value: $97",
                cover: "/product-covers/paids-framework-workbook.png",
                body: "Map your 5 income streams: Products, Ads & Affiliates, Information, Deals, Services — built from your specific expertise, not someone else's playbook.",
              },
              {
                n: "Module 3",
                title: "Creating Assets That Scale",
                sub: "DARES Asset Model",
                val: "Value: $97",
                cover: "/product-covers/platform-independence.png",
                body: "Build income that is Digital, Automated, Recurring, Evergreen, and Scalable — without quitting your job to build it.",
              },
              {
                n: "Module 4",
                title: "Content Strategy & Sales Pipeline",
                sub: "4E Content Calendar + SEEDS Pipeline",
                val: "Value: $194",
                cover: "/product-covers/content-calendar-template-pack.png",
                body: "30 days of content strategy pre-built at the exact ratio that converts. Plus the complete SEEDS funnel: Signal → Engagement → Education → Decision → Success.",
              },
              {
                n: "Module 5",
                title: "Foundation Self-Assessment",
                sub: "MS×TS×SS Evaluation Workbook",
                val: "Value: $97",
                cover: "/product-covers/ms-ts-ss-assessment.svg",
                body: "Score your current Mindset, Toolset, and Skillset across 7 Called Expert dimensions. All three must multiply — if one is zero, the result is zero. Know exactly which of the three is holding you back before you start building.",
              },
            ].map((item) => (
              <div
                key={item.n}
                className="border border-[#e0d8cc] bg-white p-5 sm:p-6 flex gap-4"
              >
                <div className="shrink-0">
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="w-20 h-28 sm:w-28 sm:h-36 object-cover border border-[#e0d8cc]"
                    loading="lazy"
                    decoding="async"
                    width={112}
                    height={144}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-banana mb-0.5">
                        {item.n}
                      </div>
                      <h3 className="font-display text-lg sm:text-xl text-[#1C1C1C]">
                        {item.title}
                      </h3>
                      <div className="text-xs text-[#5a5a5a] mt-0.5">{item.sub}</div>
                    </div>
                    <span className="font-mono text-xs text-green-600 font-bold shrink-0 bg-green-50 border border-green-200 px-2 py-0.5">
                      {item.val}
                    </span>
                  </div>
                  <p className="text-[#666] text-sm sm:text-base leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bonuses */}
          <div>
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana text-center mb-4">
              PLUS — FREE BONUSES INCLUDED
            </div>
            <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                {
                  b: "BONUS 1",
                  t: "Called Expert Quick-Start Checklist",
                  d: "One-page summary of all 7 frameworks as a daily reference you'll use for years.",
                  val: "$47",
                },
                {
                  b: "BONUS 2",
                  t: "First Income Stream 90-Day Planner",
                  d: "Week-by-week execution plan from niche clarity to your first sale.",
                  val: "$47",
                },
                {
                  b: "BONUS 3",
                  t: "30-Day Accountability Tracker",
                  d: "Daily check-in template to keep you building when motivation drops.",
                  val: "$47",
                },
              ].map((item) => (
                <div
                  key={item.b}
                  className="border border-[#C9A84C]/50 bg-[#C9A84C]/5 p-5"
                  style={GOLD_GLOW_SOFT}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-mono text-[10px] text-banana tracking-wide uppercase">
                      {item.b}
                    </div>
                    <span className="font-mono text-[10px] text-green-600 font-bold">
                      Value: {item.val}
                    </span>
                  </div>
                  <div className="font-display text-base text-[#1C1C1C] mb-2">
                    {item.t}
                  </div>
                  <p className="text-[#777] text-xs leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ORDER CTA #2 ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#5a5a5a] mb-3">
            Get Instant Access Today
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#1C1C1C] mb-6 uppercase">
            The Complete Called Expert System
          </h2>
          <CtaButton
            onClick={open}
            label={`GET INSTANT ACCESS — ${displayPrice}`}
            sub="🔒 Secure checkout · 30-day money-back guarantee · Instant download"
            size="large"
          />
        </div>
      </section>

      {/* ── ACCELERATOR PRO UPSELL ────────────────────────────────────────── */}
      <section className="bg-[#1C1C1C]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="text-center mb-8">
            <div className="inline-block font-mono text-[10px] tracking-[0.3em] uppercase text-[#111] bg-[#C9A84C] px-4 py-1.5 mb-5">
              READY FOR THE FULL SYSTEM?
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#FAF7F0] leading-[1.05] tracking-tight uppercase mb-5">
              90-Day Called Expert
              <br /><span className="text-banana">Accelerator PRO</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[#5a5a5a] text-base sm:text-lg leading-relaxed">
              The Foundation Kit gives you the frameworks. The Accelerator PRO gives you the transformation —
              live coaching, cohort accountability, and direct access for 90 days to implement all 7 stages.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: "01",
                title: "Live Coaching Sessions",
                body: "Weekly group sessions where you build, get feedback, and move — not just learn.",
              },
              {
                icon: "02",
                title: "Direct Access",
                body: "Message directly with your questions. No waiting 3 weeks for a support ticket.",
              },
              {
                icon: "03",
                title: "Cohort Accountability",
                body: "Build alongside other Called Experts at the same stage. The iron sharpens iron.",
              },
            ].map((item) => (
              <div key={item.icon} className="border border-[#C9A84C]/25 bg-[#111111] p-6">
                <div className="font-display text-3xl text-banana/30 mb-3 leading-none">{item.icon}</div>
                <div className="font-display text-base text-[#FAF7F0] mb-2">{item.title}</div>
                <p className="text-[#bbb] text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="border border-[#C9A84C]/30 bg-[#111111] p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-banana mb-1">Investment</div>
              <div className="font-display text-2xl sm:text-3xl text-[#FAF7F0]">
                $970 <span className="text-[#bbb] text-lg font-normal">once-off</span>
              </div>
              <div className="text-[#bbb] text-sm mt-1">or $350 × 3 months · billed in ZAR</div>
            </div>
            <div className="text-[#bbb] text-sm max-w-xs leading-relaxed sm:text-right">
              Application required — we review within 24 hours. Spots are limited per cohort.
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#111] font-display font-black uppercase tracking-[0.04em] text-base sm:text-lg py-5 sm:py-6 px-8 sm:px-14 hover:bg-[#b8963e] transition-colors w-full sm:w-auto max-w-md justify-center"
              style={{ boxShadow: "0 0 32px rgba(201,168,76,0.7), 0 0 80px rgba(201,168,76,0.35)" }}
            >
              Apply for the Accelerator PRO
              <ArrowRight className="size-5 shrink-0" />
            </Link>
            <p className="mt-3 text-[#555] text-xs">5-minute qualification · Response within 24 hours · No obligation</p>
          </div>
        </div>
      </section>

      {/* ── VALUE STACK ──────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-display text-2xl text-[#1C1C1C] uppercase text-center mb-6">
            Total Value Breakdown
          </h2>
          <div
            className="border-2 border-[#C9A84C] bg-white p-6 sm:p-8"
            style={GOLD_GLOW_SOFT}
          >
            <div className="space-y-2 mb-6">
              {[
                ["Niche Clarity Workbook", "$97"],
                ["Knowledge Audit", "$97"],
                ["PAIDS Framework", "$97"],
                ["DARES Asset Model", "$97"],
                ["4E Content Calendar", "$97"],
                ["SEEDS Pipeline Template", "$97"],
                ["MS×TS×SS Foundation Assessment", "$97"],
                ["BONUS: Called Expert Cheat Sheet", "$47"],
                ["BONUS: 90-Day First Income Planner", "$47"],
                ["BONUS: 30-Day Accountability Tracker", "$47"],
              ].map(([name, val]) => (
                <div
                  key={name}
                  className="flex items-center justify-between text-sm border-b border-[#f0ebe3] pb-2"
                >
                  <span className="text-[#555]">{name}</span>
                  <span className="text-[#5a5a5a] font-mono font-bold">{val}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#5a5a5a] text-sm">Total value</span>
              <span className="font-mono text-lg line-through text-[#ccc]">
                $820
              </span>
            </div>
            <div className="flex items-center justify-between border-t-2 border-[#C9A84C] pt-3 mb-6">
              <span className="font-display text-xl text-[#1C1C1C]">
                Your price today
              </span>
              <span className="font-display text-4xl sm:text-5xl text-banana">
                {displayPrice}
              </span>
            </div>
            <CtaButton
              onClick={open}
              label={`YES — GET INSTANT ACCESS FOR ${displayPrice}`}
              size="large"
            />
            <p className="text-center text-[#bbb] text-xs mt-3">
              Once-off payment · No monthly fees · Instant download
            </p>
          </div>
        </div>
      </section>

      {/* ── ABOUT / CREDIBILITY ──────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-banana text-center mb-4">
            BEHIND THE BRAND
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#1C1C1C] uppercase text-center mb-8">
            Here's How I Inspire
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
            {[
              { n: "3M+", l: "Cross-platform followers at peak" },
              { n: "50+", l: "Brand deals · 23 agencies" },
              { n: "9", l: "Industry awards" },
              { n: "2", l: "Published books" },
            ].map((p) => (
              <div
                key={p.n}
                className="border-2 border-[#C9A84C]/40 bg-white text-center py-5 px-3"
                style={GOLD_GLOW_SOFT}
              >
                <div className="font-display text-2xl sm:text-3xl text-banana">
                  {p.n}
                </div>
                <div className="mt-1.5 font-mono text-[9px] tracking-[0.12em] uppercase text-[#5a5a5a] leading-snug">
                  {p.l}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#e0d8cc] p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <img
              src="/founder.jpg"
              alt="Ndivhuwo Muhanelwa"
              className="size-20 sm:size-24 shrink-0 object-cover object-top border-2 border-[#C9A84C] bg-[#e8e0d4]"
              loading="lazy"
              decoding="async"
              width={96}
              height={96}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <div className="font-display text-xl sm:text-2xl text-[#1C1C1C] mb-0.5">
                Ndivhuwo Muhanelwa
              </div>
              <div className="font-mono text-[10px] tracking-wide uppercase text-banana mb-3">
                Founder, NOCHILL PTY LTD
              </div>
              <p className="text-[#555] text-sm sm:text-base leading-relaxed">
                Content entrepreneur, author, and brand strategist. 3M+
                cross-platform followers at peak. 50+ confirmed brand deals.
                SAMA31 judge. Meta speaker. Author of{" "}
                <em>The Influencer's Code</em> (6,000+ copies) and{" "}
                <em>Contentpreneur</em>. Built a six-figure content business in
                4-hour shift windows —{" "}
                <strong className="text-[#1C1C1C]">
                  without ever quitting his day job first.
                </strong>
              </p>
              <div className="mt-4 p-3 border-l-4 border-[#C9A84C] bg-white text-xs text-[#777] leading-relaxed">
                <strong className="text-[#1C1C1C]">Verified:</strong> Six
                figures in Meta payouts in a single year · 50+ campaigns
                including Capitec, SA Tourism, Playa Bets, Superbalist,
                Showmax, Flying Fish, ABSA · Humanz Top 20 Creators 2026 ·
                SAMA31 Judge · Meta Speaker
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALLERY ───────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#5a5a5a] text-center mb-3">
            Events · Workshops · Brand Campaigns
          </div>
          <p className="text-center text-[#5a5a5a] text-xs mb-6">50+ brand campaigns · SAMA31 judge · Meta speaker · 9 industry awards</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { src: "/IMG_5125.JPG", alt: "NoChill speaking at workshop", mobileHide: false },
              { src: "/founder.jpg", alt: "NoChill at Meta Speaker event", mobileHide: false },
              { src: "/founder-award.jpg", alt: "NoChill Humanz Top 20 award", mobileHide: false },
              { src: "/IMG_4060.JPG", alt: "Book signing — The Influencer's Code", mobileHide: false },
              { src: "/IMG_4081.JPG", alt: "NoChill signing book for fan", mobileHide: true },
              { src: "/IMG_4105.JPG", alt: "NoChill with reader at workshop", mobileHide: true },
              { src: "/IMG_2557.JPG", alt: "NoChill at entrepreneur event", mobileHide: true },
              { src: "/IMG_5213-2.JPG", alt: "Called Expert workshop audience", mobileHide: true },
            ].map((img, i) => (
              <div
                key={i}
                className={`aspect-square overflow-hidden border border-[#e0d8cc] bg-[#e8e0d4] ${img.mobileHide ? "hidden sm:block" : ""}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                  decoding="async"
                  width={300}
                  height={300}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl text-[#1C1C1C] uppercase text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div>
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e0d4]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16 text-center">
          {/* Guarantee */}
          <div
            className="inline-flex items-center gap-3 border-2 border-[#C9A84C]/50 bg-white px-5 sm:px-8 py-4 mb-8"
            style={GOLD_GLOW_SOFT}
          >
            <span className="text-3xl sm:text-4xl">🛡️</span>
            <div className="text-left">
              <div className="font-display text-base sm:text-lg text-[#1C1C1C]">
                100% Money-Back Guarantee
              </div>
              <div className="text-xs sm:text-sm text-[#777] mt-0.5">
                Work through the Kit. Not happy — full refund. No questions
                asked. 30 days. The risk is mine.
              </div>
            </div>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#1C1C1C] uppercase leading-snug mb-4">
            This Is Your Time.
            <br />
            <span className="text-banana">
              Build Your Expertise Into Income.
            </span>
          </h2>
          <p className="text-[#555] text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-3">
            Your knowledge is worth more than your salary. Your expertise
            doesn't have to expire with your career.
          </p>
          <p className="text-[#1C1C1C] font-display text-lg sm:text-xl mb-2">
            You don't have to quit first.{" "}
            <strong className="text-banana">Build first.</strong>
          </p>
          <p className="text-[#777] text-sm mb-8">
            For your children. For their children.{" "}
            <em>For the legacy you were called to build.</em>
          </p>

          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="font-mono text-base text-[#ccc] line-through">
              $723+ value
            </span>
            <span className="font-display text-5xl sm:text-6xl text-banana">
              {displayPrice}
            </span>
            <span className="text-[#5a5a5a] text-sm">today</span>
          </div>

          <CtaButton
            onClick={open}
            label={`YES — I WANT INSTANT ACCESS FOR ${displayPrice}`}
            size="large"
          />

          <p className="mt-4 text-[#bbb] text-xs">
            One-time payment · No subscription · Instant download · 30-day
            money-back guarantee
          </p>
          <p className="mt-5 text-xs text-[#ccc]">
            Already completed the Foundation Kit?{" "}
            <Link
              to="/apply"
              className="text-banana hover:underline underline-offset-4"
            >
              Apply for the Called Expert Accelerator PRO →
            </Link>
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#1C1C1C]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-[#444] text-xs leading-relaxed mb-4 max-w-2xl mx-auto">
            NOCHILL PTY LTD does not guarantee specific income results. The
            figures referenced on this page are documented personal results of
            the founder and are not typical. Individual results will vary based
            on effort, experience, market conditions, and other factors.
          </p>
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap mb-4">
            {(
              [
                ["Refund Policy", "/refund-policy"],
                ["Terms", "/terms"],
                ["Contact", "/contact"],
                ["Privacy", "/privacy"],
              ] as const
            ).map(([l, to]) => (
              <Link
                key={to}
                to={to}
                className="text-[#555] hover:text-[#5a5a5a] text-xs transition-colors"
              >
                {l}
              </Link>
            ))}
          </div>
          <p className="text-[#333] text-[11px]">
            NOCHILL PTY LTD © 2026 — Reg: 2016/507839/07
          </p>
        </div>
      </footer>

      <SiteFooter />
    </div>
  );
}
