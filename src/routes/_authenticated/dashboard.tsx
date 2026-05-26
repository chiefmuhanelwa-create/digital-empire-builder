import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { myPurchases, getDownloadUrl } from "@/lib/products.functions";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Christ Kingdom Platform" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const purchasesFn = useServerFn(myPurchases);
  const dlFn = useServerFn(getDownloadUrl);

  const isAdminQ = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      return !!data;
    },
  });

  const purchases = useQuery({
    queryKey: ["my-purchases"],
    queryFn: () => purchasesFn(),
  });

  const dlMut = useMutation({
    mutationFn: dlFn,
    onSuccess: (res: { url: string }) =>
      window.open(res.url, "_blank", "noopener,noreferrer"),
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Dashboard</div>
        <h1 className="mt-4 font-display text-5xl md:text-6xl">
          Welcome, {user?.user_metadata?.full_name ?? user?.email}.
        </h1>
        <p className="mt-6 text-muted-foreground max-w-2xl">
          Your purchases, courses, and account live here.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 border border-banana/40 px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase text-banana hover:bg-banana hover:text-banana-foreground transition-colors"
          >
            My Courses →
          </Link>
          {isAdminQ.data && (
            <>
              <Link
                to="/admin/products"
                className="inline-flex items-center gap-2 border border-banana/40 px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase text-banana hover:bg-banana hover:text-banana-foreground transition-colors"
              >
                Admin · Products →
              </Link>
              <Link
                to="/admin/contacts"
                className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-banana hover:border-banana/40 transition-colors"
              >
                Admin · Contacts &amp; Tags →
              </Link>
            </>
          )}
        </div>

        {/* Purchases */}
        <div className="mt-16">
          <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
            Your purchases
          </div>
          <h2 className="mt-3 font-display text-3xl">Downloads &amp; access</h2>

          {purchases.isLoading && (
            <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
          )}

          {!purchases.isLoading && grants.length === 0 && (
            <div className="mt-6 border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't bought anything yet.
              </p>
              <Button asChild className="mt-4 bg-banana text-banana-foreground hover:bg-banana/90">
                <Link to="/products">Browse products →</Link>
              </Button>
            </div>
          )}

          <div className="mt-6 grid gap-px bg-border md:grid-cols-2">
            {grants.map((g) =>
              g.product ? (
                <div
                  key={g.product.id}
                  className="bg-background p-5 flex gap-4 items-start"
                >
                  {g.product.cover_image_url ? (
                    <img
                      src={g.product.cover_image_url}
                      alt=""
                      className="h-20 w-20 object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="h-20 w-20 bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/products/$slug"
                      params={{ slug: g.product.slug }}
                      className="font-display text-lg hover:text-banana"
                    >
                      {g.product.title}
                    </Link>
                    {g.product.tagline && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {g.product.tagline}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      {g.product.download_path ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            dlMut.mutate({
                              data: { productSlug: g.product!.slug },
                            })
                          }
                          disabled={dlMut.isPending}
                          className="bg-banana text-banana-foreground hover:bg-banana/90"
                        >
                          <Download className="size-3.5 mr-1.5" /> Download
                        </Button>
                      ) : (
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                          Access granted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
