import { createFileRoute } from "@tanstack/react-router";
import { DashboardProducts } from "@/components/dashboard-products";

export const Route = createFileRoute("/_authenticated/dashboard/products/paid")({
  head: () => ({ meta: [{ title: "Paid Products — CHKPLT" }] }),
  component: () => <DashboardProducts mode="paid" />,
});
