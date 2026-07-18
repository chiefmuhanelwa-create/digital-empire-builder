import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { TurnstileGate } from "@/components/TurnstileGate";
import { initializeCheckout, initializeStripeCheckout } from "@/lib/checkout.functions";
import { getUtm } from "@/lib/utm";
import { trackLead } from "@/lib/track";
import { formatPrice } from "@/lib/gardens";
import { supabase } from "@/integrations/supabase/client";
import { X, ArrowRight } from "lucide-react";
import { useCountry, shouldUseStripe } from "@/lib/currency";

const PRODUCT_SLUG = "called-expert-foundation-kit";
const INTRO_VIDEO_ID = ""; // Paste YouTube video ID here
// Meta Youth Summit talk (YouTube Short — vertical).
const META_VIDEO_ID = "_JYjzFDrSgs";
// Real testimonials replace the proof-badge row automatically once added: { quote, name }
const TESTIMONIALS: { quote: string; name: string }[] = [];

// Real WhatsApp / DM / community testimonial screenshots in /public/testimonials/
const TESTIMONIAL_SHOTS: string[] = [
  "t01.jpg", "t02.jpg", "t03.jpg", "t04.jpg",
  "t05.jpg", "t06.jpg", "t07.jpg", "t08.jpg",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contentpreneur — Turn What You Know Into Income You Own | CHKPLT" },
      {
        name: "description",
        content:
          "A Contentpreneur turns what they already know into income they own. CHKPLT is the step-by-step system that turns what you know into digital products and income — for anyone with knowledge, experience, or a voice worth paying for, across Africa.",
      },
      { name: "keywords", content: "Contentpreneur, contentpreneurship, knowledge business, digital products, monetise expertise, South Africa, Africa" },
      { property: "og:title", content: "Contentpreneur — Turn What You Know Into Income You Own" },
      {
        property: "og:description",
        content:
          "A Contentpreneur turns what they already know into income they own. The system for professionals and knowledge creators across Africa.",
      },
      { property: "og:locale", content: "en_ZA" },
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
  const stripeFn = useServerFn(initializeStripeCheckout);
  const useStripe = shouldUseStripe(country);
  const mut = useMutation({
    mutationFn: (args: Parameters<typeof initFn>[0]) => (useStripe ? stripeFn(args) : initFn(args)),
    onSuccess: (res) => {
      window.location.href = res.authorizationUrl;
    },
    onError: (e: Error) =>
      toast.error(e.message ?? "Could not start checkout. Please try again."),
  });

  // Close on Escape; lock background scroll while the modal is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const inputCls =
    "w-full bg-white border border-[#CBD5E1] px-4 py-3 text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors rounded-lg";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full sm:max-w-md max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[#F59E0B] shadow-2xl relative"
      >
        {/* Sticky close bar — always reachable while scrolling */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-white/95 backdrop-blur px-4 py-2 border-b border-[#E2E8F0]">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-banana">Secure Checkout</span>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 w-10 rounded-full text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
            aria-label="Close checkout"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Header */}
        <div className="bg-white px-5 sm:px-6 pt-4 pb-5 text-center border-b border-[#E2E8F0]">
          <h3 className="font-display text-lg sm:text-xl text-[#0F172A] leading-snug">
            Contentpreneur Foundation Kit
          </h3>
          <div className="mt-3">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-[#64748B] text-sm line-through font-mono">
                {comparePrice}
              </span>
              <span className="bg-green-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                Save {savings}!
              </span>
            </div>
            <div className="font-display text-4xl sm:text-5xl text-banana">
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
            {country === "ZA"
              ? "Billed securely in Rand (ZAR)."
              : useStripe
                ? "Charged in USD · secure card checkout."
                : "Shown in USD · charged in Rand (ZAR) at today's live rate."}
          </p>
        </div>

        {/* Form */}
        <form
          className="px-5 sm:px-6 py-5 space-y-3"
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
            className="w-full rounded-full bg-[#F59E0B] text-[#0F172A] font-display font-extrabold text-base py-4 tracking-[0.06em] uppercase shadow-[0_10px_24px_-6px_rgba(217,119,6,0.5)] hover:bg-[#D97706] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none mt-1"
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
              7-Day Roadmap Guarantee
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
      <button
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 w-full max-w-lg rounded-full bg-[#F59E0B] text-[#0F172A] font-display font-extrabold uppercase tracking-[0.04em] shadow-[0_10px_24px_-6px_rgba(217,119,6,0.5)] hover:bg-[#D97706] hover:-translate-y-px active:translate-y-0 transition-all ${
          size === "large"
            ? "text-lg sm:text-xl py-4 sm:py-5 px-8"
            : "text-base sm:text-lg py-3.5 sm:py-4 px-7"
        }`}
      >
        {label}
        <ArrowRight className="size-5 shrink-0" />
      </button>
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

// The canonical definition — reused in the visible FAQ AND the DefinedTerm
// structured data so search + AI answer engines quote CHKPLT for the word.
const CONTENTPRENEUR_DEFINITION =
  "A Contentpreneur is someone who turns what they already know into income they own — packaging their expertise into digital products, courses, and assets they control, instead of chasing views as a creator or trading hours as an employee. The word covers two kinds of person: the employed professional monetising years of expertise, and the self-employed knowledge creator (coach, consultant, podcaster) who finally builds a system to own the income.";

const FAQS = [
  {
    q: "What is a Contentpreneur?",
    a: CONTENTPRENEUR_DEFINITION,
  },
  {
    q: "What exactly do I get in the kit?",
    a: "Seven guided tools that each hand you a finished result — not lessons you forget: a 2-minute readiness scorecard, find the product hiding in your head, lock your niche in one afternoon, your 30-day content plan, turn strangers into buyers (your first funnel), build an asset that sells while you sleep, and your 5-stream income map. Plus three bonuses and AI coaching on every step. You finish with a personalised plan you can act on the same day — all instant access. (Under the hood these run on the PAIDS, DARES, 4E and SEEDS frameworks — but you just follow the steps.)",
  },
  {
    q: "Do I need to quit my job first?",
    a: "No. That is the biggest lie in the industry. You don't have to quit your job — or blow up the business you already run — to build this. The PAIDS Framework maps income streams that work in the margins of your existing schedule, whether that's a salaried job or your own thing. It was built in 4-hour windows between night shifts at an air traffic control centre. You build first. You quit — if you ever want to — later.",
  },
  {
    q: "What if my employer has a moonlighting or outside-work policy?",
    a: "You build quietly, and you build an asset you own — not a competitor to your employer. Nothing in this kit requires you to expose your identity, use company time, or compete with your day job. You package your own knowledge into your own products, on your own platform, on your own hours. You stay compliant, and you decide if and when anything ever becomes public. Many people build the whole foundation before they tell a single colleague.",
  },
  {
    q: "Do I need technical skills to build this?",
    a: "No. The kit is frameworks and fill-in-the-blank workbooks — if you can write a document, you can complete them. You are not coding anything. The technical side (payments, delivery, the member area) is what the CHKPLT platform handles for you. Your job is the thinking; the platform is the plumbing.",
  },
  {
    q: "Who is this for?",
    a: "Contentpreneurs — people who turn what they know into income they own. That's two kinds of person. One: the professional still employed — a teacher, healthcare worker, academic, or specialist paid less than their expertise is worth. Two: the knowledge creator — a coach, consultant, podcaster, or creator who already has the knowledge (and often the audience) but no system to own the income. If your knowledge is deeper than what you're being paid for it, this is for you.",
  },
  {
    q: "Do I need a large following for this to work?",
    a: "No — and you can start from zero followers. Your first sales don't come from a big audience; they come from packaging your expertise for the right few and running them through a pipeline (the SEEDS system in the kit). Here's the honest part: you're not building a following, but you are publishing a little — a few pieces of expertise-based content a week on ONE platform, repurposed, with automation (ManyChat + your email list) doing the capture and the selling for you. That's the opposite of dancing on TikTok every day. Small, sharp, and mostly automated — not viral and exhausting.",
  },
  {
    q: "Do I have to post every day or become an influencer to get buyers?",
    a: "No. This is the part most people get wrong. You are not building a media channel — you're building a machine. The realistic cadence is a few expertise-based posts a week on ONE platform (not five), each one repurposed into several pieces so a single idea does a week's work. From there the system runs itself: the 4E Content Calendar tells you exactly what to post, ManyChat captures the interested ones into your owned email list, and the SEEDS pipeline sells to that list on autopilot. You spend your 4-hour windows on expertise, not on chasing an algorithm. The content attracts; the automation converts.",
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
    a: "Do the work and judge it on results. Complete the Niche Clarity Workbook and the Knowledge Audit, and if you don't have a defined asset roadmap within 7 days, email us your completed work for a full refund. (If you ever have a technical issue accessing what you paid for, we'll fix or refund that too.) See the full refund policy for details.",
  },
  {
    q: "What are the 7 stages of the Contentpreneur system?",
    a: "Stage 1: Foundation (MS×TS×SS — Mindset × Toolset × Skillset). Stage 2: Self-Awareness (SWOT Analysis + the 4Ps — Passion, Pain, Purpose, Profit). Stage 3: Content Strategy (4Es — Educate, Entertain, Encourage, Earn). Stage 4: Platform Strategy (pick one platform, stop being mediocre on five). Stage 5: Systems & DARES (Digital, Automated, Recurring, Evergreen, Scalable). Stage 6: Owned Tribes (the River-Fish-Tank model + 3Cs community — Create, Collaborate, Contribute). Stage 7: Revenue System (PAIDS — Products, Ads & Affiliates, Information, Deals, Services). The Foundation Kit gives you the core frameworks from Stages 1, 3, and 7 so you can start immediately. The Accelerator PRO takes you through all 7 in sequence, over 12 weeks, with live coaching and direct access.",
  },
  {
    q: "Is CHKPLT a Christian platform?",
    a: "The founder is Christian and the frameworks are rooted in kingdom principles — stewardship, calling, fruitfulness, generational legacy. But the system works for anyone whose expertise was given to them for a purpose beyond the money. If you believe your knowledge is a calling — this is for you.",
  },
];

// ── Structured data (SEO / Answer-Engine Optimisation) ───────────────────────
// Makes CHKPLT the machine-readable authority for the word "Contentpreneur" —
// DefinedTerm (the definition), Organization (attribution + areaServed Africa),
// WebSite, and FAQPage (the visible FAQ, incl. "What is a Contentpreneur?").
const STRUCTURED_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "DefinedTerm",
      "@id": "https://chkplt.com/#contentpreneur",
      name: "Contentpreneur",
      description: CONTENTPRENEUR_DEFINITION,
      inDefinedTermSet: {
        "@type": "DefinedTermSet",
        name: "The Contentpreneur System",
        publisher: { "@id": "https://chkplt.com/#org" },
      },
    },
    {
      "@type": "Organization",
      "@id": "https://chkplt.com/#org",
      name: "CHKPLT",
      legalName: "NOCHILL PTY LTD",
      url: "https://chkplt.com",
      description:
        "The platform that teaches professionals and knowledge creators across Africa to become Contentpreneurs — turning expertise into income they own.",
      founder: { "@type": "Person", name: "Ndivhuwo Muhanelwa", alternateName: "NoChill" },
      areaServed: [
        { "@type": "Country", name: "South Africa" },
        { "@type": "Continent", name: "Africa" },
      ],
      knowsAbout: ["Contentpreneur", "Contentpreneurship", "knowledge business", "digital products"],
    },
    {
      "@type": "WebSite",
      "@id": "https://chkplt.com/#website",
      url: "https://chkplt.com",
      name: "CHKPLT — Contentpreneur",
      inLanguage: "en-ZA",
      publisher: { "@id": "https://chkplt.com/#org" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://chkplt.com/#faq",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
});

// ── Before/After rows ───────────────────────────────────────────────────────

const BEFORE_AFTER: [string, string][] = [
  [
    "Posting without a strategy and getting nothing back",
    "A 30-day content calendar with the exact ratio that converts",
  ],
  [
    "Expertise you're not being paid what it's worth for",
    "A clear income map across 5 revenue streams built from what you know",
  ],
  [
    "No idea how to package or sell what you know",
    "A defined niche, a clear offer, and a working sales pipeline",
  ],
  [
    "Watching others earn from knowledge less deep than yours",
    "Understanding exactly how people who already know their stuff build income",
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

  // Any "Get the Kit" CTA across the site routes to /?buy=1 and opens this same modal.
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("buy") === "1") {
      setShowModal(true);
    }
  }, []);

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
  const useStripe = shouldUseStripe(country);
  const priceCents = product?.price_cents ?? 9700;
  const currency = product?.currency ?? "USD";
  // Headline price: SA sees native ZAR, everyone else USD ($97). See formatPrice.
  const displayPrice = formatPrice(priceCents, currency, false, PRODUCT_SLUG, country);
  // Value anchors ($820 value − $97 = $723 saved) rendered in the buyer's currency
  // so a SA buyer never sees a $ next to an R.
  const money = (usd: number) => formatPrice(usd * 100, "USD", false, undefined, country);
  const comparePrice = money(820);
  const savings = money(723);
  // Charge-currency note that matches the real rail (avoids "shown in USD" for SA).
  const chargeNote =
    country === "ZA"
      ? "Instant download · billed in Rand (ZAR) · 7-day guarantee"
      : useStripe
        ? "Instant download · charged in USD · 7-day guarantee"
        : "Instant download · billed in ZAR at today's rate · 7-day guarantee";

  // Named in the buyer's words (outcome first); the framework is the engine underneath.
  const VALUE_STACK: [string, string][] = [
    ["Are You Ready? — 2-minute scorecard", money(97)],
    ["Find the Product Hiding in Your Head", money(97)],
    ["Lock Your Niche in One Afternoon", money(97)],
    ["Your 30-Day Content Plan", money(97)],
    ["Turn Strangers Into Buyers — your first funnel", money(97)],
    ["Build an Asset That Sells While You Sleep", money(97)],
    ["Your 5-Stream Income Map", money(97)],
    ["BONUS: The One-Page Cheat Sheet", money(47)],
    ["BONUS: 90-Day First-Income Planner", money(47)],
    ["BONUS: 30-Day Consistency Tracker", money(47)],
  ];

  return (
    <div className="min-h-screen bg-white text-[#0F172A] overflow-x-hidden">
      {/* Structured data — owns the word "Contentpreneur" for search + AI engines. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />

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
          <p className="nx-label mb-4">Contentpreneur Foundation Kit</p>
          <h1 className="mb-5">
            Your knowledge is worth more than you're being paid for it.{" "}
            <strong>You just don't own the system yet.</strong>
          </h1>
          <p className="nx-body max-w-xl mx-auto mb-8">
            Whether you earn a salary or run your own thing, you've built real knowledge and
            experience — and you're leaving money on the table because you don't own the system. This
            is the complete, step-by-step system that turns what you already know into income you own
            — no big following, no going viral, built in 4-hour windows around the life you already have.
          </p>

          <CtaButton
            onClick={open}
            label={`Get Instant Access — ${displayPrice}`}
            sub={chargeNote}
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

      {/* ── DEFINITION — anchor the one word the whole funnel is about ────── */}
      <section className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-14 text-center">
          <p className="nx-label mb-4">The one word this is all about</p>
          <div className="flex items-baseline justify-center gap-3 flex-wrap mb-4">
            <span className="font-display text-4xl sm:text-5xl font-black text-[var(--foreground)]">
              Contentpreneur
            </span>
            <span className="font-mono text-sm text-[var(--text-dim)] italic">/ noun /</span>
          </div>
          <p className="nx-body text-lg max-w-xl mx-auto">
            Someone who turns what they already know into{" "}
            <strong className="text-[var(--foreground)]">income they own</strong>.
          </p>
          <p className="text-sm text-[var(--text-dim)] max-w-lg mx-auto mt-3">
            Not a creator chasing views. Not an employee trading hours for a salary. A builder who
            packages expertise into assets that pay — on a platform they control.
          </p>
        </div>
      </section>

      {/* ── PROOF VIDEO ──────────────────────────────────────────────────── */}
      {META_VIDEO_ID && (
        <section className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-14 text-center">
            <p className="nx-label mb-3">As seen on</p>
            <h2 className="mb-6">From sleeping in university bathrooms to the Meta stage.</h2>
            <div className="nx-video-wrapper mx-auto aspect-[9/16] max-w-[300px]">
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

      {/* ── FOUNDER STORY / PROOF ────────────────────────────────────────── */}
      <section className="bg-white border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <p className="nx-label mb-3">Proof it's possible</p>
          <h2 className="mb-6 max-w-2xl">
            He built all of this — while still clocking in for night shifts.
          </h2>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="nx-body space-y-4">
              <p>
                Ndivhuwo Muhanelwa — "NoChill" — grew up the youngest of four brothers in
                Tshikwarani, Venda. He slept on university bathroom floors in Pretoria. He never
                finished his degree.
              </p>
              <p>
                Then he stopped waiting for permission. Working night shifts at air traffic control,
                he built it all in <strong className="text-[var(--foreground)]">4-hour windows</strong> —
                and crossed <strong className="text-[var(--foreground)]">R600,000+ in a single
                year</strong>. He wrote <strong className="text-[var(--foreground)]">two books while
                still employed</strong> (Contentpreneur and The Influencer's Code — 6,000+ copies).
              </p>
              <p>
                Today: <strong className="text-[var(--foreground)]">10 awards</strong>, a{" "}
                <strong className="text-[var(--foreground)]">SAMA 30 &amp; 31 judge</strong> two years
                running, a Humanz Top 20 creator, a Meta speaker, and{" "}
                <strong className="text-[var(--foreground)]">50+ brand deals</strong> with Capitec,
                Standard Bank, Netflix, Suzuki, SA Tourism, Showmax and ABSA.
              </p>
              <p className="text-[var(--foreground)] font-semibold">
                He never quit first. He built first. So can you.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  "2 books published",
                  "10 awards",
                  "SAMA 30 & 31 judge",
                  "Humanz Top 20",
                  "Meta speaker",
                  "50+ brand deals",
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[var(--border-mid)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--text-body)]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { src: "/founder-award.jpg", cap: "Humanz Top 20 Creators Worth Following — 2026" },
                { src: "/meta-summit-stage.jpg", cap: "Meta Youth Summit — invited speaker" },
                { src: "/speaking-fnb.jpg", cap: "FNB #TheChangeables — keynote stage" },
                { src: "/sama30-judge.jpg", cap: "SAMA 30 & 31 — official awards judge" },
              ].map((p) => (
                <figure key={p.src} className="rounded-2xl overflow-hidden border border-[var(--border)] bg-white">
                  <img
                    src={p.src}
                    alt={p.cap}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover"
                    onError={(e) => {
                      const fig = (e.currentTarget as HTMLImageElement).closest("figure");
                      if (fig) (fig as HTMLElement).style.display = "none";
                    }}
                  />
                  <figcaption className="px-3 py-2 text-[11px] font-semibold text-[var(--text-dim)] leading-snug">
                    {p.cap}
                  </figcaption>
                </figure>
              ))}
              {/* The book — "Contentpreneur" */}
              <figure className="col-span-2 mt-1 flex flex-col items-center">
                <img
                  src="/proof/book-contentpreneur.png"
                  alt="Contentpreneur — the book by Ndivhuwo Muhanelwa"
                  loading="lazy"
                  className="w-2/3 max-w-[240px] object-contain drop-shadow-xl"
                  onError={(e) => {
                    const fig = (e.currentTarget as HTMLImageElement).closest("figure");
                    if (fig) (fig as HTMLElement).style.display = "none";
                  }}
                />
                <figcaption className="mt-3 text-xs font-semibold text-[var(--text-dim)] text-center">
                  "Contentpreneur" — written while still working
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE REFRAME — stewardship, not side hustle ───────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <p className="nx-label mb-3">You've stayed long enough on this mountain</p>
          <h2 className="mb-6">This isn't a side hustle. It's your parallel assignment.</h2>
          <div className="nx-body space-y-4">
            <p>
              10 years. 15. 20. That's how long you've been building real expertise — a profession, a
              specialty, a calling. And the market still pays you a fraction of what you actually
              know.
            </p>
            <p>
              You don't need another qualification. You don't need to quit and gamble your family's
              security on a leap. You need a <strong className="text-[var(--foreground)]">system</strong> to
              package what you already carry — built in the margins of the life you already have, not on
              top of the hours you don't.
            </p>
            <p>
              Build first. Quit later — if you ever want to. Your expertise was never meant to die
              with your career. It's meant to become an asset for your children's children.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["Time poverty", "Built in 4-hour windows around a full life — the same way he built it between night shifts. Not 20 hours a week you don't have."],
              ["No going viral", "Your income comes from packaging expertise for the right few — not from a huge audience or a viral hit."],
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

      {/* ── THE 7-STAGE SYSTEM — what you're actually buying into ─────────── */}
      <section className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <p className="nx-label mb-3">The system you're buying into</p>
          <h2 className="mb-4">The 7-Stage Contentpreneur System</h2>
          <p className="nx-body max-w-xl mb-10">
            One sequence, in order — each stage produces a real deliverable, not a lesson you forget.
            The <strong className="text-[var(--foreground)]">Foundation Kit starts you through Stages
            1–3</strong> and hands you the frameworks for the rest. The Accelerator walks you through
            all seven, live.
          </p>
          <div className="space-y-3">
            {[
              ["1", "Foundation", "Get honest about what you're actually ready to sell.", "You walk out with a readiness score + your toolkit installed."],
              ["2", "Self-Awareness", "Compress your expertise into one clear niche.", "You walk out with a one-sentence niche statement."],
              ["3", "Content Strategy", "Know exactly what to post, in the right mix.", "You walk out with a 30-day content calendar."],
              ["4", "Platform & Scripting", "One platform, optimised — with hooks that stop the scroll.", "You walk out with an optimised profile + a repeatable script."],
              ["5", "Systems & DARES", "Build something to sell, and automate the capture.", "You walk out with 1 live digital product + auto-capture."],
              ["6", "Owned Tribes", "Move followers off rented platforms onto a list you own.", "You walk out with an owned list + a converting funnel."],
              ["7", "PAIDS Engine", "Turn one income stream into several — safely.", "You walk out with 3+ income streams + a SARS reserve."],
            ].map(([n, name, what, outcome]) => (
              <div key={n} className="nx-card !p-5 flex gap-4 items-start">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--nx-gold)] font-display font-black text-[#0F172A]">
                  {n}
                </div>
                <div>
                  <div className="font-display text-lg text-[var(--foreground)] leading-tight">
                    Stage {n} · {name}
                  </div>
                  <p className="text-sm text-[var(--text-dim)] mt-1 leading-relaxed">
                    {what} <span className="text-[var(--foreground)] font-medium">{outcome}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT ACTUALLY GETS YOU BUYERS (the distribution machine) ────── */}
      <section className="bg-white border-b border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <p className="nx-label mb-3">Where the buyers actually come from</p>
          <h2 className="mb-4">You build the asset. The machine gets the buyers.</h2>
          <p className="nx-body max-w-xl mb-10">
            The mistake everyone makes is thinking you need a big audience to sell. You don't — you
            need a small, mostly-automated machine. The Foundation Kit builds all three parts, so
            "getting buyers" isn't left to hope:
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["1", "Attract", "A few expertise posts a week on ONE platform — the 4E Content Calendar tells you exactly what to say. One idea, repurposed. No daily grind, no five platforms, no dancing."],
              ["2", "Capture", "ManyChat + your email list pull the interested ones off the rented platform onto land you own. It runs 24/7 without you in the room."],
              ["3", "Sell", "The SEEDS pipeline turns that owned list into buyers on autopilot — the same funnel selling while you sleep or clock into your shift."],
            ].map(([n, t, d]) => (
              <div key={n} className="nx-card !p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--nx-gold)] font-display font-black text-[#0F172A] mb-3">
                  {n}
                </div>
                <div className="font-display text-lg text-[var(--foreground)]">{t}</div>
                <p className="text-sm text-[var(--text-dim)] mt-1 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-[var(--text-dim)] mt-8 max-w-xl">
            That's the whole point. Your 4-hour windows go into your <strong className="text-[var(--foreground)]">expertise</strong> — the machine does the chasing, the capturing, and the selling.
          </p>
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
              <span className="font-mono text-lg line-through text-[var(--text-subtle)]">{comparePrice}</span>
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
              {chargeNote}
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

      {/* ── TESTIMONIALS — real comments ─────────────────────────────────── */}
      <section className="bg-[var(--bg-surface)] border-y border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <p className="nx-label text-center mb-3">In their own words</p>
          <h2 className="text-center mb-10">Real messages. Real lives changed.</h2>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>img]:mb-4">
            {TESTIMONIAL_SHOTS.map((file) => (
              <img
                key={file}
                src={`/testimonials/${file}`}
                alt="Unedited testimonial from the community"
                loading="lazy"
                className="w-full break-inside-avoid rounded-xl border border-[var(--border)] shadow-sm bg-white"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ))}
          </div>
          <p className="text-center text-xs text-[var(--text-subtle)] mt-6">
            Unedited WhatsApp, DM &amp; community messages — nothing staged.
          </p>
        </div>
      </section>

      {/* ── GUARANTEE ────────────────────────────────────────────────────── */}
      <section className="bg-[var(--bg-surface)] border-y border-[var(--border)]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-14 text-center">
          <p className="nx-label mb-3">A real guarantee, not a marketing line</p>
          <h2 className="mb-4">The 7-Day Roadmap Guarantee.</h2>
          <p className="nx-body max-w-xl mx-auto">
            Do the work. Complete the Niche Clarity Workbook and the Knowledge Audit. If you don't
            walk away with a defined asset roadmap within 7 days, email us your completed work and
            we'll refund every cent — no argument. That's how confident I am the frameworks deliver.
            See the full refund policy for exactly how it works.
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
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-5">
            Every year your expertise stays locked in your head is another year you trade your
            limited hours for someone else's balance sheet.
          </p>
          <h2 className="text-white mb-4">Do it for your children. Leave them a story.</h2>
          <p className="text-slate-300 max-w-lg mx-auto mb-8">
            You were given this knowledge for a purpose bigger than the money. Every year you sit on
            it is a year your kids inherit less. The Foundation Kit is where you start turning it
            into something you own.
          </p>
          <CtaButton
            onClick={open}
            label={`Get the Foundation Kit — ${displayPrice}`}
            sub="Instant access · 7-Day Roadmap Guarantee"
            size="large"
          />

          {/* P.S. — the second-most-read block on the page, for scrollers. */}
          <div className="mt-12 text-left border-t border-white/10 pt-8 max-w-xl mx-auto">
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-[#FCD34D]">P.S.</strong> — Let's be straight. You can keep
              trading your limited hours for a salary, leaving years of expertise trapped in your
              head. Or you put down <strong className="text-white">{displayPrice}</strong> today, take
              the 7 frameworks, and spend one weekend building an asset you actually own. Complete the
              first two workbooks — if you don't have a clear roadmap in 7 days, show us your work and
              get every cent back. The risk is entirely mine. The only thing you can lose is another
              year.
            </p>
            <div className="mt-5">
              <button
                onClick={open}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--nx-gold)] px-6 py-3 text-sm font-bold text-[#0F172A] hover:bg-[var(--nx-gold-deep)] transition-colors"
              >
                Secure the Foundation Kit — {displayPrice}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dark wrapper so the space under the fixed mobile buy-bar is dark, not white */}
      <div className="bg-[#0F172A] pb-20 sm:pb-0">
        <SiteFooter />
      </div>
    </div>
  );
}
