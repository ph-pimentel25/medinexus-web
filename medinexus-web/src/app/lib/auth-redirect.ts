import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SupabaseClient } from "@supabase/supabase-js";

export async function redirectUserByRole(supabase: SupabaseClient, router: AppRouterInstance) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    router.replace("/login");
    return;
  }

  // 1. Checa se é médico
  const { data: doctor } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (doctor?.id) {
    router.replace("/medico/dashboard");
    return;
  }

  // 2. Checa se é clínica (tanto via user_id direto quanto via clinic_members)
  const { data: clinicDirect } = await supabase
    .from("clinics")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (clinicDirect?.id) {
    router.replace("/clinica/dashboard");
    return;
  }

  const { data: clinicMember } = await supabase
    .from("clinic_members")
    .select("clinic_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (clinicMember?.clinic_id) {
    router.replace("/clinica/dashboard");
    return;
  }

  // 3. Padrão: Paciente
  router.replace("/dashboard");
}