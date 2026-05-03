"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type ClinicRow = {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
};

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

type FilterType = "all" | "active" | "inactive";

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

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

function getDoctorStatusLabel(item: DoctorRow) {
  return item.is_active === false ? "Inativo" : "Ativo";
}

function getDoctorStatusClass(item: DoctorRow) {
  return item.is_active === false
    ? "bg-slate-100 text-slate-500"
    : "bg-emerald-50 text-emerald-700";
}

export default function ClinicaMedicosPage() {
  const [loading, setLoading] = useState(true);
  const [clinic, setClinic] = useState<ClinicRow | null>(null);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);

  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
      setDoctors([]);
      setLoading(false);
      return;
    }

    const { data: clinicData } = await supabase
      .from("clinics")
      .select("id, trade_name, legal_name")
      .eq("id", clinicId)
      .maybeSingle();

    const { data: doctorsData, error: doctorsError } = await supabase
      .from("doctors")
      .select("id, user_id, clinic_id, name, crm, crm_state, bio, is_active, created_at")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    if (doctorsError) {
      setMessage(`Erro ao carregar médicos: ${doctorsError.message}`);
      setMessageType("error");
      setDoctors([]);
      setLoading(false);
      return;
    }

    setClinic((clinicData as ClinicRow) || null);
    setDoctors((doctorsData || []) as DoctorRow[]);
    setLoading(false);
  }

  async function handleToggleDoctor(item: DoctorRow) {
    setActionLoadingId(item.id);
    setMessage("");

    const { error } = await supabase
      .from("doctors")
      .update({
        is_active: !(item.is_active ?? true),
      })
      .eq("id", item.id);

    if (error) {
      setMessage(`Erro ao atualizar médico: ${error.message}`);
      setMessageType("error");
      setActionLoadingId(null);
      return;
    }

    setMessage(
      item.is_active === false
        ? "Médico ativado com sucesso."
        : "Médico desativado com sucesso."
    );
    setMessageType("success");
    await loadPage();
    setActionLoadingId(null);
  }

  const stats = useMemo(() => {
    return {
      total: doctors.length,
      active: doctors.filter((item) => item.is_active !== false).length,
      inactive: doctors.filter((item) => item.is_active === false).length,
    };
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const query = normalize(search);

    return doctors.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && item.is_active !== false) ||
        (filter === "inactive" && item.is_active === false);

      const searchable = normalize(
        [item.name, item.crm, item.crm_state, item.bio].join(" ")
      );

      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [doctors, filter, search]);

  return (
    <main className="min-h-screen bg-[#F6F8FC]">
      <section className="border-b border-[#E8EAF4] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-[#D8DDF0] bg-[#F8FAFF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#4660A9]">
              Equipe médica
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Médicos da clínica
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Acompanhe os profissionais vinculados à clínica, status de
              exibição e dados profissionais principais.
            </p>

            {clinic && (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                {getClinicName(clinic)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/clinica/dashboard"
              className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-3 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F8FAFF]"
            >
              Dashboard
            </Link>

            <Link
              href="/clinica/solicitacoes"
              className="rounded-2xl bg-[#283C7A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#22356E]"
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

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total", value: stats.total, tone: "text-slate-950" },
            { label: "Ativos", value: stats.active, tone: "text-[#0F8A5F]" },
            { label: "Inativos", value: stats.inactive, tone: "text-[#B26B00]" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-[#E3E8F4] bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>
              <p className={`mt-3 text-3xl font-bold ${item.tone}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-[#E3E8F4] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="w-full xl:max-w-xl">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar médico
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Busque por nome, CRM, UF ou bio"
                className="w-full rounded-2xl border border-[#DCE1F1] bg-[#FBFCFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todos" },
                { value: "active", label: "Ativos" },
                { value: "inactive", label: "Inativos" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value as FilterType)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    filter === item.value
                      ? "bg-[#283C7A] text-white"
                      : "border border-[#D9DDF0] bg-white text-[#5E4B9A] hover:bg-[#F8FAFF]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 text-sm text-slate-500 shadow-sm">
              Carregando médicos...
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="rounded-[28px] border border-[#E3E8F4] bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Nenhum médico encontrado
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Quando houver profissionais vinculados à clínica, eles
                aparecerão aqui.
              </p>
            </div>
          ) : (
            filteredDoctors.map((item) => (
              <article
                key={item.id}
                className="rounded-[28px] border border-[#E3E8F4] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getDoctorStatusClass(
                          item
                        )}`}
                      >
                        {getDoctorStatusLabel(item)}
                      </span>

                      <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#283C7A]">
                        Médico
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-950">
                      {item.name || "Médico sem nome"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      CRM {item.crm || "N/I"}
                      {item.crm_state ? ` / ${item.crm_state}` : ""}
                    </p>

                    {item.bio && (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {item.bio}
                      </p>
                    )}

                    <p className="mt-3 text-xs text-slate-400">
                      Vinculado em {formatDate(item.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[220px]">
                    <button
                      type="button"
                      onClick={() => handleToggleDoctor(item)}
                      disabled={actionLoadingId === item.id}
                      className={`w-full rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                        item.is_active === false
                          ? "bg-[#283C7A] text-white hover:bg-[#22356E]"
                          : "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      {actionLoadingId === item.id
                        ? "Atualizando..."
                        : item.is_active === false
                        ? "Ativar médico"
                        : "Desativar médico"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}