"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type DoctorRow = {
  id: string;
  user_id: string | null;
  clinic_id: string | null;
  name: string | null;
  crm: string | null;
  crm_state: string | null;
  bio: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type ClinicRow = {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
  city: string | null;
  state: string | null;
  address_city: string | null;
  address_state: string | null;
  address_neighborhood: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getClinicName(clinic: ClinicRow | null) {
  return clinic?.trade_name || clinic?.legal_name || "Clínica não informada";
}

function getClinicLocation(clinic: ClinicRow | null) {
  const parts = [
    clinic?.address_neighborhood,
    clinic?.address_city || clinic?.city,
    clinic?.address_state || clinic?.state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Localização não informada";
}

export default function MedicoPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [doctor, setDoctor] = useState<DoctorRow | null>(null);
  const [clinic, setClinic] = useState<ClinicRow | null>(null);

  const [name, setName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("");
  const [bio, setBio] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado como médico.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data: doctorData, error: doctorError } = await supabase
      .from("doctors")
      .select("id, user_id, clinic_id, name, crm, crm_state, bio, is_active, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (doctorError) {
      setMessage(`Erro ao carregar perfil médico: ${doctorError.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (!doctorData?.id) {
      setMessage("Nenhum cadastro médico encontrado para este usuário.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const loadedDoctor = doctorData as DoctorRow;

    setDoctor(loadedDoctor);
    setName(loadedDoctor.name || "");
    setCrm(loadedDoctor.crm || "");
    setCrmState(loadedDoctor.crm_state || "");
    setBio(loadedDoctor.bio || "");
    setIsActive(loadedDoctor.is_active ?? true);

    if (loadedDoctor.clinic_id) {
      const { data: clinicData } = await supabase
        .from("clinics")
        .select(
          "id, trade_name, legal_name, city, state, address_city, address_state, address_neighborhood"
        )
        .eq("id", loadedDoctor.clinic_id)
        .maybeSingle();

      setClinic((clinicData as ClinicRow) || null);
    } else {
      setClinic(null);
    }

    setLoading(false);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!doctor?.id) {
      setMessage("Cadastro médico não encontrado.");
      setMessageType("error");
      return;
    }

    if (!name.trim()) {
      setMessage("Informe o nome profissional.");
      setMessageType("error");
      return;
    }

    if (!crm.trim()) {
      setMessage("Informe o CRM.");
      setMessageType("error");
      return;
    }

    if (!crmState.trim()) {
      setMessage("Informe o estado do CRM.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("doctors")
      .update({
        name: name.trim(),
        crm: crm.trim(),
        crm_state: crmState.trim().toUpperCase(),
        bio: bio.trim() || null,
        is_active: isActive,
      })
      .eq("id", doctor.id);

    if (error) {
      setMessage(`Erro ao salvar perfil: ${error.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("Perfil médico atualizado com sucesso.");
    setMessageType("success");
    await loadProfile();
    setSaving(false);
  }

  const completion = useMemo(() => {
    const fields = [name.trim(), crm.trim(), crmState.trim(), bio.trim()];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [name, crm, crmState, bio]);

  return (
    <main className="min-h-screen bg-[#FAF6F3]">
      <section className="border-b border-[#E7DDD7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-[#D8CCC5] bg-[#FAF6F3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#164957]">
              Perfil médico
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Meus dados profissionais
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Atualize seu nome profissional, CRM, bio e status de exibição na
              plataforma.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/medico/dashboard"
              className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
            >
              Dashboard
            </Link>

            <Link
              href="/medico/solicitacoes"
              className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
            >
              Solicitações
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
          <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 text-sm text-slate-500 shadow-sm">
            Carregando perfil médico...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.2fr]">
            <aside className="space-y-6">
              <section className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#164957] to-[#5A4C86] text-xl font-bold text-white">
                    {name ? name.slice(0, 2).toUpperCase() : "MD"}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-950">
                      {name || "Nome profissional"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      CRM {crm || "N/I"}
                      {crmState ? ` / ${crmState.toUpperCase()}` : ""}
                    </p>

                    <span
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isActive ? "Perfil ativo" : "Perfil inativo"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[#F7F9FD] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">
                      Completude do perfil
                    </p>
                    <p className="text-sm font-bold text-[#164957]">
                      {completion}%
                    </p>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#164957] to-[#5A4C86]"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-[#E7DDD7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Cadastro criado em
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {formatDate(doctor?.created_at)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E7DDD7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Clínica vinculada
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {getClinicName(clinic)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {getClinicLocation(clinic)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">
                  Atalhos
                </h2>

                <div className="mt-5 grid gap-3">
                  <Link
                    href="/medico/dashboard"
                    className="rounded-2xl bg-[#164957] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#123B46]"
                  >
                    Abrir dashboard
                  </Link>

                  <Link
                    href="/medico/disponibilidade"
                    className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-4 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
                  >
                    Editar disponibilidade
                  </Link>

                  <Link
                    href="/medico/solicitacoes"
                    className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-4 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
                  >
                    Ver solicitações
                  </Link>
                </div>
              </section>
            </aside>

            <section className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Editar informações
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Esses dados aparecem para pacientes e clínicas dentro da
                plataforma.
              </p>

              <form onSubmit={handleSave} className="mt-6 grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nome profissional
                  </label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex.: Dra. Ana Souza"
                    className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      CRM
                    </label>
                    <input
                      value={crm}
                      onChange={(event) => setCrm(event.target.value)}
                      placeholder="Ex.: 123456"
                      className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Estado do CRM
                    </label>
                    <input
                      value={crmState}
                      onChange={(event) => setCrmState(event.target.value)}
                      placeholder="Ex.: RJ"
                      maxLength={2}
                      className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm uppercase text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Bio profissional
                  </label>
                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="Descreva sua atuação, experiência, abordagem e informações úteis para pacientes."
                    rows={7}
                    className="w-full resize-none rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                  />
                </div>

                <div className="rounded-2xl border border-[#E7DDD7] bg-[#FAF6F3] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-950">
                        Exibir perfil na plataforma
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Quando ativo, seu perfil pode aparecer para pacientes e
                        clínicas.
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
                      {isActive ? "Ativo" : "Inativo"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-[#E7DDD7] pt-5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-[#164957] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46] disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : "Salvar perfil"}
                  </button>

                  <Link
                    href="/medico/dashboard"
                    className="rounded-2xl border border-[#D8CCC5] bg-white px-6 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
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


