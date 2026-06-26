import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import {
  adminGetCurriculum,
  adminCreateModule,
  adminUpdateModule,
  adminDeleteModule,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
} from "@/lib/lms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/curriculum/$productSlug")({
  head: ({ params }) => ({ meta: [{ title: `Curriculum: ${params.productSlug} — Christ Kingdom Platform` }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: CurriculumAdmin,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <div className="mx-auto max-w-3xl py-32 px-6">
          <h1 className="font-display text-3xl">Curriculum error.</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => { router.invalidate(); reset(); }} className="mt-6">Try again</Button>
        </div>
      </div>
    );
  },
});

function CurriculumAdmin() {
  const { productSlug } = Route.useParams();
  const qc = useQueryClient();

  const getFn = useServerFn(adminGetCurriculum);
  const createMod = useServerFn(adminCreateModule);
  const deleteMod = useServerFn(adminDeleteModule);
  const updateMod = useServerFn(adminUpdateModule);
  const createLesson = useServerFn(adminCreateLesson);
  const deleteLesson = useServerFn(adminDeleteLesson);
  const updateLesson = useServerFn(adminUpdateLesson);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-curriculum", productSlug],
    queryFn: () => getFn({ data: { productSlug } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-curriculum", productSlug] });

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingLesson, setEditingLesson] = useState<string | null>(null);

  const addModMut = useMutation({
    mutationFn: (title: string) => createMod({ data: { productId: data!.product.id, title } }),
    onSuccess: () => { setNewModuleTitle(""); invalidate(); toast.success("Module added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const delModMut = useMutation({
    mutationFn: (id: string) => deleteMod({ data: { id } }),
    onSuccess: () => { invalidate(); toast.success("Module deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const delLessonMut = useMutation({
    mutationFn: (id: string) => deleteLesson({ data: { id } }),
    onSuccess: () => { invalidate(); toast.success("Lesson deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <div className="mx-auto max-w-5xl py-24 px-6 text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-20">
        <Link to="/dashboard" className="font-mono text-xs text-muted-foreground hover:text-banana">
          ← Dashboard
        </Link>
        <div className="mt-6 font-mono text-xs tracking-[0.25em] uppercase text-banana">Admin · Curriculum</div>
        <h1 className="mt-3 font-display text-5xl">{data.product.title}</h1>

        <div className="mt-10 flex gap-2 items-end">
          <div className="flex-1">
            <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">New module</label>
            <Input
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Module title"
              className="mt-1"
            />
          </div>
          <Button
            onClick={() => newModuleTitle.trim() && addModMut.mutate(newModuleTitle.trim())}
            disabled={!newModuleTitle.trim() || addModMut.isPending}
            className="bg-banana text-banana-foreground hover:bg-banana/90"
          >
            <Plus className="size-4 mr-2" /> Add module
          </Button>
        </div>

        <div className="mt-10 space-y-4">
          {data.modules.length === 0 && (
            <div className="border border-border p-8 text-center text-muted-foreground">
              No modules yet. Add the first one above.
            </div>
          )}

          {data.modules.map((m: any, i: number) => {
            const open = expanded[m.id] ?? true;
            return (
              <div key={m.id} className="border border-border">
                <header className="flex items-center gap-3 p-4 bg-muted/20 border-b border-border">
                  <button onClick={() => setExpanded({ ...expanded, [m.id]: !open })}>
                    {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                  <div className="font-mono text-xs text-muted-foreground">M{String(i + 1).padStart(2, "0")}</div>
                  <input
                    defaultValue={m.title}
                    onBlur={(e) => {
                      if (e.target.value !== m.title) {
                        updateMod({ data: { id: m.id, title: e.target.value } }).then(invalidate);
                      }
                    }}
                    className="flex-1 bg-transparent font-display text-xl outline-none focus:text-banana"
                  />
                  <span className="font-mono text-xs text-muted-foreground">{m.lessons.length} lessons</span>
                  <button
                    onClick={() => confirm(`Delete module "${m.title}"?`) && delModMut.mutate(m.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </header>

                {open && (
                  <div>
                    <ul>
                      {m.lessons.map((l: any) => (
                        <li key={l.id} className="border-b border-border last:border-b-0">
                          <div className="flex items-center gap-3 p-3">
                            <input
                              defaultValue={l.title}
                              onBlur={(e) => {
                                if (e.target.value !== l.title) {
                                  updateLesson({ data: { id: l.id, title: e.target.value } }).then(invalidate);
                                }
                              }}
                              className="flex-1 bg-transparent text-sm outline-none focus:text-banana"
                            />
                            <label className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                defaultChecked={l.is_preview}
                                onChange={(e) =>
                                  updateLesson({ data: { id: l.id, is_preview: e.target.checked } }).then(invalidate)
                                }
                              />
                              Preview
                            </label>
                            <button
                              onClick={() => setEditingLesson(editingLesson === l.id ? null : l.id)}
                              className="font-mono text-[10px] tracking-[0.2em] uppercase text-banana"
                            >
                              {editingLesson === l.id ? "Close" : "Edit"}
                            </button>
                            <button
                              onClick={() => confirm(`Delete lesson "${l.title}"?`) && delLessonMut.mutate(l.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          {editingLesson === l.id && (
                            <LessonEditor
                              lesson={l}
                              onSave={(patch) => updateLesson({ data: { id: l.id, ...patch } }).then(() => { invalidate(); toast.success("Saved"); })}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                    <NewLessonInline
                      moduleId={m.id}
                      onAdd={async (title) => {
                        await createLesson({ data: { moduleId: m.id, title } });
                        invalidate();
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function LessonEditor({ lesson, onSave }: { lesson: any; onSave: (patch: any) => void }) {
  const [summary, setSummary] = useState(lesson.summary ?? "");
  const [bodyMd, setBodyMd] = useState(lesson.body_md ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson.video_url ?? "");
  const [duration, setDuration] = useState(lesson.duration_minutes?.toString() ?? "");

  return (
    <div className="bg-muted/10 border-t border-border p-4 space-y-3">
      <div>
        <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Summary</label>
        <Input value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Video URL (embed)</label>
          <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://player.vimeo.com/video/..." className="mt-1" />
        </div>
        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Duration (min)</label>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div>
        <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Body (Markdown)</label>
        <Textarea
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          className="mt-1 min-h-[200px] font-mono text-sm"
        />
      </div>
      <Button
        onClick={() =>
          onSave({
            summary: summary || null,
            body_md: bodyMd || null,
            video_url: videoUrl || null,
            duration_minutes: duration ? Number(duration) : null,
          })
        }
        className="bg-banana text-banana-foreground hover:bg-banana/90"
      >
        Save lesson
      </Button>
    </div>
  );
}

function NewLessonInline({ moduleId, onAdd }: { moduleId: string; onAdd: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div className="flex gap-2 p-3 bg-muted/10 border-t border-border">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New lesson title"
        className="flex-1"
      />
      <Button
        size="sm"
        disabled={!title.trim() || pending}
        onClick={async () => {
          setPending(true);
          try { await onAdd(title.trim()); setTitle(""); toast.success("Lesson added"); }
          catch (e: any) { toast.error(e.message); }
          finally { setPending(false); }
        }}
      >
        <Plus className="size-4 mr-1" /> Add
      </Button>
    </div>
  );
}
