import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { myPurchases, getMyDownloadUrl } from "@/lib/products.functions";
import { Download, BookOpen, User, ShieldCheck, FileText, Users, Receipt, AlertCircle, ArrowRight, Wrench } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CHKPLT" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const purchasesFn = useServerFn(myPurchases);
  const dlFn = useServerFn(getMyDownloadUrl);

  const isAdminQ = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });

  const purchases = useQuery({
    queryKey: ["my-purchases"],
    queryFn: () => purchasesFn(),
  });

  const dlMut = useMutation({
    mutationFn: dlFn,
    onSuccess: (res: { url: string }) => window.open(res.url, "_blank", "noopener,noreferrer"),
    onError: (e: Error) => toast.error(e.message),
  });

  const grants = (purchases.data?.grants ?? []) as Array<{
    granted_at: string;
    product: {
      id: string;
      slug: string;
      title: string;
      tagline: string | null;
      cover_image_url: string | null;
      download_path: string | null;
    } | null;
  }>;

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Expert";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Welcome banner */}
      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 pt-12 pb-10 sm:pt-16">
          <div className="nx-label">Dashboard</div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl">
            Welcome back, <em className="text-banana not-italic">{firstName}.</em>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl text-base">
            Your courses, downloads, and account — all in one place.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-10 space-y-12">

        {/* Quick nav tiles */}
        <div>
          <div className="nx-label mb-4">Quick access</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Link to="/learn" className="dash-tile group">
              <BookOpen className="size-5 text-banana" />
              <div className="font-display text-base mt-1">My Courses</div>
              <div className="text-xs text-muted-foreground">Enter the LMS</div>
            </Link>
            <Link to="/dashboard/tools" className="dash-tile group">
              <Wrench className="size-5 text-banana" />
              <div className="font-display text-base mt-1">Free Tools</div>
              <div className="text-xs text-muted-foreground">5 practical tools</div>
            </Link>
            <Link to="/dashboard/products/free" className="dash-tile group">
              <FileText className="size-5 text-banana" />
              <div className="font-display text-base mt-1">Products</div>
              <div className="text-xs text-muted-foreground">Free &amp; paid</div>
            </Link>
            <Link to="/account" className="dash-tile group">
              <User className="size-5 text-banana" />
              <div className="font-display text-base mt-1">Account</div>
              <div className="text-xs text-muted-foreground">Privacy &amp; data</div>
            </Link>
            <Link to="/apply" className="dash-tile group">
              <ArrowRight className="size-5 text-banana" />
              <div className="font-display text-base mt-1">Accelerator</div>
              <div className="text-xs text-muted-foreground">Apply or re-assess</div>
            </Link>
          </div>
        </div>

        {/* Admin tiles — conditionally shown */}
        {isAdminQ.data && (
          <div>
            <div className="nx-label mb-4 text-[#E8601F]">Admin tools</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { to: "/admin/products", icon: ShieldCheck, label: "Products", sub: "Manage catalog" },
                { to: "/admin/contacts", icon: Users, label: "Contacts", sub: "View & tag" },
                { to: "/admin/import-contacts", icon: FileText, label: "Import CSV", sub: "Bulk upload" },
                { to: "/admin/ledger", icon: Receipt, label: "Ledger", sub: "Audit log" },
                { to: "/admin/incidents", icon: AlertCircle, label: "Incidents", sub: "Error log" },
              ].map((t) => (
                <Link key={t.to} to={t.to as any} className="dash-tile group">
                  <t.icon className="size-4 text-[#E8601F]" />
                  <div className="font-display text-sm mt-1">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.sub}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Library */}
        <div>
          <div className="nx-label mb-1">Your library</div>
          <h2 className="font-display text-2xl sm:text-3xl mb-5">Downloads &amp; access</h2>

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
              <p className="mt-2 text-sm text-muted-foreground">
                When you purchase a product or enrol in a programme, it appears here.
              </p>
              <Button asChild className="mt-6 cta-glow">
                <Link to="/dashboard/products/free">Browse products →</Link>
              </Button>
            </div>
          )}

          {grants.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {grants.map((g) =>
                g.product ? (
                  <div key={g.product.id} className="nx-card !p-5 flex gap-4 items-start">
                    {g.product.cover_image_url ? (
                      <img
                        src={g.product.cover_image_url}
                        alt=""
                        className="size-20 rounded-lg object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="size-20 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                        <BookOpen className="size-7 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to="/products/$slug"
                        params={{ slug: g.product.slug }}
                        className="font-display text-base leading-snug hover:text-banana transition-colors line-clamp-2"
                      >
                        {g.product.title}
                      </Link>
                      {g.product.tagline && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.product.tagline}</p>
                      )}
                      <div className="mt-3">
                        {g.product.download_path ? (
                          <Button
                            size="sm"
                            onClick={() => dlMut.mutate({ data: { productSlug: g.product!.slug } })}
                            disabled={dlMut.isPending}
                            className="cta-glow h-9 px-4 text-xs"
                          >
                            <Download className="size-3.5 mr-1.5" /> Download
                          </Button>
                        ) : (
                          <Link
                            to="/learn/$slug"
                            params={{ slug: g.product.slug }}
                            className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-banana hover:text-banana/80 transition-colors"
                          >
                            Open course <ArrowRight className="size-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
