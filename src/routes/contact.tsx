import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — CHKPLT" },
      { name: "description", content: "Get in touch with the CHKPLT team." },
      { property: "og:title", content: "Contact CHKPLT" },
      { property: "og:description", content: "Get in touch with the CHKPLT team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Contact</div>
        <h1 className="mt-4 font-display text-5xl md:text-6xl">Talk to us.</h1>
        <div className="mt-10 grid gap-6 text-lg">
          <a href="mailto:hello@chkplt.com" className="block border-t border-border pt-4 hover:text-banana transition-colors">
            <span className="font-mono text-xs text-muted-foreground">EMAIL</span>
            <div className="font-display text-3xl mt-1">hello@chkplt.com</div>
          </a>
          <div className="border-t border-border pt-4">
            <span className="font-mono text-xs text-muted-foreground">SUPPORT</span>
            <div className="font-display text-3xl mt-1">support@chkplt.com</div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
