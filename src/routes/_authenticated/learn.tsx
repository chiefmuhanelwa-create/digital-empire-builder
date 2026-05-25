import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { getMyCourses } from "@/lib/lms.functions";
import { GARDENS, type Garden } from "@/lib/gardens";

export const Route = createFileRoute("/_authenticated/learn")({
  head: () => ({ meta: [{ title: "My courses — CHKPLT" }] }),
  component: LearnIndex,
});

function LearnIndex() {
  const fn = useServerFn(getMyCourses);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => fn(),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Learn</div>
        <h1 className="mt-4 font-display text-5xl md:text-6xl">My courses.</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Every product you've been granted access to. Click to enter the curriculum.
        </p>

        {isLoading && <div className="mt-12 text-muted-foreground">Loading…</div>}
        {error && <div className="mt-12 text-destructive">{(error as any).message}</div>}

        {data && data.courses.length === 0 && (
          <div className="mt-16 border border-border p-10 text-center">
            <h2 className="font-display text-3xl">No courses yet.</h2>
            <p className="mt-3 text-muted-foreground">
              When you purchase a product, it appears here.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-block border border-banana/40 px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase text-banana hover:bg-banana hover:text-banana-foreground transition-colors"
            >
              Browse products →
            </Link>
          </div>
        )}

        {data && data.courses.length > 0 && (
          <div className="mt-12 grid gap-px bg-border md:grid-cols-2">
            {data.courses.map((c: any) => {
              const p = c.products;
              if (!p) return null;
              const garden = p.garden ? GARDENS[p.garden as Garden] : null;
              return (
                <Link
                  key={c.product_id}
                  to="/learn/$slug"
                  params={{ slug: p.slug }}
                  className="group bg-background p-8 hover:bg-muted/30 transition-colors"
                >
                  {garden && (
                    <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">
                      {garden.name} garden
                    </div>
                  )}
                  <h3 className="mt-3 font-display text-3xl group-hover:text-banana transition-colors">
                    {p.title}
                  </h3>
                  {p.tagline && (
                    <p className="mt-3 text-sm text-muted-foreground">{p.tagline}</p>
                  )}
                  <div className="mt-6 font-mono text-xs text-muted-foreground">
                    Granted {new Date(c.granted_at).toLocaleDateString()}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
