import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { resolveUserRole } from "./auth";

export type Registration = {
  version: 1;
  accountType: "patient" | "doctor" | "clinic";
  fullName: string;
  crm?: string;
  crmState?: string;
  doctorBio?: string;
  specialtyIds?: string[];
  clinicTradeName?: string;
  clinicLegalName?: string;
  clinicPhone?: string;
  clinicCity?: string;
  clinicState?: string;
  clinicNeighborhood?: string;
  clinicDescription?: string;
  clinicStreet?: string;
  clinicNumber?: string;
  clinicZipcode?: string;
};

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function completeRegistration(user: User, input: Registration) {
  const access = await resolveUserRole(user);
  if (access.id && access.role !== "patient") {
    if (access.role !== input.accountType) throw new Error("Esta conta já está vinculada a outro tipo de perfil. Saia para criar uma nova conta.");
    if (access.clinicId) {
      const existing = await supabase.from("clinic_members").select("id").eq("user_id", user.id).eq("clinic_id", access.clinicId).limit(1).maybeSingle();
      check(existing.error);
      if (!existing.data) {
        const memberRole = access.role === "doctor" ? "doctor" : "owner";
        const member = await supabase.from("clinic_members").insert({
          user_id: user.id, clinic_id: access.clinicId, member_role: memberRole, role: memberRole,
          doctor_id: access.role === "doctor" ? access.id : null,
        });
        check(member.error);
      }
    }
    if (access.role === "doctor" && input.specialtyIds?.length) {
      const linked = await supabase.rpc("set_doctor_specialties", { p_doctor_id: access.id, p_specialty_ids: input.specialtyIds });
      check(linked.error);
    }
    return;
  }
  if (access.role === "patient" && input.accountType === "patient") {
    const existing = await supabase.from("patients").select("id").eq("id", user.id).maybeSingle();
    check(existing.error);
    if (existing.data) return;
  }
  if (!input.fullName.trim()) throw new Error("Informe seu nome.");
  const role = input.accountType === "clinic" ? "clinic_admin" : input.accountType;
  const profile = await supabase.from("profiles").upsert({ id: user.id, full_name: input.fullName.trim(), role });
  check(profile.error);
  if (input.accountType === "patient") {
    const patient = await supabase.from("patients").upsert({ id: user.id, full_name: input.fullName.trim(), email: user.email }, { onConflict: "id" });
    check(patient.error);
  }

  if (input.accountType === "doctor") {
    if (!input.crm?.replace(/\D/g, "") || !input.crmState?.trim()) throw new Error("Informe CRM e UF.");
    // A matching pre-registration is linked only through the current user's
    // RLS permissions. An existing account relationship is never overwritten.
    const candidates = await supabase.from("doctors").select("id, user_id, clinic_id, crm, crm_state")
      .ilike("professional_email", user.email || "").is("user_id", null);
    check(candidates.error);
    const candidate = candidates.data?.find(item =>
      String(item.crm || "").replace(/\D/g, "") === input.crm?.replace(/\D/g, "") &&
      String(item.crm_state || "").toUpperCase() === input.crmState?.trim().toUpperCase());
    const doctorId = candidate?.id || user.id;
    const payload = {
      user_id: user.id, name: input.fullName.trim(), crm: input.crm.replace(/\D/g, ""),
      crm_state: input.crmState.trim().toUpperCase(), bio: input.doctorBio?.trim() || null,
      professional_email: user.email, is_active: true,
    };
    if (candidate) {
      const linked = await supabase.from("doctors").update(payload).eq("id", doctorId).is("user_id", null).select("id").single();
      check(linked.error);
    } else {
      const created = await supabase.from("doctors").insert({ id: doctorId, created_by: user.id, ...payload }).select("id").single();
      check(created.error);
    }
    if (input.specialtyIds?.length) {
      const linked = await supabase.rpc("set_doctor_specialties", { p_doctor_id: doctorId, p_specialty_ids: input.specialtyIds });
      check(linked.error);
    }
    if (candidate?.clinic_id) {
      const member = await supabase.from("clinic_members").select("id").eq("user_id", user.id).eq("doctor_id", doctorId).limit(1).maybeSingle();
      check(member.error);
      if (!member.data) {
        const linked = await supabase.from("clinic_members").insert({ clinic_id: candidate.clinic_id, doctor_id: doctorId, user_id: user.id, member_role: "doctor", role: "doctor" });
        check(linked.error);
      }
    }
  }

  if (input.accountType === "clinic") {
    if (!input.clinicTradeName?.trim() || !input.clinicCity?.trim()) throw new Error("Informe nome e cidade da clínica.");
    const clinicId = user.id;
    const existing = await supabase.from("clinics").select("id").eq("id", clinicId).maybeSingle();
    check(existing.error);
    if (!existing.data) {
      const created = await supabase.from("clinics").insert({
        id: clinicId, user_id: user.id, created_by: user.id,
        trade_name: input.clinicTradeName.trim(),
        legal_name: input.clinicLegalName?.trim() || input.clinicTradeName.trim(),
        phone: input.clinicPhone?.trim() || null, email: user.email,
        contact_name: input.fullName.trim(), contact_email: user.email,
        contact_phone: input.clinicPhone?.trim() || null,
        address_street: input.clinicStreet?.trim() || null,
        address_number: input.clinicNumber?.trim() || null,
        address_zipcode: input.clinicZipcode?.replace(/\D/g, "") || null,
        address_text: [input.clinicStreet, input.clinicNumber, input.clinicNeighborhood, input.clinicCity, input.clinicState].filter(Boolean).join(", "),
        city: input.clinicCity.trim(), state: input.clinicState?.trim().toUpperCase(),
        address_city: input.clinicCity.trim(), address_state: input.clinicState?.trim().toUpperCase(),
        address_neighborhood: input.clinicNeighborhood?.trim() || null,
        description: input.clinicDescription?.trim() || null, is_active: true,
      });
      check(created.error);
    }
    const member = await supabase.from("clinic_members").select("id").eq("user_id", user.id).eq("clinic_id", clinicId).limit(1).maybeSingle();
    check(member.error);
    if (!member.data) {
      const linked = await supabase.from("clinic_members").insert({ clinic_id: clinicId, user_id: user.id, member_role: "owner", role: "owner" });
      check(linked.error);
    }
  }
}

export async function resumeRegistration(user: User) {
  const draft = user.user_metadata?.medinexus_registration as Registration | undefined;
  if (!draft || draft.version !== 1) return;
  await completeRegistration(user, draft);
  const cleared = await supabase.auth.updateUser({ data: { medinexus_registration: null } });
  check(cleared.error);
}
