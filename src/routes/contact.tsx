import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { TurnstileGate } from "@/components/TurnstileGate";
import { submitContact } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — CHKPLT" },
      { name: "description", content: "Send us a message. We reply within 48 hours." },
      { property: "og:title", content: "Contact — CHKPLT" },
      { property: "og:description", content: "Send us a message. We reply within 48 hours." },
    ],
  }),
  component: ContactPage,
});

const inputCls =
  "w-full bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-banana transition-colors";

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tsToken, setTsToken] = useState<string | null>(null);

  const fn = useServerFn(submitContact);
  const mut = useMutation({
    mutationFn: fn,
    onSuccess: () => {
      setName(""); setEmail(""); setSubject(""); setMessage("");
    },
    onError: (e: Error) => toast.error(e.message ?? "Something went wrong. Try again."),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto max-w-2xl px-6 pt-24 pb-24">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Contact</div>
        <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[1.05]">Talk to us.</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Questions about the Foundation Kit, the Accelerator PRO, or anything else — send it here. We reply within 48 hours.
        </p>

        {mut.isSuccess ? (
          <div className="mt-12 border-2 border-banana/40 bg-banana/5 p-8 text-center">
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Received</div>
            <h2 className="mt-3 font-display text-3xl">Message received.</h2>
            <p className="mt-3 text-muted-foreground">We'll reply within 48 hours. Check your inbox.</p>
          </div>
        ) : (
          <form
            className="mt-12 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate({
                data: {
                  name,
                  email,
                  subject: subject || undefined,
                  message,
                  turnstileToken: tsToken ?? undefined,
                },
              });
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                  Full name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                Subject (optional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Foundation Kit question"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                Message *
              </label>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here…"
                className={`${inputCls} resize-none`}
              />
            </div>

            <TurnstileGate onToken={setTsToken} />

            <Button
              type="submit"
              size="lg"
              disabled={mut.isPending || !tsToken}
              className="cta-glow w-full h-auto py-4 text-sm font-bold tracking-wide"
            >
              {mut.isPending ? "Sending…" : "Send message →"}
            </Button>
          </form>
        )}

        <div className="mt-16 pt-8 border-t border-border/40 text-sm text-muted-foreground">
          Or reach us directly:{" "}
          <a href="mailto:info@nochill.co.za" className="text-banana underline underline-offset-2">
            info@nochill.co.za
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
