"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type ClinicRow = {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_neighborhood: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  public_slug: string | null;
  public_page_enabled: boolean | null;
  cover_image_url: string | null;
  logo_url: string | null;
  accepts_private_consultation: boolean | null;
  base_private_price_cents: number | null;
};

type PatientRow = {
  health_plan_operator: string | null;
  health_plan_product_name: string | null;
  health_plan_network: string | null;
  health_plan_accommodation: string | null;
  health_plan_segment: string | null;
};

type ClinicHealthPlanRow = {
  clinic_id: string;
  health_plan_operator: string | null;
  health_plan_product_name: string | null;
  health_plan_network: string | null;
  health_plan_accommodation: string | null;
  health_plan_segment: string | null;
};

type ProfileRow = {
  role: string | null;
};

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatMoney(cents: number | null) {
  if (!cents) return "Valor não informado";

  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getClinicName(clinic: ClinicRow) {
  return clinic.trade_name || clinic.legal_name || "Clínica MediNexus";
}

function getClinicCity(clinic: ClinicRow) {
  return clinic.address_city || clinic.city || "Cidade não informada";
}

function getClinicState(clinic: ClinicRow) {
  return clinic.address_state || clinic.state || "UF";
}

function getClinicNeighborhood(clinic: ClinicRow) {
  return clinic.address_neighborhood || clinic.neighborhood || null;
}

function getGradient(index: number) {
  const gradients = [
    "from-[#283C7A] via-[#4B4EA3] to-[#6E56CF]",
    "from-[#283C7A] via-[#3656A7] to-[#7C67C9]",
    "from-[#4B4EA3] via-[#6E56CF] to-[#8B7CF6]",
    "from-[#1E3A8A] via-[#4B4EA3] to-[#6E56CF]",
  ];

  return gradients[index % gradients.length];
}

function isClinicCompatibleWithPatientPlan(
  clinicId: string,
  patient: PatientRow | null,
  clinicPlans: ClinicHealthPlanRow[]
) {
  if (!patient) return false;

  const patientOperator = normalize(patient.health_plan_operator);
  const patientProduct = normalize(patient.health_plan_product_name);
  const patientNetwork = normalize(patient.health_plan_network);
  const patientAccommodation = normalize(patient.health_plan_accommodation);
  const patientSegment = normalize(patient.health_plan_segment);

  if (!patientOperator && !patientProduct) return false;

  const plans = clinicPlans.filter((plan) => plan.clinic_id === clinicId);

  if (plans.length === 0) return false;

  return plans.some((plan) => {
    const planOperator = normalize(plan.health_plan_operator);
    const planProduct = normalize(plan.health_plan_product_name);
    const planNetwork = normalize(plan.health_plan_network);
    const planAccommodation = normalize(plan.health_plan_accommodation);
    const planSegment = normalize(plan.health_plan_segment);

    const operatorMatches =
      !planOperator || !patientOperator || planOperator === patientOperator;

    const productMatches =
      !planProduct ||
      !patientProduct ||
      patientProduct.includes(planProduct) ||
      planProduct.includes(patientProduct);

    const networkMatches =
      !planNetwork ||
      !patientNetwork ||
      patientNetwork.includes(planNetwork) ||
      planNetwork.includes(patientNetwork);

    const accommodationMatches =
      !planAccommodation ||
      !patientAccommodation ||
      patientAccommodation.includes(planAccommodation) ||
      planAccommodation.includes(patientAccommodation);

    const segmentMatches =
      !planSegment ||
      !patientSegment ||
      patientSegment.includes(planSegment) ||
      planSegment.includes(patientSegment);

    return (
      operatorMatches &&
      productMatches &&
      networkMatches &&
      accommodationMatches &&
      segmentMatches
    );
  });
}

export default function ClinicasPage() {
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [clinicPlans, setClinicPlans] = useState<ClinicHealthPlanRow[]>([]);
  const [patient, setPatient] = useState<PatientRow | null>(null);

  const [search, setSearch] = useState("");
  const [showCompatibleOnly, setShowCompatibleOnly] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setIsLogged(Boolean(user));

    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      setRole(profileData?.role || null);

      const { data: loadedPatient } = await supabase
        .from("patients")
        .select(
          `
          health_plan_operator,
          health_plan_product_name,
          health_plan_network,
          health_plan_accommodation,
          health_plan_segment
        `
        )
        .eq("id", user.id)
        .maybeSingle<PatientRow>();

      setPatient(loadedPatient || null);
    } else {
      setRole(null);
      setPatient(null);
      setShowCompatibleOnly(false);
    }

    const [clinicsResponse, plansResponse] = await Promise.all([
      supabase
        .from("clinics")
        .select(
          `
          id,
          trade_name,
          legal_name,
          description,
          city,
          state,
          neighborhood,
          address_city,
          address_state,
          address_neighborhood,
          phone,
          email,
          website,
          public_slug,
          public_page_enabled,
          cover_image_url,
          logo_url,
          accepts_private_consultation,
          base_private_price_cents
        `
        )
        .or("public_page_enabled.is.true,public_page_enabled.is.null")
        .order("trade_name", { ascending: true }),

      supabase
        .from("clinic_health_plans")
        .select(
          `
          clinic_id,
          health_plan_operator,
          health_plan_product_name,
          health_plan_network,
          health_plan_accommodation,
          health_plan_segment
        `
        ),
    ]);

    if (clinicsResponse.error) {
      setMessage(`Erro ao carregar clínicas: ${clinicsResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (plansResponse.error) {
      setMessage(`Erro ao carregar planos aceitos: ${plansResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setClinics((clinicsResponse.data || []) as ClinicRow[]);
    setClinicPlans((plansResponse.data || []) as ClinicHealthPlanRow[]);
    setLoading(false);
  }

  const hasPatientPlan = useMemo(() => {
    return Boolean(patient?.health_plan_operator || patient?.health_plan_product_name);
  }, [patient]);

  const compatibleClinicIds = useMemo(() => {
    return new Set(
      clinics
        .filter((clinic) =>
          isClinicCompatibleWithPatientPlan(clinic.id, patient, clinicPlans)
        )
        .map((clinic) => clinic.id)
    );
  }, [clinics, patient, clinicPlans]);

  const filteredClinics = useMemo(() => {
    const query = normalize(search);

    return clinics.filter((clinic) => {
      const name = normalize(getClinicName(clinic));
      const city = normalize(getClinicCity(clinic));
      const state = normalize(getClinicState(clinic));
      const neighborhood = normalize(getClinicNeighborhood(clinic));
      const description = normalize(clinic.description);

      const matchesSearch =
        !query ||
        name.includes(query) ||
        city.includes(query) ||
        state.includes(query) ||
        neighborhood.includes(query) ||
        description.includes(query);

      const matchesPlan =
        !showCompatibleOnly || compatibleClinicIds.has(clinic.id);

      return matchesSearch && matchesPlan;
    });
  }, [clinics, search, showCompatibleOnly, compatibleClinicIds]);

  const dashboardHref =
    role === "clinic"
      ? "/clinica/dashboard"
      : role === "doctor"
        ? "/medico/dashboard"
        : "/dashboard";

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />

        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pb-14 lg:pt-20">
          <div className="overflow-hidden rounded-[46px] border border-[#D9D6F4] bg-white/80 shadow-[0_34px_110px_-75px_rgba(40,60,122,0.55)] backdrop-blur">
            <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-12">
              <div>
                <p className="inline-flex rounded-full border border-[#D9D6F4] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#283C7A] shadow-sm">
                  Diretório público de clínicas
                </p>

                <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-6xl">
                  Explore clínicas parceiras da MediNexus
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  Veja clínicas disponíveis, convênios aceitos, atendimento
                  particular e estrutura médica em um diretório mais claro e
                  profissional.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={isLogged ? "/busca" : "/login"}
                    className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-7 py-4 text-sm font-bold text-white shadow-[0_18px_50px_-30px_rgba(40,60,122,0.9)] transition hover:-translate-y-0.5 hover:bg-[#213366]"
                  >
                    {isLogged ? "Nova busca" : "Entrar para agendar"}
                  </Link>

                  {isLogged ? (
                    <Link
                      href={dashboardHref}
                      className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-7 py-4 text-sm font-bold text-[#5E4B9A] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6F3FF]"
                    >
                      Voltar ao painel
                    </Link>
                  ) : (
                    <Link
                      href="/sobre"
                      className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-7 py-4 text-sm font-bold text-[#5E4B9A] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6F3FF]"
                    >
                      Conhecer a MediNexus
                    </Link>
                  )}
                </div>
              </div>

              <div className="rounded-[38px] bg-gradient-to-br from-[#283C7A] via-[#4B4EA3] to-[#6E56CF] p-7 text-white shadow-[0_28px_90px_-65px_rgba(40,60,122,0.9)]">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/60">
                  Visão geral
                </p>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-[28px] bg-white/12 p-5 ring-1 ring-white/15">
                    <p className="text-4xl font-bold">{clinics.length}</p>
                    <p className="mt-1 text-sm text-white/70">
                      clínicas no diretório
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[28px] bg-white/12 p-5 ring-1 ring-white/15">
                      <p className="text-3xl font-bold">
                        {compatibleClinicIds.size}
                      </p>
                      <p className="mt-1 text-sm text-white/70">
                        compatíveis com seu plano
                      </p>
                    </div>

                    <div className="rounded-[28px] bg-white/12 p-5 ring-1 ring-white/15">
                      <p className="text-3xl font-bold">
                        {filteredClinics.length}
                      </p>
                      <p className="mt-1 text-sm text-white/70">
                        resultados filtrados
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-white p-5 text-[#283C7A]">
                    <p className="font-bold">
                      Busque por nome, bairro, cidade ou plano.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Faça login para liberar filtro por compatibilidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        {!isLogged && (
          <div className="mb-6 rounded-[26px] border border-[#BFDBFE] bg-[#EFF6FF] p-5 text-sm font-semibold text-[#1D4ED8]">
            Você está vendo o diretório público. Para solicitar consulta, entre
            ou crie sua conta.
          </div>
        )}

        <div className="rounded-[38px] border border-[#D9D6F4] bg-white p-6 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Buscar clínica
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6E56CF] focus:bg-white"
                placeholder="Digite nome, cidade ou bairro"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowCompatibleOnly(false)}
                className={`rounded-2xl px-6 py-4 text-sm font-bold transition ${
                  !showCompatibleOnly
                    ? "bg-[#283C7A] text-white"
                    : "border border-[#D9D6F4] bg-white text-[#5E4B9A] hover:bg-[#F6F3FF]"
                }`}
              >
                Todas
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isLogged || !hasPatientPlan) return;
                  setShowCompatibleOnly(true);
                }}
                disabled={!isLogged || !hasPatientPlan}
                className={`rounded-2xl px-6 py-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  showCompatibleOnly
                    ? "bg-[#6E56CF] text-white"
                    : "border border-[#D9D6F4] bg-white text-[#5E4B9A] hover:bg-[#F6F3FF]"
                }`}
              >
                Compatíveis com meu plano
              </button>
            </div>
          </div>

          {!isLogged && (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Faça login para filtrar clínicas compatíveis com seu plano de saúde.
            </p>
          )}

          {isLogged && !hasPatientPlan && (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Você ainda não tem um plano padrão cadastrado, então o filtro por
              compatibilidade ficou desabilitado.
            </p>
          )}
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[34px] border border-[#D9D6F4] bg-white shadow-sm"
              >
                <div className="h-40 animate-pulse bg-[#F1F5FF]" />
                <div className="space-y-4 p-6">
                  <div className="h-5 w-28 animate-pulse rounded-full bg-[#F1F5FF]" />
                  <div className="h-8 w-2/3 animate-pulse rounded-xl bg-[#F1F5FF]" />
                  <div className="h-4 w-1/2 animate-pulse rounded-lg bg-[#F1F5FF]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="mt-8 rounded-[34px] border border-[#D9D6F4] bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6F3FF] text-2xl">
              🏥
            </div>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950">
              Nenhuma clínica encontrada
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
              Tente buscar por outro nome, cidade ou bairro — ou volte para
              visualizar todas as clínicas.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredClinics.map((clinic, index: number) => {
              const name = getClinicName(clinic);
              const compatible = compatibleClinicIds.has(clinic.id);

              return (
                <article
                  key={clinic.id}
                  className="group overflow-hidden rounded-[34px] border border-[#D9D6F4] bg-white shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)] transition hover:-translate-y-1.5 hover:shadow-[0_32px_90px_-70px_rgba(40,60,122,0.65)]"
                >
                  <div
                    className={`relative h-40 bg-gradient-to-br ${getGradient(
                      index
                    )}`}
                  >
                    {clinic.cover_image_url && (
                      <img
                        src={clinic.cover_image_url}
                        alt={name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}

                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_40%)]" />

                    <div className="absolute bottom-4 left-5 flex items-center gap-2 rounded-full bg-white/18 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                      {compatible ? "Compatível" : "Particular"}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap gap-2">
                      {compatible && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-200">
                          Compatível com seu plano
                        </span>
                      )}

                      {clinic.accepts_private_consultation !== false && (
                        <span className="rounded-full bg-[#F6F3FF] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#6E56CF] ring-1 ring-[#D9D6F4]">
                          Particular
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950">
                      {name}
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      {getClinicNeighborhood(clinic)
                        ? `${getClinicNeighborhood(clinic)} • `
                        : ""}
                      {getClinicCity(clinic)} / {getClinicState(clinic)}
                    </p>

                    <div className="mt-5 rounded-2xl border border-[#E0E7FF] bg-[#F8FAFC] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Atendimento
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Consulta particular:{" "}
                        {formatMoney(clinic.base_private_price_cents)}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {clinic.description ||
                          "Veja mais detalhes da clínica, estrutura e informações públicas na página individual."}
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <Link
                        href={`/clinicas/${clinic.public_slug || clinic.id}`}
                        className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#D9D6F4] bg-white px-4 text-sm font-bold text-[#5E4B9A] transition hover:bg-[#F6F3FF]"
                      >
                        Ver página
                      </Link>

                      <Link
                        href={isLogged ? `/busca?clinicId=${clinic.id}` : "/login"}
                        className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#283C7A] px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(40,60,122,0.22)] transition hover:bg-[#213366]"
                      >
                        {isLogged ? "Agendar" : "Entrar"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}