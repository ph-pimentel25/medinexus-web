"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Alert from "../../../components/alert";
import { supabase } from "../../../lib/supabase";

type Specialty = {
  id: string;
  name: string;
};

type DoctorForm = {
  name: string;
  professionalEmail: string;
  crm: string;
  crmState: string;
  bioShort: string;
  isActive: boolean;
  specialtyIds: string[];
};

const emptyDoctorForm: DoctorForm = {
  name: "",
  professionalEmail: "",
  crm: "",
  crmState: "",
  bioShort: "",
  isActive: true,
  specialtyIds: [],
};

export default function ClinicaEditarMedicoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [clinicId, setClinicId] = useState("");
  const [memberRole, setMemberRole] = useState<"owner" | "admin" | "doctor" | "">(
    ""
  );
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [form, setForm] = useState<DoctorForm>(emptyDoctorForm);

  const doctorId = params?.id as string;
  const canManage = memberRole === "owner" || memberRole === "admin";

  const specialtyNameMap = useMemo(() => {
    return Object.fromEntries(specialties.map((item) => [item.id, item.name]));
  }, [specialties]);

  useEffect(() => {
    if (doctorId) {
      loadPage();
    }
  }, [doctorId]);

  async function loadPage() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from("clinic_members")
      .select("clinic_id, member_role")
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      setMessage("Você não possui acesso à área da clínica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setClinicId(member.clinic_id);
    setMemberRole(member.member_role);

    const { data: specialtiesData, error: specialtiesError } = await supabase
      .from("specialties")
      .select("id, name")
      .order("name", { ascending: true });

    if (specialtiesError) {
      setMessage("Erro ao carregar especialidades.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setSpecialties(specialtiesData || []);

    const { data: doctorData, error: doctorError } = await supabase
      .from("doctors")
      .select("id, name, professional_email, crm, crm_state, bio_short, is_active, clinic_id")
      .eq("id", doctorId)
      .eq("clinic_id", member.clinic_id)
      .single();

    if (doctorError || !doctorData) {
      setMessage("Médico não encontrado para esta clínica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data: dsData, error: dsError } = await supabase
      .from("doctor_specialties")
      .select("specialty_id")
      .eq("doctor_id", doctorId);

    if (dsError) {
      setMessage("Erro ao carregar especialidades do médico.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setForm({
      name: doctorData.name || "",
      professionalEmail: doctorData.professional_email || "",
      crm: doctorData.crm || "",
      crmState: doctorData.crm_state || "",
      bioShort: doctorData.bio_short || "",
      isActive: doctorData.is_active,
      specialtyIds: (dsData || []).map((item) => item.specialty_id),
    });

    setLoading(false);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target as HTMLInputElement;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleSpecialtyToggle(specialtyId: string) {
    setForm((prev) => ({
      ...prev,
      specialtyIds: prev.specialtyIds.includes(specialtyId)
        ? prev.specialtyIds.filter((id) => id !== specialtyId)
        : [...prev.specialtyIds, specialtyId],
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!canManage) {
      setMessage("Apenas owner/admin pode editar médicos.");
      setMessageType("error");
      return;
    }

    if (!clinicId || !doctorId) {
      setMessage("Dados do médico não encontrados.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    const { error: updateDoctorError } = await supabase
      .from("doctors")
      .update({
        name: form.name,
        professional_email: form.professionalEmail || null,
        crm: form.crm || null,
        crm_state: form.crmState || null,
        bio_short: form.bioShort || null,
        is_active: form.isActive,
      })
      .eq("id", doctorId)
      .eq("clinic_id", clinicId);

    if (updateDoctorError) {
      console.error("updateDoctorError:", updateDoctorError);
      setMessage(`Erro ao atualizar médico: ${updateDoctorError.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    const { error: deleteSpecialtiesError } = await supabase
      .from("doctor_specialties")
      .delete()
      .eq("doctor_id", doctorId);

    if (deleteSpecialtiesError) {
      console.error("deleteSpecialtiesError:", deleteSpecialtiesError);
      setMessage(
        `Médico atualizado, mas houve erro ao limpar especialidades antigas: ${deleteSpecialtiesError.message}`
      );
      setMessageType("error");
      setSaving(false);
      return;
    }

    if (form.specialtyIds.length > 0) {
      const { error: insertSpecialtiesError } = await supabase
        .from("doctor_specialties")
        .insert(
          form.specialtyIds.map((specialtyId) => ({
            doctor_id: doctorId,
            specialty_id: specialtyId,
          }))
        );

      if (insertSpecialtiesError) {
        console.error("insertSpecialtiesError:", insertSpecialtiesError);
        setMessage(
          `Médico atualizado, mas houve erro ao salvar especialidades: ${insertSpecialtiesError.message}`
        );
        setMessageType("error");
        setSaving(false);
        return;
      }
    }

    setMessage("Médico atualizado com sucesso.");
    setMessageType("success");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando médico...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/clinica/medicos"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para médicos
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Editar médico
          </p>
          <h1 className="mt-3 app-section-title">{form.name || "Médico"}</h1>
          <p className="app-section-subtitle">
            Atualize os dados do profissional e revise suas especialidades.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-6 app-card-soft p-4">
          <p className="text-sm text-slate-700">
            Especialidades atuais:{" "}
            {form.specialtyIds.length > 0
              ? form.specialtyIds
                  .map((id) => specialtyNameMap[id] || "Especialidade")
                  .join(", ")
              : "nenhuma vinculada"}
          </p>
        </div>

        <div className="app-card p-8">
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nome do médico
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="app-input"
                  required
                  disabled={!canManage}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  E-mail profissional
                </label>
                <input
                  name="professionalEmail"
                  type="email"
                  value={form.professionalEmail}
                  onChange={handleChange}
                  className="app-input"
                  required
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  CRM
                </label>
                <input
                  name="crm"
                  value={form.crm}
                  onChange={handleChange}
                  className="app-input"
                  disabled={!canManage}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Estado do CRM
                </label>
                <input
                  name="crmState"
                  value={form.crmState}
                  onChange={handleChange}
                  className="app-input"
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  disabled={!canManage}
                />
                <span className="text-sm font-medium text-slate-700">
                  Médico ativo
                </span>
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Bio curta
              </label>
              <textarea
                name="bioShort"
                value={form.bioShort}
                onChange={handleChange}
                className="app-textarea"
                disabled={!canManage}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">
                Especialidades
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {specialties.map((specialty) => {
                  const checked = form.specialtyIds.includes(specialty.id);

                  return (
                    <label
                      key={specialty.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleSpecialtyToggle(specialty.id)}
                        disabled={!canManage}
                      />
                      <span className="text-sm text-slate-700">
                        {specialty.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving || !canManage}
                className="app-button-primary"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>

              <Link href="/clinica/medicos" className="app-button-secondary text-center">
                Voltar para lista
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}