import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef} from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Sparkles, Copy, Check, RotateCcw, Flame, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurnstileGate, type TurnstileGateHandle } from "@/components/TurnstileGate";
import { generateHooks } from "@/lib/hook-generator.functions";
import { getUtm } from "@/lib/utm";
import { useToolView } from "@/lib/tool-analytics";

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

interface Hook {
  type: string;
  text: string;
  why: string;
}

const LABEL = "font-display text-[#0F172A] text-sm font-bold leading-snug block mb-1.5";
const HINT = "text-[#555] text-xs mb-2";

function HookGeneratorPage() {
  useToolView("hook-generator");
  const [t, setT] = useState("");
  const [a, setA] = useState("");
  const [ang, setAng] = useState("");
  const [aw, setAw] = useState<Awareness>("problem");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [tsToken, setTsToken] = useState<string | null>(null);
  // A Turnstile token is single-use — reset after EVERY attempt so a retry
  // (or a second run of this tool) gets a fresh one instead of re-sending a
  // spent token, which Cloudflare rejects as `timeout-or-duplicate`.
  const tsRef = useRef<TurnstileGateHandle>(null);
  const [hooks, setHooks] = useState<Hook[] | null>(null);
  const [locked, setLocked] = useState(false);

  const generateFn = useServerFn(generateHooks);
  const mut = useMutation({
    mutationFn: generateFn,
    onSuccess: (res) => {
      if (res.locked) setLocked(true);
      else setHooks(res.hooks);
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => tsRef.current?.reset(),
  });

  const valid = t.trim().length >= 2 && a.trim().length >= 2 && /\S+@\S+\.\S+/.test(email);

  const generate = () => {
    mut.mutate({
      data: {
        topic: t.trim(),
        audience: a.trim(),
        angle: ang.trim() || undefined,
        awareness: aw,
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        turnstileToken: tsToken ?? undefined,
        ...getUtm(),
      },
    });
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 pt-24 pb-20">
        <BackNav to="/tools" label="All tools" className="mb-6" />
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-banana mb-3">
            <Flame className="size-3.5" /> Free Hook Generator
          </div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase leading-[1.05]">
            Stop posting into <strong>silence.</strong>
          </h1>
          <p className="text-[#555] mt-3 max-w-md mx-auto">
            5 scroll-stopping hooks, written fresh for YOUR topic and audience by Claude on NoChill's
            <strong> R×A×C×U^B</strong> framework — each one shows you exactly why it works.
          </p>
        </div>

        {locked ? (
          <HookLimitReached />
        ) : !hooks ? (
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Your name <span className="text-[#999] font-normal">(optional)</span></label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="h-11 border-[#d0c8bc] focus:border-[#F59E0B] focus:ring-0" />
              </div>
              <div>
                <label className={LABEL}>Your email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 border-[#d0c8bc] focus:border-[#F59E0B] focus:ring-0" />
              </div>
            </div>

            <TurnstileGate ref={tsRef} onToken={setTsToken} />

            <Button
              type="button"
              disabled={!valid || !tsToken || mut.isPending}
              onClick={generate}
              className="w-full bg-[#F59E0B] hover:bg-[#b8963e] text-[#111] font-display font-black uppercase tracking-wide text-sm py-3 h-auto disabled:opacity-40"
            >
              {mut.isPending ? "Writing your hooks…" : "Generate my hooks"} <ArrowRight className="size-4 ml-1" />
            </Button>
            <p className="text-center text-[#777] text-xs">
              First 3 generations free — we'll also email you a copy. After that, it's part of the Foundation Kit.
            </p>
          </div>
        ) : (
          <HookResults hooks={hooks} onReset={() => setHooks(null)} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function HookLimitReached() {
  return (
    <div className="border-2 rounded-2xl bg-white p-6 sm:p-8 text-center" style={{ borderColor: "#F59E0B" }}>
      <div className="mx-auto inline-flex size-11 items-center justify-center rounded-full" style={{ backgroundColor: "#FBF7EC", color: "#F59E0B" }}>
        <Lock className="size-5" />
      </div>
      <h3 className="font-display text-xl uppercase mt-4">You've used your 3 free hooks</h3>
      <p className="text-[#555] text-sm mt-2 max-w-md mx-auto">
        Real Claude-written hooks cost real money to generate — 3 free was the trial. Unlimited hooks
        (plus the full 7-Act post structure, the 4E content calendar, and Offer Builder) come with the
        Foundation Kit.
      </p>
      <Link
        to="/products/$slug"
        params={{ slug: "called-expert-foundation-kit" }}
        className="cta-glow inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-md text-sm font-display font-black uppercase tracking-wide"
      >
        Get the Foundation Kit <ArrowRight className="size-4" />
      </Link>
      <p className="text-[#999] text-xs mt-4">Already own the Foundation Kit? Make sure you're using the same email you purchased with, then try again.</p>
    </div>
  );
}

function HookResults({ hooks, onReset }: { hooks: Hook[]; onReset: () => void }) {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-banana mb-3">
          <Sparkles className="size-3.5" /> {hooks.length} hooks, ready to post
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
          <p className="text-[#2A2A2A] text-sm">{hook.why}</p>
        </div>
      )}
    </div>
  );
}
