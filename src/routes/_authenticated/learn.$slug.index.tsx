import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Lock, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/learn/$slug/")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} — CHKPLT` }],
  }),
  component: CoursePage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <div className="mx-auto max-w-3xl py-32 px-6">
          <h1 className="font-display text-3xl">Couldn't load course.</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => { router.invalidate(); reset(); }} className="mt-6">Try again</Button>
        </div>
      </div>
    );
  },
});

function CoursePage() {
  const { slug } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from("products")
        .select("id,slug,title,tagline,description,garden")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!product) throw new Error("Course not found");

      const { data: modules, error: me } = await supabase
        .from("modules")
        .select("id,title,summary,sort_order,unlock_week, lessons:lessons(id,slug,title,is_preview,sort_order,duration_minutes)")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true });
      if (me) throw me;

      const { data: grantRows } = await supabase
        .from("product_grants")
        .select("id, granted_at")
        .eq("product_id", product.id)
        .limit(1);
      const grant = (grantRows ?? [])[0] ?? null;

      // Admins (owner) get full access for QA even without a grant.
      let isAdmin = false;
      const { data: au } = await supabase.auth.getUser();
      if (au.user) {
        const { data } = await supabase.rpc("has_role", { _user_id: au.user.id, _role: "admin" });
        isAdmin = !!data;
      }

      // Drip-delivery: cohort week N unlocks N-1 weeks after the purchase grant.
      // Admins bypass entirely (QA needs to see every module immediately).
      const currentWeek = grant
        ? Math.floor((Date.now() - new Date(grant.granted_at).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
        : 0;

      return {
        product,
        modules: (modules ?? []).map((m: any) => ({
          ...m,
          lessons: (m.lessons ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
          dripLocked: !isAdmin && !!grant && (m.unlock_week ?? 1) > currentWeek,
        })),
        hasAccess: !!grant || isAdmin,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <div className="mx-auto max-w-4xl px-6 py-24 animate-pulse">
          <div className="h-12 w-2/3 bg-muted rounded" />
        </div>
      </div>
    );
  }
  if (!data) return null;

  const totalLessons = data.modules.reduce((n, m: any) => n + (m.lessons?.length ?? 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-6 pt-20 pb-16">
        <Link to="/learn" className="font-mono text-xs text-muted-foreground hover:text-banana">
          ← My courses
        </Link>
        <div className="mt-6 font-mono text-xs tracking-[0.25em] uppercase text-banana">
          {data.hasAccess ? "Enrolled" : "Preview"}
        </div>
        <h1 className="mt-3 font-display text-5xl md:text-6xl leading-[1.05]">{data.product.title}</h1>
        {data.product.tagline && (
          <p className="mt-4 text-lg text-muted-foreground">{data.product.tagline}</p>
        )}

        <div className="mt-10 font-mono text-xs text-muted-foreground">
          {data.modules.length} module{data.modules.length !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
        </div>

        {data.modules.length === 0 && (
          <div className="mt-12 border border-banana/30 bg-banana/5 p-8 md:p-10">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              Cohort 01 — Curriculum loading
            </div>
            <h2 className="mt-3 font-display text-2xl md:text-3xl leading-tight">
              Your seat is confirmed. The scrolls are being finalised.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {data.hasAccess
                ? "We are recording the final modules and assembling your cohort materials. The moment a module goes live it will appear here, and we will email you at the address on your order. You do not need to do anything."
                : "This program opens in cohort form. Enrolment is gated through the Stewardship Application — once you qualify and complete checkout, your portal unlocks here."}
            </p>
          </div>
        )}

        <div className="mt-10 space-y-8">
          {data.modules.map((m: any, i: number) => (
            <section key={m.id} className="border border-border">
              <header className="border-b border-border p-5 bg-muted/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-banana">
                    Module {String(i + 1).padStart(2, "0")}
                  </div>
                  {m.dripLocked && (
                    <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                      <Lock className="size-3" /> Unlocks Week {m.unlock_week}
                    </div>
                  )}
                </div>
                <h2 className="mt-2 font-display text-2xl">{m.title}</h2>
                {m.summary && <p className="mt-2 text-sm text-muted-foreground">{m.summary}</p>}
              </header>
              <ul>
                {(m.lessons ?? []).map((l: any, idx: number) => {
                  const locked = (!data.hasAccess || m.dripLocked) && !l.is_preview;
                  return (
                    <li key={l.id} className="border-b border-border last:border-b-0">
                      <Link
                        to="/learn/$slug/$lessonSlug"
                        params={{ slug, lessonSlug: l.slug }}
                        className="flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors"
                      >
                        <span className="font-mono text-xs text-muted-foreground w-8">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {locked ? (
                          <Lock className="size-4 text-muted-foreground" />
                        ) : (
                          <PlayCircle className="size-4 text-banana" />
                        )}
                        <span className="flex-1">{l.title}</span>
                        {l.is_preview && (
                          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-banana">
                            Preview
                          </span>
                        )}
                        {l.duration_minutes && (
                          <span className="font-mono text-xs text-muted-foreground">
                            {l.duration_minutes}m
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {!data.hasAccess && (
          <div className="mt-12 border border-banana/30 p-6 bg-banana/5">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Locked</div>
            <p className="mt-2 text-sm">
              You're previewing this course. Get access to unlock every lesson.
            </p>
            <Button asChild className="mt-4 bg-banana text-banana-foreground hover:bg-banana/90">
              <Link to="/products/$slug" params={{ slug }}>Get access →</Link>
            </Button>
          </div>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}
