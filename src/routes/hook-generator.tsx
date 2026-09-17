import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Copy, Check, RotateCcw, Lock } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BackNav } from "@/components/BackNav";
import { TurnstileGate, type TurnstileGateHandle } from "@/components/TurnstileGate";
import {
  ToolCanvas,
  DotGrid,
  GoldGlow,
  Eyebrow,
  Pill,
  Panel,
  PanelHeader,
  Field,
  Input,
  GoldButton,
} from "@/components/tools/premium";
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
    <div className="min-h-screen overflow-x-clip bg-[#F5F3FF]">
      <SiteHeader />
      <ToolCanvas>
        <div className="px-5 pt-3 sm:px-6">
          <BackNav to="/tools" label="All tools" />
        </div>

        {!hooks && !locked && (
          <header className="mx-auto max-w-2xl px-5 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-12">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Eyebrow>Creator · Free Tool</Eyebrow>
              <Pill className="whitespace-nowrap">R×A×C×U^B Framework</Pill>
            </div>
            <h1 className="mt-7 font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#1A1523] sm:text-[52px]">
              Stop posting into <span className="text-[#8B5CF6]">silence.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-[1.65] text-neutral-600 sm:text-[17px]">
              5 scroll-stopping hooks, written fresh for your topic and your audience on NoChill's
              R×A×C×U^B framework — and each one shows you exactly why it works.
            </p>
            <div className="mt-7 h-[3px] w-16 rounded-full bg-[#8B5CF6]" />
          </header>
        )}

        <main className="mx-auto max-w-2xl px-5 pb-20 sm:px-6">
          {locked ? (
            <HookLimitReached />
          ) : !hooks ? (
            <div className="space-y-4">
              <Panel>
                <PanelHeader
                  title="Tell me what you're posting about"
                  step="01"
                  hint="The clearer the topic and the person, the sharper the hooks."
                />
                <div className="space-y-5 p-5 sm:p-6">
                  <Field label="What's the topic?" hint="Your skill, niche, or the thing this post is about.">
                    <Input
                      value={t}
                      onChange={(e) => setT(e.target.value)}
                      placeholder="e.g. building a personal brand"
                    />
                  </Field>
                  <Field label="Who's it for?" hint="The exact person you want to stop the scroll.">
                    <Input
                      value={a}
                      onChange={(e) => setA(e.target.value)}
                      placeholder="e.g. nurses who want a side income"
                    />
                  </Field>
                  <Field
                    label="Your unique angle (optional)"
                    hint="A proof point or one-liner only you can say. Don't invent anything."
                  >
                    <Input
                      value={ang}
                      onChange={(e) => setAng(e.target.value)}
                      placeholder="e.g. I quoted R15,000 for years without ever costing it"
                    />
                  </Field>
                </div>
              </Panel>

              <Panel>
                <PanelHeader
                  title="How aware is your audience?"
                  step="02"
                  hint={'This is the "A" in R×A×C×U^B — it changes where each hook starts.'}
                />
                <div className="grid gap-2.5 p-5 sm:p-6">
                  {AWARENESS.map((o) => {
                    const active = aw === o.val;
                    return (
                      <button
                        key={o.val}
                        type="button"
                        onClick={() => setAw(o.val)}
                        aria-pressed={active}
                        className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                          active
                            ? "border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                            : "border-neutral-200 bg-white hover:border-neutral-300"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-bold leading-snug text-[#1A1523]">
                            {o.t}
                          </span>
                          <span className="mt-1 block text-[12.5px] leading-snug text-neutral-500">
                            {o.d}
                          </span>
                        </span>
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                            active ? "border-[#8B5CF6] bg-[#8B5CF6]" : "border-neutral-300 bg-white"
                          }`}
                        >
                          {active && (
                            <span className="h-2 w-2 rounded-full bg-[#1A1523]" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel>
                <PanelHeader
                  title="Where should we send them?"
                  step="03"
                  hint="First 3 generations are free — we email you a copy each time."
                />
                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  <Field label="Your name (optional)">
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                    />
                  </Field>
                  <Field label="Your email">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </Field>
                </div>
                <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                  <TurnstileGate ref={tsRef} onToken={setTsToken} />
                  <GoldButton
                    type="button"
                    disabled={!valid || !tsToken || mut.isPending}
                    onClick={generate}
                    className="mt-4"
                  >
                    {mut.isPending ? "Writing your hooks…" : "Generate my hooks"}
                    <ArrowRight className="size-4" />
                  </GoldButton>
                  <p className="mt-3 text-center text-[12px] text-neutral-500">
                    First 3 generations free. After that, unlimited hooks are part of the Foundation Kit.
                  </p>
                </div>
              </Panel>
            </div>
          ) : (
            <HookResults hooks={hooks} onReset={() => setHooks(null)} />
          )}
        </main>
      </ToolCanvas>
      <SiteFooter />
    </div>
  );
}

function HookLimitReached() {
  return (
    <Panel raised className="overflow-hidden">
      <div className="relative overflow-hidden bg-[#1A1523] px-6 py-9 text-center sm:px-10">
        <DotGrid dark />
        <GoldGlow className="-right-24 -top-28" size={420} opacity={0.6} />
        <div className="relative">
          <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[#8B5CF6] text-white">
            <Lock className="size-5" />
          </div>
          <h3 className="mt-5 font-display text-[24px] font-extrabold tracking-tight text-white sm:text-[28px]">
            You've used your 3 free hooks
          </h3>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
            Real Claude-written hooks cost real money to generate — 3 free was the trial. Unlimited
            hooks, the full 7-Act post structure, the 4E content calendar and the Offer Builder all
            come with the Foundation Kit.
          </p>
          <Link
            to="/products/$slug"
            params={{ slug: "called-expert-foundation-kit" }}
            className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#8B5CF6] px-7 text-[15px] font-bold text-white transition hover:brightness-110"
          >
            Get the Foundation Kit <ArrowRight className="size-4" />
          </Link>
          <p className="mt-4 text-[12px] text-white/45">
            Already own it? Use the same email you purchased with, then try again.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function HookResults({ hooks, onReset }: { hooks: Hook[]; onReset: () => void }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Eyebrow>Your hooks</Eyebrow>
          <Pill tone="gold">{hooks.length} ready to post</Pill>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-neutral-500 transition hover:text-[#1A1523]"
        >
          <RotateCcw className="size-3.5" /> New hooks
        </button>
      </div>

      <div className="grid gap-3">
        {hooks.map((h, i) => (
          <HookCard key={i} hook={h} n={i + 1} />
        ))}
      </div>

      <Panel raised className="mt-6 overflow-hidden">
        <div className="relative overflow-hidden bg-[#1A1523] px-6 py-9 text-center sm:px-10">
          <DotGrid dark />
          <GoldGlow className="-bottom-32 -right-20" size={440} opacity={0.6} />
          <div className="relative">
            <Eyebrow className="!text-[#8B5CF6]">Hooks open the door</Eyebrow>
            <h3 className="mt-4 font-display text-[24px] font-extrabold tracking-tight text-white sm:text-[30px]">
              Now walk through it.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
              A hook stops the scroll. The Foundation Kit gives you the full 7-Act post structure,
              the 4E content calendar, and the offer to point all that attention at.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/products/$slug"
                params={{ slug: "called-expert-foundation-kit" }}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#8B5CF6] px-7 text-[15px] font-bold text-white transition hover:brightness-110"
              >
                Get the Foundation Kit <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/offer-builder"
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-white/25 px-7 text-[14px] font-bold text-white transition hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
              >
                Build your offer
              </Link>
            </div>
          </div>
        </div>
      </Panel>
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
    <Panel className="p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7C3AED]">
          #{n} · {hook.type}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-neutral-500 transition hover:text-[#1A1523]"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-[#8B5CF6]" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <p className="text-[17px] font-medium leading-snug text-[#1A1523]">{hook.text}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-3 text-[12px] font-bold text-neutral-500 transition hover:text-[#7C3AED]"
      >
        {open ? "Hide" : "Why this works →"}
      </button>
      {open && (
        <div className="mt-3 border-t border-neutral-200/80 pt-3">
          <p className="text-[14px] leading-relaxed text-neutral-700">{hook.why}</p>
        </div>
      )}
    </Panel>
  );
}
