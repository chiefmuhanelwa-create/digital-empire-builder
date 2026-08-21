import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { Lock, ArrowRight, Check, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/voice-print")({
  head: () => ({ meta: [{ title: "Voice Print — Contentpreneur Africa" }] }),
  component: VoicePrint,
});

// STAGE 3 · CONTENT ENGINE — rebuilt from the content system's "Brand Voice".
//
// WHY IT COULD NOT BE PORTED AS-IS
// ================================
// The original scored a draft against the FOUNDER'S voice — his sentence
// patterns, his phrases, his register — because it was built for an audience of
// one. Shipped to a buyer, it marks them down for not sounding like somebody
// else, which is the precise opposite of what a personal brand tool should do.
//
// This version measures a draft against THEIR OWN writing. They paste three
// things they wrote and already liked; the tool reads the mechanics of those
// samples and then holds new drafts to that. No AI call, no opinion about what
// good writing is — just: does this sound like the rest of your work?
//
// The one universal rule it does enforce is the AI-slop list, because that is
// not a matter of taste. A credentialed professional publishing machine-sounding
// copy loses the exact credibility they came here to monetise.

const KEY = "nochill-voiceprint-v1";

// Words and constructions that read as generated regardless of whose voice it
// is. Kept short and specific — a bloated list flags honest writing.
const SLOP = [
  "delve", "tapestry", "testament to", "in today's fast-paced", "navigate the",
  "unlock the power", "game-changer", "leverage your", "elevate your",
  "it's important to note", "in conclusion", "furthermore", "moreover",
  "embark on", "realm of", "landscape of", "at the end of the day",
  "seamless", "robust solution", "cutting-edge", "revolutionize",
];

const HEDGES = ["perhaps", "arguably", "somewhat", "fairly", "quite possibly", "it could be argued", "generally speaking"];

interface Saved { samples: string[]; draft: string }
const DEFAULTS: Saved = { samples: ["", "", ""], draft: "" };

interface Metrics {
  words: number;
  sentences: number;
  avgSentence: number;
  longestSentence: number;
  pctShort: number;      // sentences under 8 words — the punch rate
  questionRate: number;
  youRate: number;       // "you" per 100 words — is it addressed to a person
  passive: number;       // rough passive-voice count
  numbers: number;       // specific figures per 100 words
}

function analyse(text: string): Metrics | null {
  const t = text.trim();
  if (t.length < 40) return null;
  const sentences = t.split(/[.!?]+(?:\s|$)/).map((x) => x.trim()).filter(Boolean);
  const words = t.split(/\s+/).filter(Boolean);
  const lens = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const per100 = (n: number) => +((n / Math.max(words.length, 1)) * 100).toFixed(1);
  return {
    words: words.length,
    sentences: sentences.length,
    avgSentence: +(lens.reduce((a, b) => a + b, 0) / Math.max(lens.length, 1)).toFixed(1),
    longestSentence: Math.max(0, ...lens),
    pctShort: Math.round((lens.filter((l) => l > 0 && l < 8).length / Math.max(lens.length, 1)) * 100),
    questionRate: sentences.filter((s) => /\?$/.test(s)).length,
    youRate: per100((t.match(/\byou(r|rs|rself)?\b/gi) || []).length),
    passive: (t.match(/\b(was|were|is|are|been|being)\s+\w+(ed|en)\b/gi) || []).length,
    numbers: per100((t.match(/\b(R\s?\d[\d,\s]*|\d+%|\d{2,})\b/g) || []).length),
  };
}

function VoicePrint() {
  const { access } = useKitAccess();
  const [s, setS] = useState<Saved>(DEFAULTS);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r?.samples) setS({ ...DEFAULTS, ...r });
    } catch { /* ignore */ }
  }, []);

  const save = (next: Saved) => {
    setS(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const fingerprint = useMemo(() => analyse(s.samples.join("\n\n")), [s.samples]);
  const draft = useMemo(() => analyse(s.draft), [s.draft]);

  const slopHits = useMemo(() => {
    const low = s.draft.toLowerCase();
    return SLOP.filter((w) => low.includes(w));
  }, [s.draft]);

  const hedgeHits = useMemo(() => {
    const low = s.draft.toLowerCase();
    return HEDGES.filter((w) => low.includes(w));
  }, [s.draft]);

  const drift = useMemo(() => {
    if (!fingerprint || !draft) return null;
    const out: { label: string; verdict: "ok" | "off"; note: string }[] = [];

    const dSent = draft.avgSentence - fingerprint.avgSentence;
    out.push(
      Math.abs(dSent) <= 4
        ? { label: "Sentence length", verdict: "ok", note: `About ${draft.avgSentence} words, same as your own writing.` }
        : { label: "Sentence length", verdict: "off", note: dSent > 0
            ? `${draft.avgSentence} words a sentence against your usual ${fingerprint.avgSentence}. You are writing longer than you speak. Cut the longest one in half.`
            : `${draft.avgSentence} words against your usual ${fingerprint.avgSentence}. Clipped — fine for a hook, thin for a whole piece.` });

    const dShort = draft.pctShort - fingerprint.pctShort;
    out.push(
      Math.abs(dShort) <= 18
        ? { label: "Rhythm", verdict: "ok", note: `${draft.pctShort}% short punches — close to your ${fingerprint.pctShort}%.` }
        : { label: "Rhythm", verdict: "off", note: dShort < 0
            ? `Only ${draft.pctShort}% of your sentences land short, against your usual ${fingerprint.pctShort}%. It reads flat. Break one long line into two.`
            : `${draft.pctShort}% short lines against your usual ${fingerprint.pctShort}%. Staccato — let one sentence breathe.` });

    out.push(
      draft.youRate >= fingerprint.youRate * 0.6
        ? { label: "Written to a person", verdict: "ok", note: `"You" appears ${draft.youRate} times per 100 words.` }
        : { label: "Written to a person", verdict: "off", note: `"You" appears ${draft.youRate} times per 100 words against your usual ${fingerprint.youRate}. This is drifting into a report. Write it to one person.` });

    out.push(
      draft.numbers >= fingerprint.numbers * 0.5 || draft.numbers > 0.5
        ? { label: "Specifics", verdict: "ok", note: "Real figures are in there." }
        : { label: "Specifics", verdict: "off", note: "No numbers, dates or amounts. Your own writing carries more. Specifics are what make an expert sound like one." });

    if (draft.longestSentence > 34) {
      out.push({ label: "The long one", verdict: "off", note: `Your longest sentence runs ${draft.longestSentence} words. Read it aloud — if you run out of breath, so will they.` });
    }
    if (draft.passive > Math.max(2, draft.sentences * 0.25)) {
      out.push({ label: "Passive voice", verdict: "off", note: `${draft.passive} passive constructions. "The algorithm changed" — not "was changed".` });
    }
    return out;
  }, [fingerprint, draft]);

  const ready = !!fingerprint;

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">Voice Print is part of the Foundation Kit.</h2>
            <a href="/foundation" className="cta-glow inline-block mt-6">Get the Kit</a>
          </div>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-7">
          <Link to="/dashboard/foundation-kit" className="inline-flex items-center gap-1 text-[16px] font-semibold text-[var(--nx-gold-text)] hover:underline">
            ← All tools
          </Link>
          <p className="nx-label mt-4">Stage 3 · Content engine</p>
          <h1 className="mt-2">Does this still sound like you?</h1>
          <p className="nx-body max-w-xl mt-3">
            Not like a guru, not like a template, not like a machine. Like the person whose name is
            on it. Paste three things you wrote and liked — the tool learns your mechanics and holds
            everything after that to your own standard.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-9 space-y-5">
        {/* samples */}
        <div className="nx-card !p-5">
          <p className="nx-label">Step 1 · Three things you wrote</p>
          <p className="nx-body mt-1">
            An email, a post, a message to a colleague. Anything you wrote yourself and thought
            sounded right. Not your best writing — your <em>normal</em> writing.
          </p>
          {s.samples.map((v, i) => (
            <textarea
              key={i}
              value={v}
              onChange={(e) => save({ ...s, samples: s.samples.map((x, n) => (n === i ? e.target.value : x)) })}
              rows={3}
              placeholder={`Sample ${i + 1}`}
              className="mt-3 w-full rounded-lg border border-[var(--border)] bg-transparent p-3 text-sm outline-none focus:border-[var(--nx-gold)]"
            />
          ))}

          {fingerprint && (
            <div className="mt-4 rounded-lg bg-[var(--bg-surface)] p-4">
              <span className="nx-label">Your fingerprint</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <Stat n={`${fingerprint.avgSentence}`} l="words a sentence" />
                <Stat n={`${fingerprint.pctShort}%`} l="short punches" />
                <Stat n={`${fingerprint.youRate}`} l={`"you" per 100 words`} />
                <Stat n={`${fingerprint.numbers}`} l="figures per 100 words" />
              </div>
              <p className="text-xs text-[var(--text-subtle)] mt-3">
                Based on {fingerprint.words} words. Add more samples and this sharpens.
              </p>
            </div>
          )}
        </div>

        {/* draft */}
        <div className="nx-card !p-5">
          <p className="nx-label">Step 2 · Paste a draft</p>
          <textarea
            value={s.draft}
            onChange={(e) => save({ ...s, draft: e.target.value })}
            rows={7}
            placeholder="The thing you're about to publish."
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent p-3 text-sm outline-none focus:border-[var(--nx-gold)]"
          />
          {!ready && s.draft.trim().length > 40 && (
            <p className="nx-body mt-3">
              Add your samples above first — without them there is nothing to measure against, and a
              generic opinion about your writing is worth nothing.
            </p>
          )}
        </div>

        {/* the AI-slop check runs regardless of samples */}
        {(slopHits.length > 0 || hedgeHits.length > 0) && (
          <div className="rounded-2xl border-2 border-[#EA580C] bg-[#EA580C]/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 text-[#9A3412] mt-0.5" />
              <div>
                <h3 className="font-display text-lg text-[#9A3412]">This reads as machine-written.</h3>
                {slopHits.length > 0 && (
                  <p className="text-sm text-[#7C2D12] mt-2">
                    Found: {slopHits.map((w) => `“${w}”`).join(", ")}. Nobody says these out loud.
                    Say what you actually mean instead.
                  </p>
                )}
                {hedgeHits.length > 0 && (
                  <p className="text-sm text-[#7C2D12] mt-2">
                    Hedging: {hedgeHits.map((w) => `“${w}”`).join(", ")}. You are the expert here.
                    Say it plainly or cut the sentence.
                  </p>
                )}
                <p className="text-sm text-[#7C2D12] mt-2 leading-relaxed">
                  This one matters more for you than for most people. Your whole asset is that people
                  believe you wrote it and meant it.
                </p>
              </div>
            </div>
          </div>
        )}

        {drift && (
          <div className="nx-card !p-5">
            <p className="nx-label">Against your own writing</p>
            <ul className="mt-3 space-y-3">
              {drift.map((d, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-0.5 shrink-0 ${d.verdict === "ok" ? "text-[#2A6B4C]" : "text-[#B4650F]"}`}>
                    {d.verdict === "ok" ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-[var(--text-body)]">{d.label}</span>
                    <span className="block text-sm text-[var(--text-dim)]">{d.note}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-[var(--text-subtle)] mt-4">
              These are mechanics, not verdicts. If a line breaks a rule and you meant it, keep it —
              a voice is allowed to have exceptions. Drift is what this catches.
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-center">
          <h2 className="text-white text-2xl">The test that beats every rule here.</h2>
          <p className="text-[#C8C2B4] text-sm mt-2 max-w-lg mx-auto">
            Read it aloud. If it would pass a corporate editor, it is too polished — rewrite it until
            it sounds like you talking.
          </p>
          <Link
            to="/apps/teleprompter"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-6 py-3 text-sm font-bold text-[#111111] hover:bg-[var(--nx-gold-deep)] transition-colors"
          >
            Read it in the teleprompter <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </Shell>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <span className="block font-display text-xl text-[var(--text-body)] tabular-nums">{n}</span>
      <span className="block text-xs text-[var(--text-subtle)] leading-tight">{l}</span>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
