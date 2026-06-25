import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { myPurchases } from "@/lib/products.functions";

// Product slugs whose grant unlocks the $97 kit deliverables (apps + course).
export const KIT_SLUGS = ["called-expert-foundation-kit", "called-expert-starter-bundle"];

/**
 * Kit gate shared by the Foundation Kit workspace and every interactive app route.
 * Access = owns a kit product OR is an admin. `loading` is true until both checks resolve.
 */
export function useKitAccess() {
  const { user } = useAuth();
  const purchasesFn = useServerFn(myPurchases);

  const isAdminQ = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });

  const purchasesQ = useQuery({
    queryKey: ["my-purchases"],
    enabled: !!user?.id,
    queryFn: () => purchasesFn(),
  });

  const grants = (purchasesQ.data?.grants ?? []) as Array<{ product: { slug: string } | null }>;
  const ownsKit = grants.some((g) => g.product && KIT_SLUGS.includes(g.product.slug));
  const isAdmin = isAdminQ.data === true;

  return {
    access: ownsKit || isAdmin,
    ownsKit,
    isAdmin,
    loading: (isAdminQ.isLoading || purchasesQ.isLoading) && !!user?.id,
  };
}
