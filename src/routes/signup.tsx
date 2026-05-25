import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Join — Christ Kingdom Platform" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Google sign-in failed.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 pt-20 pb-16">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Join</div>
        <h1 className="mt-4 font-display text-5xl">Join the Kingdom.</h1>

        <Button onClick={onGoogle} variant="outline" className="mt-10 w-full">Continue with Google</Button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-banana text-banana-foreground hover:bg-banana/90">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-banana">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
