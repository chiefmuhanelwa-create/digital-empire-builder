import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Download } from "lucide-react";
import { ContentpreneurHeader, ContentpreneurFooter } from "@/components/contentpreneur-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimFreeProduct } from "@/lib/products.functions";
import { getUtm } from "@/lib/utm";
import { trackLead } from "@/lib/track";
import { toast } from "sonner";

// Dedicated, branded landing page for the "Creator Starter Bundle" free lead
// magnet — same product already live at /products/creator-starter-bundle
// (generic product template), same server function (claimFreeProduct), same
// MailerLite group (MAILERLITE_GROUP_ID_BUYERS). This page exists so the
// Facebook/ManyChat funnel has somewhere on-brand to send people that
// actually captures their email, instead of delivering the bundle natively
// inside Messenger where no lead ever reaches MailerLite.
const PRODUCT_SLUG = "creator-starter-bundle";

const MODULES: [string, string][] = [
  [
    "The Niche Clarity Workbook",
    "A 7-step, 90-minute guided workbook to a documented niche and content pillars",
  ],
  ["The PAIDS Framework Workbook", "The complete 5-income-stream implementation guide"],
];

export const Route = createFileRoute("/creator-bundle")({
  head: () => ({
    meta: [
      { title: "Free Creator Starter Bundle — Niche Clarity + PAIDS Map" },
      {
        name: "description",
        content:
          "Two free guided PDFs — the Niche Clarity Workbook and the PAIDS Framework Workbook. Free, no login required.",
      },
    ],
  }),
  component: CreatorBundlePage,
});

function CreatorBundlePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ContentpreneurHeader />

      <section className="mx-auto max-w-2xl px-6 pt-20 pb-16 text-center">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          Free · No Login Required
        </div>
        <h1 className="mt-6 font-display text-4xl sm:text-5xl leading-[1.05]">
          You're posting. You're consistent. Nothing's converting.
        </h1>
        <p className="mt-4 font-display text-sm font-bold uppercase tracking-wide text-banana">
          The Creator Starter Bundle
        </p>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          You're missing two things: clarity on your niche, and a real monetisation system. This
          free bundle gives you both — two guided PDFs built specifically for South African
          creators. No card, no catch.
        </p>
        <div className="mt-10">
          <ClaimForm />
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="text-center font-display text-3xl">What's Inside</h2>
          <div className="mt-8 divide-y divide-border border border-border bg-background">
            {MODULES.map(([title, desc], i) => (
              <div key={title} className="flex items-start gap-4 p-5">
                <span className="font-display text-sm font-black text-banana">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-display text-sm font-bold">{title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Both PDFs, instant access, mobile-friendly. Free — no card required.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-border bg-card/30 p-6 text-center">
          <h3 className="font-display text-xl uppercase">This bundle stops at clarity</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            You'll walk away with a documented niche and a 5-stream income plan. The Foundation Kit
            hands you the system to actually build and price your first offer — the Accelerator
            installs the whole seven-stage system with you, faster.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/foundation"
              className="inline-flex items-center gap-2 rounded-md bg-banana px-6 py-3 font-display text-sm font-black uppercase tracking-wide text-banana-foreground hover:bg-banana/90"
            >
              Get the Foundation Kit <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/accelerator"
              className="inline-flex items-center gap-2 rounded-md border border-banana px-6 py-3 font-mono text-sm uppercase tracking-[0.15em] text-foreground hover:bg-banana hover:text-banana-foreground transition-colors"
            >
              Apply for the Accelerator
            </Link>
          </div>
        </div>
      </section>

      <ContentpreneurFooter />
    </div>
  );
}

function ClaimForm() {
  const claimFn = useServerFn(claimFreeProduct);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: claimFn,
    onSuccess: (res: { url: string }) => {
      setDownloadUrl(res.url);
      toast.success("It's yours — check your email too.");
    },
    onError: (e: Error) => toast.error(e.message ?? "Something went wrong — try again"),
  });

  if (downloadUrl) {
    return (
      <div className="border border-border bg-background p-6 text-center">
        <p className="font-display text-lg font-bold text-banana">You're in.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We've also emailed a copy — check your inbox (or spam).
        </p>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-banana px-6 py-3 font-display text-sm text-banana-foreground hover:bg-banana/90"
        >
          <Download className="size-4" />
          Open Your Bundle →
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </div>
      <Button
        disabled={!email || mut.isPending}
        onClick={() => {
          trackLead();
          mut.mutate({
            data: { productSlug: PRODUCT_SLUG, email, fullName: name || undefined, ...getUtm() },
          });
        }}
        className="whitespace-nowrap bg-banana text-banana-foreground hover:bg-banana/90"
      >
        {mut.isPending ? "Sending…" : "Get The Free Bundle"}
      </Button>
    </div>
  );
}
