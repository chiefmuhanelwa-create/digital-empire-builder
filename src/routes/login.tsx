import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileGate } from "@/components/TurnstileGate";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — CHKPLT" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tsToken, setTsToken] = useState<string | null>(null);

  const onSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!tsToken) { toast.error("Please complete the security check."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back.");
    navigate({ to: "/dashboard" });
  };

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast.error("Google sign-in failed.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="auth-card">
            <div className="nx-label text-center mb-2">Sign in</div>
            <h1 className="font-display text-3xl sm:text-4xl text-center tracking-tight">
              Welcome back.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Your courses and purchases are waiting.
            </p>

            <Button
              onClick={onGoogle}
              variant="outline"
              className="mt-8 w-full h-12 border-border/60 hover:border-banana/40 hover:text-banana font-semibold"
            >
              Continue with Google
            </Button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <div className="h-px flex-1 bg-border" /> or sign in with email <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/reset-password" className="text-xs text-muted-foreground hover:text-banana transition-colors">Forgot password?</Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" />
              </div>
              <TurnstileGate onToken={setTsToken} className="pt-1" />
              <Button type="submit" disabled={loading || !tsToken} className="cta-glow w-full h-12 font-bold">
                {loading ? "Signing in…" : "Sign in →"}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground text-center">
              New here?{" "}
              <Link to="/signup" className="text-banana font-semibold hover:text-banana/80 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
