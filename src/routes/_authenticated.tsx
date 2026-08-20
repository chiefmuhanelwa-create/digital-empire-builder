import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { claimMyGrants } from "@/lib/products.functions";
import { getKitWorkspace, saveKitWorkspace } from "@/lib/kit-workspace.functions";
import { mergeIntoLocal, startKitSync } from "@/lib/kit-sync";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const claimFn = useServerFn(claimMyGrants);
  const qc = useQueryClient();
  const getWorkspace = useServerFn(getKitWorkspace);
  const saveWorkspace = useServerFn(saveKitWorkspace);

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

  // Pull this buyer's kit answers down to whatever device they just opened,
  // then keep mirroring. Everything the seventeen tools write lived only in
  // this browser before — a new phone showed an empty paid product.
  useEffect(() => {
    if (loading || !user) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    getWorkspace()
      .then((res) => {
        if (cancelled) return;
        const state = (res as { state?: Record<string, unknown> } | undefined)?.state;
        mergeIntoLocal(state ?? {});
      })
      .catch(() => { /* offline or first run — local state still works */ })
      .finally(() => {
        if (cancelled) return;
        stop = startKitSync((state) => saveWorkspace({ data: { state } }));
      });
    return () => { cancelled = true; stop?.(); };
  }, [loading, user, getWorkspace, saveWorkspace]);

  if (loading || !user) {
    return (
      <div className="theme-contentpreneur min-h-screen flex items-center justify-center bg-background">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-muted-foreground">Loading…</div>
      </div>
    );
  }
  // The whole signed-in area is Contentpreneur Africa, not CHKPLT — it lives on
  // contentpreneur.africa and chkplt.com 301s every member path here. Applying
  // the brand theme at this single point re-skins every member route (see
  // .theme-contentpreneur in styles.css); the storefront keeps CHKPLT's amber
  // and slate untouched.
  return (
    <div className="theme-contentpreneur">
      <Outlet />
    </div>
  );
}
