import { createFileRoute } from "@tanstack/react-router";
import { DashboardProducts } from "@/components/dashboard-products";

export const Route = createFileRoute("/_authenticated/dashboard/products/free")({
  head: () => ({ meta: [{ title: "Free Resources — Contentpreneur Africa" }] }),
  component: () => <DashboardProducts mode="free" />,
});
