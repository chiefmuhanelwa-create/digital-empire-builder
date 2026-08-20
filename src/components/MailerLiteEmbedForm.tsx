import { useEffect } from "react";

const MAILERLITE_ACCOUNT_ID = "2399736";

declare global {
  interface Window {
    ml?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

// Loads MailerLite's universal embed script once per page and renders a
// native MailerLite form by its slug (the `data-form` code from MailerLite's
// own embed snippet, e.g. "v3XiMi"). Delivery of whatever the form promises
// is entirely MailerLite's responsibility from here — the form must be
// active and have a real automation attached in the MailerLite dashboard.
export function MailerLiteEmbedForm({ formSlug }: { formSlug: string }) {
  useEffect(() => {
    if (window.ml) return;
    const w = window as unknown as Record<string, unknown>;
    w.ml =
      w.ml ||
      function (...args: unknown[]) {
        ((w.ml as { q?: unknown[] }).q = (w.ml as { q?: unknown[] }).q || []).push(args);
      };
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://assets.mailerlite.com/js/universal.js";
    document.head.appendChild(script);
    // `w.ml` was just assigned above, so read it from `w` rather than casting
    // `window.ml` (typed optional) through undefined — that cast was the only
    // TypeScript error left in the repo.
    (w.ml as (...args: unknown[]) => void)("account", MAILERLITE_ACCOUNT_ID);
  }, []);

  return <div className="ml-embedded" data-form={formSlug} />;
}
