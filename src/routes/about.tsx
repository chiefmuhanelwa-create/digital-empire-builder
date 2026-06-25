import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Christ Kingdom Platform" },
      { name: "description", content: "CHKPLT is the owned platform, curriculum, and business infrastructure for Called Experts — professionals, teachers, healthcare workers, and specialists ready to monetise what they know." },
      { property: "og:title", content: "About CHKPLT — The knowledge economy rewards the brave." },
      { property: "og:description", content: "Built by someone who went from sleeping in university bathrooms to building a knowledge empire. The system is real. The receipts exist." },
    ],
  }),
  component: About,
});

const PILLARS = [
  {
    t: "Asset Ownership",
    d: "Migrating your attention equity off volatile social media algorithms onto secure databases and owned list infrastructure.",
  },
  {
    t: "Product Engineering — The DARES Model",
    d: "Transitioning you away from trading time for money into building products that are Digital, Automated, Recurring, Evergreen, and Scalable.",
  },
  {
    t: "Revenue Security — The PAIDS Engine",
    d: "Balancing your income across 5 distinct streams (Products, Ads/Affiliates, Information, Deals, Services) so that no single platform controls more than 40% of your business.",
  },
  {
    t: "Stewardship, Not Hustle",
    d: "Proverbs 13:22 says the wealth of the sinner is laid up for the just. Your expertise is not just a skill — it is a stewardship. CHKPLT treats it accordingly.",
  },
];

function About() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A] overflow-x-hidden">
      <SiteHeader />

      {/* HERO */}
      <section className="mx-auto max-w-3xl px-5 sm:px-6 pt-20 sm:pt-24 pb-12">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">About CHKPLT</div>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05]">
          The knowledge economy{" "}
          <em className="text-banana not-italic">rewards the brave.</em>
        </h1>
        <p className="mt-8 text-lg text-[#555] leading-relaxed">
          CHKPLT is the owned platform, curriculum, and business infrastructure for Called Experts — professionals, teachers, healthcare workers, faith leaders, and specialists ready to monetise what they know through social media, content, and digital technology.
        </p>
      </section>

      {/* WHAT IS A CALLED EXPERT */}
      <section className="border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-14 sm:py-20">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">Who is a Called Expert?</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
            You were not just trained.{" "}
            <em className="text-banana not-italic">You were called.</em>
          </h2>
          <div className="mt-8 bg-white border border-[#F59E0B]/30 px-6 sm:px-8 py-6 space-y-4">
            <p className="text-base sm:text-lg text-[#555] leading-relaxed">
              A <strong className="text-[#0F172A]">Called Expert</strong> is a professional, teacher, specialist, or healthcare worker who was not just trained in their field — they were{" "}
              <em className="text-banana not-italic font-semibold">called</em> to it. Their knowledge is not just a skill. It is a stewardship.
            </p>
            <p className="text-base sm:text-lg text-[#555] leading-relaxed">
              Proverbs 13:22 says <em>"the wealth of the sinner is laid up for the just."</em> That includes the wealth of knowledge. If you have been sitting on expertise that could change lives — and you haven't deployed it — this is the platform that changes that.
            </p>
            <p className="text-base sm:text-lg text-[#555] leading-relaxed">
              You don't need to quit your job first. You don't need a massive audience. You need a system. And that's exactly what CHKPLT delivers.
            </p>
          </div>
          <blockquote className="mt-8 border-l-4 border-[#F59E0B] pl-5 italic text-[#555] text-base sm:text-lg leading-relaxed">
            "Unless the LORD builds the house, the builders labor in vain." — Psalm 127:1
          </blockquote>
        </div>
      </section>

      {/* ORIGIN STORY + FOUNDER PHOTO */}
      <section className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-14 sm:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">Where this came from</div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl tracking-tight">
              Built from the{" "}
              <em className="text-banana not-italic">receipts, not the theory.</em>
            </h2>
            <div className="mt-6 space-y-4 text-[#555] leading-relaxed">
              <p>
                Someone started with a phone, a social media account, and no strategy — and built it into income across digital platforms, brand campaigns, affiliate income, and online products.
              </p>
              <p>
                They also watched 780,000 Instagram followers disappear overnight. Watched annual income disabled in a single email. Watched one algorithm change take a record month to almost nothing in 60 days.
              </p>
              <p>
                Every time a platform took back what felt like progress, the lesson was the same:{" "}
                <strong className="text-[#0F172A]">social media is a distribution channel, not a destination.</strong> Use it to build your audience. Then move them onto what you own.
              </p>
              <p>CHKPLT is that lesson turned into a system.</p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <img
              src="/founder.jpg"
              alt="Ndivhuwo Muhanelwa — NoChill — speaking at Meta"
              className="w-full object-cover border border-[#E2E8F0]"
              style={{ maxHeight: "440px", objectFit: "cover", objectPosition: "top" }}
            />
          </div>
        </div>
      </section>

      {/* PHOTO STRIP */}
      <section className="border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { src: "/IMG_5125.JPG", alt: "NoChill speaking at workshop" },
              { src: "/founder-award.jpg", alt: "NoChill — Humanz Top 20 Award 2026" },
              { src: "/IMG_4060.JPG", alt: "Book signing — The Influencer's Code" },
            ].map((img, i) => (
              <div key={i} className="aspect-[4/3] overflow-hidden border border-[#E2E8F0] bg-[#f0ebe0]">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE SOLVE */}
      <section className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-14 sm:py-20">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">What we solve</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight max-w-3xl">
            Eliminating the operational{" "}
            <em className="text-banana not-italic">"zeros"</em> capping your growth.
          </h2>
          <p className="mt-5 max-w-3xl text-[#555] leading-relaxed">
            Everything deployed inside CHKPLT came from doing it wrong first, then right.
          </p>
          <div className="mt-10 grid gap-5 sm:gap-6 md:grid-cols-2">
            {PILLARS.map((p) => (
              <div key={p.t} className="border border-[#E2E8F0] bg-white p-6 sm:p-8 flex flex-col">
                <h3 className="font-display text-xl sm:text-2xl leading-tight text-[#0F172A]">{p.t}</h3>
                <p className="mt-3 text-sm sm:text-base text-[#555] leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER BIO */}
      <section className="border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-14 sm:py-20">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">The founder</div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl tracking-tight">
            The receipts are real.
          </h2>
          <div className="mt-8 bg-white border border-[#E2E8F0] p-6 sm:p-8">
            <p className="text-base sm:text-lg text-[#555] leading-relaxed">
              Ndivhuwo Muhanelwa — "NoChill" — went from sleeping in university bathrooms in Pretoria to building a knowledge business that crossed six figures in a single year. Over 50 brand campaigns. 23 agencies. A published book. A SAMA31 judge seat. A Meta speaker slot. Not as a tech founder — as a content creator from Tshikwarani, Limpopo who learned the system the hard way and wrote it down so you wouldn't have to.
            </p>
            <blockquote className="mt-6 border-l-4 border-[#F59E0B] pl-4 italic text-[#555] text-sm sm:text-base leading-relaxed">
              "I didn't just hustle — I obeyed the calling. And now I'm handing you the map."
            </blockquote>
            <div className="mt-6 pt-5 border-t border-[#E2E8F0] font-mono text-xs tracking-[0.12em] uppercase text-[#5a5a5a] space-y-1">
              <div>Ndivhuwo Muhanelwa — "NoChill"</div>
              <div>Founder · NOCHILL PTY LTD · CHKPLT</div>
              <div>SAMA31 Judge · Meta Speaker · Author</div>
              <div>Tshikwarani, Venda, Limpopo → the world</div>
            </div>
          </div>
        </div>
      </section>

      {/* SEAL */}
      <section className="border-t border-[#E2E8F0] bg-[#0F172A]">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-12 sm:py-16 text-center">
          <div className="font-display text-3xl sm:text-4xl tracking-tight text-banana">CHKPLT</div>
          <div className="mt-3 font-mono text-[10px] tracking-[0.25em] uppercase text-[#666]">
            Christ Kingdom Platform · Built for Called Experts · Grounded in Faith · Anchored in Africa
          </div>
          <p className="mt-4 text-[#555] text-sm max-w-lg mx-auto">
            "Be fruitful. That means produce." — Genesis 1:28 applied to your expertise.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
