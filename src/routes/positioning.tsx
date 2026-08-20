import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { runTests, score, verdictFor, assembleSentence, defendingLine, EMPTY_POSITIONING, type Positioning } from "@/lib/positioning-engine";
import { Check, AlertTriangle, ArrowRight, Loader2, Mail } from "lucide-react";

export const Route = createFileRoute("/positioning")({
  head: () => ({
    meta: [
      { title: "The Positioning Test — Contentpreneur Africa" },
      { name: "description", content: "Five tests on the one sentence your whole business inherits. Free, and you get the brief by email." },
    ],
  }),
  component: PositioningTool,
});

// PUBLIC TOOL — no auth, no paywall.
//
// The tests run live in the browser so the value lands before any email is
// asked for. That order matters: a tool that gates its result behind a form is
// a lead magnet wearing a tool's clothes, and this audience can tell.
// The email buys the PDF brief, not the answer.

const FIELDS: { key: keyof Omit<Positioning, "price">; label: string; hint: string; placeholder: string }[] = [
  { key: "who", label: "Who do you help?", hint: "Specific enough to picture. A category cannot be phoned.", placeholder: "e.g. finance managers at mid-size firms who have to present to a board" },
  { key: "from", label: "Where are they now?", hint: "In their words, not yours.", placeholder: "e.g. rewriting the same report every quarter and still being questioned on it" },
  { key: "to", label: "Where do they end up?", hint: "Something they can DO, not something they feel.", placeholder: "e.g. presenting numbers the board signs off first time" },
  { key: "timeframe", label: "How long does it take?", hint: "A real span. Vague is unsellable.", placeholder: "e.g. six weeks" },
  { key: "output", label: "What do they walk away holding?", hint: "A thing, not a subject.", placeholder: "e.g. a board-ready reporting pack and the template behind it" },
];

function PositioningTool() {
  const [p, setP] = useState<Positioning>(EMPTY_POSITIONING);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const results = useMemo(() => runTests(p), [p]);
  const passed = useMemo(() => score(results), [results]);
  const v = useMemo(() => verdictFor(passed), [passed]);
  const sentence = useMemo(() => assembleSentence(p), [p]);
  const defending = useMemo(() => defendingLine(p), [p]);

  const filled = FIELDS.filter((f) => p[f.key].trim().length > 1).length;
  const canSend = filled >= 4 && /\S+@\S+\.\S+/.test(email);

  const send = async () => {
    setSending(true); setErr(null);
    try {
      const res = await fetch("/api/public/positioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, email: email.trim(), name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong.");
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#3B3A35]">
      {/* hero */}
      <header className="border-b border-[#E2E0D6]">
        <div className="mx-auto max-w-3xl px-5 pt-16 pb-10">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#8A6B12]">Free · no signup to see your result</p>
          <h1 className="mt-4 font-display text-[2.1rem] sm:text-[3rem] font-black leading-[1.03] tracking-tight text-[#1C1C1C]">
            One sentence decides<br />what you can charge.
          </h1>
          <p className="mt-5 text-[1.05rem] text-[#605E56] max-w-xl leading-relaxed">
            Everything downstream inherits it — your bio, your emails, your price, the way people
            describe you when you are not in the room. Five tests, answered as you type.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 space-y-5">
        {/* inputs */}
        <div className="rounded-xl border border-[#C8C5B6] bg-white p-5 sm:p-6 shadow-sm">
          {FIELDS.map((f) => (
            <label key={f.key} className="block mb-5 last:mb-0">
              <span className="block text-sm font-bold text-[#1C1C1C]">{f.label}</span>
              <span className="block text-xs text-[#8C8A80] mt-0.5">{f.hint}</span>
              <input
                value={p[f.key]}
                onChange={(e) => setP({ ...p, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="mt-2 w-full rounded-lg border border-[#E2E0D6] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[#D4A82F] placeholder:text-[#B5B2A6]"
              />
            </label>
          ))}
          <label className="block">
            <span className="block text-sm font-bold text-[#1C1C1C]">What does it cost? (R)</span>
            <span className="block text-xs text-[#8C8A80] mt-0.5">Optional — but a position without a price is a hobby.</span>
            <input
              type="number" min={0} inputMode="numeric"
              value={p.price ?? ""}
              onChange={(e) => setP({ ...p, price: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
              className="mt-2 w-full rounded-lg border border-[#E2E0D6] bg-transparent px-3 py-2.5 text-sm tabular-nums outline-none focus:border-[#D4A82F]"
            />
          </label>
        </div>

        {/* live sentence */}
        {filled >= 2 && (
          <div className="rounded-xl bg-[#1C1C1C] p-6">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#D4A82F]">Your sentence</p>
            <p className="mt-2 text-white text-[1.15rem] font-bold leading-snug">{sentence}</p>
          </div>
        )}

        {/* live tests */}
        {filled >= 2 && (
          <div className="rounded-xl border border-[#C8C5B6] bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#8A6B12]">The five tests</p>
              <span className="font-display text-2xl font-black text-[#1C1C1C] tabular-nums">{passed}<span className="text-[#8C8A80] text-base">/5</span></span>
            </div>
            <h2 className="mt-2 font-display text-xl font-black text-[#1C1C1C] leading-snug">{v.headline}</h2>
            <p className="mt-1.5 text-sm text-[#605E56]">{v.body}</p>

            <ul className="mt-5 space-y-4">
              {results.map((r) => (
                <li key={r.id} className="flex gap-3">
                  <span className={`mt-0.5 shrink-0 ${r.passed ? "text-[#2A6B4C]" : "text-[#B4650F]"}`}>
                    {r.passed ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[#1C1C1C]">
                      {r.name} <span className="font-normal text-[#8C8A80]">— {r.question}</span>
                    </span>
                    <span className="block text-sm text-[#605E56] mt-0.5">{r.note}</span>
                    {r.fix && <span className="block text-sm text-[#B4650F] mt-1">→ {r.fix}</span>}
                  </span>
                </li>
              ))}
            </ul>

            {defending && (
              <div className="mt-6 border-l-[3px] border-[#D4A82F] pl-4">
                <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#8A6B12]">When they ask why it costs that</p>
                <p className="mt-1.5 text-[#1C1C1C] font-bold leading-snug">{defending}</p>
              </div>
            )}
          </div>
        )}

        {/* delivery */}
        <div className="rounded-xl border-2 border-[#D4A82F] bg-[#FBF4E2] p-5 sm:p-6">
          {sent ? (
            <div className="text-center py-4">
              <Mail className="size-8 text-[#8A6B12] mx-auto" />
              <h2 className="mt-3 font-display text-xl font-black text-[#1C1C1C]">On its way.</h2>
              <p className="mt-2 text-sm text-[#605E56] max-w-md mx-auto">
                Check your inbox in a minute or two. If it is not there, look in Promotions — and
                drag it to your main inbox so the next one lands properly.
              </p>
              <p className="mt-4 text-sm text-[#605E56]">
                Now do the only part that counts: <strong className="text-[#1C1C1C]">put the sentence in your bio today.</strong>
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-black text-[#1C1C1C]">Want it as a one-page brief?</h2>
              <p className="mt-1.5 text-sm text-[#605E56]">
                A PDF with your sentence, all five verdicts, the line that defends your price, and
                the five places the sentence goes. You have already seen your result above — this is
                the version you can keep and print.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 mt-4">
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="First name"
                  className="rounded-lg border border-[#D4A82F]/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#D4A82F]"
                />
                <input
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  type="email" inputMode="email" placeholder="you@work.com"
                  className="rounded-lg border border-[#D4A82F]/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#D4A82F]"
                />
              </div>
              {err && <p className="mt-3 text-sm text-[#A83226]">{err}</p>}
              <button
                onClick={send}
                disabled={!canSend || sending}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1C1C1C] px-6 py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-[#333] transition-colors"
              >
                {sending ? <><Loader2 className="size-4 animate-spin" /> Sending</> : <>Send me the brief <ArrowRight className="size-4" /></>}
              </button>
              {filled < 4 && (
                <p className="mt-3 text-xs text-[#8C8A80]">
                  Fill in at least four answers first — a brief built on blanks is not worth your inbox.
                </p>
              )}
              <p className="mt-3 text-xs text-[#8C8A80]">
                One email with the brief. A weekly one after that, which you can stop at any time.
              </p>
            </>
          )}
        </div>

        <footer className="pt-6 pb-4 text-center">
          <p className="text-xs text-[#8C8A80]">
            Contentpreneur Africa · Turn what you know into income you own.
          </p>
        </footer>
      </main>
    </div>
  );
}
