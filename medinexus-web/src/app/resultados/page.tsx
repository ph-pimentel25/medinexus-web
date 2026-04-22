"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type SearchPreference = {
  id: string;
  specialty_id: string;
};

type PatientData = {
  default_health_plan_id: string | null;
};

type ResultItem = {
  doctor_id: string;
  doctor_name: string;
  specialty_id: string;
  specialty_name: string;
  clinic_id: string;
  clinic_name: string;
  city: string | null;
  state: string | null;
};

export default function ResultadosPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [results, setResults] = useState<ResultItem[]>([]);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [searchPreference, setSearchPreference] = useState<SearchPreference | null>(
    null
  );
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Você precisa estar logado para ver os resultados.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("default_health_plan_id")
        .eq("id", user.id)
        .single();

      if (patientError || !patientData) {
        setMessage("Não foi possível carregar os dados do paciente.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setPatient(patientData);

      const { data: latestSearch, error: searchError } = await supabase
        .from("patient_search_preferences")
        .select("id, specialty_id")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (searchError || !latestSearch) {
        setMessage("Nenhuma busca encontrada para este paciente.");
        setMessageType("info");
        setLoading(false);
        return;
      }

      setSearchPreference(latestSearch);

      const { data: doctorSpecialties, error: dsError } = await supabase
        .from("doctor_specialties")
        .select(`
          doctor_id,
          specialty_id,
          doctors (
            id,
            name,
            is_active,
            clinic_id,
            clinics (
              id,
              trade_name,
              city,
              state
            )
          ),
          specialties (
            id,
            name
          )
        `)
        .eq("specialty_id", latestSearch.specialty_id);

      if (dsError || !doctorSpecialties) {
        setMessage("Erro ao buscar médicos compatíveis.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const { data: clinicPlans, error: clinicPlansError } = await supabase
        .from("clinic_health_plans")
        .select("clinic_id, health_plan_id");

      if (clinicPlansError || !clinicPlans) {
        setMessage("Erro ao buscar planos aceitos pelas clínicas.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const compatibleClinicIds = clinicPlans
        .filter(
          (item) => item.health_plan_id === patientData.default_health_plan_id
        )
        .map((item) => item.clinic_id);

      const formattedResults: ResultItem[] = doctorSpecialties
        .map((item: any) => {
          const doctor = item.doctors;
          const clinic = doctor?.clinics;
          const specialty = item.specialties;

          return {
            doctor_id: doctor?.id,
            doctor_name: doctor?.name,
            specialty_id: specialty?.id,
            specialty_name: specialty?.name,
            clinic_id: clinic?.id,
            clinic_name: clinic?.trade_name,
            city: clinic?.city,
            state: clinic?.state,
            is_active: doctor?.is_active,
          };
        })
        .filter(
          (item: any) =>
            item.doctor_id &&
            item.clinic_id &&
            item.specialty_id &&
            item.is_active &&
            compatibleClinicIds.includes(item.clinic_id)
        )
        .map(({ is_active, ...rest }: any) => rest);

      if (formattedResults.length === 0) {
        setMessage("Nenhum resultado compatível foi encontrado.");
        setMessageType("info");
        setResults([]);
        setLoading(false);
        return;
      }

      setResults(formattedResults);
      setLoading(false);
    }

    loadResults();
  }, []);

  async function handleRequestAppointment(result: ResultItem) {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !patient || !searchPreference) {
      setMessage("Não foi possível identificar os dados necessários para a solicitação.");
      setMessageType("error");
      return;
    }

    setSubmittingId(result.doctor_id);

    const { error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      clinic_id: result.clinic_id,
      doctor_id: result.doctor_id,
      specialty_id: result.specialty_id,
      health_plan_id: patient.default_health_plan_id,
      search_preference_id: searchPreference.id,
      status: "pending",
    });

    if (error) {
      setMessage("Erro ao solicitar a consulta.");
      setMessageType("error");
      setSubmittingId(null);
      return;
    }

    setMessage(`Solicitação enviada com sucesso para ${result.doctor_name}.`);
    setMessageType("success");
    setSubmittingId(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando resultados...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para o dashboard
          </Link>

          <Link href="/busca" className="app-button-secondary">
            Nova busca
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Resultados
          </p>
          <h1 className="app-section-title mt-3">
            Opções compatíveis com sua busca
          </h1>
          <p className="app-section-subtitle">
            Escolha a melhor opção e envie sua solicitação para a clínica.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        {results.length === 0 ? (
          <div className="app-card p-8">
            <p className="text-slate-700">Nenhum resultado compatível foi encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {results.map((result) => (
              <div
                key={`${result.doctor_id}-${result.clinic_id}`}
                className="app-card p-8"
              >
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-bold text-slate-900">
                        {result.doctor_name}
                      </h2>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 ring-1 ring-sky-200">
                        {result.specialty_name}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="app-card-soft p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Clínica
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {result.clinic_name}
                        </p>
                      </div>

                      <div className="app-card-soft p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Local
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {result.city || "Cidade não informada"} /{" "}
                          {result.state || "Estado não informado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-[240px]">
                    <button
                      onClick={() => handleRequestAppointment(result)}
                      disabled={submittingId === result.doctor_id}
                      className="app-button-primary w-full"
                    >
                      {submittingId === result.doctor_id
                        ? "Solicitando..."
                        : "Solicitar consulta"}
                    </button>
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