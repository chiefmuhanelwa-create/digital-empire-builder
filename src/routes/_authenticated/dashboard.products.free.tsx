import { createFileRoute } from "@tanstack/react-router";
import { DashboardProducts } from "@/components/dashboard-products";

export const Route = createFileRoute("/_authenticated/dashboard/products/free")({
  head: () => ({ meta: [{ title: "Free Resources — CHKPLT" }] }),
  component: () => <DashboardProducts mode="free" />,
});
