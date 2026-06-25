import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Sparkles, Copy, Check, RotateCcw, Flame } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/hook-generator")({
  head: () => ({
    meta: [
      { title: "Free Hook Generator — scroll-stopping hooks (R×A×C×U^B) | CHKPLT" },
      {
        name: "description",
        content:
          "Stop posting into silence. Generate scroll-stopping hooks built on NoChill's R×A×C×U^B framework — each one shows you exactly why it works. Free.",
      },
      { property: "og:title", content: "Free Hook Generator — CHKPLT" },
    ],
  }),
  component: HookGeneratorPage,
});

type Awareness = "symptom" | "problem" | "solution" | "product";

const AWARENESS: { val: Awareness; t: string; d: string }[] = [
  { val: "symptom", t: "Symptom Aware", d: "They feel the pain but don't know why — the cause is invisible to them." },
  { val: "problem", t: "Problem Aware", d: "They know the problem exists, but haven't found the right fix yet." },
  { val: "solution", t: "Solution Aware", d: "They know solutions exist — they need to see why yours is different." },
  { val: "product", t: "Product Aware", d: "They know you / your offer — they need a reason to act now." },
];

interface Ctx {
  t: string; // topic / expertise
  a: string; // audience
  ang: string; // unique angle (optional)
  aw: Awareness;
}

interface Hook {
  type: string;
  text: string;
  formula: string;
  why: string;
}

// Pain framing shifts by awareness level — same R×A×C×U^B engine, different entry point.
const painFrame = (c: Ctx): string => {
  switch (c.aw) {
    case "symptom": return `you keep doing the work and ${c.t} still isn't paying off`;
    case "problem": return `you know ${c.t} is the gap — you just don't have the system`;
    case "solution": return `you've tried fixing ${c.t} and the usual advice didn't move the needle`;
    case "product": return `you're ready to fix ${c.t} for good`;
  }
};

const BUILDERS: ((c: Ctx) => Hook)[] = [
  (c) => ({
    type: "Contrarian",
    text: `Everything you've been told about ${c.t} is keeping ${c.a} broke.`,
    formula: "Relevance (their topic) × Pattern Interrupt (reverses belief) → forces a re-read.",
    why: "A contrarian claim breaks the scroll because it attacks an assumption they hold. Back it up in line two.",
  }),
  (c) => ({
    type: "Story Promise",
    text: `I went from invisible to ${c.t} that actually pays. Here's the one shift that did it.`,
    formula: "Story (before→after) × Clarity (one shift) × Curiosity gap → they stay for the reveal.",
    why: "Specific transformation + a single named lever feels achievable, not hype. Name the real shift next.",
  }),
  (c) => ({
    type: "List / Number",
    text: `3 things about ${c.t} that ${c.a} learn too late.`,
    formula: "Specificity (3) × Loss-aversion (too late) → low-friction, high-curiosity open.",
    why: "Numbered hooks promise a finite, skimmable payoff. Deliver all 3 fast or they bounce.",
  }),
  (c) => ({
    type: "Question Hook",
    text: `What if ${painFrame(c)} — because no one taught you the part that matters?`,
    formula: `Awareness (${c.aw}-aware entry) × Relevance × open loop → self-identification.`,
    why: "A question they silently answer 'yes' to pulls them in. Then name 'the part that matters'.",
  }),
  (c) => ({
    type: "Bold Claim",
    text: `${cap(c.t)} isn't a talent problem. It's a system problem — and systems can be copied.`,
    formula: "Reframe (talent→system) × Clarity × Empowerment → removes the excuse, keeps hope.",
    why: "Reframing the obstacle as fixable lowers shame and raises belief. Show the system after.",
  }),
  (c) => ({
    type: "Pattern Interrupt",
    text: `Stop posting about ${c.t}. Start doing this instead.`,
    formula: "Interrupt (stop X) × Curiosity (do this) → halts the scroll, demands the next line.",
    why: "A blunt 'stop' against their current behaviour creates tension only your next line resolves.",
  }),
  (c) => ({
    type: "Authority Building",
    text: c.ang
      ? `${c.ang}. That's why ${c.a} trust me on ${c.t}.`
      : `After every mistake in ${c.t}, here's what I'd tell ${c.a} on day one.`,
    formula: "Proof / earned-scars × Relevance → credibility without bragging.",
    why: "Authority lands when it's framed as service ('what I'd tell you'), not a flex. Lead with the lesson.",
  }),
  (c) => ({
    type: "Transformation",
    text: `From ${painFrame(c)} → to ${c.t} that runs without you. In one post, here's the map.`,
    formula: "Before→After × Clarity (a map) × Relevance → visualises the destination.",
    why: "Showing the gap between now and the dream — then promising the bridge — is the core of every great hook.",
  }),
  (c) => ({
    type: "Lead Generation",
    text: `If you're ${c.a} stuck on ${c.t}, I made the thing I wish I'd had. It's free.`,
    formula: "Qualifier (if you're X) × Relevance × Low-risk offer → self-selecting opt-in.",
    why: "Naming exactly who it's for filters in your people and filters out tyre-kickers. End with a clear next step.",
  }),
  (c) => ({
    type: "Direct Sale",
    text: c.aw === "product"
      ? `You already know ${c.t} is the move. This is your sign — and your system — to finally do it.`
      : `When you're done guessing at ${c.t}, the system is here. No fluff.`,
    formula: "Awareness (warm/product-aware) × Clarity × Urgency → permission to buy.",
    why: "Direct works only on warm audiences. For colder ones, lead with the contrarian or question hooks above.",
  }),
];

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const LABEL = "font-display text-[#0F172A] text-sm font-bold leading-snug block mb-1.5";
const HINT = "text-[#555] text-xs mb-2";

function HookGeneratorPage() {
  const [t, setT] = useState("");
  const [a, setA] = useState("");
  const [ang, setAng] = useState("");
  const [aw, setAw] = useState<Awareness>("problem");
  const [hooks, setHooks] = useState<Hook[] | null>(null);

  const valid = t.trim().length >= 2 && a.trim().length >= 2;

  const generate = () => {
    const ctx: Ctx = { t: t.trim().toLowerCase(), a: a.trim().toLowerCase(), ang: ang.trim(), aw };
    setHooks(BUILDERS.map((b) => b(ctx)));
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 pt-24 pb-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-banana mb-3">
            <Flame className="size-3.5" /> Free Hook Generator
          </div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase leading-[1.05]">
            Stop posting into <strong>silence.</strong>
          </h1>
          <p className="text-[#555] mt-3 max-w-md mx-auto">
            Ten scroll-stopping hooks built on NoChill's <strong>R×A×C×U^B</strong> framework — and each one shows you exactly why it works, so you can write your own next time.
          </p>
        </div>

        {!hooks ? (
          <div className="border border-[#e8e0d4] rounded-2xl bg-white p-6 sm:p-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.10)] space-y-6">
            <div>
              <label className={LABEL}>What's the topic?</label>
              <p className={HINT}>Your skill, niche, or the thing this post is about.</p>
              <Input value={t} onChange={(e) => setT(e.target.value)} placeholder="e.g. building a personal brand" className="h-11 border-[#d0c8bc] focus:border-[#F59E0B] focus:ring-0" />
            </div>
            <div>
              <label className={LABEL}>Who's it for?</label>
              <p className={HINT}>The exact person you want to stop the scroll.</p>
              <Input value={a} onChange={(e) => setA(e.target.value)} placeholder="e.g. nurses who want a side income" className="h-11 border-[#d0c8bc] focus:border-[#F59E0B] focus:ring-0" />
            </div>
            <div>
              <label className={LABEL}>Your unique angle <span className="text-[#999] font-normal">(optional)</span></label>
              <p className={HINT}>A proof point or one-liner only you can say. Don't invent anything.</p>
              <Input value={ang} onChange={(e) => setAng(e.target.value)} placeholder="e.g. I built R600K in 4-hour night-shift windows" className="h-11 border-[#d0c8bc] focus:border-[#F59E0B] focus:ring-0" />
            </div>
            <div>
              <label className={LABEL}>How aware is your audience?</label>
              <p className={HINT}>This is the "A" in R×A×C×U^B — it changes where each hook starts.</p>
              <div className="grid gap-2">
                {AWARENESS.map((o) => (
                  <button
                    key={o.val}
                    type="button"
                    onClick={() => setAw(o.val)}
                    className={`text-left py-3 px-4 border rounded-lg transition-all ${
                      aw === o.val ? "border-[#F59E0B] bg-[#FBF7EC]" : "border-[#d0c8bc] bg-white hover:border-[#F59E0B]"
                    }`}
                  >
                    <div className="font-display font-bold text-sm text-[#0F172A]">{o.t}</div>
                    <div className="text-[#555] text-xs mt-0.5">{o.d}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              disabled={!valid}
              onClick={generate}
              className="w-full bg-[#F59E0B] hover:bg-[#b8963e] text-[#111] font-display font-black uppercase tracking-wide text-sm py-3 h-auto disabled:opacity-40"
            >
              Generate my hooks <ArrowRight className="size-4 ml-1" />
            </Button>
            <p className="text-center text-[#777] text-xs">Free. Instant. Nothing leaves your browser.</p>
          </div>
        ) : (
          <HookResults hooks={hooks} onReset={() => setHooks(null)} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function HookResults({ hooks, onReset }: { hooks: Hook[]; onReset: () => void }) {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-banana mb-3">
          <Sparkles className="size-3.5" /> 10 hooks, ready to post
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] uppercase text-[#5a5a5a] hover:text-[#0F172A] transition-colors"
        >
          <RotateCcw className="size-3.5" /> New hooks
        </button>
      </div>

      <div className="grid gap-4">
        {hooks.map((h, i) => (
          <HookCard key={i} hook={h} n={i + 1} />
        ))}
      </div>

      <div className="mt-8 text-center border border-[#e8e0d4] rounded-2xl p-6 bg-white">
        <h3 className="font-display text-xl uppercase">Hooks open the door. Now walk through it.</h3>
        <p className="text-[#555] text-sm mt-2 max-w-md mx-auto">
          A hook gets the scroll to stop. The Foundation Kit gives you the full 7-Act post structure, the 4E content calendar, and the offer to point all that attention at.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/products/$slug"
            params={{ slug: "called-expert-foundation-kit" }}
            className="cta-glow inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-display font-black uppercase tracking-wide"
          >
            Get the Foundation Kit <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/offer-builder"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-mono uppercase tracking-[0.15em] border border-[#F59E0B] text-[#0F172A] hover:bg-[#F59E0B] hover:text-[#111] transition-colors"
          >
            Build your offer
          </Link>
        </div>
      </div>
    </div>
  );
}

function HookCard({ hook, n }: { hook: Hook; n: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(hook.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  return (
    <div className="border border-[#e8e0d4] rounded-xl bg-white p-5 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-banana">#{n} · {hook.type}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] uppercase text-[#5a5a5a] hover:text-[#0F172A] transition-colors"
        >
          {copied ? <><Check className="size-3.5 text-banana" /> Copied</> : <><Copy className="size-3.5" /> Copy</>}
        </button>
      </div>
      <p className="text-[17px] leading-snug text-[#0F172A] font-medium">{hook.text}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-3 font-mono text-[10px] tracking-[0.15em] uppercase text-[#777] hover:text-banana transition-colors"
      >
        {open ? "Hide" : "Why this works →"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-[#f0ebe1] pt-3">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#777] mb-1">The formula</div>
            <p className="text-[#2A2A2A] text-sm font-mono">{hook.formula}</p>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#777] mb-1">Why it stops the scroll</div>
            <p className="text-[#2A2A2A] text-sm">{hook.why}</p>
          </div>
        </div>
      )}
    </div>
  );
}
