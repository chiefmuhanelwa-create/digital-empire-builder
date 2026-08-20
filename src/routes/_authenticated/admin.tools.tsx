// Tools Hub insights. Answers the two questions that had no answer before:
// how many people opened each tool, and how many actually got a result out of
// it — plus what that converted into (emails captured, results delivered).
//
// Three independent sources, joined per tool slug:
//   tool_events    — view / start / complete / lead  (new this session)
//   subscribers    — leads whose first touch was a tool (source = 'tool:<slug>')
//   email_send_log — results actually delivered (label = '<tool>_result')
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SiteHeader, SiteFooter } from "@/components/admin-shell";

const TOOLS: { slug: string; name: string; emailLabel?: string }[] = [
  { slug: "rate-card", name: "Rate Card Calculator", emailLabel: "rate_card_result" },
  { slug: "media-kit", name: "Media Kit Builder", emailLabel: "media_kit_result" },
  { slug: "hook-generator", name: "Hook Generator", emailLabel: "hook_generator_result" },
  { slug: "offer-builder", name: "Offer Builder", emailLabel: "offer_builder_result" },
  {
    slug: "provisional-tax",
    name: "Provisional Tax Calculator",
    emailLabel: "provisional_tax_result",
  },
  { slug: "tax-guide", name: "Creator Tax Starter (free guide)" },
  { slug: "sars-calculator", name: "SARS 25% Reserve Calculator" },
  { slug: "niche-clarity", name: "Niche Clarity Builder" },
  { slug: "align-accelerate-excel", name: "Align · Accelerate · Excel" },
  { slug: "tools-hub", name: "Tools Hub (index)" },
];

const getToolInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ days: z.number().int().min(1).max(365) }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();

    const [events, subs, sends] = await Promise.all([
      supabaseAdmin
        .from("tool_events")
        .select("tool_slug,event,session_id")
        .gte("created_at", since),
      supabaseAdmin
        .from("subscribers")
        .select("source,created_at")
        .like("source", "tool:%")
        .gte("created_at", since),
      supabaseAdmin.from("email_send_log").select("template_name,status").gte("created_at", since),
    ]);

    // Aggregate in JS rather than SQL: the volumes here are small, and one
    // shape change shouldn't need a migration.
    const rows = TOOLS.map((t) => {
      const mine = (events.data ?? []).filter((e) => e.tool_slug === t.slug);
      const count = (evt: string) => mine.filter((e) => e.event === evt).length;
      // Counts distinct sessions, but a row with NO session still counts as one
      // rather than vanishing. The first version dropped them, which would have
      // reported 0 visitors while three real events sat in the table — any
      // browser that blocks storage or runs outside a secure context lands here.
      const uniq = (evt: string) => {
        const rows = mine.filter((e) => e.event === evt);
        const sessions = new Set(rows.filter((e) => e.session_id).map((e) => e.session_id)).size;
        const sessionless = rows.filter((e) => !e.session_id).length;
        return sessions + sessionless;
      };

      const leads = (subs.data ?? []).filter((s) => s.source === `tool:${t.slug}`).length;
      const delivered = t.emailLabel
        ? (sends.data ?? []).filter((s) => s.template_name === t.emailLabel && s.status === "sent")
            .length
        : null;

      const visitors = uniq("view");
      const completed = uniq("complete");
      return {
        slug: t.slug,
        name: t.name,
        views: count("view"),
        visitors,
        started: uniq("start"),
        completed,
        leads,
        delivered,
        // "how many visited vs how many calculated" — the founder's actual question
        completionRate: visitors > 0 ? Math.round((completed / visitors) * 100) : null,
        leadRate: completed > 0 ? Math.round((leads / completed) * 100) : null,
      };
    });

    const anyEvents = (events.data ?? []).length > 0;
    return { rows, anyEvents, since };
  });

export const Route = createFileRoute("/_authenticated/admin/tools")({
  component: AdminToolsPage,
});

function AdminToolsPage() {
  const [days, setDays] = useState(30);
  const fn = useServerFn(getToolInsights);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-tool-insights", days],
    queryFn: () => fn({ data: { days } }),
  });

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              Tools insights
            </h1>
            <p className="mt-1 text-sm text-[#6E685C]">
              Who opened each tool, who got a result, and what it turned into.
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                  days === d
                    ? "border-[#0F172A] bg-[var(--obsidian)] text-white"
                    : "border-slate-200 text-[#6E685C] hover:border-slate-400"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {isLoading && <p className="mt-8 text-sm text-slate-500">Loading…</p>}
        {error && <p className="mt-8 text-sm text-red-600">{(error as Error).message}</p>}

        {data && !data.anyEvents && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>No events recorded yet.</strong> Tracking went live with this deploy — views and
            completions only start counting from now, so this table stays empty until real visitors
            come through. Leads and delivered columns read from existing data and may already show
            numbers.
          </div>
        )}

        {data && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Tool</th>
                  <th className="px-4 py-3 font-bold">Visitors</th>
                  <th className="px-4 py-3 font-bold">Views</th>
                  <th className="px-4 py-3 font-bold">Started</th>
                  <th className="px-4 py-3 font-bold">Got a result</th>
                  <th className="px-4 py-3 font-bold">Completion</th>
                  <th className="px-4 py-3 font-bold">Leads</th>
                  <th className="px-4 py-3 font-bold">Delivered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rows.map((r) => (
                  <tr key={r.slug} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{r.name}</td>
                    <td className="px-4 py-3 tabular-nums">{r.visitors}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-500">{r.views}</td>
                    <td className="px-4 py-3 tabular-nums">{r.started}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold">{r.completed}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.completionRate == null ? (
                        <span className="text-[#C8C2B4]">—</span>
                      ) : (
                        `${r.completionRate}%`
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-[#B45309]">
                      {r.leads}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.delivered == null ? (
                        <span className="text-[#C8C2B4]">n/a</span>
                      ) : (
                        r.delivered
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          <strong>Visitors</strong> de-duplicates by anonymous session, <strong>Views</strong>{" "}
          counts every open. <strong>Started</strong> = first real interaction.{" "}
          <strong>Got a result</strong> = the tool produced its output. <strong>Leads</strong>{" "}
          counts subscribers whose first touch was that tool, so a person who already existed on the
          list is not double-counted.
          <strong> Delivered</strong> counts result emails Resend confirmed as sent.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
