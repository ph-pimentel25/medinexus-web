"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_zip_code: string | null;
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

type DoctorRow = {
  id: string;
  name: string | null;
  crm: string | null;
  crm_state: string | null;
  clinic_id: string | null;
  average_consultation_minutes: number | null;
  accepts_private_consultation: boolean | null;
  private_price_cents: number | null;
};

type DoctorSpecialtyRow = {
  doctor_id: string | null;
  specialty_id: string | null;
  specialties:
    | {
        id: string;
        name: string | null;
      }
    | {
        id: string;
        name: string | null;
      }[]
    | null;
};

type ClinicHealthPlanRow = {
  id?: string;
  clinic_id: string;
  health_plan_operator: string | null;
  health_plan_product_name: string | null;
  health_plan_network: string | null;
  health_plan_accommodation: string | null;
  health_plan_segment: string | null;
  notes: string | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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

function buildAddress(clinic: ClinicRow) {
  const line1 = [
    clinic.address_street,
    clinic.address_number,
    clinic.address_complement,
  ]
    .filter(Boolean)
    .join(", ");

  const line2 = [
    getClinicNeighborhood(clinic),
    getClinicCity(clinic),
    getClinicState(clinic),
  ]
    .filter(Boolean)
    .join(" • ");

  if (line1 && line2) return `${line1} — ${line2}`;
  if (line1) return line1;
  return line2 || "Endereço não informado";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getDoctorPrice(doctor: DoctorRow, clinic: ClinicRow) {
  return doctor.private_price_cents || clinic.base_private_price_cents || null;
}

function uniqueSpecialtyNames(rows: DoctorSpecialtyRow[]) {
  const names = rows
    .map((row) => pickOne(row.specialties)?.name)
    .filter(Boolean) as string[];

  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export default function ClinicPublicPage() {
  const params = useParams<{ id: string }>();
  const clinicIdentifier = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);

  const [clinic, setClinic] = useState<ClinicRow | null>(null);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [doctorSpecialties, setDoctorSpecialties] = useState<
    DoctorSpecialtyRow[]
  >([]);
  const [healthPlans, setHealthPlans] = useState<ClinicHealthPlanRow[]>([]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "info" | "success">(
    "info"
  );

  useEffect(() => {
    loadClinicPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicIdentifier]);

  async function loadClinicPage() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setIsLogged(Boolean(user));

    if (!clinicIdentifier) {
      setMessage("Clínica não encontrada.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    let clinicQuery = supabase.from("clinics").select(
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
      address_street,
      address_number,
      address_complement,
      address_zip_code,
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
    );

    if (isUuid(clinicIdentifier)) {
      clinicQuery = clinicQuery.eq("id", clinicIdentifier);
    } else {
      clinicQuery = clinicQuery.eq("public_slug", clinicIdentifier);
    }

    const { data: clinicData, error: clinicError } =
      await clinicQuery.maybeSingle<ClinicRow>();

    if (clinicError || !clinicData) {
      setMessage(
        `Erro ao carregar clínica: ${
          clinicError?.message || "clínica não encontrada"
        }`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (clinicData.public_page_enabled === false) {
      setMessage("A página pública desta clínica não está disponível.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const [doctorsResponse, plansResponse] = await Promise.all([
      supabase
        .from("doctors")
        .select(
          `
          id,
          name,
          crm,
          crm_state,
          clinic_id,
          average_consultation_minutes,
          accepts_private_consultation,
          private_price_cents
        `
        )
        .eq("clinic_id", clinicData.id)
        .order("name", { ascending: true }),

      supabase
        .from("clinic_health_plans")
        .select(
          `
          clinic_id,
          health_plan_operator,
          health_plan_product_name,
          health_plan_network,
          health_plan_accommodation,
          health_plan_segment,
          notes
        `
        )
        .eq("clinic_id", clinicData.id),
    ]);

    if (doctorsResponse.error) {
      setMessage(`Erro ao carregar médicos: ${doctorsResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (plansResponse.error) {
      setMessage(
        `Erro ao carregar planos aceitos: ${plansResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    const loadedDoctors = (doctorsResponse.data || []) as DoctorRow[];
    const doctorIds = loadedDoctors.map((item) => item.id);

    let specialtiesData: DoctorSpecialtyRow[] = [];

    if (doctorIds.length > 0) {
      const { data, error } = await supabase
        .from("doctor_specialties")
        .select(
          `
          doctor_id,
          specialty_id,
          specialties (
            id,
            name
          )
        `
        )
        .in("doctor_id", doctorIds);

      if (error) {
        setMessage(`Erro ao carregar especialidades: ${error.message}`);
        setMessageType("error");
        setLoading(false);
        return;
      }

      specialtiesData = (data || []) as DoctorSpecialtyRow[];
    }

    setClinic(clinicData);
    setDoctors(loadedDoctors);
    setHealthPlans((plansResponse.data || []) as ClinicHealthPlanRow[]);
    setDoctorSpecialties(specialtiesData);
    setLoading(false);
  }

  const clinicName = clinic ? getClinicName(clinic) : "Clínica MediNexus";

  const specialtyNames = useMemo(
    () => uniqueSpecialtyNames(doctorSpecialties),
    [doctorSpecialties]
  );

  const doctorsWithSpecialties = useMemo(() => {
    return doctors.map((doctor) => {
      const specialties = doctorSpecialties
        .filter((row) => row.doctor_id === doctor.id)
        .map((row) => pickOne(row.specialties)?.name)
        .filter(Boolean) as string[];

      return {
        ...doctor,
        specialtyNames: Array.from(new Set(specialties)).sort((a, b) =>
          a.localeCompare(b, "pt-BR")
        ),
      };
    });
  }, [doctors, doctorSpecialties]);

  const planOperators = useMemo(() => {
    const names = healthPlans
      .map((plan) => plan.health_plan_operator)
      .filter(Boolean) as string[];

    return Array.from(new Set(names)).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [healthPlans]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-slate-600">Carregando página da clínica...</p>
        </section>
      </main>
    );
  }

  if (!clinic) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-[34px] border border-red-200 bg-red-50 p-6 text-red-700">
            {message || "Clínica não encontrada."}
          </div>

          <Link
            href="/clinicas"
            className="mt-6 inline-flex rounded-2xl bg-[#164957] px-6 py-4 text-sm font-bold text-white"
          >
            Voltar para clínicas
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />

        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pb-14 lg:pt-20">
          <div className="overflow-hidden rounded-[46px] border border-[#D9D6F4] bg-white shadow-[0_34px_110px_-75px_rgba(40,60,122,0.55)]">
            <div className="relative min-h-[280px] bg-gradient-to-br from-[#164957] via-[#5A4C86] to-[#5A4C86]">
              {clinic.cover_image_url && (
                <img
                  src={clinic.cover_image_url}
                  alt={clinicName}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-br from-[#172554]/75 via-[#4338CA]/55 to-[#5A4C86]/70" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_36%)]" />

              <div className="relative flex min-h-[280px] flex-col justify-end p-7 text-white sm:p-10 lg:p-12">
                <div className="mb-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                    Página pública
                  </span>

                  {clinic.accepts_private_consultation !== false && (
                    <span className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                      Particular disponível
                    </span>
                  )}

                  {planOperators.length > 0 && (
                    <span className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                      Convênios aceitos
                    </span>
                  )}
                </div>

                <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <div className="mb-5 flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[26px] border border-white/25 bg-white/15 text-2xl font-bold text-white backdrop-blur">
                        {clinic.logo_url ? (
                          <img
                            src={clinic.logo_url}
                            alt={clinicName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(clinicName)
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
                          Clínica
                        </p>
                        <p className="mt-1 text-white/80">
                          {getClinicNeighborhood(clinic)
                            ? `${getClinicNeighborhood(clinic)} • `
                            : ""}
                          {getClinicCity(clinic)} / {getClinicState(clinic)}
                        </p>
                      </div>
                    </div>

                    <h1 className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl">
                      {clinicName}
                    </h1>

                    <p className="mt-5 max-w-3xl text-lg leading-8 text-white/78">
                      {clinic.description ||
                        "Conheça a estrutura, médicos, especialidades e formas de atendimento desta clínica dentro da MediNexus."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                    <Link
                      href={isLogged ? `/busca?clinicId=${clinic.id}` : "/login"}
                      className="inline-flex justify-center rounded-2xl bg-white px-7 py-4 text-sm font-bold text-[#164957] shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
                    >
                      {isLogged ? "Agendar nesta clínica" : "Entrar para agendar"}
                    </Link>

                    <Link
                      href="/clinicas"
                      className="inline-flex justify-center rounded-2xl border border-white/25 bg-white/10 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
                    >
                      Ver outras clínicas
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-[#E0E7FF] bg-white p-6 md:grid-cols-4">
              <div className="rounded-[26px] bg-[#F1F5FF] p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Médicos
                </p>
                <p className="mt-2 text-4xl font-bold text-[#164957]">
                  {doctors.length}
                </p>
              </div>

              <div className="rounded-[26px] bg-[#F6F3FF] p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Especialidades
                </p>
                <p className="mt-2 text-4xl font-bold text-[#5A4C86]">
                  {specialtyNames.length}
                </p>
              </div>

              <div className="rounded-[26px] bg-[#F8FAFC] p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Convênios
                </p>
                <p className="mt-2 text-4xl font-bold text-slate-950">
                  {planOperators.length}
                </p>
              </div>

              <div className="rounded-[26px] bg-[#F8FAFC] p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Particular
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {clinic.accepts_private_consultation !== false
                    ? formatMoney(clinic.base_private_price_cents)
                    : "Não informado"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div
            className={`mb-6 rounded-[26px] border p-5 text-sm font-semibold ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[38px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#164957]">
              Sobre a clínica
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Estrutura para receber pacientes com mais organização.
            </h2>

            <p className="mt-4 leading-8 text-slate-600">
              {clinic.description ||
                "Esta clínica faz parte do diretório MediNexus e pode receber solicitações de pacientes por especialidade, localização, plano de saúde ou consulta particular."}
            </p>

            <div className="mt-7 grid gap-3">
              <div className="rounded-3xl border border-[#E0E7FF] bg-[#F8FAFC] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Endereço
                </p>
                <p className="mt-2 font-semibold text-slate-800">
                  {buildAddress(clinic)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-[#E0E7FF] bg-[#F8FAFC] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Telefone
                  </p>
                  <p className="mt-2 font-semibold text-slate-800">
                    {clinic.phone || "Não informado"}
                  </p>
                </div>

                <div className="rounded-3xl border border-[#E0E7FF] bg-[#F8FAFC] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    E-mail
                  </p>
                  <p className="mt-2 break-all font-semibold text-slate-800">
                    {clinic.email || "Não informado"}
                  </p>
                </div>
              </div>

              {clinic.website && (
                <a
                  href={clinic.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-5 py-4 text-sm font-bold text-[#5A4C86] transition hover:bg-[#F6F3FF]"
                >
                  Acessar site da clínica
                </a>
              )}
            </div>
          </article>

          <article className="rounded-[38px] border border-[#D9D6F4] bg-gradient-to-br from-[#F6F3FF] to-[#F1F5FF] p-7 shadow-[0_24px_80px_-70px_rgba(94,75,154,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#5A4C86]">
              Especialidades
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Áreas de atendimento disponíveis.
            </h2>

            {specialtyNames.length === 0 ? (
              <p className="mt-4 leading-8 text-slate-600">
                Esta clínica ainda não cadastrou especialidades públicas.
              </p>
            ) : (
              <div className="mt-6 flex flex-wrap gap-3">
                {specialtyNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-[#D9D6F4] bg-white px-4 py-2 text-sm font-bold text-[#5A4C86]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-[30px] bg-white/80 p-5 ring-1 ring-white">
              <p className="text-sm font-bold text-slate-700">
                Quer buscar uma consulta por especialidade?
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                A MediNexus pode sugerir o melhor encaixe considerando raio,
                disponibilidade e forma de atendimento.
              </p>

              <Link
                href={isLogged ? `/busca?clinicId=${clinic.id}` : "/login"}
                className="mt-5 inline-flex rounded-2xl bg-[#5A4C86] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#5A4C86]"
              >
                {isLogged ? "Buscar nesta clínica" : "Entrar para buscar"}
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#164957]">
              Equipe médica
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">
              Médicos vinculados Ã  clínica
            </h2>
          </div>

          <Link
            href={isLogged ? `/busca?clinicId=${clinic.id}` : "/login"}
            className="inline-flex justify-center rounded-2xl bg-[#164957] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#164957]"
          >
            Agendar consulta
          </Link>
        </div>

        {doctorsWithSpecialties.length === 0 ? (
          <div className="rounded-[34px] border border-[#D9D6F4] bg-white p-8 text-slate-600 shadow-sm">
            Nenhum médico público vinculado a esta clínica ainda.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {doctorsWithSpecialties.map((doctor) => (
              <article
                key={doctor.id}
                className="rounded-[34px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]"
              >
                <div className="flex gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#164957] to-[#5A4C86] text-lg font-bold text-white">
                    {getInitials(doctor.name || "Médico")}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                      {doctor.name || "Médico não informado"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      CRM {doctor.crm || "não informado"}
                      {doctor.crm_state ? ` / ${doctor.crm_state}` : ""}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {doctor.specialtyNames.length === 0 ? (
                        <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-[#E0E7FF]">
                          Especialidade não informada
                        </span>
                      ) : (
                        doctor.specialtyNames.map((name) => (
                          <span
                            key={name}
                            className="rounded-full bg-[#F1F5FF] px-3 py-1 text-xs font-bold text-[#164957] ring-1 ring-[#E0E7FF]"
                          >
                            {name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-[#F8FAFC] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Duração média
                    </p>
                    <p className="mt-2 font-bold text-slate-950">
                      {doctor.average_consultation_minutes || 20} minutos
                    </p>
                  </div>

                  <div className="rounded-3xl bg-[#F8FAFC] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Particular
                    </p>
                    <p className="mt-2 font-bold text-slate-950">
                      {doctor.accepts_private_consultation === false
                        ? "Não informado"
                        : formatMoney(getDoctorPrice(doctor, clinic))}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[42px] border border-[#D9D6F4] bg-white p-8 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#5A4C86]">
                Convênios aceitos
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Planos cadastrados pela clínica
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                A compatibilidade pode variar conforme rede, acomodação,
                produto do plano e regras da operadora.
              </p>
            </div>

            {healthPlans.length === 0 ? (
              <div className="rounded-[30px] bg-[#F8FAFC] p-6 text-slate-600">
                Esta clínica ainda não cadastrou convênios públicos.
              </div>
            ) : (
              <div className="grid gap-3">
                {healthPlans.map((plan, index) => (
                  <div
                    key={`${plan.clinic_id}-${index}`}
                    className="rounded-[28px] border border-[#E0E7FF] bg-[#F8FAFC] p-5"
                  >
                    <p className="font-bold text-slate-950">
                      {plan.health_plan_operator || "Operadora não informada"}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold">Produto:</span>{" "}
                        {plan.health_plan_product_name || "Não informado"}
                      </p>
                      <p>
                        <span className="font-semibold">Rede:</span>{" "}
                        {plan.health_plan_network || "Não informado"}
                      </p>
                      <p>
                        <span className="font-semibold">Acomodação:</span>{" "}
                        {plan.health_plan_accommodation || "Não informado"}
                      </p>
                      <p>
                        <span className="font-semibold">Segmentação:</span>{" "}
                        {plan.health_plan_segment || "Não informado"}
                      </p>
                    </div>

                    {plan.notes && (
                      <p className="mt-3 text-sm text-slate-500">
                        {plan.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

