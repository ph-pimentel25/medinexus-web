import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AccountRole = "patient" | "doctor" | "clinic";
const normalizeRole = (role: unknown): AccountRole | null => role === "doctor" ? "doctor" :
  role === "clinic" || role === "clinic_admin" ? "clinic" : role === "patient" ? "patient" : null;

// Keep the same relationship precedence as medinexus-web/src/app/lib/auth.ts.
// Metadata only chooses the completion screen; database RLS grants actual access.
export async function loadAccount(user: User, client: SupabaseClient) {
  const [profile, doctor, clinic, memberships] = await Promise.all([
    client.from("profiles").select("full_name,role,address_city,profile_completed").eq("id", user.id).maybeSingle(),
    client.from("doctors").select("id").eq("user_id", user.id).order("id").limit(1).maybeSingle(),
    client.from("clinics").select("id").or(`user_id.eq.${user.id},created_by.eq.${user.id}`).order("id").limit(1).maybeSingle(),
    client.from("clinic_members").select("clinic_id,doctor_id,member_role,role").eq("user_id", user.id).order("clinic_id"),
  ]);
  const members = memberships.data || [];
  const doctorMember = members.find(m => (m.member_role || m.role) === "doctor" && m.doctor_id);
  const clinicMember = members.find(m => ["owner", "admin"].includes(m.member_role || m.role) && m.clinic_id);
  const proven = doctor.data || doctorMember ? "doctor" : clinic.data || clinicMember ? "clinic" : null;
  if (!proven && [profile, doctor, clinic, memberships].some(result => result.error)) {
    throw new Error("Não foi possível verificar seu cadastro. Tente novamente.");
  }
  const stored = normalizeRole(profile.data?.role);
  const role = proven || (stored && stored !== "patient" ? stored : normalizeRole(user.user_metadata?.role) || stored || "patient");
  const name = profile.data?.full_name || user.user_metadata?.full_name || "";
  let incompletePatient = false;
  if (role === "patient") {
    const patient = await client.from("patients").select("id").eq("id", user.id).maybeSingle();
    if (patient.error) throw new Error("Não foi possível carregar o cadastro de paciente.");
    incompletePatient = !patient.data || profile.data?.profile_completed === false;
    // Resume an email-confirmed signup without changing an existing account's role or data.
    if (!profile.data) {
      if (!name.trim()) throw new Error("Conclua seu nome no cadastro da plataforma web.");
      const saved = await client.from("profiles").upsert({ id: user.id, full_name: name.trim(), role: "patient" }, { onConflict: "id", ignoreDuplicates: true });
      if (saved.error) throw new Error("Sua conta existe, mas o perfil não foi concluído. Tente novamente.");
    }
    if (!patient.data) {
      const saved = await client.from("patients").upsert({ id: user.id, full_name: name.trim(), email: user.email }, { onConflict: "id", ignoreDuplicates: true });
      if (saved.error) throw new Error("Sua conta existe, mas o cadastro de paciente não foi concluído. Tente novamente.");
    }
  }
  return { role, name, city: profile.data?.address_city || "", newPatient: role === "patient" && (!profile.data || incompletePatient) };
}
