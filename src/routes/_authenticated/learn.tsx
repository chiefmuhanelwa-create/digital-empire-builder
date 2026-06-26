import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { getMyCourses } from "@/lib/lms.functions";
import { GARDENS, type Garden } from "@/lib/gardens";
import { BookOpen, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/learn")({
  head: () => ({ meta: [{ title: "My Courses — CHKPLT" }] }),
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

      <section className="nx-hero-orb border-b border-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 pt-12 pb-10 sm:pt-16">
          <div className="nx-label">My Courses</div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl">
            Your <em className="text-banana not-italic">learning library.</em>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Every programme and product you have access to. Click to enter the curriculum.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-10 sm:py-14">

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="nx-card !p-6 animate-pulse space-y-3">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-6 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="nx-card border-destructive/40 !p-6 text-destructive">
            {(error as Error).message}
          </div>
        )}

        {data && data.courses.length === 0 && (
          <div className="nx-card !p-12 text-center max-w-lg mx-auto">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
              <Lock className="size-7 text-muted-foreground/50" />
            </div>
            <h2 className="font-display text-2xl">No courses yet.</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              When you purchase a product or enrol in the Called Expert Accelerator, it unlocks here.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="cta-glow">
                <Link to="/apply">Apply for the Accelerator →</Link>
              </Button>
              <Button asChild variant="outline" className="border-border text-foreground hover:border-banana/40">
                <Link to="/products">Browse products</Link>
              </Button>
            </div>
          </div>
        )}

        {data && data.courses.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.courses.map((c: any) => {
              const p = c.products;
              if (!p) return null;
              const garden = p.garden ? GARDENS[p.garden as Garden] : null;
              const grantedDate = new Date(c.granted_at).toLocaleDateString("en-ZA", {
                year: "numeric", month: "short", day: "numeric",
              });
              return (
                <Link
                  key={c.product_id}
                  to="/learn/$slug"
                  params={{ slug: p.slug }}
                  className="nx-card group flex flex-col !p-6 cursor-pointer"
                >
                  {/* Garden badge */}
                  {garden && (
                    <span className="nx-label text-banana self-start">{garden.name}</span>
                  )}

                  {/* Title */}
                  <h3 className="mt-3 font-display text-xl sm:text-2xl leading-snug group-hover:text-banana transition-colors">
                    {p.title}
                  </h3>

                  {p.tagline && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{p.tagline}</p>
                  )}

                  {/* Progress */}
                  {c.total_lessons > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                          {c.completed_lessons}/{c.total_lessons} lessons
                        </span>
                        <span className="font-mono text-[10px] font-bold text-banana">
                          {c.percent_complete}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-banana transition-all" style={{ width: `${c.percent_complete}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Footer row */}
                  <div className="mt-auto pt-5 flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                      {c.completed_lessons > 0
                        ? c.percent_complete === 100 ? "Completed ✓" : "Resume"
                        : `Access granted ${grantedDate}`}
                    </span>
                    <ArrowRight className="size-4 text-banana opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-12 flex justify-between items-center text-sm">
          <Link to="/dashboard" className="text-muted-foreground hover:text-banana transition-colors flex items-center gap-2">
            ← Dashboard
          </Link>
          <Link to="/products" className="text-banana hover:text-banana/80 transition-colors flex items-center gap-2">
            Browse more products <BookOpen className="size-3.5" />
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
