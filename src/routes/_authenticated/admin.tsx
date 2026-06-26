import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Single admin gate for the whole /admin console. Child routes (admin.index,
// admin.products, admin.contacts, …) nest under this layout's <Outlet/> and
// inherit the guard. Each child renders the admin chrome via @/components/admin-shell.
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: () => <Outlet />,
});
