import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

// Single source of truth for the admin role check. Shared cache key + staleTime
// so the member shell, admin shell, and dashboard don't each refetch has_role.
export function useIsAdmin() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });
  return { isAdmin: q.data === true, loading: q.isLoading && !!user?.id };
}
