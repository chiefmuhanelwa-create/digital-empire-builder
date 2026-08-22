import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { WorkspaceShell, BLUE, INK, BODY, MUTED, LINE, TINT } from "@/components/workspace-shell";
import { kitDeliveryReport, type Check } from "@/lib/kit-delivery.functions";
import { Check as CheckIcon, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

// FOUNDATION KIT — DELIVERY HEALTH.
//
// Answers one question that nobody could answer before without opening the
// Supabase dashboard and counting by eye: does everything this product promises
// actually reach the person who paid?
//
// Two failures had already survived weeks in the dark for exactly that reason —
// Accelerator buyers 403'ing on every workbook, and a receipt email telling
// people to start at a step that had not existed for two rebuilds. Neither was
// hard to fix. Both were impossible to notice.
export const Route = createFileRoute("/_authenticated/admin/kit-health")({
  head: () => ({ meta: [{ title: "Kit delivery health — Contentpreneur Africa" }] }),
  component: KitHealth,
});

const TONE = {
  ok:   { fg: "#15803D", bg: "#F0FDF4", Icon: CheckIcon,     word: "OK" },
  warn: { fg: "#B45309", bg: "#FFFBEB", Icon: AlertTriangle, word: "Check" },
  fail: { fg: "#B91C1C", bg: "#FEF2F2", Icon: XCircle,       word: "Broken" },
} as const;

function KitHealth() {
  const run = useServerFn(kitDeliveryReport);
  const q = useQuery({ queryKey: ["kit-health"], queryFn: () => run() });

  return (
    <WorkspaceShell>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold" style={{ color: BLUE }}>Admin</p>
            <h1 className="mt-1.5 text-[30px] font-black leading-tight" style={{ color: INK }}>
              Does the Foundation Kit actually arrive?
            </h1>
            <p className="mt-2 text-[17px] leading-relaxed" style={{ color: BODY }}>
              Every deliverable, checked against the live bucket and the live database. Read-only —
              it never repairs anything, because a repair that runs itself is one nobody understands
              the next time it fires.
            </p>
          </div>
          <button
            type="button"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-[15px] font-bold"
            style={{ border: `1px solid ${LINE}`, background: "#fff", color: INK, cursor: "pointer" }}
          >
            <RefreshCw className={`size-4 ${q.isFetching ? "animate-spin" : ""}`} /> Re-run
          </button>
        </div>

        {q.isLoading && (
          <p className="mt-10 text-[16px]" style={{ color: MUTED }}>Checking…</p>
        )}

        {q.error && (
          <div className="mt-8 rounded-2xl p-5" style={{ background: TONE.fail.bg, border: `1px solid ${TONE.fail.fg}33` }}>
            <p className="text-[16px] font-bold" style={{ color: TONE.fail.fg }}>
              {(q.error as Error).message}
            </p>
          </div>
        )}

        {q.data && (
          <>
            <div
              className="mt-8 rounded-2xl p-6"
              style={{ background: TONE[q.data.worst].bg, border: `1px solid ${TONE[q.data.worst].fg}33` }}
            >
              <p className="text-[15px] font-bold uppercase tracking-wide" style={{ color: TONE[q.data.worst].fg }}>
                {TONE[q.data.worst].word}
              </p>
              <p className="mt-1.5 text-[22px] font-black leading-tight" style={{ color: INK }}>
                {q.data.worst === "ok"
                  ? "Everything the kit promises is reachable."
                  : q.data.worst === "warn"
                    ? "It works, but something below is not what the sales page says."
                    : "Something a buyer paid for does not reach them."}
              </p>
              <p className="mt-2 text-[16px]" style={{ color: BODY }}>
                {q.data.toolCount} tools in the catalogue.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {q.data.checks.map((c: Check) => {
                const t = TONE[c.level];
                return (
                  <div key={c.id} className="rounded-2xl p-5" style={{ border: `1px solid ${LINE}` }}>
                    <div className="flex items-start gap-3">
                      <t.Icon className="mt-0.5 size-5 shrink-0" style={{ color: t.fg }} />
                      <div className="min-w-0">
                        <div className="text-[17px] font-bold" style={{ color: INK }}>{c.label}</div>
                        <p className="mt-1 break-words text-[16px] leading-relaxed" style={{ color: BODY }}>
                          {c.detail}
                        </p>
                        {c.fix && (
                          <p className="mt-2.5 rounded-lg p-3 text-[15px] leading-relaxed"
                             style={{ background: TINT, color: INK }}>
                            {c.fix}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </WorkspaceShell>
  );
}
