"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type MemberRow = {
  doctor_id: string | null;
};

type DoctorRow = {
  id: string;
  name: string | null;
  crm: string | null;
  crm_state: string | null;
  cpf: string | null;
  rqe: string | null;
  professional_phone: string | null;
  average_consultation_minutes: number | null;
  accepts_private_consultation: boolean | null;
  private_price_cents: number | null;
  doctor_completed: boolean | null;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function validateCpf(value: string) {
  return onlyDigits(value).length === 11;
}

function moneyToCents(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  if (Number.isNaN(number)) return null;
  return Math.round(number * 100);
}

function centsToMoney(value: number | null) {
  if (!value) return "";
  return (value / 100).toFixed(2).replace(".", ",");
}

export default function MedicoPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [form, setForm] = useState({
    name: "",
    cpf: "",
    crm: "",
    crm_state: "",
    rqe: "",
    professional_phone: "",
    average_consultation_minutes: "20",
    accepts_private_consultation: true,
    private_price: "",
  });

  useEffect(() => {
    loadDoctor();
  }, []);

  async function loadDoctor() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from("clinic_members")
      .select("doctor_id")
      .eq("user_id", user.id)
      .eq("member_role", "doctor")
      .maybeSingle<MemberRow>();

    if (memberError || !member?.doctor_id) {
      setMessage("Médico não encontrado para esta conta.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setDoctorId(member.doctor_id);

    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select(`
        id,
        name,
        crm,
        crm_state,
        cpf,
        rqe,
        professional_phone,
        average_consultation_minutes,
        accepts_private_consultation,
        private_price_cents,
        doctor_completed
      `)
      .eq("id", member.doctor_id)
      .maybeSingle<DoctorRow>();

    if (doctorError || !doctor) {
      setMessage(`Erro ao carregar médico: ${doctorError?.message || "não encontrado"}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setForm({
      name: doctor.name || "",
      cpf: doctor.cpf || "",
      crm: doctor.crm || "",
      crm_state: doctor.crm_state || "",
      rqe: doctor.rqe || "",
      professional_phone: doctor.professional_phone || "",
      average_consultation_minutes: String(
        doctor.average_consultation_minutes || 20
      ),
      accepts_private_consultation:
        doctor.accepts_private_consultation ?? true,
      private_price: centsToMoney(doctor.private_price_cents),
    });

    setLoading(false);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;

      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const requiredMissing = useMemo(() => {
    const requiredFields = [
      ["Nome profissional", form.name],
      ["CPF", form.cpf],
      ["CRM", form.crm],
      ["UF do CRM", form.crm_state],
      ["Telefone profissional", form.professional_phone],
      ["Tempo médio de consulta", form.average_consultation_minutes],
    ];

    const missing = requiredFields
      .filter(([, value]) => !String(value || "").trim())
      .map(([label]) => label);

    if (form.cpf && !validateCpf(form.cpf)) {
      missing.push("CPF válido com 11 dígitos");
    }

    return missing;
  }, [form]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (!doctorId) {
      setMessage("Médico não encontrado.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    if (requiredMissing.length > 0) {
      setMessage(`Preencha os campos obrigatórios: ${requiredMissing.join(", ")}.`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("doctors")
      .update({
        name: form.name.trim(),
        cpf: onlyDigits(form.cpf),
        crm: form.crm.trim(),
        crm_state: form.crm_state.trim().toUpperCase(),
        rqe: form.rqe.trim() || null,
        professional_phone: form.professional_phone.trim(),
        average_consultation_minutes: Number(
          form.average_consultation_minutes || 20
        ),
        accepts_private_consultation: form.accepts_private_consultation,
        private_price_cents: form.private_price
          ? moneyToCents(form.private_price)
          : null,
        doctor_completed: true,
      })
      .eq("id", doctorId);

    if (error) {
      setMessage(`Erro ao salvar perfil médico: ${error.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("Perfil médico atualizado com sucesso.");
    setMessageType("success");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando perfil médico...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#EAF1F0_0,#F8FAFC_34%,#FFFFFF_100%)]">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1B4B58]">
              Perfil médico
            </p>
            <h1 className="mt-3 app-section-title">
              Complete seu cadastro profissional
            </h1>
            <p className="app-section-subtitle">
              Dados usados no prontuário, documentos médicos, receituários e disponibilidade.
            </p>
          </div>

          <Link href="/medico/dashboard" className="app-button-secondary text-center">
            Voltar ao dashboard
          </Link>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        {requiredMissing.length > 0 && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="font-bold">Cadastro médico incompleto</p>
            <p className="mt-1 text-sm">
              Campos pendentes: {requiredMissing.join(", ")}.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="grid gap-6">
          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Dados profissionais
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome profissional *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  CPF *
                </label>
                <input
                  name="cpf"
                  value={form.cpf}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Somente números"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  CRM *
                </label>
                <input
                  name="crm"
                  value={form.crm}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  UF do CRM *
                </label>
                <input
                  name="crm_state"
                  value={form.crm_state}
                  onChange={handleChange}
                  className="app-input"
                  maxLength={2}
                  placeholder="RJ"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  RQE
                </label>
                <input
                  name="rqe"
                  value={form.rqe}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Registro de Qualificação de Especialista"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Telefone profissional *
                </label>
                <input
                  name="professional_phone"
                  value={form.professional_phone}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>
            </div>
          </div>

          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Atendimento
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tempo médio de consulta em minutos *
                </label>
                <input
                  type="number"
                  name="average_consultation_minutes"
                  value={form.average_consultation_minutes}
                  onChange={handleChange}
                  className="app-input"
                  min={5}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Valor particular
                </label>
                <input
                  name="private_price"
                  value={form.private_price}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Ex: 200,00"
                />
              </div>

              <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
                <input
                  type="checkbox"
                  name="accepts_private_consultation"
                  checked={form.accepts_private_consultation}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-slate-900">
                    Aceito consulta particular
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    Permite que pacientes encontrem você mesmo sem plano compatível.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="app-button-primary"
            >
              {saving ? "Salvando..." : "Salvar perfil médico"}
            </button>

            <Link
              href="/medico/dashboard"
              className="app-button-secondary text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}