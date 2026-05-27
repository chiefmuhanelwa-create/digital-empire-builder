import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { exportMyData, requestAccountDeletion } from "@/lib/account.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Your Account — Christ Kingdom Platform" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const exportFn = useServerFn(exportMyData);
  const deleteFn = useServerFn(requestAccountDeletion);
  const [confirmText, setConfirmText] = useState("");

  const exportMut = useMutation({
    mutationFn: exportFn,
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chkplt-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been exported.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteFn,
    onSuccess: async () => {
      toast.success("Your account has been deleted.");
      await supabase.auth.signOut();
      navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
          Your account
        </div>
        <h1 className="mt-4 font-display text-5xl">Privacy &amp; Data Rights</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Signed in as <span className="text-foreground">{user?.email}</span>.
        </p>

        <div className="mt-12 border border-border p-6">
          <h2 className="font-display text-2xl">Download my data</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get a portable JSON copy of your profile, subscriber record,
            orders, and order items.
          </p>
          <Button
            onClick={() => exportMut.mutate(undefined)}
            disabled={exportMut.isPending}
            className="mt-5 bg-banana text-banana-foreground hover:bg-banana/90"
          >
            {exportMut.isPending ? "Preparing…" : "Download JSON"}
          </Button>
        </div>

        <div className="mt-8 border border-destructive/40 p-6">
          <h2 className="font-display text-2xl text-destructive">
            Delete my account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We permanently wipe your profile, subscriber row, marketing tags,
            and personal details on every order. Anonymized financial rows are
            retained for mandatory tax and corporate compliance — they no
            longer carry your name, email, or phone.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Type <span className="font-mono text-foreground">delete my account</span>{" "}
            below to confirm. This cannot be undone.
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete my account"
            className="mt-3 max-w-sm"
          />
          <Button
            variant="destructive"
            disabled={
              confirmText.trim().toLowerCase() !== "delete my account" ||
              deleteMut.isPending
            }
            onClick={() => deleteMut.mutate(undefined)}
            className="mt-4"
          >
            {deleteMut.isPending ? "Deleting…" : "Permanently delete account"}
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
