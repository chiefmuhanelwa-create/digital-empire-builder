import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { myPurchases, getMyDownloadUrl, getKitFileUrl } from "@/lib/products.functions";
import { TOOLS } from "@/lib/tools";
import { Download, Lock, ArrowRight, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/foundation-kit")({
  head: () => ({ meta: [{ title: "Foundation Kit Workspace — CHKPLT" }] }),
  component: FoundationKitWorkspace,
});

const KIT_SLUGS = ["called-expert-foundation-kit", "called-expert-starter-bundle"];

// The 7 frameworks the $97 kit promises. `app` = live interactive version;
// `pdf` = key in getKitFileUrl whitelist once the fillable PDF is uploaded.
const FRAMEWORKS: { name: string; blurb: string; app?: "/niche-clarity"; pdf?: string }[] = [
  { name: "Niche Clarity", blurb: "Lock your niche in one afternoon.", app: "/niche-clarity", pdf: "niche-clarity" },
  { name: "Knowledge Audit", blurb: "Find the product hiding in your expertise — in 2 hours." },
  { name: "PAIDS Income Map", blurb: "Map your 5 income streams from what you already know.", pdf: "paids" },
  { name: "DARES Asset Model", blurb: "Build income that doesn't need you to show up daily." },
  { name: "4E Content Calendar", blurb: "30 days of content at the ratio that converts." },
  { name: "SEEDS Pipeline", blurb: "Your first sales funnel, step by step." },
  { name: "MS×TS×SS Assessment", blurb: "Score your Mindset × Toolset × Skillset." },
];

function FoundationKitWorkspace() {
  const { user } = useAuth();
  const purchasesFn = useServerFn(myPurchases);
  const dlFn = useServerFn(getMyDownloadUrl);

  const isAdminQ = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });

  const purchases = useQuery({ queryKey: ["my-purchases"], queryFn: () => purchasesFn() });

  const dlMut = useMutation({
    mutationFn: dlFn,
    onSuccess: (res: { url: string }) => window.open(res.url, "_blank", "noopener,noreferrer"),
    onError: (e: Error) => toast.error(e.message),
  });

  const kitFileFn = useServerFn(getKitFileUrl);
  const kitFileMut = useMutation({
    mutationFn: kitFileFn,
    onSuccess: (res: { url: string }) => window.open(res.url, "_blank", "noopener,noreferrer"),
    onError: (e: Error) => toast.error(e.message),
  });

  const grants = (purchases.data?.grants ?? []) as Array<{ product: { slug: string } | null }>;
  const ownsKit = grants.some((g) => g.product && KIT_SLUGS.includes(g.product.slug));
  const access = ownsKit || isAdminQ.data === true;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/dashboard" className="text-sm font-semibold text-[var(--nx-gold-text)] hover:underline">
          ← Back to dashboard
        </Link>
        <p className="nx-label mt-4 mb-2">Foundation Kit</p>
        <h1 className="mb-3">Your Foundation Kit workspace.</h1>

        {!access ? (
          <div className="nx-card !p-10 text-center mt-6">
            <Lock className="size-9 text-[var(--text-subtle)] mx-auto" />
            <h2 className="mt-4 text-2xl">This workspace is for kit owners.</h2>
            <p className="nx-body max-w-md mx-auto mt-2">
              Get the Called Expert Foundation Kit to unlock the interactive apps and fillable workbooks.
            </p>
            <a href="/?buy=1" className="cta-glow inline-block mt-6">Get the Kit — $97</a>
          </div>
        ) : (
          <>
            <p className="nx-body max-w-2xl mb-6">
              Everything in one place — interactive apps to <em>do</em> the work, plus fillable PDF
              workbooks to keep. Start anywhere; you don't have to do it all at once.
            </p>

            {/* Download fillable workbooks */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <div>
                <div className="font-display text-lg">Fillable workbooks (PDF)</div>
                <p className="text-sm text-[var(--text-dim)]">All 7 frameworks + 3 bonuses, ready to fill in.</p>
              </div>
              <button
                onClick={() => dlMut.mutate({ data: { productSlug: "called-expert-foundation-kit" } })}
                disabled={dlMut.isPending}
                className="cta-glow inline-flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Download className="size-4" /> {dlMut.isPending ? "Preparing…" : "Download workbooks"}
              </button>
            </div>

            {/* The 7 frameworks */}
            <h2 className="text-2xl mb-4">The 7 frameworks</h2>
            <div className="grid gap-4 sm:grid-cols-2 mb-12">
              {FRAMEWORKS.map((f) => (
                <div key={f.name} className="nx-card !p-5 flex flex-col">
                  <div className="font-display text-lg text-[var(--foreground)]">{f.name}</div>
                  <p className="text-sm text-[var(--text-dim)] mt-1 flex-1">{f.blurb}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {f.app ? (
                      <Link to={f.app} className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
                        Open interactive app <ArrowRight className="size-4" />
                      </Link>
                    ) : (
                      <span className="inline-block rounded-full bg-[var(--bg-card-hi)] px-3 py-1 text-xs font-semibold text-[var(--text-subtle)]">
                        App coming soon
                      </span>
                    )}
                    {f.pdf && (
                      <button
                        onClick={() => kitFileMut.mutate({ data: { key: f.pdf! } })}
                        disabled={kitFileMut.isPending}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)] hover:text-[var(--foreground)] disabled:opacity-50"
                      >
                        <Download className="size-4" /> Workbook PDF
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive tools you can use right now */}
            <h2 className="text-2xl mb-1">Your interactive tools</h2>
            <p className="text-sm text-[var(--text-dim)] mb-4">Built to give you a real win in minutes — no extra cost.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                return (
                  <Link key={t.path} to={t.path} className="dash-tile group">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-card-hi)] text-[var(--nx-gold-deep)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="mt-2 font-display text-base group-hover:text-[var(--nx-gold-text)] transition-colors">{t.name}</span>
                    <span className="text-xs text-[var(--text-dim)] leading-relaxed">{t.blurb}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-12 rounded-2xl bg-[#0F172A] p-6 text-center">
              <BookOpen className="size-7 text-[var(--nx-gold-bright)] mx-auto" />
              <h2 className="text-white text-2xl mt-3">Ready for the full system?</h2>
              <p className="text-slate-300 max-w-lg mx-auto mt-2 mb-5">
                The 90-Day Accelerator takes you through all 7 stages with live coaching.
              </p>
              <Link to="/apply" className="cta-glow inline-block">Apply for the Accelerator</Link>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
