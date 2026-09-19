import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type UserRole = "patient" | "doctor" | "clinic" | "public";
export type RoleInfo = {
  role: UserRole;
  id: string | null;
  userId: string | null;
  email: string | null;
  name: string;
  clinicId: string | null;
  memberRole: "owner" | "admin" | "doctor" | null;
};

export const publicRole: RoleInfo = {
  role: "public", id: null, userId: null, email: null, name: "", clinicId: null, memberRole: null,
};

export function normalizeRole(value: unknown): UserRole | null {
  if (value === "doctor") return "doctor";
  if (value === "clinic" || value === "clinic_admin") return "clinic";
  if (value === "patient") return "patient";
  return null;
}

// These queries run with the user's session. Database RLS remains the authority
// for reading or changing any medical or clinic record.
export async function resolveUserRole(user: User, client: SupabaseClient = supabase): Promise<RoleInfo> {
  const [doctors, clinics, memberships, profile] = await Promise.all([
    client.from("doctors").select("id, name, clinic_id").eq("user_id", user.id).order("id").limit(1).maybeSingle(),
    client.from("clinics").select("id, trade_name, legal_name").or(`user_id.eq.${user.id},created_by.eq.${user.id}`).order("id").limit(1).maybeSingle(),
    client.from("clinic_members").select("clinic_id, doctor_id, member_role, role").eq("user_id", user.id).order("clinic_id"),
    client.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
  ]);
  const base = {
    ...publicRole,
    userId: user.id,
    email: user.email || null,
    name: profile.data?.full_name || user.user_metadata?.full_name || "",
  };
  const members = memberships.data || [];
  if (doctors.data?.id) {
    return { ...base, role: "doctor", id: doctors.data.id, name: doctors.data.name || base.name, clinicId: doctors.data.clinic_id, memberRole: "doctor" };
  }
  const doctorMember = members.find(m => (m.member_role || m.role) === "doctor" && m.doctor_id);
  if (doctorMember) {
    return { ...base, role: "doctor", id: doctorMember.doctor_id, clinicId: doctorMember.clinic_id, memberRole: "doctor" };
  }
  if (clinics.data?.id) {
    return { ...base, role: "clinic", id: clinics.data.id, clinicId: clinics.data.id, name: clinics.data.trade_name || clinics.data.legal_name || base.name, memberRole: "owner" };
  }
  const clinicMember = members.find(m => ["owner", "admin"].includes(m.member_role || m.role) && m.clinic_id);
  if (clinicMember) {
    return { ...base, role: "clinic", id: clinicMember.clinic_id, clinicId: clinicMember.clinic_id, memberRole: clinicMember.member_role || clinicMember.role };
  }
  // A failed lookup must never silently turn a professional into a patient.
  const lookupError = [doctors, clinics, memberships, profile].find(result => result.error)?.error;
  if (lookupError) throw new Error("Não foi possível verificar seu perfil. Tente novamente. Se persistir, revise as permissões de acesso no Supabase.");
  const storedRole = normalizeRole(profile.data?.role);
  const requestedRole = normalizeRole(user.user_metadata?.role);
  const role = storedRole && storedRole !== "patient" ? storedRole : requestedRole || storedRole || "patient";
  // Metadata can indicate an incomplete registration, but cannot grant access
  // to a professional area without an actual doctor/clinic relationship.
  return { ...base, role, id: role === "patient" ? user.id : null };
}

export async function getUserRole(): Promise<RoleInfo> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("Não foi possível verificar sua sessão. Entre novamente.");
  }
  return user ? resolveUserRole(user) : publicRole;
}

export function getRoleDashboardPath(role: string): string {
  if (role === "doctor") return "/medico/dashboard";
  if (role === "clinic") return "/clinica/dashboard";
  return role === "patient" ? "/dashboard" : "/login";
}

export function getRoleProfilePath(role: string): string {
  if (role === "doctor") return "/medico/perfil";
  if (role === "clinic") return "/clinica/configuracoes";
  return role === "patient" ? "/perfil" : "/login";
}

export function getRoleRequestsPath(role: string): string {
  if (role === "doctor") return "/medico/solicitacoes";
  if (role === "clinic") return "/clinica/solicitacoes";
  return "/solicitacoes";
}

export async function getCurrentDoctor() {
  try {
    const access = await getUserRole();
    if (access.role !== "doctor" || !access.id) return { data: null, error: { message: "Nenhum cadastro médico vinculado a esta conta." } };
    return await supabase.from("doctors").select("*").eq("id", access.id).single();
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : "Não foi possível carregar o médico." } };
  }
}

export async function getCurrentClinicMember() {
  try {
    const access = await getUserRole();
    if (access.role !== "clinic" || !access.id) return { data: null, error: { message: "Nenhuma clínica vinculada a esta conta." } };
    return { data: { clinic_id: access.id, member_role: access.memberRole || "admin" }, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : "Não foi possível carregar a clínica." } };
  }
}
