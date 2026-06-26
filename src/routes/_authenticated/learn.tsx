import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout for /learn. The index (learn.index.tsx) and the course pages
// (learn.$slug, learn.$slug.$lessonSlug) render in this Outlet — without it,
// every /learn/* child would re-render the library list.
export const Route = createFileRoute("/_authenticated/learn")({
  component: () => <Outlet />,
});
