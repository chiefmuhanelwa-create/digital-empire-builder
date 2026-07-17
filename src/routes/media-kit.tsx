import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FileText, Printer, Instagram, Sparkles } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/media-kit")({
  head: () => ({
    meta: [
      { title: "Free Media Kit Builder — a brand-ready one-pager in minutes | CHKPLT" },
      {
        name: "description",
        content:
          "Turn your stats into a professional media kit brands take seriously. Fill the form, watch it build live, save it as a PDF. Free.",
      },
      { property: "og:title", content: "Free Media Kit Builder — CHKPLT" },
    ],
  }),
  component: MediaKitPage,
});

interface Platform { name: string; followers: string; er: string; }
interface Pillar { name: string; desc: string; }
interface Rate { name: string; price: string; }

interface Kit {
  name: string; handle: string; tagline: string; bio: string; location: string; niches: string;
  platforms: Platform[];
  targetAudience: string; ageBracket: string; genderSplit: string;
  pillars: Pillar[];
  rates: Rate[];
  stats: string; brands: string; email: string; booking: string;
}

const INITIAL: Kit = {
  name: "", handle: "", tagline: "", bio: "", location: "", niches: "",
  platforms: [
    { name: "Instagram", followers: "", er: "" },
    { name: "TikTok", followers: "", er: "" },
    { name: "YouTube", followers: "", er: "" },
  ],
  targetAudience: "", ageBracket: "25–34", genderSplit: "",
  pillars: [
    { name: "", desc: "" },
    { name: "", desc: "" },
    { name: "", desc: "" },
  ],
  rates: [
    { name: "Single Reel / Short Video", price: "" },
    { name: "Story Package (3–5 stories)", price: "" },
    { name: "Monthly Retainer", price: "" },
  ],
  stats: "", brands: "", email: "", booking: "",
};

const LABEL = "font-display text-[#0F172A] text-xs font-bold uppercase tracking-wide block mb-1.5";
const FLD = "h-10 border-[#d0c8bc] focus:border-[#F59E0B] focus:ring-0";
const TA =
  "w-full min-h-[72px] border border-[#d0c8bc] bg-white rounded-md px-3 py-2 text-sm text-[#0F172A] focus:border-[#F59E0B] focus:outline-none focus:ring-0 resize-y";

function MediaKitPage() {
  const [k, setK] = useState<Kit>(INITIAL);
  const set = <K extends keyof Kit>(key: K, v: Kit[K]) => setK((s) => ({ ...s, [key]: v }));
  const setArr = <T extends Platform | Pillar | Rate>(
    key: "platforms" | "pillars" | "rates",
    i: number,
    field: keyof T,
    v: string,
  ) =>
    setK((s) => ({
      ...s,
      [key]: (s[key] as T[]).map((row, idx) => (idx === i ? { ...row, [field]: v } : row)),
    }));

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pt-24 pb-20">
        <div className="text-center mb-8 print:hidden">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] uppercase text-banana mb-3">
            <FileText className="size-3.5" /> Free Media Kit Builder
          </div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase leading-[1.05]">
            Make brands take you <strong>seriously.</strong>
          </h1>
          <p className="text-[#555] mt-3 max-w-md mx-auto">
            Fill it in on the left, watch your professional one-pager build on the right. Then save it as a PDF and attach it to every pitch.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* FORM */}
          <div className="space-y-6 print:hidden">
            <Section title="The basics">
              <Two>
                <div><label className={LABEL}>Name</label><Input className={FLD} value={k.name} onChange={(e) => set("name", e.target.value)} placeholder="Ndivhuwo Muhanelwa" /></div>
                <div><label className={LABEL}>@handle</label><Input className={FLD} value={k.handle} onChange={(e) => set("handle", e.target.value)} placeholder="@nochill_god" /></div>
              </Two>
              <div><label className={LABEL}>Tagline</label><Input className={FLD} value={k.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Helping professionals turn their expertise into income" /></div>
              <div><label className={LABEL}>Bio</label><textarea className={TA} value={k.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Tell brands who you are, who you serve, and why your audience trusts you." /></div>
              <Two>
                <div><label className={LABEL}>Location</label><Input className={FLD} value={k.location} onChange={(e) => set("location", e.target.value)} placeholder="Johannesburg, SA" /></div>
                <div><label className={LABEL}>Niches (comma-separated)</label><Input className={FLD} value={k.niches} onChange={(e) => set("niches", e.target.value)} placeholder="Finance, Business, Faith" /></div>
              </Two>
            </Section>

            <Section title="Platforms & reach">
              {k.platforms.map((p, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1fr] gap-2">
                  <Input className={FLD} value={p.name} onChange={(e) => setArr<Platform>("platforms", i, "name", e.target.value)} placeholder="Platform" />
                  <Input className={FLD} value={p.followers} onChange={(e) => setArr<Platform>("platforms", i, "followers", e.target.value)} placeholder="Followers" />
                  <Input className={FLD} value={p.er} onChange={(e) => setArr<Platform>("platforms", i, "er", e.target.value)} placeholder="ER %" />
                </div>
              ))}
            </Section>

            <Section title="Audience">
              <div><label className={LABEL}>Who they are</label><Input className={FLD} value={k.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} placeholder="SA professionals aged 25–45 building a side income" /></div>
              <Two>
                <div>
                  <label className={LABEL}>Core age bracket</label>
                  <select className={FLD + " w-full rounded-md border bg-white px-3 appearance-none"} value={k.ageBracket} onChange={(e) => set("ageBracket", e.target.value)}>
                    {["13–17", "18–24", "25–34", "35–44", "45–54", "55+"].map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div><label className={LABEL}>Gender split</label><Input className={FLD} value={k.genderSplit} onChange={(e) => set("genderSplit", e.target.value)} placeholder="62% F · 38% M" /></div>
              </Two>
            </Section>

            <Section title="Content pillars">
              {k.pillars.map((p, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-2">
                  <Input className={FLD} value={p.name} onChange={(e) => setArr<Pillar>("pillars", i, "name", e.target.value)} placeholder={`Pillar ${i + 1}`} />
                  <Input className={FLD} value={p.desc} onChange={(e) => setArr<Pillar>("pillars", i, "desc", e.target.value)} placeholder="What you cover" />
                </div>
              ))}
            </Section>

            <Section title="Rate card">
              {k.rates.map((r, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-2">
                  <Input className={FLD} value={r.name} onChange={(e) => setArr<Rate>("rates", i, "name", e.target.value)} placeholder="Package" />
                  <Input className={FLD} value={r.price} onChange={(e) => setArr<Rate>("rates", i, "price", e.target.value)} placeholder="R 4,500" />
                </div>
              ))}
              <p className="text-[#777] text-xs">Tip: not sure what to charge? <Link to="/rate-card" className="text-banana underline">Use the Rate Card Calculator</Link> first.</p>
            </Section>

            <Section title="Proof & contact">
              <div><label className={LABEL}>Key stats / proof</label><textarea className={TA} value={k.stats} onChange={(e) => set("stats", e.target.value)} placeholder={"• 8% engagement — 2.4× SA average\n• 3 years finance content\n• 60K+ active community"} /></div>
              <div><label className={LABEL}>Past brand collabs (comma-separated)</label><Input className={FLD} value={k.brands} onChange={(e) => set("brands", e.target.value)} placeholder="Capitec, SA Tourism, Playa Bets" /></div>
              <Two>
                <div><label className={LABEL}>Email</label><Input className={FLD} value={k.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" /></div>
                <div><label className={LABEL}>Booking link</label><Input className={FLD} value={k.booking} onChange={(e) => set("booking", e.target.value)} placeholder="calendly.com/you" /></div>
              </Two>
            </Section>

            <Button
              type="button"
              onClick={() => window.print()}
              className="w-full bg-[#F59E0B] hover:bg-[#b8963e] text-[#111] font-display font-black uppercase tracking-wide text-sm py-3 h-auto"
            >
              <Printer className="size-4 mr-2" /> Save as PDF
            </Button>
          </div>

          {/* LIVE PREVIEW (the deliverable) */}
          <div className="lg:sticky lg:top-24">
            <KitPreview k={k} />
          </div>
        </div>

        {/* Bridge CTA */}
        <div className="mt-10 text-center border border-[#e8e0d4] rounded-2xl p-6 bg-white print:hidden">
          <h3 className="font-display text-xl uppercase">A kit gets the meeting. A system closes the deal.</h3>
          <p className="text-[#555] text-sm mt-2 max-w-md mx-auto">
            The Foundation Kit hands you the pitch email, the negotiation scripts, and the path from one brand reply to a recurring retainer.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link to="/products/$slug" params={{ slug: "called-expert-foundation-kit" }} className="cta-glow inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-display font-black uppercase tracking-wide">
              Get the Foundation Kit <ArrowRight className="size-4" />
            </Link>
            <Link to="/rate-card" className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-mono uppercase tracking-[0.15em] border border-[#F59E0B] text-[#0F172A] hover:bg-[#F59E0B] hover:text-[#111] transition-colors">
              Price your rate
            </Link>
          </div>
        </div>
      </main>
      <div className="print:hidden"><SiteFooter /></div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#e8e0d4] rounded-2xl bg-white p-5 space-y-3 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.18)]">
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-banana">{title}</div>
      {children}
    </div>
  );
}
function Two({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function KitPreview({ k }: { k: Kit }) {
  const niches = k.niches.split(",").map((s) => s.trim()).filter(Boolean);
  const brands = k.brands.split(",").map((s) => s.trim()).filter(Boolean);
  const platforms = k.platforms.filter((p) => p.name.trim() && p.followers.trim());
  const pillars = k.pillars.filter((p) => p.name.trim());
  const rates = k.rates.filter((r) => r.name.trim());
  const statLines = k.stats.split("\n").map((s) => s.replace(/^[•\-\s]+/, "").trim()).filter(Boolean);

  return (
    <div className="border border-[#e8e0d4] rounded-2xl overflow-hidden bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] print:shadow-none print:border-0 print:rounded-none">
      {/* Header */}
      <div className="bg-[#0F172A] text-[#f1e7c3] p-7">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#B45309]">Media Kit</div>
        <h2 className="font-display text-3xl mt-1 text-white">{k.name || "Your Name"}</h2>
        <div className="flex items-center gap-2 text-[#B45309] mt-1 text-sm">
          <Instagram className="size-3.5" /> {k.handle || "@handle"}
          {k.location && <span className="text-[#9a906f]">· {k.location}</span>}
        </div>
        {k.tagline && <p className="mt-3 text-[#cdc3a8] text-sm max-w-md">{k.tagline}</p>}
        {niches.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {niches.map((n) => (
              <span key={n} className="font-mono text-[10px] uppercase tracking-wide bg-[#F59E0B] text-[#111] rounded px-2 py-0.5">{n}</span>
            ))}
          </div>
        )}
      </div>

      <div className="p-7 space-y-6">
        {k.bio && <p className="text-[#2A2A2A] text-sm leading-relaxed">{k.bio}</p>}

        {platforms.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {platforms.map((p) => (
              <div key={p.name} className="border border-[#e8e0d4] rounded-xl p-3 text-center bg-[#FBFAF8]">
                <div className="font-display text-2xl text-banana">{p.followers}</div>
                <div className="font-mono text-[9px] uppercase tracking-wide text-[#777] mt-0.5">{p.name}</div>
                {p.er && <div className="text-[11px] text-[#555] mt-1">{p.er}% ER</div>}
              </div>
            ))}
          </div>
        )}

        {(k.targetAudience || k.genderSplit) && (
          <Block label="Audience">
            {k.targetAudience && <p className="text-[#2A2A2A] text-sm">{k.targetAudience}</p>}
            <p className="text-[#555] text-xs mt-1">Core: {k.ageBracket}{k.genderSplit ? ` · ${k.genderSplit}` : ""}</p>
          </Block>
        )}

        {pillars.length > 0 && (
          <Block label="Content pillars">
            <ul className="space-y-1.5">
              {pillars.map((p) => (
                <li key={p.name} className="text-sm">
                  <span className="font-display font-bold text-[#0F172A]">{p.name}</span>
                  {p.desc && <span className="text-[#555]"> — {p.desc}</span>}
                </li>
              ))}
            </ul>
          </Block>
        )}

        {statLines.length > 0 && (
          <Block label="Why brands work with me">
            <ul className="space-y-1">
              {statLines.map((s, i) => (
                <li key={i} className="text-sm text-[#2A2A2A] flex gap-2"><span className="text-banana">✦</span>{s}</li>
              ))}
            </ul>
          </Block>
        )}

        {rates.length > 0 && (
          <Block label="Rate card">
            <div className="divide-y divide-[#f0ebe1]">
              {rates.map((r) => (
                <div key={r.name} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-[#2A2A2A]">{r.name}</span>
                  <span className="font-mono font-bold text-[#0F172A]">{r.price || "—"}</span>
                </div>
              ))}
            </div>
          </Block>
        )}

        {brands.length > 0 && (
          <Block label="Trusted by">
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <span key={b} className="text-sm border border-[#e8e0d4] rounded px-2.5 py-1 text-[#2A2A2A]">{b}</span>
              ))}
            </div>
          </Block>
        )}
      </div>

      {(k.email || k.booking) && (
        <div className="bg-[#FBF7EC] border-t border-[#F59E0B]/30 p-5 flex flex-wrap items-center justify-between gap-2">
          <div className="font-display font-bold text-sm uppercase">Let's work together</div>
          <div className="text-sm text-[#0F172A]">
            {k.email}{k.email && k.booking ? " · " : ""}{k.booking}
          </div>
        </div>
      )}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#777] mb-1.5">{label}</div>
      {children}
    </div>
  );
}
