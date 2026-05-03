"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type ClinicRow = {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  city: string | null;
  state: string | null;
  address_city: string | null;
  address_state: string | null;
  address_neighborhood: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getClinicName(clinic: ClinicRow | null) {
  return clinic?.trade_name || clinic?.legal_name || "Clínica";
}

function getClinicLocation(clinic: ClinicRow | null) {
  const parts = [
    clinic?.address_neighborhood,
    clinic?.address_city || clinic?.city,
    clinic?.address_state || clinic?.state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Localização não informada";
}

export default function ClinicaConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clinic, setClinic] = useState<ClinicRow | null>(null);

  const [tradeName, setTradeName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    loadPage();
  }, []);

  async function getClinicIdForCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        clinicId: null,
        errorMessage: "Você precisa estar logado como clínica.",
      };
    }

    const { data: memberData, error: memberError } = await supabase
      .from("clinic_members")
      .select("clinic_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (memberError) {
      return {
        clinicId: null,
        errorMessage: `Erro ao carregar vínculo da clínica: ${memberError.message}`,
      };
    }

    if (!memberData?.clinic_id) {
      return {
        clinicId: null,
        errorMessage: "Nenhuma clínica vinculada a este usuário.",
      };
    }

    return {
      clinicId: memberData.clinic_id as string,
      errorMessage: "",
    };
  }

  async function loadPage() {
    setLoading(true);
    setMessage("");

    const { clinicId, errorMessage } = await getClinicIdForCurrentUser();

    if (!clinicId) {
      setMessage(errorMessage);
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinicId)
      .maybeSingle();

    if (error) {
      setMessage(`Erro ao carregar clínica: ${error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    const loadedClinic = (data || null) as ClinicRow | null;

    setClinic(loadedClinic);
    setTradeName(loadedClinic?.trade_name || "");
    setLegalName(loadedClinic?.legal_name || "");
    setPhone(loadedClinic?.phone || "");
    setEmail(loadedClinic?.email || "");
    setAddressNeighborhood(loadedClinic?.address_neighborhood || "");
    setAddressCity(loadedClinic?.address_city || loadedClinic?.city || "");
    setAddressState(loadedClinic?.address_state || loadedClinic?.state || "");
    setAddressStreet(loadedClinic?.address_street || "");
    setAddressNumber(loadedClinic?.address_number || "");
    setAddressComplement(loadedClinic?.address_complement || "");
    setDescription(loadedClinic?.description || "");
    setIsActive(loadedClinic?.is_active ?? true);

    setLoading(false);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clinic?.id) {
      setMessage("Clínica não encontrada.");
      setMessageType("error");
      return;
    }

    if (!tradeName.trim() && !legalName.trim()) {
      setMessage("Informe ao menos o nome fantasia ou a razão social.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload: Record<string, unknown> = {
      trade_name: tradeName.trim() || null,
      legal_name: legalName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address_neighborhood: addressNeighborhood.trim() || null,
      address_city: addressCity.trim() || null,
      address_state: addressState.trim().toUpperCase() || null,
      city: addressCity.trim() || null,
      state: addressState.trim().toUpperCase() || null,
      address_street: addressStreet.trim() || null,
      address_number: addressNumber.trim() || null,
      address_complement: addressComplement.trim() || null,
      description: description.trim() || null,
      is_active: isActive,
    };

    const { error } = await supabase
      .from("clinics")
      .update(payload)
      .eq("id", clinic.id);

    if (error) {
      setMessage(`Erro ao salvar configurações: ${error.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("Configurações da clínica atualizadas com sucesso.");
    setMessageType("success");
    await loadPage();
    setSaving(false);
  }

  const completion = useMemo(() => {
    const fields = [
      tradeName.trim(),
      legalName.trim(),
      phone.trim(),
      email.trim(),
      addressCity.trim(),
      addressState.trim(),
      description.trim(),
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [tradeName, legalName, phone, email, addressCity, addressState, description]);

  return (
    <main className="min-h-screen bg-[#F6F8FC]">
      <section className="border-b border-[#E8EAF4] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-[#D8DDF0] bg-[#F8FAFF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#4660A9]">
              Configurações
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Dados da clínica
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Atualize informações institucionais, contato, endereço e status de
              exibição da clínica na plataforma.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/clinica/dashboard"
              className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-3 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F8FAFF]"
            >
              Dashboard
            </Link>

            <Link
              href="/clinica/medicos"
              className="rounded-2xl bg-[#283C7A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#22356E]"
            >
              Médicos
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 text-sm text-slate-500 shadow-sm">
            Carregando configurações da clínica...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.2fr]">
            <aside className="space-y-6">
              <section className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#283C7A] to-[#6E56CF] text-xl font-bold text-white">
                    {getClinicName(clinic).slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-950">
                      {getClinicName(clinic)}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {getClinicLocation(clinic)}
                    </p>

                    <span
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isActive ? "Clínica ativa" : "Clínica inativa"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[#F7F9FD] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">
                      Completude do cadastro
                    </p>
                    <p className="text-sm font-bold text-[#283C7A]">
                      {completion}%
                    </p>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#283C7A] to-[#6E56CF]"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-[#E9EDF7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Razão social
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {clinic?.legal_name || "Não informada"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E9EDF7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Criada em
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {formatDate(clinic?.created_at)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">Atalhos</h2>

                <div className="mt-5 grid gap-3">
                  <Link
                    href="/clinica/dashboard"
                    className="rounded-2xl bg-[#283C7A] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#22356E]"
                  >
                    Abrir dashboard
                  </Link>

                  <Link
                    href="/clinica/solicitacoes"
                    className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-4 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F8FAFF]"
                  >
                    Ver solicitações
                  </Link>

                  <Link
                    href="/clinica/medicos"
                    className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-4 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F8FAFF]"
                  >
                    Gerenciar médicos
                  </Link>
                </div>
              </section>
            </aside>

            <section className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Editar informações
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Esses dados ajudam pacientes e médicos a reconhecerem sua
                clínica dentro da plataforma.
              </p>

              <form onSubmit={handleSave} className="mt-6 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Nome fantasia
                    </label>
                    <input
                      value={tradeName}
                      onChange={(event) => setTradeName(event.target.value)}
                      placeholder="Ex.: Clínica Vida"
                      className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Razão social
                    </label>
                    <input
                      value={legalName}
                      onChange={(event) => setLegalName(event.target.value)}
                      placeholder="Ex.: Clínica Vida LTDA"
                      className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Telefone
                    </label>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Ex.: (21) 99999-9999"
                      className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      E-mail
                    </label>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Ex.: contato@clinica.com"
                      className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-[1.2fr_0.45fr_0.45fr]">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Rua
                    </label>
                    <input
                      value={addressStreet}
                      onChange={(event) => setAddressStreet(event.target.value)}
                      placeholder="Ex.: Rua das Flores"
                      className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Número
                    </label>
                    <input
                      value={addressNumber}
                      onChange={(event) => setAddressNumber(event.target.value)}
                      placeholder="120"
                      className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      UF
                    </label>
                    <input
                      value={addressState}
                      maxLength={2}
                      onChange={(event) => setAddressState(event.target.value)}
                      placeholder="RJ"
                      className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm uppercase text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Bairro
                    </label>
                    <input
                      value={addressNeighborhood}
                      onChange={(event) =>
                        setAddressNeighborhood(event.target.value)
                      }
                      placeholder="Ex.: Centro"
                      className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Cidade
                    </label>
                    <input
                      value={addressCity}
                      onChange={(event) => setAddressCity(event.target.value)}
                      placeholder="Ex.: Rio de Janeiro"
                      className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Complemento
                    </label>
                    <input
                      value={addressComplement}
                      onChange={(event) =>
                        setAddressComplement(event.target.value)
                      }
                      placeholder="Ex.: Sala 304"
                      className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Descrição da clínica
                  </label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Descreva a clínica, estrutura, especialidades atendidas e diferenciais."
                    rows={7}
                    className="w-full resize-none rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                  />
                </div>

                <div className="rounded-2xl border border-[#E3E8F4] bg-[#FBFCFF] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-950">
                        Exibir clínica na plataforma
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Quando ativa, a clínica pode aparecer para pacientes.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsActive((prev) => !prev)}
                      className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isActive ? "Ativa" : "Inativa"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-[#EEF1FA] pt-5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-[#283C7A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#22356E] disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : "Salvar configurações"}
                  </button>

                  <Link
                    href="/clinica/dashboard"
                    className="rounded-2xl border border-[#D9DDF0] bg-white px-6 py-3 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F8FAFF]"
                  >
                    Cancelar
                  </Link>
                </div>
              </form>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}