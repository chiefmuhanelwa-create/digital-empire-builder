import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { getInnerCircleStatus } from "@/lib/inner-circle.functions";
import { Users, Check, ArrowRight, CalendarClock, MessagesSquare, Vault } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/inner-circle")({
  head: () => ({ meta: [{ title: "Inner Circle — CHKPLT" }] }),
  component: InnerCircle,
});

// OWNER: set these once your community + monthly call exist. Empty = button hidden
// (we don't show links that don't work). Members see "details emailed" until set.
const COMMUNITY_URL = "";          // e.g. WhatsApp/Circle invite link
const CALL_INFO = "Live group coaching — first Tuesday of each month, 19:00 SAST";
const CALL_URL = "";               // e.g. Zoom/Meet link

const BENEFITS = [
  { Icon: MessagesSquare, t: "Private community", s: "Ask, share wins, get unstuck with other Contentpreneurs." },
  { Icon: CalendarClock, t: "Monthly group coaching", s: CALL_INFO },
  { Icon: Vault, t: "The monthly drop", s: "A new template, teardown or playbook every month." },
];

function InnerCircle() {
  const fn = useServerFn(getInnerCircleStatus);
  const q = useQuery({ queryKey: ["inner-circle-status"], queryFn: () => fn() });
  const active = q.data?.active === true;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-8">
          <Link to="/dashboard" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">← Dashboard</Link>
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]"><Users className="h-5 w-5" /></span>
            <p className="nx-label">The Inner Circle · $39/mo</p>
          </div>
          <h1 className="mt-3">{active ? "You're in the room." : "Clarity got you started. Momentum keeps you going."}</h1>
          <p className="nx-body max-w-2xl mt-3">
            {active
              ? "Your monthly coaching + community + the new drop. Show up, stay accountable, keep building."
              : "The kit gives you the plan. The Inner Circle keeps you executing it — monthly coaching, a community that holds you to it, and a fresh playbook every month."}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-3 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.t} className="nx-card !p-5">
              <b.Icon className="size-6 text-[var(--nx-gold-deep)]" />
              <div className="font-display text-base mt-2">{b.t}</div>
              <p className="text-sm text-[var(--text-dim)] mt-1">{b.s}</p>
            </div>
          ))}
        </div>

        {q.isLoading ? (
          <div className="mt-8 text-center text-muted-foreground">Checking your membership…</div>
        ) : active ? (
          <div className="rounded-2xl bg-[#0F172A] p-6 sm:p-8 text-white mt-8">
            <div className="flex items-center gap-2"><Check className="size-5 text-[#4ADE80]" /><span className="nx-label !text-[var(--nx-gold-bright)]">Active member</span></div>
            <h2 className="text-white text-2xl mt-2">Your room</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {COMMUNITY_URL ? (
                <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="cta-glow inline-flex items-center gap-2">Open the community <ArrowRight className="size-4" /></a>
              ) : (
                <span className="text-sm text-slate-300">Your community invite is emailed to members — check your inbox.</span>
              )}
              {CALL_URL && <a href={CALL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-white/25 px-5 py-3 text-sm font-semibold hover:border-white/60">Join the next call</a>}
            </div>
            <p className="text-xs text-slate-400 mt-4">{CALL_INFO}</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0F172A] p-6 sm:p-8 text-center text-white mt-8">
            <div className="font-display text-4xl">$39<span className="text-slate-400 text-xl">/mo</span></div>
            <p className="text-slate-300 mt-2 mb-5 max-w-md mx-auto">Cancel anytime. The recurring room that turns a one-afternoon plan into a real business.</p>
            <a href="/products/called-expert-inner-circle" className="cta-glow inline-block">Join the Inner Circle</a>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
