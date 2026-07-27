import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ContentpreneurHeader, ContentpreneurFooter } from "@/components/contentpreneur-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimStarterKit } from "@/lib/starterkit.functions";
import { toast } from "sonner";

// The free Knowledge Entrepreneur Starter Kit — moved here from the separate
// contentpreneur-africa-site (Next.js) so it lives entirely on CHKPLT's proven
// checkout/lead-capture stack, reachable at contentpreneur.africa/starterkit.
// Content ported verbatim from that site's app/start/page.tsx.
const MODULES: [string, string][] = [
  ["The Knowledge Audit", "Identify your monetizable knowledge"],
  ["The Knowledge Entrepreneur Scorecard", "Where you actually stand, across 5 axes"],
  ["The Positioning Blueprint", "Who you help, what you help with, why they should listen"],
  ["Your First Content Engine", "Know what to talk about"],
  ["The River → Fish → Tank Framework", "Stop building only on rented platforms"],
  ["Your First Offer", "Create your first paid asset"],
  ["The PAIDS Map", "Your future income roadmap, in 5 streams"],
];

export const Route = createFileRoute("/starterkit")({
  head: () => ({
    meta: [
      { title: "Free Knowledge Entrepreneur Starter Kit" },
      {
        name: "description",
        content:
          "7 short worksheets to take you from having valuable knowledge with no plan, to a clear next step. Free, no login required.",
      },
    ],
  }),
  component: StarterKitPage,
});

function StarterKitPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ContentpreneurHeader />

      <section className="mx-auto max-w-2xl px-6 pt-20 pb-16 text-center">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          Free · No Login Required
        </div>
        <h1 className="mt-6 font-display text-4xl sm:text-5xl leading-[1.05]">
          The Knowledge Entrepreneur Starter Kit
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          7 short worksheets to take you from "I have valuable knowledge but no idea what to do with it" to
          a clear next step. Most people finish it in one sitting.
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
            This kit stops at clarity. The{" "}
            <a href="/foundation" className="text-banana underline">Foundation Kit</a> and{" "}
            <a href="/accelerator" className="text-banana underline">Accelerator</a> take you the rest of the way.
          </p>
        </div>
      </section>

      <ContentpreneurFooter />
    </div>
  );
}

function ClaimForm() {
  const claimFn = useServerFn(claimStarterKit);
  const [email, setEmail] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: claimFn,
    onSuccess: (res: { ok: true; downloadUrl: string }) => setDownloadUrl(res.downloadUrl),
    onError: (e: Error) => toast.error(e.message ?? "Something went wrong — try again"),
  });

  if (downloadUrl) {
    return (
      <div className="border border-border bg-background p-6 text-center">
        <p className="font-display text-lg font-bold text-banana">You're in.</p>
        <p className="mt-2 text-sm text-muted-foreground">Your kit is ready — open it below.</p>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center rounded-md bg-banana px-6 py-3 font-display text-sm text-banana-foreground hover:bg-banana/90"
        >
          Open Your Starter Kit →
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
      />
      <Button
        disabled={!email || mut.isPending}
        onClick={() => mut.mutate({ data: { email } })}
        className="whitespace-nowrap bg-banana text-banana-foreground hover:bg-banana/90"
      >
        {mut.isPending ? "Sending…" : "Get The Free Kit"}
      </Button>
    </div>
  );
}
