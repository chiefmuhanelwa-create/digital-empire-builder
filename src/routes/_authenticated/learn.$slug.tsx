import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout for /learn/$slug. The course outline (learn.$slug.index.tsx) and the
// lesson player (learn.$slug.$lessonSlug.tsx) render in this Outlet — without it,
// opening a lesson would just re-render the course outline.
export const Route = createFileRoute("/_authenticated/learn/$slug")({
  component: () => <Outlet />,
});
