"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type ClinicRow = {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
  cnpj: string | null;
  corporate_email: string | null;
  whatsapp: string | null;
  phone: string | null;
  responsible_name: string | null;
  responsible_cpf: string | null;
  technical_director_name: string | null;
  technical_director_crm: string | null;
  technical_director_crm_state: string | null;
  cnes: string | null;
  address_zipcode: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_country: string | null;
  accepts_private_consultation: boolean | null;
  base_private_price_cents: number | null;
  average_response_minutes: number | null;
  clinic_completed: boolean | null;
};

type MemberRow = {
  clinic_id: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function validateCnpj(value: string) {
  return onlyDigits(value).length === 14;
}

function validateCpf(value: string) {
  return onlyDigits(value).length === 11;
}

function moneyToCents(value: string) {
  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const number = Number(cleaned);

  if (!value.trim() || Number.isNaN(number)) return null;

  return Math.round(number * 100);
}

function centsToMoney(value: number | null) {
  if (!value) return "";

  return (value / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ClinicaConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [clinicId, setClinicId] = useState("");

  const [form, setForm] = useState({
    trade_name: "",
    legal_name: "",
    cnpj: "",
    corporate_email: "",
    whatsapp: "",
    phone: "",
    responsible_name: "",
    responsible_cpf: "",
    technical_director_name: "",
    technical_director_crm: "",
    technical_director_crm_state: "",
    cnes: "",
    address_zipcode: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_country: "Brasil",
    accepts_private_consultation: true,
    base_private_price: "",
    average_response_minutes: "60",
  });

  useEffect(() => {
    loadClinic();
  }, []);

  async function loadClinic() {
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
      .select("clinic_id")
      .eq("user_id", user.id)
      .in("member_role", ["owner", "admin"])
      .maybeSingle<MemberRow>();

    if (memberError || !member?.clinic_id) {
      setMessage("Você não possui permissão para configurar esta clínica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setClinicId(member.clinic_id);

    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select(
        `
        id,
        trade_name,
        legal_name,
        cnpj,
        corporate_email,
        whatsapp,
        phone,
        responsible_name,
        responsible_cpf,
        technical_director_name,
        technical_director_crm,
        technical_director_crm_state,
        cnes,
        address_zipcode,
        address_street,
        address_number,
        address_complement,
        address_neighborhood,
        address_city,
        address_state,
        address_country,
        accepts_private_consultation,
        base_private_price_cents,
        average_response_minutes,
        clinic_completed
      `
      )
      .eq("id", member.clinic_id)
      .maybeSingle<ClinicRow>();

    if (clinicError || !clinic) {
      setMessage(
        `Erro ao carregar clínica: ${clinicError?.message || "clínica não encontrada"}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    setForm({
      trade_name: clinic.trade_name || "",
      legal_name: clinic.legal_name || "",
      cnpj: clinic.cnpj || "",
      corporate_email: clinic.corporate_email || "",
      whatsapp: clinic.whatsapp || "",
      phone: clinic.phone || "",
      responsible_name: clinic.responsible_name || "",
      responsible_cpf: clinic.responsible_cpf || "",
      technical_director_name: clinic.technical_director_name || "",
      technical_director_crm: clinic.technical_director_crm || "",
      technical_director_crm_state: clinic.technical_director_crm_state || "",
      cnes: clinic.cnes || "",
      address_zipcode: clinic.address_zipcode || "",
      address_street: clinic.address_street || "",
      address_number: clinic.address_number || "",
      address_complement: clinic.address_complement || "",
      address_neighborhood: clinic.address_neighborhood || "",
      address_city: clinic.address_city || "",
      address_state: clinic.address_state || "",
      address_country: clinic.address_country || "Brasil",
      accepts_private_consultation:
        clinic.accepts_private_consultation ?? true,
      base_private_price: centsToMoney(clinic.base_private_price_cents),
      average_response_minutes: String(clinic.average_response_minutes || 60),
    });

    setLoading(false);
  }

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
      ["Nome fantasia", form.trade_name],
      ["Razão social", form.legal_name],
      ["CNPJ", form.cnpj],
      ["E-mail corporativo", form.corporate_email],
      ["WhatsApp", form.whatsapp],
      ["Responsável administrativo", form.responsible_name],
      ["CPF do responsável", form.responsible_cpf],
      ["CEP", form.address_zipcode],
      ["Rua", form.address_street],
      ["Número", form.address_number],
      ["Bairro", form.address_neighborhood],
      ["Cidade", form.address_city],
      ["Estado", form.address_state],
    ];

    const missing = requiredFields
      .filter(([, value]) => !String(value || "").trim())
      .map(([label]) => label);

    if (form.cnpj && !validateCnpj(form.cnpj)) {
      missing.push("CNPJ válido com 14 dígitos");
    }

    if (form.responsible_cpf && !validateCpf(form.responsible_cpf)) {
      missing.push("CPF do responsável válido com 11 dígitos");
    }

    if (
      form.technical_director_crm &&
      !form.technical_director_crm_state.trim()
    ) {
      missing.push("UF do CRM do diretor técnico");
    }

    return missing;
  }, [form]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    if (!clinicId) {
      setMessage("Clínica não encontrada.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    if (requiredMissing.length > 0) {
      setMessage(
        `Preencha os campos obrigatórios: ${requiredMissing.join(", ")}.`
      );
      setMessageType("error");
      setSaving(false);
      return;
    }

    const privatePriceCents = form.base_private_price
      ? moneyToCents(form.base_private_price)
      : null;

    const { error } = await supabase
      .from("clinics")
      .update({
        trade_name: form.trade_name.trim(),
        legal_name: form.legal_name.trim(),
        cnpj: onlyDigits(form.cnpj),
        corporate_email: form.corporate_email.trim(),
        whatsapp: form.whatsapp.trim(),
        phone: form.phone.trim() || null,
        responsible_name: form.responsible_name.trim(),
        responsible_cpf: onlyDigits(form.responsible_cpf),
        technical_director_name:
          form.technical_director_name.trim() || null,
        technical_director_crm:
          form.technical_director_crm.trim() || null,
        technical_director_crm_state:
          form.technical_director_crm_state.trim().toUpperCase() || null,
        cnes: form.cnes.trim() || null,
        address_zipcode: form.address_zipcode.trim(),
        address_street: form.address_street.trim(),
        address_number: form.address_number.trim(),
        address_complement: form.address_complement.trim() || null,
        address_neighborhood: form.address_neighborhood.trim(),
        address_city: form.address_city.trim(),
        address_state: form.address_state.trim().toUpperCase(),
        address_country: form.address_country.trim() || "Brasil",
        accepts_private_consultation: form.accepts_private_consultation,
        base_private_price_cents: privatePriceCents,
        average_response_minutes: Number(form.average_response_minutes || 60),
        clinic_completed: true,
      })
      .eq("id", clinicId);

    if (error) {
      setMessage(`Erro ao salvar clínica: ${error.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("Configurações da clínica salvas com sucesso.");
    setMessageType("success");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando configurações...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#EAF1F0_0,#F8FAFC_34%,#FFFFFF_100%)]">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1B4B58]">
              Configurações da clínica
            </p>
            <h1 className="mt-3 app-section-title">
              Cadastro institucional completo
            </h1>
            <p className="app-section-subtitle">
              Dados usados para página pública, busca por localização, planos,
              atendimento particular e gestão da clínica.
            </p>
          </div>

          <Link
            href="/clinica/dashboard"
            className="app-button-secondary text-center"
          >
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
            <p className="font-bold">Cadastro institucional incompleto</p>
            <p className="mt-1 text-sm">
              Campos pendentes: {requiredMissing.join(", ")}.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="grid gap-6">
          <div className="app-card p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Dados jurídicos e institucionais
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Informações formais usadas para validação, contato e
                  credibilidade da clínica.
                </p>
              </div>

              <span className="rounded-full bg-[#EAF1F0] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#1B4B58]">
                Obrigatório
              </span>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome fantasia *
                </label>
                <input
                  name="trade_name"
                  value={form.trade_name}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Razão social *
                </label>
                <input
                  name="legal_name"
                  value={form.legal_name}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  CNPJ *
                </label>
                <input
                  name="cnpj"
                  value={form.cnpj}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Somente números"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  CNES
                </label>
                <input
                  name="cnes"
                  value={form.cnes}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  E-mail corporativo *
                </label>
                <input
                  type="email"
                  name="corporate_email"
                  value={form.corporate_email}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  WhatsApp *
                </label>
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Telefone fixo
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="app-input"
                />
              </div>
            </div>
          </div>

          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Responsáveis
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Informe o responsável administrativo e, se houver, o diretor
              técnico da clínica.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Responsável administrativo *
                </label>
                <input
                  name="responsible_name"
                  value={form.responsible_name}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  CPF do responsável *
                </label>
                <input
                  name="responsible_cpf"
                  value={form.responsible_cpf}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Somente números"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Diretor técnico
                </label>
                <input
                  name="technical_director_name"
                  value={form.technical_director_name}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Nome do médico responsável técnico"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  CRM do diretor técnico
                </label>
                <input
                  name="technical_director_crm"
                  value={form.technical_director_crm}
                  onChange={handleChange}
                  className="app-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  UF do CRM do diretor técnico
                </label>
                <input
                  name="technical_director_crm_state"
                  value={form.technical_director_crm_state}
                  onChange={handleChange}
                  className="app-input"
                  maxLength={2}
                  placeholder="RJ"
                />
              </div>
            </div>
          </div>

          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Endereço completo
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Esse endereço será usado futuramente para busca por raio,
              localização e página pública da clínica.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  CEP *
                </label>
                <input
                  name="address_zipcode"
                  value={form.address_zipcode}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Rua *
                </label>
                <input
                  name="address_street"
                  value={form.address_street}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Número *
                </label>
                <input
                  name="address_number"
                  value={form.address_number}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Complemento
                </label>
                <input
                  name="address_complement"
                  value={form.address_complement}
                  onChange={handleChange}
                  className="app-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Bairro *
                </label>
                <input
                  name="address_neighborhood"
                  value={form.address_neighborhood}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Cidade *
                </label>
                <input
                  name="address_city"
                  value={form.address_city}
                  onChange={handleChange}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Estado *
                </label>
                <input
                  name="address_state"
                  value={form.address_state}
                  onChange={handleChange}
                  className="app-input"
                  maxLength={2}
                  placeholder="RJ"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  País
                </label>
                <input
                  name="address_country"
                  value={form.address_country}
                  onChange={handleChange}
                  className="app-input"
                />
              </div>
            </div>
          </div>

          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Atendimento e financeiro
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Defina se a clínica aceita atendimento particular e o tempo médio
              de resposta ao paciente.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
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
                    A clínica aceita consulta particular
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    Isso permite que pacientes sem plano compatível encontrem a
                    clínica.
                  </span>
                </span>
              </label>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Valor base particular
                </label>
                <input
                  name="base_private_price"
                  value={form.base_private_price}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Ex: 180,00"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tempo médio de resposta em minutos
                </label>
                <input
                  name="average_response_minutes"
                  type="number"
                  min={1}
                  value={form.average_response_minutes}
                  onChange={handleChange}
                  className="app-input"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="app-button-primary"
            >
              {saving ? "Salvando..." : "Salvar configurações"}
            </button>

            <Link
              href="/clinica/dashboard"
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