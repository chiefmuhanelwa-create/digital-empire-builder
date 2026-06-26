import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout for /dashboard. The index (dashboard.index.tsx) and the sub-pages
// (dashboard.foundation-kit, dashboard.tools, dashboard.products.*) render in this
// Outlet — without it, every /dashboard/* child would re-render the dashboard.
export const Route = createFileRoute("/_authenticated/dashboard")({
  component: () => <Outlet />,
});
