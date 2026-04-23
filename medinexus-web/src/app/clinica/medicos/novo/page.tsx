"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../../components/alert";
import { supabase } from "../../../lib/supabase";

type Specialty = {
  id: string;
  name: string;
};

type DoctorForm = {
  name: string;
  crm: string;
  crmState: string;
  bioShort: string;
  isActive: boolean;
  specialtyIds: string[];
};

const emptyDoctorForm: DoctorForm = {
  name: "",
  crm: "",
  crmState: "",
  bioShort: "",
  isActive: true,
  specialtyIds: [],
};

export default function ClinicaNovoMedicoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const canManage = memberRole === "owner" || memberRole === "admin";

  useEffect(() => {
    loadPage();
  }, []);

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
      setMessage("Apenas owner/admin pode cadastrar médicos.");
      setMessageType("error");
      return;
    }

    if (!clinicId) {
      setMessage("Clínica não encontrada.");
      setMessageType("error");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Sessão não encontrada.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);

    const { data: insertedDoctor, error: insertDoctorError } = await supabase
      .from("doctors")
      .insert({
        clinic_id: clinicId,
        created_by: user.id,
        name: form.name,
        crm: form.crm || null,
        crm_state: form.crmState || null,
        bio_short: form.bioShort || null,
        is_active: form.isActive,
      })
      .select("id")
      .single();

    if (insertDoctorError || !insertedDoctor) {
      console.error("insertDoctorError:", insertDoctorError);
      setMessage(
        `Erro ao cadastrar médico: ${insertDoctorError?.message || "erro desconhecido"}`
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (form.specialtyIds.length > 0) {
      const { error: specialtiesError } = await supabase
        .from("doctor_specialties")
        .insert(
          form.specialtyIds.map((specialtyId) => ({
            doctor_id: insertedDoctor.id,
            specialty_id: specialtyId,
          }))
        );

      if (specialtiesError) {
        console.error("specialtiesError:", specialtiesError);
        setMessage(
          `Médico criado, mas houve erro ao vincular especialidades: ${specialtiesError.message}`
        );
        setMessageType("error");
        setSubmitting(false);
        return;
      }
    }

    setMessage("Médico cadastrado com sucesso.");
    setMessageType("success");
    setSubmitting(false);

    setTimeout(() => {
      router.push("/clinica/medicos");
    }, 1000);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando cadastro de médico...</p>
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
            Novo médico
          </p>
          <h1 className="mt-3 app-section-title">
            Cadastre um profissional da clínica
          </h1>
          <p className="app-section-subtitle">
            Preencha os dados básicos do médico e marque as especialidades atendidas.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

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
                  placeholder="Digite o nome do médico"
                  required
                  disabled={!canManage}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  CRM
                </label>
                <input
                  name="crm"
                  value={form.crm}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Número do CRM"
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Estado do CRM
                </label>
                <input
                  name="crmState"
                  value={form.crmState}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Ex: RJ"
                  disabled={!canManage}
                />
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
                placeholder="Resumo rápido sobre o profissional"
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
                disabled={submitting || !canManage}
                className="app-button-primary"
              >
                {submitting ? "Cadastrando..." : "Cadastrar médico"}
              </button>

              <Link href="/clinica/medicos" className="app-button-secondary text-center">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}