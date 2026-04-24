"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type ClinicRow = {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
  cnpj: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address_text: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  public_highlight_1: string | null;
  public_highlight_2: string | null;
  public_highlight_3: string | null;
};

type PatientRow = {
  default_health_plan_id: string | null;
};

type ClinicHealthPlanRow = {
  clinic_id: string;
  health_plan_id: string;
  health_plans?: { name: string | null } | { name: string | null }[] | null;
};

type DoctorRow = {
  id: string;
  name: string | null;
  professional_email: string | null;
  crm: string | null;
  crm_state: string | null;
  bio_short: string | null;
  is_active: boolean;
};

type DoctorSpecialtyRow = {
  doctor_id: string;
  specialty_id: string;
};

type SpecialtyRow = {
  id: string;
  name: string;
};

type DoctorCard = {
  id: string;
  name: string;
  professionalEmail: string | null;
  crm: string | null;
  crmState: string | null;
  bioShort: string | null;
  specialties: string[];
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatCnpj(value: string | null) {
  if (!value) return "Não informado";

  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return value;

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

export default function ClinicaDetalhePage() {
  const params = useParams<{ id: string }>();
  const clinicId = params?.id;

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [clinic, setClinic] = useState<ClinicRow | null>(null);
  const [planNames, setPlanNames] = useState<string[]>([]);
  const [compatibleWithPatientPlan, setCompatibleWithPatientPlan] = useState(false);
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);

  useEffect(() => {
    if (clinicId) {
      loadClinicPage(clinicId);
    }
  }, [clinicId]);

  async function loadClinicPage(targetClinicId: string) {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para visualizar esta clínica.");
      setMessageType("info");
      setLoading(false);
      return;
    }

    const { data: clinicData, error: clinicError } = await supabase
      .from("clinics")
      .select(
        `
        id,
        trade_name,
        legal_name,
        cnpj,
        contact_name,
        contact_phone,
        contact_email,
        address_text,
        neighborhood,
        city,
        state,
        zip_code,
        description,
        website_url,
        logo_url,
        cover_image_url,
        hero_title,
        hero_subtitle,
        public_highlight_1,
        public_highlight_2,
        public_highlight_3
      `
      )
      .eq("id", targetClinicId)
      .maybeSingle<ClinicRow>();

    if (clinicError || !clinicData) {
      setMessage("Não foi possível carregar esta clínica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setClinic(clinicData);

    const [
      patientResponse,
      clinicPlansResponse,
      doctorsResponse,
      doctorSpecialtiesResponse,
      specialtiesResponse,
    ] = await Promise.all([
      supabase
        .from("patients")
        .select("default_health_plan_id")
        .eq("id", user.id)
        .maybeSingle<PatientRow>(),
      supabase
        .from("clinic_health_plans")
        .select("clinic_id, health_plan_id, health_plans(name)")
        .eq("clinic_id", targetClinicId),
      supabase
        .from("doctors")
        .select(
          "id, name, professional_email, crm, crm_state, bio_short, is_active"
        )
        .eq("clinic_id", targetClinicId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase.from("doctor_specialties").select("doctor_id, specialty_id"),
      supabase.from("specialties").select("id, name"),
    ]);

    if (clinicPlansResponse.error) {
      setMessage(
        `Erro ao carregar convênios da clínica: ${clinicPlansResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (doctorsResponse.error) {
      setMessage(
        `Erro ao carregar médicos da clínica: ${doctorsResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (doctorSpecialtiesResponse.error) {
      setMessage(
        `Erro ao carregar especialidades médicas: ${doctorSpecialtiesResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (specialtiesResponse.error) {
      setMessage(
        `Erro ao carregar especialidades: ${specialtiesResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    const patientPlanId =
      patientResponse.data?.default_health_plan_id || null;

    const clinicPlansRows = (clinicPlansResponse.data || []) as ClinicHealthPlanRow[];
    const doctorRows = (doctorsResponse.data || []) as DoctorRow[];
    const doctorSpecialtiesRows =
      (doctorSpecialtiesResponse.data || []) as DoctorSpecialtyRow[];
    const specialtyRows = (specialtiesResponse.data || []) as SpecialtyRow[];

    const specialtyMap = new Map(specialtyRows.map((item) => [item.id, item.name]));
    const specialtiesByDoctor = new Map<string, string[]>();

    for (const row of doctorSpecialtiesRows) {
      const current = specialtiesByDoctor.get(row.doctor_id) || [];
      current.push(row.specialty_id);
      specialtiesByDoctor.set(row.doctor_id, current);
    }

    const normalizedPlans = clinicPlansRows
      .map((row) => pickOne(row.health_plans)?.name)
      .filter(Boolean) as string[];

    setPlanNames(normalizedPlans);
    setCompatibleWithPatientPlan(
      patientPlanId
        ? clinicPlansRows.some((row) => row.health_plan_id === patientPlanId)
        : false
    );

    const normalizedDoctors: DoctorCard[] = doctorRows.map((doctor) => {
      const specialtyIds = specialtiesByDoctor.get(doctor.id) || [];
      const specialtyNames = specialtyIds
        .map((id) => specialtyMap.get(id))
        .filter(Boolean) as string[];

      return {
        id: doctor.id,
        name: doctor.name || "Médico sem nome",
        professionalEmail: doctor.professional_email,
        crm: doctor.crm,
        crmState: doctor.crm_state,
        bioShort: doctor.bio_short,
        specialties: specialtyNames,
      };
    });

    setDoctors(normalizedDoctors);
    setLoading(false);
  }

  const clinicSpecialties = useMemo(() => {
    return Array.from(new Set(doctors.flatMap((doctor) => doctor.specialties)));
  }, [doctors]);

  const highlights = useMemo(() => {
    if (!clinic) return [];
    return [
      clinic.public_highlight_1,
      clinic.public_highlight_2,
      clinic.public_highlight_3,
    ].filter(Boolean) as string[];
  }, [clinic]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando clínica...</p>
      </main>
    );
  }

  if (!clinic) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="app-shell py-10">
          <Alert variant="error">Clínica não encontrada.</Alert>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section
        className="relative overflow-hidden border-b border-slate-200"
        style={{
          background: clinic.cover_image_url
            ? `linear-gradient(135deg, rgba(27,75,88,0.80), rgba(89,78,134,0.72)), url(${clinic.cover_image_url}) center/cover`
            : "linear-gradient(135deg, rgba(27,75,88,0.10), rgba(89,78,134,0.12))",
        }}
      >
        <div className="app-shell py-14">
          <Link
            href="/clinicas"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para clínicas
          </Link>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              {clinic.logo_url && (
                <div className="mb-5 inline-flex rounded-3xl bg-white/85 p-3 shadow-sm">
                  <img
                    src={clinic.logo_url}
                    alt={clinic.trade_name || "Logo da clínica"}
                    className="h-16 w-auto object-contain"
                  />
                </div>
              )}

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
                  {clinic.hero_title || clinic.trade_name || "Clínica"}
                </h1>

                {compatibleWithPatientPlan && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                    Compatível com seu plano
                  </span>
                )}
              </div>

              <p className="max-w-3xl text-lg leading-8 text-slate-700">
                {clinic.hero_subtitle ||
                  clinic.description ||
                  "Conheça a clínica, seus convênios aceitos, equipe médica e especialidades disponíveis na MediNexus."}
              </p>

              {highlights.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {highlights.map((highlight, index) => (
                    <span
                      key={`${highlight}-${index}`}
                      className="rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-slate-800"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full max-w-[280px] rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-lg">
              <p className="text-sm font-medium text-slate-500">
                Pronto para agendar?
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Busque nessa clínica
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                A busca já vai abrir pré-filtrada para esta clínica.
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  href={`/busca?clinicId=${clinic.id}`}
                  className="app-button-primary text-center"
                >
                  Agendar nesta clínica
                </Link>

                <Link href="/clinicas" className="app-button-secondary text-center">
                  Ver outras clínicas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-shell py-10">
        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Médicos ativos</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {doctors.length}
            </h3>
          </div>

          <div className="metric-card metric-card--success">
            <p className="text-sm text-green-700">Especialidades</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {clinicSpecialties.length}
            </h3>
          </div>

          <div className="metric-card metric-card--warning">
            <p className="text-sm text-yellow-700">Convênios aceitos</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {planNames.length}
            </h3>
          </div>

          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Contato</p>
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              {clinic.contact_phone || "Não informado"}
            </h3>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6">
            <div className="app-card p-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                Sobre a clínica
              </h2>

              <div className="mt-5 grid gap-3 text-slate-700">
                <p>
                  <span className="font-semibold">Nome fantasia:</span>{" "}
                  {clinic.trade_name || "Não informado"}
                </p>
                <p>
                  <span className="font-semibold">Razão social:</span>{" "}
                  {clinic.legal_name || "Não informado"}
                </p>
                <p>
                  <span className="font-semibold">CNPJ:</span>{" "}
                  {formatCnpj(clinic.cnpj)}
                </p>
                <p>
                  <span className="font-semibold">Responsável:</span>{" "}
                  {clinic.contact_name || "Não informado"}
                </p>
                <p>
                  <span className="font-semibold">Telefone:</span>{" "}
                  {clinic.contact_phone || "Não informado"}
                </p>
                <p>
                  <span className="font-semibold">E-mail:</span>{" "}
                  {clinic.contact_email || "Não informado"}
                </p>
                <p>
                  <span className="font-semibold">Endereço:</span>{" "}
                  {clinic.address_text || "Não informado"}
                </p>
                <p>
                  <span className="font-semibold">Bairro:</span>{" "}
                  {clinic.neighborhood || "Não informado"}
                </p>
                <p>
                  <span className="font-semibold">Cidade/UF:</span>{" "}
                  {clinic.city || "Cidade não informada"} /{" "}
                  {clinic.state || "Estado não informado"}
                </p>
                <p>
                  <span className="font-semibold">CEP:</span>{" "}
                  {clinic.zip_code || "Não informado"}
                </p>
              </div>

              {clinic.description && (
                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm leading-7 text-slate-700">
                    {clinic.description}
                  </p>
                </div>
              )}
            </div>

            <div className="app-card p-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                Equipe médica
              </h2>

              {doctors.length === 0 ? (
                <p className="mt-5 text-slate-500">
                  Nenhum médico ativo cadastrado nesta clínica.
                </p>
              ) : (
                <div className="mt-6 grid gap-6">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-slate-900">
                            {doctor.name}
                          </h3>

                          <div className="mt-4 grid gap-3 text-slate-700 md:grid-cols-2">
                            <p>
                              <span className="font-semibold">CRM:</span>{" "}
                              {doctor.crm || "Não informado"}
                              {doctor.crmState ? ` / ${doctor.crmState}` : ""}
                            </p>
                            <p>
                              <span className="font-semibold">E-mail:</span>{" "}
                              {doctor.professionalEmail || "Não informado"}
                            </p>
                          </div>

                          {doctor.bioShort && (
                            <div className="mt-4 rounded-2xl bg-white p-4">
                              <p className="text-sm text-slate-700">
                                {doctor.bioShort}
                              </p>
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            {doctor.specialties.length > 0 ? (
                              doctor.specialties.map((specialty, index) => (
                                <span
                                  key={`${doctor.id}-${specialty}-${index}`}
                                  className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 ring-1 ring-sky-200"
                                >
                                  {specialty}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-slate-500">
                                Sem especialidades vinculadas
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="lg:w-[220px]">
                          <Link
                            href={`/busca?clinicId=${clinic.id}`}
                            className="app-button-secondary block text-center"
                          >
                            Agendar na clínica
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="app-card p-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                Convênios aceitos
              </h2>

              <div className="mt-5 flex flex-wrap gap-2">
                {planNames.length > 0 ? (
                  planNames.map((planName, index) => (
                    <span
                      key={`${planName}-${index}`}
                      className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 ring-1 ring-sky-200"
                    >
                      {planName}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500">
                    Convênios ainda não cadastrados.
                  </p>
                )}
              </div>
            </div>

            <div className="app-card p-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                Especialidades da clínica
              </h2>

              <div className="mt-5 flex flex-wrap gap-2">
                {clinicSpecialties.length > 0 ? (
                  clinicSpecialties.map((specialty, index) => (
                    <span
                      key={`${specialty}-${index}`}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200"
                    >
                      {specialty}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500">
                    Especialidades ainda não cadastradas.
                  </p>
                )}
              </div>
            </div>

            <div className="app-card p-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                Ações rápidas
              </h2>

              <div className="mt-5 grid gap-3">
                <Link
                  href={`/busca?clinicId=${clinic.id}`}
                  className="app-button-primary text-center"
                >
                  Agendar nesta clínica
                </Link>

                <Link href="/clinicas" className="app-button-secondary text-center">
                  Voltar ao diretório
                </Link>

                {clinic.website_url && (
                  <a
                    href={clinic.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="app-button-secondary text-center"
                  >
                    Visitar site
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}