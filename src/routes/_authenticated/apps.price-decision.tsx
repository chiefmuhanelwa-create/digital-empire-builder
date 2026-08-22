import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { WorkspaceShell, BLUE, INK, BODY, MUTED, LINE, TINT } from "@/components/workspace-shell";
import { ToolHeader, ToolFooter } from "@/components/tool-frame";
import { useKitAccess } from "@/lib/use-kit-access";
import { getLeakAudit } from "@/lib/leak.functions";
import { hourlyRate, type Basis } from "@/lib/leak-engine";
import { readOffer, writeOffer, EMPTY_OFFER, type Offer } from "@/lib/offer-spine";
import {
  EMPTY_SIGNALS, EMPTY_INPUTS, conditions, gate, floors, recommend,
  foundingOffer, raiseTrigger, transitionScript,
  type Signals, type PriceInputs,
} from "@/lib/pricing-engine";
import { Lock, Check, X, Copy, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/price-decision")({
  head: () => ({ meta: [{ title: "The Charge Gate — Contentpreneur Africa" }] }),
  component: PriceDecision,
});

const KEY = "nochill-price-decision-v1";

function PriceDecision() {
  const { access } = useKitAccess();
  const getLeak = useServerFn(getLeakAudit);

  const [sig, setSig] = useState<Signals>(EMPTY_SIGNALS);
  const [inp, setInp] = useState<PriceInputs>(EMPTY_INPUTS);
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [rateFromLeak, setRateFromLeak] = useState(false);

  useEffect(() => {
    setOffer(readOffer());
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r?.sig) { setSig({ ...EMPTY_SIGNALS, ...r.sig }); setInp({ ...EMPTY_INPUTS, ...r.inp }); }
    } catch { /* ignore */ }
  }, []);

  // The rate comes from The Leak rather than being asked for twice. That tool
  // already derives it from their package the way their own industry prices
  // them — re-asking here would produce a second, worse answer.
  useEffect(() => {
    getLeak()
      .then((r) => {
        const basis = (r as { basis?: Basis | null })?.basis;
        if (!basis) return;
        const rate = hourlyRate(basis);
        if (rate) {
          setRateFromLeak(true);
          setInp((prev) => (prev.hourlyRate ? prev : { ...prev, hourlyRate: Math.round(rate) }));
        }
      })
      .catch(() => { /* they have not run The Leak yet */ });
  }, [getLeak]);

  const save = useCallback((nextSig: Signals, nextInp: PriceInputs) => {
    setSig(nextSig); setInp(nextInp);
    try { localStorage.setItem(KEY, JSON.stringify({ sig: nextSig, inp: nextInp })); } catch { /* ignore */ }
  }, []);

  const conds = useMemo(() => conditions(sig), [sig]);
  const verdict = useMemo(() => gate(sig), [sig]);
  const fl = useMemo(() => floors(inp), [inp]);
  const rec = useMemo(() => recommend(inp), [inp]);
  const founding = useMemo(() => (rec ? foundingOffer(rec.amount) : null), [rec]);

  const finalPrice = verdict.band === "founding" && founding ? founding.price : rec?.amount ?? null;

  const copy = (t: string) =>
    navigator.clipboard.writeText(t).then(() => toast.success("Copied"), () => toast.error("Could not copy"));

  const lockIn = () => {
    if (!finalPrice) return;
    writeOffer({ ...readOffer(), price: finalPrice });
    setOffer(readOffer());
    toast.success("Price saved to your offer");
  };

  if (!access) {
    return (
      <WorkspaceShell>
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <Lock className="size-10 mx-auto" style={{ color: MUTED }} />
          <h1 className="mt-5 text-[30px] font-black" style={{ color: INK }}>The Charge Gate is part of the Foundation Kit.</h1>
          <a href="/foundation" className="mt-6 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
             style={{ background: BLUE, color: "#fff", textDecoration: "none" }}>Get the Kit <ArrowRight className="size-4" /></a>
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <main className="mx-auto max-w-3xl px-5 py-9">
        <ToolHeader
          slug="price-decision"
          why="Two different questions, and answering them in the wrong order is why most people stay free. First: am I allowed to charge at all? That is a readiness question with a checkable answer. Only then: what is the number?"
        />

        {/* ── PART ONE: may I charge */}
        <section>
          <p className="text-[15px] font-semibold" style={{ color: BLUE }}>Part one</p>
          <h2 className="mt-1 text-[26px] font-black leading-tight" style={{ color: INK }}>
            When do I start charging?
          </h2>
          <p className="mt-2 text-[17px] leading-relaxed" style={{ color: BODY }}>
            Four conditions. Not feelings — things that either happened or did not.
          </p>

          <div className="mt-5 space-y-3">
            <Toggle
              on={sig.askedTwice}
              onClick={() => save({ ...sig, askedTwice: !sig.askedTwice }, inp)}
              label="More than one person has asked me for this"
              why={conds[0].why}
            />
            <Toggle
              on={sig.deliveredOnce}
              onClick={() => save({ ...sig, deliveredOnce: !sig.deliveredOnce }, inp)}
              label="I have delivered it at least once, and it worked"
              why={conds[1].why}
            />
            {sig.deliveredOnce && (
              <Field
                label="What was the result? Name it."
                hint="One sentence you would be comfortable repeating to a stranger. A number if you have one."
                value={sig.namedResult}
                onChange={(v) => save({ ...sig, namedResult: v }, inp)}
                placeholder="e.g. two of the people I helped won the scholarship they applied for"
              />
            )}
            <Field
              label="What actually changes hands?"
              hint="A thing they keep, not a subject you know about."
              value={sig.output}
              onChange={(v) => save({ ...sig, output: v }, inp)}
              placeholder="e.g. a finished application, reviewed line by line, and the template behind it"
            />
            <Field
              label="What does it cost them NOT to have this?"
              hint="This is your price justification — and the sentence you will need when someone hesitates."
              value={sig.costOfInaction}
              onChange={(v) => save({ ...sig, costOfInaction: v }, inp)}
              placeholder="e.g. another year of fees they have to find themselves"
            />
          </div>

          <div className="mt-6 rounded-2xl p-6" style={{ background: TINT, border: `1px solid ${LINE}` }}>
            <p className="text-[15px] font-semibold" style={{ color: BLUE }}>{verdict.score} of 4</p>
            <h3 className="mt-1.5 text-[24px] font-black leading-tight" style={{ color: INK }}>{verdict.headline}</h3>
            <p className="mt-3 text-[17px] leading-relaxed" style={{ color: BODY }}>{verdict.body}</p>
            <p className="mt-4 text-[16px]" style={{ color: BODY }}>
              <strong style={{ color: INK }}>Do this:</strong> {verdict.action}
            </p>
          </div>
        </section>

        {/* ── PART TWO: the number */}
        <section className="mt-12">
          <p className="text-[15px] font-semibold" style={{ color: BLUE }}>Part two</p>
          <h2 className="mt-1 text-[26px] font-black leading-tight" style={{ color: INK }}>What is the number?</h2>
          <p className="mt-2 text-[17px] leading-relaxed" style={{ color: BODY }}>
            Three floors. The recommendation is the highest of them, never the average — a floor is a
            floor, and averaging lets your weakest input drag the price down.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Num label="Hours to deliver once" hint="Including preparation." value={inp.hours}
                 onChange={(v) => save(sig, { ...inp, hours: v })} />
            <Num label="Your hourly rate (R)" hint={rateFromLeak ? "Pulled from your Leak audit." : "Run The Leak and this fills itself."}
                 value={inp.hourlyRate} onChange={(v) => save(sig, { ...inp, hourlyRate: v })} highlight={rateFromLeak} />
            <Num label="Worth to them per year (R)" hint="Your honest estimate." value={inp.outcomeValue}
                 onChange={(v) => save(sig, { ...inp, outcomeValue: v })} />
          </div>

          <div className="mt-5 space-y-2.5">
            {fl.map((f) => (
              <div key={f.id} className="rounded-xl p-4" style={{ border: `1px solid ${LINE}` }}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span className="text-[16px] font-bold" style={{ color: INK }}>{f.name}</span>
                  {f.missing ? (
                    <span className="text-[15px]" style={{ color: MUTED }}>—</span>
                  ) : (
                    <span className="text-[17px] font-black tabular-nums" style={{ color: INK }}>
                      R{Math.round(f.amount).toLocaleString("en-ZA")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[15px] leading-relaxed" style={{ color: f.missing ? MUTED : BODY }}>
                  {f.missing ?? f.how}
                </p>
              </div>
            ))}
          </div>

          {rec && (
            <div className="mt-6 rounded-2xl p-6" style={{ background: INK }}>
              <p className="text-[15px] font-semibold" style={{ color: "#8FB0F5" }}>
                Your price — set by {rec.from.toLowerCase()}
              </p>
              <p className="mt-2 font-black tabular-nums leading-none" style={{ color: "#fff", fontSize: "clamp(2.4rem,7vw,3.6rem)" }}>
                R{rec.amount.toLocaleString("en-ZA")}
              </p>
              <p className="mt-3 text-[16px] leading-relaxed" style={{ color: "#C7CEDA" }}>{rec.note}</p>
              {rec.mirror && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,.14)" }}>
                  <p className="text-[16px] font-bold" style={{ color: "#fff" }}>{rec.mirror.headline}</p>
                  <p className="mt-1 text-[15px] leading-relaxed" style={{ color: "#C7CEDA" }}>{rec.mirror.body}</p>
                </div>
              )}
            </div>
          )}

          {rec && founding && verdict.band === "founding" && (
            <div className="mt-4 rounded-2xl p-5" style={{ background: TINT, border: `1px solid ${LINE}` }}>
              <p className="text-[15px] font-semibold" style={{ color: BLUE }}>Your founding price</p>
              <p className="mt-1 text-[24px] font-black tabular-nums" style={{ color: INK }}>
                R{founding.price.toLocaleString("en-ZA")}
              </p>
              <p className="mt-3 text-[16px] leading-relaxed" style={{ color: BODY }}>{founding.sentence}</p>
              <button onClick={() => copy(founding.sentence)}
                      className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold" style={{ color: BLUE }}>
                <Copy className="size-4" /> Copy this
              </button>
              <p className="mt-3 text-[15px]" style={{ color: MUTED }}>
                A founding price only works if it visibly ends. Without the end condition it is just a
                low price you will struggle to raise.
              </p>
            </div>
          )}

          {rec && (
            <>
              <div className="mt-4 rounded-xl p-5" style={{ border: `1px solid ${LINE}` }}>
                <p className="text-[15px] font-semibold" style={{ color: INK }}>When to raise it</p>
                <p className="mt-1.5 text-[16px] leading-relaxed" style={{ color: BODY }}>{raiseTrigger(finalPrice ?? rec.amount)}</p>
              </div>

              <div className="mt-4 rounded-xl p-5" style={{ border: `1px solid ${LINE}` }}>
                <p className="text-[15px] font-semibold" style={{ color: INK }}>
                  Telling someone who has always had it free
                </p>
                <p className="mt-2 whitespace-pre-line text-[16px] leading-relaxed" style={{ color: BODY }}>
                  {transitionScript(offer.name, finalPrice ?? rec.amount)}
                </p>
                <button onClick={() => copy(transitionScript(offer.name, finalPrice ?? rec.amount))}
                        className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold" style={{ color: BLUE }}>
                  <Copy className="size-4" /> Copy this
                </button>
              </div>

              <button onClick={lockIn}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
                      style={{ background: BLUE, color: "#fff" }}>
                <Check className="size-4" /> Save R{(finalPrice ?? rec.amount).toLocaleString("en-ZA")} to my offer
              </button>
              {offer.price ? (
                <p className="mt-2 text-[15px]" style={{ color: MUTED }}>
                  Your offer currently says R{offer.price.toLocaleString("en-ZA")}.
                </p>
              ) : null}
            </>
          )}
        </section>

        <ToolFooter
          slug="price-decision"
          youNowHave="a price you can defend, the sentence that ends a founding rate, and the words for telling someone who has always had it free."
        />
      </main>
    </WorkspaceShell>
  );
}

function Toggle({ on, onClick, label, why }: { on: boolean; onClick: () => void; label: string; why: string }) {
  return (
    <button onClick={onClick} className="w-full text-left flex items-start gap-3.5 rounded-xl p-4"
            style={{ border: `1px solid ${on ? BLUE : LINE}`, background: on ? TINT : "#fff" }}>
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md mt-0.5"
            style={{ background: on ? BLUE : "#fff", border: `1px solid ${on ? BLUE : LINE}` }}>
        {on ? <Check className="size-4" style={{ color: "#fff" }} /> : <X className="size-3.5" style={{ color: MUTED }} />}
      </span>
      <span>
        <span className="block text-[16px] font-bold" style={{ color: INK }}>{label}</span>
        <span className="block text-[15px] mt-1 leading-relaxed" style={{ color: BODY }}>{why}</span>
      </span>
    </button>
  );
}

function Field({ label, hint, value, onChange, placeholder }: {
  label: string; hint: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <label className="block rounded-xl p-4" style={{ border: `1px solid ${LINE}` }}>
      <span className="block text-[16px] font-bold" style={{ color: INK }}>{label}</span>
      <span className="block text-[15px] mt-0.5" style={{ color: MUTED }}>{hint}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
             className="mt-2.5 w-full rounded-lg px-3 py-2.5 text-[16px] outline-none"
             style={{ border: `1px solid ${LINE}`, background: "transparent", color: INK }} />
    </label>
  );
}

function Num({ label, hint, value, onChange, highlight }: {
  label: string; hint: string; value: number | null; onChange: (v: number | null) => void; highlight?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[15px] font-bold" style={{ color: INK }}>{label}</span>
      <span className="block text-[14px]" style={{ color: highlight ? BLUE : MUTED }}>{hint}</span>
      <input type="number" min={0} inputMode="numeric" value={value ?? ""}
             onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
             className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-[17px] font-bold tabular-nums outline-none"
             style={{ border: `1px solid ${highlight ? BLUE : LINE}`, background: "transparent", color: INK }} />
    </label>
  );
}
