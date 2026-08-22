import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WorkspaceShell, BLUE, BLUE_DARK, INK, BODY, MUTED, LINE, TINT } from "@/components/workspace-shell";
import { ToolHeader, ToolFooter } from "@/components/tool-frame";
import { useKitAccess } from "@/lib/use-kit-access";
import { readOffer } from "@/lib/offer-spine";
import {
  EMPTY_ENTRY, score, summarise, permissionMessage, nextId, type ProofEntry,
} from "@/lib/proof-ledger";
import { Lock, Copy, ArrowRight, Plus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

// THE PROOF LEDGER.
//
// The Charge Gate asks for "one result you can quote". This audience has
// produced dozens and recorded none, because nobody records a favour. Two
// students won scholarships and nobody wrote it down.
//
// So this runs before the gate: list what you already achieved, then send the
// message that makes it quotable. Asking for permission is the actual blocker —
// it feels like begging and it is not. Most people are glad to be asked.
//
// ⚠️ PRIVACY. Entries never leave the member's own synced storage, and the tool
// asks for a ROLE rather than a name — a half-written client list under real
// names is not a thing that should exist in somebody's browser.
export const Route = createFileRoute("/_authenticated/apps/proof-ledger")({
  head: () => ({ meta: [{ title: "The Proof Ledger — Contentpreneur Africa" }] }),
  component: ProofLedger,
});

const KEY = "nochill-proof-ledger-v1";

function ProofLedger() {
  const { access } = useKitAccess();
  const [entries, setEntries] = useState<ProofEntry[]>([]);
  const [methodName, setMethodName] = useState("");

  useEffect(() => {
    setMethodName(readOffer().name ?? "");
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (Array.isArray(r)) setEntries(r);
    } catch { /* first run */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { /* private mode */ }
  }, [entries]);

  const scored = entries.map(score);
  const sum = summarise(entries);

  function add() {
    setEntries((p) => [...p, { ...EMPTY_ENTRY, id: nextId(p) }]);
  }
  function patch(id: string, k: keyof ProofEntry, v: string) {
    setEntries((p) => p.map((e) => (e.id === id ? { ...e, [k]: v } : e)));
  }

  if (!access) {
    return (
      <WorkspaceShell>
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <Lock className="size-10 mx-auto" style={{ color: MUTED }} />
          <h1 className="mt-5 text-[30px] font-black" style={{ color: INK }}>
            The Proof Ledger is part of the Foundation Kit.
          </h1>
          <a href="/foundation" className="mt-6 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
             style={{ background: BLUE, color: "#fff", textDecoration: "none" }}>
            Get the Kit <ArrowRight className="size-4" />
          </a>
        </main>
      </WorkspaceShell>
    );
  }

  const input = {
    border: `1px solid ${LINE}`, borderRadius: 12, padding: "11px 13px",
    fontSize: 16, width: "100%", color: INK, background: "#fff",
  } as const;

  const TONE: Record<string, string> = { quotable: "#16A34A", usable: BLUE, thin: MUTED };

  return (
    <WorkspaceShell>
      <main className="mx-auto max-w-3xl px-5 py-9">
        <ToolHeader
          slug="proof-ledger"
          why="You have produced results for years and recorded none of them, because nobody records a favour. The Charge Gate needs one result you are allowed to quote — this is where you go and get it."
        />

        <section className="rounded-2xl p-5" style={{ background: TINT, border: `1px solid ${LINE}` }}>
          <p className="inline-flex items-center gap-2 text-[15px] font-bold" style={{ color: INK }}>
            <ShieldCheck className="size-4" style={{ color: BLUE }} /> This stays on your device
          </p>
          <p className="mt-1.5 text-[16px] leading-relaxed" style={{ color: BODY }}>
            Nothing here is sent anywhere. Use a role rather than a name — “a masters student”, “a
            finance team” — because a list of real people's names is not something to leave lying
            around in a browser.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-[26px] font-black leading-tight" style={{ color: INK }}>
            Who have you already helped?
          </h2>
          <p className="mt-2 text-[17px] leading-relaxed" style={{ color: BODY }}>
            Start with the last five people who came to you for nothing. Not the impressive ones — the
            ordinary ones. That is where the quotable results usually are.
          </p>
        </section>

        <div className="mt-6 space-y-4">
          {scored.map((e) => (
            <div key={e.id} className="rounded-2xl p-5" style={{ border: `1px solid ${LINE}` }}>
              <div className="flex items-start justify-between gap-3">
                <span
                  className="rounded-full px-3 py-1 text-[12px] font-black uppercase tracking-wide"
                  style={{ background: `${TONE[e.strength]}18`, color: TONE[e.strength] }}
                >
                  {e.strength}
                </span>
                <button
                  type="button"
                  onClick={() => setEntries((p) => p.filter((x) => x.id !== e.id))}
                  aria-label="Remove this entry"
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <input style={input} value={e.role} onChange={(ev) => patch(e.id, "role", ev.target.value)}
                       placeholder="Their role — a masters student, a finance team" />
                <input style={input} value={e.before} onChange={(ev) => patch(e.id, "before", ev.target.value)}
                       placeholder="They came to me… (where they were before)" />
                <input style={input} value={e.after} onChange={(ev) => patch(e.id, "after", ev.target.value)}
                       placeholder="What changed — the more countable, the stronger" />
                <select
                  style={{ ...input, appearance: "auto" }}
                  value={e.permission}
                  onChange={(ev) => patch(e.id, "permission", ev.target.value)}
                >
                  <option value="not-asked">I have not asked if I can mention it</option>
                  <option value="asked">I have asked, waiting to hear</option>
                  <option value="granted">They said yes</option>
                  <option value="declined">They said no</option>
                </select>
              </div>

              <p className="mt-3 text-[15px]" style={{ color: BODY }}>{e.note}</p>

              {e.quote && (
                <div className="mt-4 rounded-xl p-4" style={{ background: TINT }}>
                  <p className="text-[14px] font-semibold" style={{ color: MUTED }}>How it reads</p>
                  <p className="mt-1.5 text-[17px] leading-relaxed" style={{ color: INK }}>{e.quote}</p>
                </div>
              )}

              {e.permission === "not-asked" && e.after.trim().length > 4 && (
                <div className="mt-4 rounded-xl p-4" style={{ border: `1px solid ${LINE}` }}>
                  <p className="text-[15px] font-bold" style={{ color: INK }}>The message to send</p>
                  <p className="mt-1.5 text-[15px]" style={{ color: BODY }}>
                    Asking feels like begging. It is not — you are offering somebody the chance to say
                    their story helped. Most people are glad to be asked.
                  </p>
                  <pre className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed"
                       style={{ color: BODY, fontFamily: "inherit" }}>
                    {permissionMessage(e, methodName)}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(permissionMessage(e, methodName));
                      toast.success("Copied — send it today, not later");
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[15px] font-bold"
                    style={{ border: `1px solid ${LINE}`, color: INK, background: "#fff", cursor: "pointer" }}
                  >
                    <Copy className="size-4" /> Copy the message
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={add}
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[16px] font-bold"
          style={{ background: BLUE, color: "#fff", border: "none", cursor: "pointer" }}
          onMouseOver={(e) => (e.currentTarget.style.background = BLUE_DARK)}
          onMouseOut={(e) => (e.currentTarget.style.background = BLUE)}
        >
          <Plus className="size-4" /> {entries.length === 0 ? "Add the first one" : "Add another"}
        </button>

        <section className="mt-9 rounded-2xl p-6" style={{ background: TINT, border: `1px solid ${LINE}` }}>
          <p className="text-[15px] font-semibold" style={{ color: BLUE }}>Where you stand</p>
          <h2 className="mt-1.5 text-[24px] font-black leading-tight" style={{ color: INK }}>{sum.headline}</h2>
          <p className="mt-3 text-[16px]" style={{ color: BODY }}>
            {sum.total} recorded · {sum.quotable} you can quote · {sum.usable} that need permission
          </p>
          {sum.meetsChargeGate && (
            <a href="/apps/price-decision"
               className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[16px] font-bold"
               style={{ background: BLUE, color: "#fff", textDecoration: "none" }}>
              Take it to the Charge Gate <ArrowRight className="size-4" />
            </a>
          )}
        </section>

        <ToolFooter
          slug="proof-ledger"
          youNowHave="your past results written down, and the message that makes them quotable."
        />
      </main>
    </WorkspaceShell>
  );
}
