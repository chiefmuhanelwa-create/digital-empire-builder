import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { claimMyGrants } from "@/lib/products.functions";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const claimFn = useServerFn(claimMyGrants);
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Link any email-only purchases to this account, then refresh access state.
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    claimFn()
      .then((res: { linked: number }) => {
        if (!cancelled && res?.linked > 0) {
          qc.invalidateQueries({ queryKey: ["my-purchases"] });
        }
      })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, [loading, user, claimFn, qc]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-muted-foreground">Loading…</div>
      </div>
    );
  }
  return <Outlet />;
}
