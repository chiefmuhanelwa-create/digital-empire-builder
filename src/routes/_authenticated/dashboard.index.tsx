import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-is-admin";
import { supabase } from "@/integrations/supabase/client";
import { myPurchases, getMyDownloadUrl } from "@/lib/products.functions";
import { KIT_SLUGS } from "@/lib/use-kit-access";
import { Download, BookOpen, User, ArrowRight, Package, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — CHKPLT" }] }),
  component: Dashboard,
});

// Products to surface as "Complete your toolkit" when not already owned.
const RECO_SLUGS = ["called-expert-foundations", "asset-accelerator", "paids-framework", "called-expert-foundation-kit"];

type Grant = {
  granted_at: string;
  product: {
    id: string; slug: string; title: string; tagline: string | null;
    cover_image_url: string | null; download_path: string | null; garden?: string | null;
  } | null;
};

function Dashboard() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const purchasesFn = useServerFn(myPurchases);
  const dlFn = useServerFn(getMyDownloadUrl);

  const purchases = useQuery({ queryKey: ["my-purchases"], queryFn: () => purchasesFn() });

  const dlMut = useMutation({
    mutationFn: dlFn,
    onSuccess: (res: { url: string }) => window.open(res.url, "_blank", "noopener,noreferrer"),
    onError: (e: Error) => toast.error(e.message),
  });

  const grants = (purchases.data?.grants ?? []) as Grant[];
  const ownedSlugs = new Set(grants.map((g) => g.product?.slug).filter(Boolean) as string[]);

  // Recommended upsells the member doesn't own yet.
  const reco = useQuery({
    queryKey: ["reco-upsells"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("slug,title,tagline,cover_image_url")
        .in("slug", RECO_SLUGS)
        .eq("status", "published");
      return (data ?? []) as Array<{ slug: string; title: string; tagline: string | null; cover_image_url: string | null }>;
    },
  });
  const recommended = (reco.data ?? []).filter((p) => !ownedSlugs.has(p.slug)).slice(0, 3);

  const courses = grants.filter((g) => g.product && !g.product.download_path);
  const downloads = grants.filter((g) => g.product && g.product.download_path);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Expert";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 pt-12 pb-10 sm:pt-16">
          <div className="nx-label">Your workspace</div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl">
            Welcome back, <em className="text-banana not-italic">{firstName}.</em>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl text-base">
            Everything you've unlocked — courses, downloads and your kit — in one place.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-10 space-y-12">

        {/* Admin entry — only for admins, kept out of the member flow */}
        {isAdmin && (
          <Link to="/admin" className="flex items-center gap-3 rounded-xl border border-[var(--nx-orange)]/30 bg-[var(--nx-orange)]/5 px-5 py-3 hover:border-[var(--nx-orange)]/60 transition-colors">
            <ShieldCheck className="size-5 text-[var(--nx-orange-deep)]" />
            <span className="text-sm font-semibold text-[var(--nx-orange-deep)]">You're an owner — open the Admin console</span>
            <ArrowRight className="size-4 text-[var(--nx-orange-deep)] ml-auto" />
          </Link>
        )}

        {/* Quick access — member only */}
        <div>
          <div className="nx-label mb-4">Quick access</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link to="/dashboard/foundation-kit" className="dash-tile group">
              <Package className="size-5 text-banana" />
              <div className="font-display text-base mt-1">Foundation Kit</div>
              <div className="text-xs text-muted-foreground">Apps, course &amp; workbooks</div>
            </Link>
            <Link to="/learn" className="dash-tile group">
              <GraduationCap className="size-5 text-banana" />
              <div className="font-display text-base mt-1">My Courses</div>
              <div className="text-xs text-muted-foreground">Watch &amp; track progress</div>
            </Link>
            <Link to="/dashboard/products/free" className="dash-tile group">
              <BookOpen className="size-5 text-banana" />
              <div className="font-display text-base mt-1">Browse Products</div>
              <div className="text-xs text-muted-foreground">Free &amp; paid</div>
            </Link>
            <Link to="/account" className="dash-tile group">
              <User className="size-5 text-banana" />
              <div className="font-display text-base mt-1">Account</div>
              <div className="text-xs text-muted-foreground">Settings &amp; privacy</div>
            </Link>
          </div>
        </div>

        {/* My Access */}
        <div>
          <div className="nx-label mb-1">My access</div>
          <h2 className="font-display text-2xl sm:text-3xl mb-5">Everything you've unlocked</h2>

          {purchases.isLoading && (
            <div className="grid sm:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="nx-card !p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="size-20 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!purchases.isLoading && grants.length === 0 && (
            <div className="nx-card !p-10 text-center">
              <BookOpen className="size-10 text-muted-foreground/40 mx-auto" />
              <h3 className="mt-4 font-display text-xl text-foreground">Nothing here yet.</h3>
              <p className="mt-2 text-sm text-muted-foreground">When you buy a product or enrol in a programme, it appears here.</p>
              <Button asChild className="mt-6 cta-glow"><Link to="/dashboard/products/free">Browse products →</Link></Button>
            </div>
          )}

          {courses.length > 0 && (
            <>
              <div className="text-sm font-semibold text-[var(--text-dim)] mb-3">Courses &amp; programmes</div>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {courses.map((g) => <AccessCard key={g.product!.id} g={g} />)}
              </div>
            </>
          )}

          {downloads.length > 0 && (
            <>
              <div className="text-sm font-semibold text-[var(--text-dim)] mb-3">Downloads</div>
              <div className="grid sm:grid-cols-2 gap-4">
                {downloads.map((g) => (
                  <AccessCard key={g.product!.id} g={g} onDownload={() => dlMut.mutate({ data: { productSlug: g.product!.slug } })} downloading={dlMut.isPending} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Complete your toolkit — funnel continues, clearly separated, only what they don't own */}
        {recommended.length > 0 && (
          <div>
            <div className="nx-label mb-1 flex items-center gap-2"><Sparkles className="size-4 text-banana" /> Recommended next</div>
            <h2 className="font-display text-2xl sm:text-3xl mb-1">Complete your toolkit</h2>
            <p className="text-sm text-muted-foreground mb-5">The next steps that build on what you already have.</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {recommended.map((p) => (
                <Link key={p.slug} to="/products/$slug" params={{ slug: p.slug }} className="nx-card !p-5 flex flex-col group">
                  <div className="font-display text-lg group-hover:text-banana transition-colors">{p.title}</div>
                  {p.tagline && <p className="text-sm text-muted-foreground mt-1 flex-1">{p.tagline}</p>}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--nx-gold-text)]">See details <ArrowRight className="size-4" /></span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function AccessCard({ g, onDownload, downloading }: { g: Grant; onDownload?: () => void; downloading?: boolean }) {
  const p = g.product!;
  const isKit = KIT_SLUGS.includes(p.slug);
  return (
    <div className="nx-card !p-5 flex gap-4 items-start">
      {p.cover_image_url ? (
        <img src={p.cover_image_url} alt="" className="size-20 rounded-lg object-cover border border-border shrink-0" />
      ) : (
        <div className="size-20 rounded-lg bg-muted shrink-0 flex items-center justify-center">
          <BookOpen className="size-7 text-muted-foreground/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-display text-base leading-snug line-clamp-2">{p.title}</div>
        {p.tagline && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.tagline}</p>}
        <div className="mt-3">
          {onDownload ? (
            <Button size="sm" onClick={onDownload} disabled={downloading} className="cta-glow h-9 px-4 text-xs">
              <Download className="size-3.5 mr-1.5" /> {downloading ? "Preparing…" : "Download"}
            </Button>
          ) : isKit ? (
            <Link to="/dashboard/foundation-kit" className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
              Open Foundation Kit <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link to="/learn/$slug" params={{ slug: p.slug }} className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--nx-gold-text)] hover:underline">
              Open course <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
