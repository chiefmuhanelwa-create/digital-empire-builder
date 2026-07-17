import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileGate } from "@/components/TurnstileGate";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Join the Contentpreneur Accelerator — CHKPLT" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tsToken, setTsToken] = useState<string | null>(null);

  const onSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!tsToken) { toast.error("Please complete the security check."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Check your email to confirm your account.");
    navigate({ to: "/login" });
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
            <div className="nx-label text-center mb-2">Secure your seat</div>
            <h1 className="font-display text-3xl sm:text-4xl text-center tracking-tight">
              Join the <em className="text-banana not-italic">Kingdom.</em>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Contentpreneur Accelerator PRO · Kingdom Business Programme
            </p>

            <Button
              onClick={onGoogle}
              variant="outline"
              className="mt-8 w-full h-12 border-border/60 hover:border-banana/40 hover:text-banana font-semibold"
            >
              Continue with Google
            </Button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <div className="h-px flex-1 bg-border" /> or create with email <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="h-12" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" className="h-12" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className="h-12" />
              </div>
              <TurnstileGate onToken={setTsToken} className="pt-1" />
              <Button type="submit" disabled={loading || !tsToken} className="cta-glow w-full h-12 font-bold">
                {loading ? "Creating account…" : "Create account →"}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-banana font-semibold hover:text-banana/80 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
            By creating an account you agree to our{" "}
            <Link to="/terms" className="text-banana/80 hover:text-banana">Terms</Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-banana/80 hover:text-banana">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
