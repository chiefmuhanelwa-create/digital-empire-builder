import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import {
  MAGNET_SHAPES, shapeByKey, EMPTY_MAGNET, EMPTY_OFFER,
  readMagnet, writeMagnet, readOffer, optInLine, isOfferComplete,
  type Magnet, type MagnetShape, type Offer,
} from "@/lib/offer-spine";
import { Lock, ArrowRight, Copy, Printer, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apps/lead-magnet")({
  head: () => ({ meta: [{ title: "River, Fish, Tank — Contentpreneur Africa" }] }),
  component: LeadMagnet,
});

// TOOL 04 · THE LEAD MAGNET BUILDER — and the home of River → Fish → Tank.
//
// The framework is sold on the Starter Kit page (worksheet six) and inside
// Accelerator Phase 4, and until this tool it was taught nowhere: mentioned
// twice, demonstrated never. A framework a buyer meets in your marketing and
// then cannot find in the product they bought reads as a bait-and-switch even
// when nothing was intended.
//
// So this tool does not open with "let's make a freebie". It opens with the
// model, then makes the point that the magnet IS the net — the only mechanism
// that moves a fish out of a river you do not own and into a tank you do.

function LeadMagnet() {
  const { access } = useKitAccess();
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [magnet, setMagnet] = useState<Magnet>(EMPTY_MAGNET);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOffer(readOffer());
    setMagnet(readMagnet());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) writeMagnet(magnet);
  }, [magnet, loaded]);

  const spec = shapeByKey(magnet.shape);
  const ready = isOfferComplete(offer);
  const optIn = optInLine(offer, magnet);

  // ADJACENCY CHECK — the thing this tool was missing.
  //
  // It was a shape picker: choose a format, get a title. But the format is not
  // what decides whether a magnet works. What decides it is whether the magnet
  // solves a problem ADJACENT to the paid offer.
  //
  // A magnet that solves an unrelated problem attracts the wrong people, and a
  // list of the wrong people is worse than no list — it costs money to hold,
  // it makes every open rate look like a failure, and it convinces the owner
  // that email does not work for them.
  //
  // The check is lexical overlap between the magnet's own words and the offer's
  // "from" (the problem being solved) and "who". Crude on purpose: it is a
  // prompt to think, not a verdict, and it says so.
  const adjacency = useMemo(() => {
    const title = magnet.title.trim();
    if (!title || !offer.from.trim()) return null;

    const STOP = new Set(["the","a","an","and","or","to","of","for","in","on","with","your","you","their","they","how","what","why","when","that","this","is","are","it","from","at","by","get","one","five","ten"]);
    const tok = (t: string) => new Set(
      t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
        .filter((w) => w.length > 2 && !STOP.has(w)),
    );

    const m = tok(`${title} ${magnet.points.join(" ")}`);
    const problem = tok(offer.from);
    const who = tok(offer.who);

    const hitsProblem = [...problem].filter((w) => m.has(w));
    const hitsWho = [...who].filter((w) => m.has(w));

    if (hitsProblem.length === 0 && hitsWho.length === 0) {
      return {
        ok: false,
        title: "This magnet may be attracting the wrong people.",
        body: `Nothing in it shares language with the problem your offer solves — “${offer.from.trim()}”. A magnet that solves an unrelated problem still gets downloads; the people it collects just never buy, and a list of the wrong people is worse than no list at all.`,
        fix: "Rewrite it so it solves the FIRST step of the same problem your paid offer finishes. Same road, earlier on it.",
      };
    }
    if (hitsProblem.length === 0) {
      return {
        ok: false,
        title: "Right audience, wrong problem.",
        body: "It speaks to the people you help, but not to the thing you actually fix. They will join for one reason and be sold on another, which is where trust goes.",
        fix: `Point it at “${offer.from.trim()}” — the state your paid offer moves them out of.`,
      };
    }
    return {
      ok: true,
      title: "This sits on the road to your offer.",
      body: `It shares ground with the problem you charge to solve, so the people it collects are the people your offer is for. That is the whole test — the format matters far less than this does.`,
      fix: null,
    };
  }, [magnet.title, magnet.points, offer.from, offer.who]);

  const choose = (k: MagnetShape) => {
    const s = shapeByKey(k)!;
    setMagnet({ shape: k, title: s.titleFor(offer), points: s.outline(offer) });
  };

  const copy = (text: string, what: string) =>
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${what} copied`),
      () => toast.error("Could not copy"),
    );

  if (!access) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
          <div className="nx-card !p-10 text-center">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">River, Fish, Tank is part of the Foundation Kit.</h2>
            <p className="nx-body max-w-md mx-auto mt-2">
              Build the one thing that moves people off a platform you rent and onto a list you own.
            </p>
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
          <p className="nx-label mt-4">Tool 04 · River, Fish, Tank</p>
          <h1 className="mt-2">Build the net.</h1>
          <p className="nx-body max-w-xl mt-3">
            What do you give away to start owning an audience instead of renting one?
          </p>
        </div>
      </section>

      {/* The framework, in full, before anything is asked. */}
      <section className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 grid gap-5 sm:grid-cols-3">
          {[
            ["The river", "Social media. Huge, always moving, not yours. You are only fishing in it."],
            ["The fish", "Your followers. They swim past. You own none of them."],
            ["The tank", "Your email list or WhatsApp community — the only place you can reach people without permission."],
          ].map(([t, b]) => (
            <div key={t}>
              <div className="font-display text-lg text-[var(--nx-gold-text)]">{t}</div>
              <p className="text-sm text-[var(--text-dim)] mt-1 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-3xl px-4 sm:px-6 pb-8 text-[15px]">
          <strong>Your job is not to collect fish. It is to move fish out of the river into your
          tank.</strong>{" "}
          The magnet below is the net. Without one, every follower you earn stays in the river — and
          the day the platform changes its mind, they go with it.
        </p>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
        {!ready && (
          <div className="nx-card !p-5">
            <p className="nx-body">
              Your offer is not finished yet, so the outlines below will be generic. Ten minutes in
              the Offer Blueprint and everything here fills in with your own buyer and words.
            </p>
            <Link to="/apps/offer-blueprint" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
              Finish the Offer Blueprint <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        <div>
          <h2 className="text-xl">Pick the shape</h2>
          <p className="nx-body mt-1">
            All four work. They are not interchangeable — each one is right for a different reason,
            and picking on taste rather than on the reason is why most magnets go unread.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {MAGNET_SHAPES.map((s) => (
              <button
                key={s.key}
                onClick={() => choose(s.key)}
                className={`text-left rounded-xl border p-5 transition-colors ${
                  magnet.shape === s.key
                    ? "border-[var(--nx-gold)] bg-[var(--bg-card-hi)]"
                    : "border-[var(--border)] bg-white hover:border-[var(--nx-gold)]"
                }`}
              >
                <div className="font-display text-lg">{s.label}</div>
                <p className="text-sm text-[var(--text-dim)] mt-1">
                  <strong className="text-[var(--text-body)]">Right when:</strong> {s.whenRight}
                </p>
                <p className="text-xs text-[var(--text-subtle)] mt-2">{s.why}</p>
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--text-dim)]">
            Whichever you pick, keep it to one page. A one-page checklist out-converts a forty-page
            ebook because people believe they will finish it — and a magnet nobody finishes never
            earns the open on the email after it.
          </p>
        </div>

        {spec && (
          <>
            <div className="nx-card !p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="nx-label">What it is called</p>
                  <input
                    value={magnet.title}
                    onChange={(e) => setMagnet((m) => ({ ...m, title: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-[var(--border-mid)] bg-white p-3 font-display text-lg focus:border-[var(--nx-gold)] focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setMagnet((m) => ({ ...m, title: spec.titleFor(offer) }))}
                  title="Regenerate from your offer"
                  className="shrink-0 mt-7 text-[var(--text-dim)] hover:text-foreground"
                >
                  <Wand2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="nx-card !p-6">
              <p className="nx-label">The five points of the page</p>
              <h3 className="text-xl mt-1">Written from your own offer.</h3>
              <ol className="mt-4 space-y-3">
                {magnet.points.map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-xs text-[var(--nx-gold-text)] mt-1 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <textarea
                      value={p}
                      onChange={(e) =>
                        setMagnet((m) => {
                          const pts = [...m.points];
                          pts[i] = e.target.value;
                          return { ...m, points: pts };
                        })
                      }
                      rows={2}
                      className="flex-1 rounded-lg border border-[var(--border-mid)] bg-white p-2.5 text-sm focus:border-[var(--nx-gold)] focus:outline-none"
                    />
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => copy(`${magnet.title}\n\n${magnet.points.map((p, i) => `${i + 1}. ${p}`).join("\n")}`, "Outline")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)] hover:text-foreground"
                >
                  <Copy className="size-4" /> Copy the outline
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)] hover:text-foreground"
                >
                  <Printer className="size-4" /> Print
                </button>
              </div>
            </div>

            {adjacency && (
              <div className={`rounded-2xl border-2 p-5 mb-4 ${adjacency.ok ? "border-[#2A6B4C] bg-[#2A6B4C]/5" : "border-[#EA580C] bg-[#EA580C]/5"}`}>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${adjacency.ok ? "text-[#1F5B41]" : "text-[#9A3412]"}`}>
                  The only test that matters
                </p>
                <h3 className={`font-display text-lg mt-1 ${adjacency.ok ? "text-[#1F5B41]" : "text-[#9A3412]"}`}>
                  {adjacency.title}
                </h3>
                <p className={`text-sm mt-2 leading-relaxed ${adjacency.ok ? "text-[#24614A]" : "text-[#7C2D12]"}`}>
                  {adjacency.body}
                </p>
                {adjacency.fix && (
                  <p className="text-sm text-[#7C2D12] mt-2 leading-relaxed"><strong>Fix:</strong> {adjacency.fix}</p>
                )}
                <p className={`text-xs mt-3 ${adjacency.ok ? "text-[#1F5B41]/75" : "text-[#9A3412]/75"}`}>
                  Checked by comparing your magnet's words against the problem in your offer. Crude
                  on purpose &mdash; it is a prompt to think, not a verdict.
                </p>
              </div>
            )}

            {optIn && (
              <div className="nx-card !p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="nx-label">The sentence that asks for the email</p>
                    <p className="text-[15px] mt-1 text-[var(--text-body)]">{optIn}</p>
                    <p className="text-xs text-[var(--text-subtle)] mt-2">
                      This is the whole tank. Everything upstream is wasted if nobody is asked.
                    </p>
                  </div>
                  <button onClick={() => copy(optIn, "Opt-in line")} className="shrink-0 text-[var(--text-dim)] hover:text-foreground">
                    <Copy className="size-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-[var(--obsidian)] p-6 sm:p-8 text-center">
              <h2 className="text-white text-2xl">The net exists. Now write what follows it.</h2>
              <p className="text-[#C8C2B4] text-sm mt-2 max-w-lg mx-auto">
                Email one delivers this magnet. The four after it are what turn a name in a tank into
                someone who buys.
              </p>
              <Link
                to="/apps/first-five-emails"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--nx-gold)] px-6 py-3 text-sm font-bold text-[#111111] hover:bg-[var(--nx-gold-deep)] transition-colors"
              >
                The First Five Emails <ArrowRight className="size-4" />
              </Link>
            </div>
          </>
        )}
      </main>
    </Shell>
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
