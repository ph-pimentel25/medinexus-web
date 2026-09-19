import type { SupabaseClient } from "@supabase/supabase-js";

type UserRole = "patient" | "doctor" | "clinic";

type RouterLike = {
  replace: (href: string) => void;
};

export async function detectUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole> {
  const { data: doctorData, error: doctorError } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!doctorError && doctorData?.id) {
    return "doctor";
  }

  const { data: clinicMemberData, error: clinicMemberError } = await supabase
    .from("clinic_members")
    .select("clinic_id, member_role")
    .eq("user_id", userId)
    .in("member_role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();

  if (!clinicMemberError && clinicMemberData?.clinic_id) {
    return "clinic";
  }

  return "patient";
}

export function getDashboardByRole(role: UserRole) {
  if (role === "doctor") return "/medico/dashboard";
  if (role === "clinic") return "/clinica/dashboard";
  return "/dashboard";
}

export async function redirectUserByRole(
  supabase: SupabaseClient,
  router: RouterLike
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.replace("/login");
    return;
  }

  const role = await detectUserRole(supabase, user.id);
  router.replace(getDashboardByRole(role));
}
