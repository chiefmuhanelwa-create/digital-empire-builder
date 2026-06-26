import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/member-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { requestAccountDeletion } from "@/lib/account.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Your account — CHKPLT" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteFn = useServerFn(requestAccountDeletion);

  const [name, setName] = useState((user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [password, setPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const saveName = async () => {
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSavingName(false);
    if (error) toast.error(error.message);
    else toast.success("Name updated.");
  };

  const savePassword = async () => {
    if (password.length < 8) { toast.error("Use at least 8 characters."); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPw(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated."); setPassword(""); }
  };

  const deleteMut = useMutation({
    mutationFn: deleteFn,
    onSuccess: async () => {
      toast.success("Your account has been closed.");
      await supabase.auth.signOut();
      navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 sm:px-6 pt-12 pb-16">
        <p className="nx-label">Account</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Your account.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Signed in as <span className="text-foreground font-medium">{user?.email}</span>.
        </p>

        {/* Your details */}
        <div className="nx-card !p-6 mt-8">
          <h2 className="font-display text-xl">Your details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="mt-1.5 opacity-70" />
              <p className="mt-1 text-xs text-muted-foreground">Your email is your login — contact us if you need to change it.</p>
            </div>
            <Button onClick={saveName} disabled={savingName} className="cta-glow">
              {savingName ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="nx-card !p-6 mt-6">
          <h2 className="font-display text-xl">Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Set a new password for signing in.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <Label htmlFor="pw">New password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="mt-1.5" />
            </div>
            <Button onClick={savePassword} disabled={savingPw || !password} className="cta-glow shrink-0">
              {savingPw ? "Updating…" : "Update password"}
            </Button>
          </div>
        </div>

        {/* Close account */}
        <div className="rounded-2xl border border-destructive/40 p-6 mt-6">
          <h2 className="font-display text-xl text-destructive">Close my account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This permanently removes your profile and personal details. You'll lose access to anything you've
            unlocked. (We keep anonymised payment records only where the law requires — they no longer carry your
            name, email, or phone.) This can't be undone.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Type <span className="font-mono text-foreground">delete my account</span> to confirm.
          </p>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="delete my account" className="mt-3 max-w-sm" />
          <Button
            variant="destructive"
            disabled={confirmText.trim().toLowerCase() !== "delete my account" || deleteMut.isPending}
            onClick={() => deleteMut.mutate(undefined)}
            className="mt-4"
          >
            {deleteMut.isPending ? "Closing…" : "Permanently close account"}
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
