"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type ClinicRow = {
  id: string;
  trade_name: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  contact_phone: string | null;
  description: string | null;
  website_url: string | null;
  cover_image_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
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
  clinic_id: string;
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

type ClinicCard = {
  id: string;
  tradeName: string;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  contactPhone: string | null;
  description: string | null;
  websiteUrl: string | null;
  coverImageUrl: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  acceptedPlanIds: string[];
  acceptedPlanNames: string[];
  doctorCount: number;
  specialtyCount: number;
  compatibleWithPatientPlan: boolean;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function ClinicasPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [onlyCompatible, setOnlyCompatible] = useState(false);

  const [patientPlanId, setPatientPlanId] = useState<string | null>(null);
  const [clinics, setClinics] = useState<ClinicCard[]>([]);

  useEffect(() => {
    loadClinicsDirectory();
  }, []);

  async function loadClinicsDirectory() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para visualizar as clínicas.");
      setMessageType("info");
      setLoading(false);
      return;
    }

    const { data: patientData } = await supabase
      .from("patients")
      .select("default_health_plan_id")
      .eq("id", user.id)
      .maybeSingle<PatientRow>();

    const currentPatientPlanId = patientData?.default_health_plan_id || null;
    setPatientPlanId(currentPatientPlanId);
    setOnlyCompatible(Boolean(currentPatientPlanId));

    const [
      clinicsResponse,
      clinicPlansResponse,
      doctorsResponse,
      doctorSpecialtiesResponse,
      specialtiesResponse,
    ] = await Promise.all([
      supabase
        .from("clinics")
        .select(
          "id, trade_name, city, state, neighborhood, contact_phone, description, website_url, cover_image_url, hero_title, hero_subtitle"
        )
        .order("trade_name", { ascending: true }),
      supabase
        .from("clinic_health_plans")
        .select("clinic_id, health_plan_id, health_plans(name)"),
      supabase
        .from("doctors")
        .select("id, clinic_id, is_active")
        .eq("is_active", true),
      supabase.from("doctor_specialties").select("doctor_id, specialty_id"),
      supabase.from("specialties").select("id, name"),
    ]);

    if (clinicsResponse.error) {
      setMessage(`Erro ao carregar clínicas: ${clinicsResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (clinicPlansResponse.error) {
      setMessage(
        `Erro ao carregar convênios das clínicas: ${clinicPlansResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (doctorsResponse.error) {
      setMessage(`Erro ao carregar médicos: ${doctorsResponse.error.message}`);
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

    const clinicRows = (clinicsResponse.data || []) as ClinicRow[];
    const clinicPlansRows = (clinicPlansResponse.data || []) as ClinicHealthPlanRow[];
    const doctorRows = (doctorsResponse.data || []) as DoctorRow[];
    const doctorSpecialtiesRows =
      (doctorSpecialtiesResponse.data || []) as DoctorSpecialtyRow[];
    const specialtyRows = (specialtiesResponse.data || []) as SpecialtyRow[];

    const specialtyMap = new Map(specialtyRows.map((item) => [item.id, item.name]));

    const activeDoctorsByClinic = new Map<string, DoctorRow[]>();
    for (const doctor of doctorRows) {
      const current = activeDoctorsByClinic.get(doctor.clinic_id) || [];
      current.push(doctor);
      activeDoctorsByClinic.set(doctor.clinic_id, current);
    }

    const specialtiesByDoctor = new Map<string, string[]>();
    for (const row of doctorSpecialtiesRows) {
      const current = specialtiesByDoctor.get(row.doctor_id) || [];
      current.push(row.specialty_id);
      specialtiesByDoctor.set(row.doctor_id, current);
    }

    const plansByClinic = new Map<
      string,
      { ids: string[]; names: string[] }
    >();

    for (const row of clinicPlansRows) {
      const current = plansByClinic.get(row.clinic_id) || { ids: [], names: [] };
      const plan = pickOne(row.health_plans);

      current.ids.push(row.health_plan_id);
      if (plan?.name) current.names.push(plan.name);

      plansByClinic.set(row.clinic_id, current);
    }

    const normalizedClinics: ClinicCard[] = clinicRows.map((clinic) => {
      const clinicDoctors = activeDoctorsByClinic.get(clinic.id) || [];
      const specialtyIds = new Set<string>();

      for (const doctor of clinicDoctors) {
        const doctorSpecialties = specialtiesByDoctor.get(doctor.id) || [];
        doctorSpecialties.forEach((specialtyId) => specialtyIds.add(specialtyId));
      }

      const plans = plansByClinic.get(clinic.id) || { ids: [], names: [] };

      return {
        id: clinic.id,
        tradeName: clinic.trade_name || "Clínica sem nome",
        city: clinic.city,
        state: clinic.state,
        neighborhood: clinic.neighborhood,
        contactPhone: clinic.contact_phone,
        description: clinic.description,
        websiteUrl: clinic.website_url,
        coverImageUrl: clinic.cover_image_url,
        heroTitle: clinic.hero_title,
        heroSubtitle: clinic.hero_subtitle,
        acceptedPlanIds: plans.ids,
        acceptedPlanNames: plans.names,
        doctorCount: clinicDoctors.length,
        specialtyCount: Array.from(specialtyIds).filter((id) => specialtyMap.has(id))
          .length,
        compatibleWithPatientPlan: currentPatientPlanId
          ? plans.ids.includes(currentPatientPlanId)
          : false,
      };
    });

    setClinics(normalizedClinics);
    setLoading(false);
  }

  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic) => {
      const matchesSearch =
        clinic.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (clinic.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (clinic.state || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (clinic.neighborhood || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesPlan = onlyCompatible
        ? clinic.compatibleWithPatientPlan
        : true;

      return matchesSearch && matchesPlan;
    });
  }, [clinics, onlyCompatible, searchTerm]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando clínicas...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
              Diretório de clínicas
            </p>
            <h1 className="mt-3 app-section-title">
              Explore as clínicas da MediNexus
            </h1>
            <p className="app-section-subtitle">
              Veja as clínicas disponíveis, os convênios aceitos e a estrutura
              médica de cada uma.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="app-button-secondary text-center">
              Voltar ao dashboard
            </Link>
            <Link href="/busca" className="app-button-primary text-center">
              Nova busca
            </Link>
          </div>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 app-card p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar clínica
              </label>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite nome, cidade ou bairro"
                className="app-input"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyCompatible(false)}
              className={
                onlyCompatible ? "app-button-secondary" : "app-button-primary"
              }
            >
              Todas
            </button>

            <button
              type="button"
              onClick={() => setOnlyCompatible(true)}
              disabled={!patientPlanId}
              className={
                onlyCompatible ? "app-button-primary" : "app-button-secondary"
              }
            >
              Compatíveis com meu plano
            </button>
          </div>

          {!patientPlanId && (
            <p className="mt-4 text-sm text-slate-500">
              Você ainda não tem um plano padrão cadastrado, então o filtro por
              compatibilidade ficou desabilitado.
            </p>
          )}
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Total de clínicas</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {clinics.length}
            </h3>
          </div>

          <div className="metric-card metric-card--success">
            <p className="text-sm text-green-700">Compatíveis com seu plano</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {clinics.filter((item) => item.compatibleWithPatientPlan).length}
            </h3>
          </div>

          <div className="metric-card metric-card--warning">
            <p className="text-sm text-yellow-700">Resultados filtrados</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {filteredClinics.length}
            </h3>
          </div>
        </div>

        {filteredClinics.length === 0 ? (
          <div className="app-card p-8">
            <p className="text-slate-700">
              Nenhuma clínica encontrada com os filtros atuais.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredClinics.map((clinic) => (
              <div key={clinic.id} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div
                  className="relative min-h-[180px] border-b border-slate-200 px-8 py-8"
                  style={{
                    background: clinic.coverImageUrl
                      ? `linear-gradient(135deg, rgba(27,75,88,0.75), rgba(89,78,134,0.65)), url(${clinic.coverImageUrl}) center/cover`
                      : "linear-gradient(135deg, rgba(27,75,88,0.12), rgba(89,78,134,0.12))",
                  }}
                >
                  <div className="max-w-3xl">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-bold text-slate-900">
                        {clinic.heroTitle || clinic.tradeName}
                      </h2>

                      {clinic.compatibleWithPatientPlan && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                          Compatível com seu plano
                        </span>
                      )}
                    </div>

                    <p className="max-w-2xl text-slate-700">
                      {clinic.heroSubtitle ||
                        clinic.description ||
                        "Conheça a estrutura da clínica, convênios aceitos e equipe médica disponível na MediNexus."}
                    </p>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="app-card-soft p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Local
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {clinic.city || "Cidade não informada"} /{" "}
                            {clinic.state || "Estado não informado"}
                          </p>
                          {clinic.neighborhood && (
                            <p className="mt-1 text-sm text-slate-500">
                              {clinic.neighborhood}
                            </p>
                          )}
                        </div>

                        <div className="app-card-soft p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Estrutura
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {clinic.doctorCount} médico(s)
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {clinic.specialtyCount} especialidade(s)
                          </p>
                        </div>

                        <div className="app-card-soft p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Contato
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {clinic.contactPhone || "Não informado"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {clinic.acceptedPlanNames.length > 0 ? (
                          clinic.acceptedPlanNames.slice(0, 6).map((planName, index) => (
                            <span
                              key={`${clinic.id}-${planName}-${index}`}
                              className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 ring-1 ring-sky-200"
                            >
                              {planName}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">
                            Convênios ainda não informados
                          </span>
                        )}

                        {clinic.acceptedPlanNames.length > 6 && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                            +{clinic.acceptedPlanNames.length - 6} convênio(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="lg:w-[260px]">
                      <Link
                        href={`/clinicas/${clinic.id}`}
                        className="app-button-primary block text-center"
                      >
                        Ver clínica
                      </Link>

                      <Link
                        href={`/busca?clinicId=${clinic.id}`}
                        className="mt-3 app-button-secondary block text-center"
                      >
                        Agendar nesta clínica
                      </Link>

                      {clinic.websiteUrl && (
                        <a
                          href={clinic.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 app-button-secondary block text-center"
                        >
                          Visitar site
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}