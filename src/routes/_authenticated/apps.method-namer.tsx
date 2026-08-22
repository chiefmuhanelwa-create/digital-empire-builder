import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  WorkspaceShell,
  BLUE,
  BLUE_DARK,
  INK,
  BODY,
  MUTED,
  LINE,
  TINT,
} from "@/components/workspace-shell";
import { ToolHeader, ToolFooter } from "@/components/tool-frame";
import { useKitAccess } from "@/lib/use-kit-access";
import { readOffer, writeOffer, EMPTY_OFFER, type Offer } from "@/lib/offer-spine";
import {
  EMPTY_METHOD,
  nameCandidates,
  checks,
  isMethod,
  methodSentence,
  toOffer,
  favourVsProduct,
  type MethodInput,
} from "@/lib/method-engine";
import { Lock, Check, X, Copy, ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";

// THE METHOD NAMER.
//
// Built because a favour has no edges and therefore stays free. The argument
// this tool exists to win, in the founder's words:
//
//   A service you cannot name is a favour, and favours are free by definition.
//   A method with a name is a product, and products have prices.
//
// The worked example is real. An academic support advisor never gives a student
// a research topic — after they cite somebody she asks "so, what do YOU say?",
// and before a defence she says "be honest." Two students won scholarships on
// that. It was a method the whole time. It just had no name.
export const Route = createFileRoute("/_authenticated/apps/method-namer")({
  head: () => ({ meta: [{ title: "The Method Namer — Contentpreneur Africa" }] }),
  component: MethodNamer,
});

const KEY = "nochill-method-namer-v1";

function MethodNamer() {
  const { access } = useKitAccess();
  const [m, setM] = useState<MethodInput>(EMPTY_METHOD);
  const [chosen, setChosen] = useState("");
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);

  useEffect(() => {
    const o = readOffer();
    setOffer(o);
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r) {
        setM({
          ...EMPTY_METHOD,
          ...r.m,
          moves: r.m?.moves?.length ? r.m.moves : EMPTY_METHOD.moves,
        });
        setChosen(r.chosen ?? "");
      } else if (o.who) {
        // Carried from the Knowledge Audit so nobody types their buyer twice.
        setM((p) => ({ ...p, who: o.who }));
      }
    } catch {
      /* first run */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ m, chosen }));
    } catch {
      /* private mode */
    }
  }, [m, chosen]);

  const cs = checks(m);
  const ready = isMethod(m);
  const names = nameCandidates(m);

  function setMove(i: number, v: string) {
    setM((p) => ({ ...p, moves: p.moves.map((x, ix) => (ix === i ? v : x)) }));
  }

  function confirm() {
    // writeOffer REPLACES the stored object rather than merging, so the current
    // offer has to be read and spread first. Passing the patch alone would wipe
    // the price the Charge Gate wrote and the timeframe from the Blueprint.
    const patch = toOffer(m, chosen);
    const merged = { ...readOffer(), ...patch };
    writeOffer(merged);
    setOffer(merged);
    toast.success("Method saved. Every step after this now knows its name.");
  }

  if (!access) {
    return (
      <WorkspaceShell>
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <Lock className="size-10 mx-auto" style={{ color: MUTED }} />
          <h1 className="mt-5 text-[30px] font-black" style={{ color: INK }}>
            The Method Namer is part of the Foundation Kit.
          </h1>
          <a
            href="/foundation"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
            style={{ background: BLUE, color: "#fff", textDecoration: "none" }}
          >
            Get the Kit <ArrowRight className="size-4" />
          </a>
        </main>
      </WorkspaceShell>
    );
  }

  const label = { color: MUTED, fontSize: 15, fontWeight: 600 } as const;
  const input = {
    border: `1px solid ${LINE}`,
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 16,
    width: "100%",
    color: INK,
    background: "#fff",
  } as const;

  return (
    <WorkspaceShell>
      <main className="mx-auto max-w-3xl px-5 py-9">
        <ToolHeader
          slug="method-namer"
          why="You already have a method. You run it every time somebody comes to you, and you have never written it down — which is why it still reads as a favour. Favours are free by definition. Things with names have prices."
        />

        {/* The worked example, first, because "what is a method?" is the real
            blocker and an abstract definition does not answer it. */}
        <section
          className="rounded-2xl p-6"
          style={{ background: TINT, border: `1px solid ${LINE}` }}
        >
          <p className="text-[15px] font-semibold" style={{ color: BLUE }}>
            What this looks like
          </p>
          <p className="mt-2 text-[17px] leading-relaxed" style={{ color: BODY }}>
            An academic support advisor never gives a student a research topic. After they cite
            somebody, she asks <strong style={{ color: INK }}>“so, what do YOU say?”</strong> Before
            a defence, she says <strong style={{ color: INK }}>“be honest.”</strong> Two of her
            students won scholarships.
          </p>
          <p className="mt-3 text-[17px] leading-relaxed" style={{ color: BODY }}>
            That is a method. It had no name, so it stayed free for eleven years.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-[26px] font-black leading-tight" style={{ color: INK }}>
            Who do you do this for?
          </h2>
          <input
            style={{ ...input, marginTop: 10 }}
            value={m.who}
            onChange={(e) => setM({ ...m, who: e.target.value })}
            placeholder="Masters students writing their first real thesis"
          />
          <p className="mt-2 text-[15px]" style={{ color: MUTED }}>
            Not “anyone who needs help”. The person you have actually done this for.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-[26px] font-black leading-tight" style={{ color: INK }}>
            What do you do, every time, in order?
          </h2>
          <p className="mt-2 text-[17px] leading-relaxed" style={{ color: BODY }}>
            Think about the last three people. Not what you would ideally do — what you actually
            did, all three times.
          </p>
          <div className="mt-4 space-y-3">
            {m.moves.map((mv, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="mt-3 grid size-7 shrink-0 place-items-center rounded-lg text-[13px] font-black"
                  style={{ background: TINT, color: BLUE }}
                >
                  {i + 1}
                </span>
                <input
                  style={input}
                  value={mv}
                  onChange={(e) => setMove(i, e.target.value)}
                  placeholder={
                    i === 0
                      ? "I read what they have written before we speak"
                      : "The next thing you always do"
                  }
                />
              </div>
            ))}
          </div>
          {m.moves.length < 6 && (
            <button
              type="button"
              onClick={() => setM({ ...m, moves: [...m.moves, ""] })}
              className="mt-3 inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ color: BLUE, background: "none", border: "none", cursor: "pointer" }}
            >
              <Plus className="size-4" /> Add a step
            </button>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-[26px] font-black leading-tight" style={{ color: INK }}>
            Which move is yours?
          </h2>
          <p className="mt-2 text-[17px] leading-relaxed" style={{ color: BODY }}>
            The thing you always say or always check that others in your field do not. Hers was{" "}
            <em>“so, what do YOU say?”</em>
          </p>
          <input
            style={{ ...input, marginTop: 10 }}
            value={m.signature}
            onChange={(e) => setM({ ...m, signature: e.target.value })}
            placeholder="I make them argue against their own conclusion before I accept it"
          />
        </section>

        <section className="mt-8">
          <h2 className="text-[26px] font-black leading-tight" style={{ color: INK }}>
            What are they holding at the end?
          </h2>
          <input
            style={{ ...input, marginTop: 10 }}
            value={m.endsWith}
            onChange={(e) => setM({ ...m, endsWith: e.target.value })}
            placeholder="A defended argument they can stand behind in a viva"
          />
          <p className="mt-2 text-[15px]" style={{ color: MUTED }}>
            A document, a decision, a corrected draft. If they only leave feeling better, it cannot
            be priced.
          </p>
        </section>

        {/* Checks — the same shape as the Charge Gate, on purpose. */}
        <section className="mt-9">
          <h2 className="text-[22px] font-black" style={{ color: INK }}>
            Is it a method yet?
          </h2>
          <div className="mt-4 space-y-3">
            {cs.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ border: `1px solid ${LINE}` }}
              >
                {c.ok ? (
                  <Check className="mt-0.5 size-5 shrink-0" style={{ color: "#16A34A" }} />
                ) : (
                  <X className="mt-0.5 size-5 shrink-0" style={{ color: MUTED }} />
                )}
                <div>
                  <div className="text-[16px] font-bold" style={{ color: INK }}>
                    {c.label}
                  </div>
                  {!c.ok && (
                    <p className="mt-1 text-[15px] leading-relaxed" style={{ color: BODY }}>
                      {c.fix}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {ready && names.length > 0 && (
          <section
            className="mt-9 rounded-2xl p-6"
            style={{ background: TINT, border: `1px solid ${LINE}` }}
          >
            <h2 className="text-[26px] font-black leading-tight" style={{ color: INK }}>
              Give it a name
            </h2>
            <p className="mt-2 text-[17px] leading-relaxed" style={{ color: BODY }}>
              Three shapes, all built from your own words. Pick one or write your own — the point is
              that it has a name, not that the name is perfect.
            </p>
            <div className="mt-5 space-y-3">
              {names.map((n) => (
                <button
                  key={n.name}
                  type="button"
                  onClick={() => setChosen(n.name)}
                  className="w-full rounded-xl p-4 text-left"
                  style={{
                    background: "#fff",
                    border: `1px solid ${chosen === n.name ? BLUE : LINE}`,
                    cursor: "pointer",
                  }}
                >
                  <div className="text-[18px] font-black" style={{ color: INK }}>
                    {n.name}
                  </div>
                  <div className="mt-1 text-[15px]" style={{ color: BODY }}>
                    {n.why}
                  </div>
                </button>
              ))}
            </div>
            <input
              style={{ ...input, marginTop: 14 }}
              value={chosen}
              onChange={(e) => setChosen(e.target.value)}
              placeholder="Or type your own name for it"
            />

            {chosen.trim() && (
              <div
                className="mt-6 rounded-xl p-5"
                style={{ background: "#fff", border: `1px solid ${LINE}` }}
              >
                <p className="text-[15px] font-semibold" style={{ color: MUTED }}>
                  Say this out loud
                </p>
                <p className="mt-2 text-[19px] font-bold leading-relaxed" style={{ color: INK }}>
                  {methodSentence(m, chosen)}
                </p>
                <p className="mt-3 text-[16px] leading-relaxed" style={{ color: BODY }}>
                  {favourVsProduct(chosen)}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={confirm}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[16px] font-bold"
                    style={{ background: BLUE, color: "#fff", border: "none", cursor: "pointer" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = BLUE_DARK)}
                    onMouseOut={(e) => (e.currentTarget.style.background = BLUE)}
                  >
                    Use this name <ArrowRight className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(methodSentence(m, chosen));
                      toast.success("Copied");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[16px] font-bold"
                    style={{
                      border: `1px solid ${LINE}`,
                      color: INK,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <Copy className="size-4" /> Copy the sentence
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {offer.name && (
          <p className="mt-6 text-[15px]" style={{ color: MUTED }}>
            Saved as <strong style={{ color: INK }}>{offer.name}</strong>. The Charge Gate and The
            Send will use it.
          </p>
        )}

        <ToolFooter
          slug="method-namer"
          youNowHave="a named method instead of a favour — and every step after this inherits the name."
        />
      </main>
    </WorkspaceShell>
  );
}
