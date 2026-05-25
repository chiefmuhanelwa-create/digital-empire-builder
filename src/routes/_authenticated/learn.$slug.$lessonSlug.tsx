import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { getLessonBody, markLessonComplete } from "@/lib/lms.functions";
import { Button } from "@/components/ui/button";
import { Lock, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/learn/$slug/$lessonSlug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.lessonSlug} — Christ Kingdom Platform` }],
  }),
  component: LessonPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <div className="mx-auto max-w-3xl py-32 px-6">
          <h1 className="font-display text-3xl">Couldn't load lesson.</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => { router.invalidate(); reset(); }} className="mt-6">Try again</Button>
        </div>
      </div>
    );
  },
});

function LessonPage() {
  const { slug, lessonSlug } = Route.useParams();
  const fn = useServerFn(getLessonBody);
  const completeFn = useServerFn(markLessonComplete);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["lesson", slug, lessonSlug],
    queryFn: () => fn({ data: { productSlug: slug, lessonSlug } }),
  });

  const completeMut = useMutation({
    mutationFn: (lessonId: string) => completeFn({ data: { lessonId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson", slug, lessonSlug] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 animate-pulse">
          <div className="h-10 w-2/3 bg-muted rounded" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pt-20 pb-24">
        <Link
          to="/learn/$slug"
          params={{ slug }}
          className="font-mono text-xs text-muted-foreground hover:text-banana"
        >
          ← {data.product.title}
        </Link>

        <h1 className="mt-6 font-display text-4xl md:text-5xl leading-[1.1]">
          {data.lesson.title}
        </h1>
        {data.lesson.summary && (
          <p className="mt-4 text-muted-foreground">{data.lesson.summary}</p>
        )}

        {data.locked ? (
          <div className="mt-12 border border-banana/30 bg-banana/5 p-10 text-center">
            <Lock className="mx-auto size-8 text-banana" />
            <h2 className="mt-4 font-display text-2xl">This lesson is locked.</h2>
            <p className="mt-2 text-muted-foreground">
              Buy access to {data.product.title} to unlock the full content.
            </p>
            <Button asChild className="mt-6 bg-banana text-banana-foreground hover:bg-banana/90">
              <Link to="/products/$slug" params={{ slug }}>Get access →</Link>
            </Button>
          </div>
        ) : (
          <>
            {data.lesson.video_url && (
              <div className="mt-10 aspect-video w-full bg-muted">
                <iframe
                  src={data.lesson.video_url}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={data.lesson.title}
                />
              </div>
            )}

            {data.lesson.body_md && (
              <div className="mt-10 prose prose-invert max-w-none whitespace-pre-line text-lg leading-relaxed text-foreground/90">
                {data.lesson.body_md}
              </div>
            )}

            <div className="mt-12 flex items-center gap-3 border-t border-border pt-8">
              <Button
                onClick={() => completeMut.mutate(data.lesson.id)}
                disabled={completeMut.isPending}
                className="bg-banana text-banana-foreground hover:bg-banana/90"
              >
                <Check className="size-4 mr-2" />
                {completeMut.isPending ? "Saving…" : "Mark complete"}
              </Button>
              <Button asChild variant="outline">
                <Link to="/learn/$slug" params={{ slug }}>Back to curriculum</Link>
              </Button>
            </div>
          </>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}
