// Repairs only the three existing demonstration accounts. No passwords are changed.
import { createClient } from "@supabase/supabase-js";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key || key.startsWith("sb_publishable_")) throw new Error("Configure uma chave secreta em SUPABASE_SERVICE_ROLE_KEY.");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
const apply = process.argv.includes("--apply");
const check = result => { if (result.error) throw new Error(result.error.message); return result.data; };
const { users } = check(await db.auth.admin.listUsers({ perPage: 100 }));
const account = email => { const user = users.find(u => u.email === email); if (!user) throw new Error("Conta de demonstração não encontrada: " + email); return user; };
const clinicUser = account("clinica@medinexus.com");
const doctorUser = account("medico@medinexus.com");
const patientUser = account("paciente@medinexus.com");
const doctor = check(await db.from("doctors").select("id, clinic_id").eq("user_id", doctorUser.id).single());
if (doctor.clinic_id && doctor.clinic_id !== clinicUser.id) throw new Error("O médico já pertence a outra clínica; revisão manual necessária.");
console.log("Plano: corrigir os papéis das três contas de demonstração, criar os registros ausentes e vincular médico, clínica, especialidade e agenda.");
if (!apply) { console.log("Prévia apenas. Execute com --apply para aplicar."); process.exit(0); }

for (const [user, role] of [[clinicUser, "clinic_admin"], [doctorUser, "doctor"], [patientUser, "patient"]]) {
  check(await db.from("profiles").update({ role }).eq("id", user.id).select("id").single());
}
const clinic = check(await db.from("clinics").select("id").eq("id", clinicUser.id).maybeSingle());
if (!clinic) check(await db.from("clinics").insert({
  id: clinicUser.id, user_id: clinicUser.id, created_by: clinicUser.id,
  trade_name: "Clínica Horizonte · Demonstração", legal_name: "Clínica Horizonte",
  contact_name: "Equipe de demonstração", contact_email: clinicUser.email, email: clinicUser.email,
  address_text: "Centro, São Paulo — endereço de demonstração",
  city: "São Paulo", state: "SP", address_city: "São Paulo", address_state: "SP",
  address_neighborhood: "Centro", latitude: -23.5505, longitude: -46.6333,
  description: "Clínica fictícia para apresentar a jornada integrada da MediNexus.",
  is_active: true, accepts_private_consultation: true, base_private_price_cents: 15000,
}));
const patient = check(await db.from("patients").select("id").eq("id", patientUser.id).maybeSingle());
if (!patient) check(await db.from("patients").insert({
  id: patientUser.id, full_name: "Paciente da Silva", email: patientUser.email,
  city: "São Paulo", state: "SP", accepts_private_consultation: true,
}));
check(await db.from("doctors").update({ clinic_id: clinicUser.id }).eq("id", doctor.id).is("clinic_id", null));
for (const [user, role, doctorId] of [[clinicUser, "owner", null], [doctorUser, "doctor", doctor.id]]) {
  const members = check(await db.from("clinic_members").select("id").eq("user_id", user.id).eq("clinic_id", clinicUser.id));
  if (!members.length) check(await db.from("clinic_members").insert({ user_id: user.id, clinic_id: clinicUser.id, member_role: role, role, doctor_id: doctorId }));
}
const specialties = check(await db.from("specialties").select("id,name"));
const specialty = specialties.find(s => /clínica (geral|médica)/i.test(s.name));
if (!specialty) throw new Error("Especialidade Clínica Geral/Médica não encontrada.");
const links = check(await db.from("doctor_specialties").select("id").eq("doctor_id", doctor.id).eq("specialty_id", specialty.id));
if (!links.length) check(await db.from("doctor_specialties").insert({ doctor_id: doctor.id, specialty_id: specialty.id }));
const availability = check(await db.from("doctor_availability").select("id").eq("doctor_id", doctor.id));
if (!availability.length) check(await db.from("doctor_availability").insert([1,2,3,4,5].map(day => ({
  doctor_id: doctor.id, weekday: day, day_of_week: day, start_time: "08:00", end_time: "18:00", slot_minutes: 30, is_active: true,
}))));
console.log("Contas de demonstração reparadas. Nenhuma conta, senha ou consulta foi removida.");
