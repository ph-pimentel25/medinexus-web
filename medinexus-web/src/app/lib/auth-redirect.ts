import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRoleDashboardPath, resolveUserRole } from "./auth";

export async function redirectUserByRole(supabase: SupabaseClient, router: AppRouterInstance) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) { router.replace("/login"); return; }
  const access = await resolveUserRole(user, supabase);
  router.replace(getRoleDashboardPath(access.role));
}
