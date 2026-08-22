import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { myPurchases } from "@/lib/products.functions";
import { WorkspaceShell, BLUE, BLUE_DARK, INK, BODY, MUTED, LINE, TINT } from "@/components/workspace-shell";
import { STAGES as ACCEL_STAGES, STAGE_COUNT, readGates, writeGates, nextStage } from "@/lib/accelerator-stages";
import { toolBySlug } from "@/lib/kit-catalog";
import { Lock, ArrowRight, Check, ChevronDown, BookOpen } from "lucide-react";

// THE ACCELERATOR WORKSPACE.
//
// Until now a $997 buyer had nowhere to land. There was no accelerator route at
// all, so they fell through to the generic /learn index — a list of modules with
// no indication of what they had bought, where they were, or what came next. The
// $97 tier had a workspace. The $997 tier had a course listing.
//
// What this page deliberately does NOT do:
//   • It does not show a cohort. No cohort has run — there is no group, no
//     schedule and no room, and putting a card here promising one would repeat
//     the exact failure this rebuild exists to correct.
//   • It does not promise that anybody reviews your gate artifact. Offer Review
//     is not built. The gates are self-marked, and the page says so plainly.
//
// What it does: names the stage they are on, the artifact that opens the next
// one, and the tools that produce it. The gate is the product.
const SLUG = "contentpreneur-90day-cohort";

export const Route = createFileRoute("/_authenticated/dashboard/accelerator")({
  head: () => ({ meta: [{ title: "The Accelerator — Contentpreneur Africa" }] }),
  component: AcceleratorWorkspace,
});

/** Access to THIS workspace requires the Accelerator itself — a kit grant is not enough. */
function useAcceleratorAccess() {
  const { user } = useAuth();
  const purchasesFn = useServerFn(myPurchases);

  const isAdminQ = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });

  const purchasesQ = useQuery({
    queryKey: ["my-purchases"],
    enabled: !!user?.id,
    queryFn: () => purchasesFn(),
  });

  const grants = (purchasesQ.data?.grants ?? []) as Array<{ product: { slug: string } | null }>;
  return {
    access: grants.some((g) => g.product?.slug === SLUG) || isAdminQ.data === true,
    loading: (isAdminQ.isLoading || purchasesQ.isLoading) && !!user?.id,
  };
}

function AcceleratorWorkspace() {
  const { access, loading } = useAcceleratorAccess();
  const [cleared, setCleared] = useState<number[]>([]);

  // localStorage is only readable after mount — reading it during render would
  // mismatch the server-rendered HTML and blank the page on hydration.
  useEffect(() => setCleared(readGates()), []);

  function toggle(n: number) {
    const next = cleared.includes(n) ? cleared.filter((x) => x !== n) : [...cleared, n];
    setCleared(next);
    writeGates(next);
  }

  if (loading) {
    return (
      <WorkspaceShell>
        <div className="py-32 text-center text-[16px]" style={{ color: MUTED }}>Loading…</div>
      </WorkspaceShell>
    );
  }

  if (!access) {
    return (
      <WorkspaceShell>
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <Lock className="size-10 mx-auto" style={{ color: MUTED }} />
          <h1 className="mt-5 text-[32px] font-black leading-tight" style={{ color: INK }}>
            This workspace is part of the Accelerator.
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed" style={{ color: BODY }}>
            Applications are read by a person, and the entry requirement is honest: you have sent an
            offer to somebody real and they answered.
          </p>
          <a href="/accelerator" className="mt-7 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
             style={{ background: BLUE, color: "#fff", textDecoration: "none" }}>
            See the Accelerator <ArrowRight className="size-4" />
          </a>
        </main>
      </WorkspaceShell>
    );
  }

  const next = nextStage(cleared);

  return (
    <WorkspaceShell>
      <main className="mx-auto max-w-3xl px-5 py-10">

        <section>
          <p className="text-[15px] font-semibold" style={{ color: BLUE }}>The Accelerator</p>
          <h1 className="mt-2 text-[30px] sm:text-[38px] font-black leading-[1.1]" style={{ color: INK }}>
            Seven stages. Seven gates you cannot skip.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed" style={{ color: BODY }}>
            The Foundation Kit taught the delivery — driver, cargo, and the moment money moves. This
            builds everything that turns one delivery into a route that runs: the fuel, the vehicle,
            the roads, the depot and the ledger.
          </p>
          <p className="mt-3 text-[17px] leading-relaxed" style={{ color: BODY }}>
            You do not advance because a week passed.{" "}
            <strong style={{ color: INK }}>You advance because you produced the artifact.</strong>
          </p>
        </section>

        {/* ── the one next thing */}
        {next ? (
          <section className="mt-7 rounded-2xl p-6 sm:p-7" style={{ background: TINT, border: `1px solid ${LINE}` }}>
            <p className="text-[15px] font-semibold" style={{ color: BLUE }}>
              {cleared.length === 0 ? "Start here" : `Stage ${next.n} of ${STAGE_COUNT}`} · {next.element}
            </p>
            <h2 className="mt-2 text-[26px] sm:text-[30px] font-black leading-tight" style={{ color: INK }}>
              {next.title}
            </h2>
            <p className="mt-3 text-[17px] italic leading-relaxed" style={{ color: BODY }}>
              {next.question}
            </p>
            <p className="mt-4 text-[16px] leading-relaxed" style={{ color: BODY }}>
              <strong style={{ color: INK }}>The gate:</strong> {next.gate}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`/learn/${SLUG}`}
                 className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
                 style={{ background: BLUE, color: "#fff", textDecoration: "none" }}
                 onMouseOver={(e) => (e.currentTarget.style.background = BLUE_DARK)}
                 onMouseOut={(e) => (e.currentTarget.style.background = BLUE)}>
                Open the lessons <ArrowRight className="size-4" />
              </a>
              {next.tools[0] && (
                <a href={`/apps/${next.tools[0]}`}
                   className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[16px] font-bold"
                   style={{ border: `1px solid ${LINE}`, color: INK, textDecoration: "none" }}>
                  Open {toolBySlug(next.tools[0])?.name ?? "the tool"}
                </a>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-7 rounded-2xl p-6" style={{ background: TINT, border: `1px solid ${LINE}` }}>
            <h2 className="text-[26px] font-black leading-tight" style={{ color: INK }}>
              Every gate is behind you.
            </h2>
            <p className="mt-2 text-[17px]" style={{ color: BODY }}>
              A driver, cargo, fuel, a vehicle, roads you chose, a depot you own and a ledger that
              balances. That is the whole truck. Now run it.
            </p>
          </section>
        )}

        {/* ── the seven */}
        <section className="mt-9">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[22px] font-black" style={{ color: INK }}>The seven stages</h2>
            <span className="text-[15px]" style={{ color: MUTED }}>
              {cleared.length} of {STAGE_COUNT} gates cleared
            </span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: MUTED }}>
            You mark your own gates. Nobody is watching — which means the only person you can cheat
            here is the one paying for it.
          </p>
          <div className="mt-4 space-y-3">
            {ACCEL_STAGES.map((s) => (
              <StageRow
                key={s.n}
                stage={s}
                done={cleared.includes(s.n)}
                isNext={next?.n === s.n}
                onToggle={() => toggle(s.n)}
              />
            ))}
          </div>
        </section>

        <section className="mt-9 rounded-2xl p-6" style={{ border: `1px solid ${LINE}` }}>
          <div className="flex items-center gap-2">
            <BookOpen className="size-5" style={{ color: BLUE }} />
            <h2 className="text-[18px] font-bold" style={{ color: INK }}>The lessons</h2>
          </div>
          <p className="mt-2 text-[16px] leading-relaxed" style={{ color: BODY }}>
            Written lessons across all seven stages, plus every tool the Foundation Kit has. Nothing
            is held back from you — a higher tier should never contain less than the one below it.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={`/learn/${SLUG}`} className="text-[15px] font-semibold"
               style={{ color: BLUE, textDecoration: "none" }}>
              Open the curriculum →
            </a>
            <a href="/dashboard/foundation-kit" className="text-[15px] font-semibold"
               style={{ color: BLUE, textDecoration: "none" }}>
              Open the tools →
            </a>
          </div>
        </section>

      </main>
    </WorkspaceShell>
  );
}

function StageRow({
  stage, done, isNext, onToggle,
}: {
  stage: (typeof ACCEL_STAGES)[number];
  done: boolean;
  isNext: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl" style={{ border: `1px solid ${isNext ? BLUE : LINE}`, background: "#fff" }}>
      <div className="flex items-start gap-3 p-4">
        {/* The gate checkbox is the primary control on this page — it is the
            thing that moves you through the programme. */}
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={`Mark stage ${stage.n} gate ${done ? "not cleared" : "cleared"}`}
          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md"
          style={{
            background: done ? BLUE : "#fff",
            border: `1px solid ${done ? BLUE : LINE}`,
          }}
        >
          {done && <Check className="size-4" style={{ color: "#fff" }} />}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
              Stage {stage.n} · {stage.element}
            </span>
          </div>
          <div className="mt-0.5 text-[17px] font-bold leading-snug" style={{ color: INK }}>
            {stage.title}
          </div>
          <div className="mt-1 text-[15px] leading-relaxed" style={{ color: BODY }}>
            {stage.gate}
          </div>
        </button>
        <ChevronDown
          className="mt-1 size-5 shrink-0 transition-transform"
          style={{ color: MUTED, transform: open ? "rotate(180deg)" : "none" }}
        />
      </div>

      {open && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <p className="mt-3 text-[15px] italic" style={{ color: BODY }}>{stage.question}</p>
          {stage.tools.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {stage.tools.map((slug) => {
                const t = toolBySlug(slug);
                if (!t) return null;
                return (
                  <a key={slug} href={`/apps/${slug}`}
                     className="rounded-lg px-3 py-1.5 text-[14px] font-semibold"
                     style={{ background: TINT, color: BLUE, textDecoration: "none" }}>
                    {t.name}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
