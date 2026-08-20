import { createFileRoute, redirect } from "@tanstack/react-router";

// Short, sayable alias for the provisional tax calculator — "chkplt.com/tax".
// A video CTA has to be something a viewer can hear once and type correctly;
// /provisional-tax is neither. Redirects so there is still one canonical URL.
export const Route = createFileRoute("/tax")({
  beforeLoad: () => {
    throw redirect({ to: "/provisional-tax", replace: true });
  },
});
