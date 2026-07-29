import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { sendOpsAlert } from "@/lib/alerts";
import { toast } from "sonner";

const listIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await supabaseAdmin
      .from("incidents")
      .select("id,message,endpoint,severity,user_id,meta,resolved_at,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

const resolveIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabaseAdmin
      .from("incidents")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Bypasses reportError()/the incidents table entirely — a unique endpoint per
// click means sendOpsAlert's own dedup (which queries incidents by endpoint)
// never suppresses it, and no fake "critical" row clutters real triage later.
// Exists so the founder (or a future maintainer) can confirm the alert
// pipeline itself still works — e.g. after rotating the Resend API key —
// without needing to fake a webhook signature or wait for a real failure.
const sendTestAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    await sendOpsAlert({
      endpoint: `admin-test-alert-${Date.now()}`,
      severity: "critical",
      message: "This is a test alert triggered manually from /admin/incidents — if you got this, the alert pipeline works.",
    });
    return { ok: true };
  });

export const Route = createFileRoute("/_authenticated/admin/incidents")({
  head: () => ({ meta: [{ title: "Incidents — Admin" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: IncidentsPage,
});

function sevColor(s: string) {
  if (s === "critical") return "text-destructive";
  if (s === "warning") return "text-banana";
  return "text-muted-foreground";
}

function IncidentsPage() {
  const fn = useServerFn(listIncidents);
  const resFn = useServerFn(resolveIncident);
  const testFn = useServerFn(sendTestAlert);
  const q = useQuery({ queryKey: ["incidents"], queryFn: () => fn() });
  const m = useMutation({
    mutationFn: resFn,
    onSuccess: () => q.refetch(),
  });
  const testM = useMutation({
    mutationFn: testFn,
    onSuccess: () => toast.success("Test alert sent — check the ops inbox (OPS_ALERT_EMAIL)."),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          Admin · Incidents
        </div>
        <h1 className="mt-4 font-display text-5xl">The Watchman</h1>
        <p className="mt-4 text-sm text-muted-foreground max-w-2xl">
          Operational fractures caught the moment they happen. Every error
          reported through reportError() is journaled here for triage —
          "critical" ones also email OPS_ALERT_EMAIL directly (src/lib/alerts.ts).
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => testM.mutate(undefined)}
          disabled={testM.isPending}
        >
          {testM.isPending ? "Sending…" : "Send test alert"}
        </Button>

        {q.isLoading && (
          <div className="mt-10 text-sm text-muted-foreground">Loading…</div>
        )}

        {q.data && (
          <div className="mt-10 space-y-px bg-border">
            {q.data.rows.map((i) => (
              <div key={i.id} className="bg-background p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.2em] uppercase">
                      <span className={sevColor(i.severity)}>{i.severity}</span>
                      <span className="text-muted-foreground">
                        {new Date(i.created_at).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground truncate">
                        {i.endpoint ?? "—"}
                      </span>
                      {i.resolved_at && (
                        <span className="text-emerald-500">resolved</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm break-words">{i.message}</div>
                    {i.meta && (
                      <pre className="mt-2 text-[10px] text-muted-foreground overflow-x-auto bg-muted/30 p-2 max-h-32">
                        {JSON.stringify(i.meta, null, 2)}
                      </pre>
                    )}
                  </div>
                  {!i.resolved_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => m.mutate({ data: { id: i.id } })}
                      disabled={m.isPending}
                    >
                      Mark resolved
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {q.data.rows.length === 0 && (
              <div className="bg-background p-12 text-center text-sm text-muted-foreground">
                No incidents recorded. The watchman stands quiet.
              </div>
            )}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
