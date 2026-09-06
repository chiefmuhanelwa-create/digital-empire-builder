import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { useKitAccess } from "@/lib/use-kit-access";
import { DEFAULT_PLAN, EVIDENCE_NOTE, checkEdit, editVerdict, type EditPlan } from "@/lib/edit-brief";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Copy, Check, AlertTriangle, X, Scissors } from "lucide-react";

export const Route = createFileRoute("/_authenticated/apps/edit-brief")({
  head: () => ({ meta: [{ title: "Edit Brief — Contentpreneur Africa" }] }),
  component: Page,
});

function Page() {
  const { access, loading } = useKitAccess();
  if (loading) return <Shell><div className="py-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!access) return <Locked />;
  return <Tool />;
}

function Tool() {
  const [p, setP] = useState<EditPlan>(DEFAULT_PLAN);
  const set = <K extends keyof EditPlan>(k: K, v: EditPlan[K]) => setP((s) => ({ ...s, [k]: v }));

  const checks = useMemo(() => checkEdit(p), [p]);
  const verdict = useMemo(() => editVerdict(checks), [checks]);

  const tone = { fail: "border-destructive/50 bg-destructive/5", warn: "border-amber-500/40 bg-amber-500/5", pass: "border-emerald-500/40 bg-emerald-500/5" }[verdict.state];

  const brief = useMemo(
    () =>
      `EDIT BRIEF\n\nRuntime        ${p.runtimeSeconds}s\nFirst cut      ${p.firstCutSeconds}s (zero cuts in the first 3s)\nCut rate       ${p.cutsPerMinute}/min after the hook\nMusic          ${p.musicFromFrameOne ? "from frame one" : "NOT from frame one — fix this"}, no pause over ${p.longestSilence}s\nCards          under ${p.cardsPercent}% of runtime, never at a retention-critical beat\nOpening        ${p.opensTight ? "tight, face filling frame" : "WIDE — tighten it"}, ${p.opensSecondPerson ? "second person, about the viewer" : "FIRST PERSON — rewrite to accuse the viewer"}\nCTA            ${p.faceInFrameForCta ? "face in frame" : "face NOT in frame — fix this"}\n\n${checks.filter((c) => c.state !== "pass").map((c) => `· ${c.label}: ${c.detail}`).join("\n")}\n\n${EVIDENCE_NOTE}`,
    [p, checks],
  );

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Edit brief</h1>
          <p className="text-muted-foreground max-w-2xl">
            Check the cut before you make it. Runtime, first cut, cut rate, where the face is —
            the things that separated the two reels that held attention from the three that did not.
          </p>
        </header>

        <div className="rounded-lg border border-dashed p-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Where these numbers come from.</strong> {EVIDENCE_NOTE}{" "}
            Instagram does not expose a retention curve through its API, so completion here is average
            watch time over runtime — blunter than a real curve. Test it against your own posts and
            when yours disagree, yours win.
          </p>
        </div>

        <section className="rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold">The plan</h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <F label="Runtime (seconds)"><Input type="number" min="5" max="600" value={p.runtimeSeconds} onChange={(e) => set("runtimeSeconds", Number(e.target.value) || 0)} /></F>
            <F label="First cut (seconds)"><Input type="number" min="0" step="0.1" value={p.firstCutSeconds} onChange={(e) => set("firstCutSeconds", Number(e.target.value) || 0)} /></F>
            <F label="Cuts per minute"><Input type="number" min="0" max="60" value={p.cutsPerMinute} onChange={(e) => set("cutsPerMinute", Number(e.target.value) || 0)} /></F>
            <F label="Longest silence (seconds)"><Input type="number" min="0" step="0.1" value={p.longestSilence} onChange={(e) => set("longestSilence", Number(e.target.value) || 0)} /></F>
            <F label="Full-screen cards (% of runtime)"><Input type="number" min="0" max="100" value={p.cardsPercent} onChange={(e) => set("cardsPercent", Number(e.target.value) || 0)} /></F>
          </div>

          <div className="space-y-2 pt-1">
            <Toggle checked={p.opensSecondPerson} onChange={(v) => set("opensSecondPerson", v)}
              label="The spoken opening is about the viewer, not about me"
              hint="“You are accepting R750 for brand deals worth R15,000.” Your own loss lands around ten seconds in, not at zero." />
            <Toggle checked={p.opensTight} onChange={(v) => set("opensTight", v)}
              label="Opens tight — face filling the frame" hint="No establishing shot, no room." />
            <Toggle checked={p.musicFromFrameOne} onChange={(v) => set("musicFromFrameOne", v)}
              label="Music from frame one" hint="Never silence, anywhere." />
            <Toggle checked={p.faceInFrameForCta} onChange={(v) => set("faceInFrameForCta", v)}
              label="Face in frame for the ask" hint="The audience leaves when the face leaves." />
          </div>
        </section>

        <section className={`rounded-lg border p-5 space-y-3 ${tone}`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">{verdict.headline}</h2>
            <span className="text-sm tabular-nums text-muted-foreground shrink-0">{verdict.passes}/{verdict.total}</span>
          </div>

          <div className="space-y-2">
            {checks.map((c) => (
              <div key={c.id} className="rounded-md border bg-background p-3">
                <p className="flex items-start gap-2 text-sm font-medium">
                  {c.state === "pass"
                    ? <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    : c.state === "warn"
                      ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      : <X className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />}
                  {c.label}
                </p>
                <p className="text-sm mt-1 ml-6">{c.detail}</p>
                <p className="text-[11px] mt-1 ml-6 text-muted-foreground tabular-nums">{c.evidence}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Hand this to the edit</h2>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(brief); toast.success("Copied"); }}>
              <Copy className="mr-1 h-3.5 w-3.5" />Copy
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-xs font-mono bg-muted/40 rounded-md p-4 overflow-x-auto">{brief}</pre>
        </section>
      </div>
    </Shell>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader /><main className="flex-1">{children}</main><SiteFooter />
    </div>
  );
}

function Locked() {
  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-3">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Edit brief</h1>
        <p className="text-muted-foreground">
          Part of the Foundation Kit. Check the cut against what actually held attention.
        </p>
        <Button asChild><a href="/foundation"><Scissors className="mr-1 h-4 w-4" />Get the Foundation Kit</a></Button>
      </div>
    </Shell>
  );
}
