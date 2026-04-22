"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [results, setResults] = useState<ResultItem[]>([]);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [searchPreference, setSearchPreference] = useState<SearchPreference | null>(null);
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
        setLoading(false);
        return;
      }

      const { data: clinicPlans, error: clinicPlansError } = await supabase
        .from("clinic_health_plans")
        .select("clinic_id, health_plan_id");

      if (clinicPlansError || !clinicPlans) {
        setMessage("Erro ao buscar planos aceitos pelas clínicas.");
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
      setSubmittingId(null);
      return;
    }

    setMessage(`Solicitação enviada com sucesso para ${result.doctor_name}.`);
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
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-sky-700 hover:underline">
            ← Voltar para o dashboard
          </Link>

          <Link
            href="/busca"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Nova busca
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-slate-900">Resultados</h1>
        <p className="mb-8 text-slate-600">
          Veja as opções compatíveis com sua última busca.
        </p>

        {message && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">{message}</p>
          </div>
        )}

        {results.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">Nenhum resultado compatível foi encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {results.map((result) => (
              <div
                key={`${result.doctor_id}-${result.clinic_id}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-2xl font-semibold text-slate-900">
                  {result.doctor_name}
                </h2>

                <p className="mt-2 text-slate-700">
                  <span className="font-medium">Especialidade:</span>{" "}
                  {result.specialty_name}
                </p>

                <p className="mt-1 text-slate-700">
                  <span className="font-medium">Clínica:</span>{" "}
                  {result.clinic_name}
                </p>

                <p className="mt-1 text-slate-700">
                  <span className="font-medium">Local:</span>{" "}
                  {result.city || "Cidade não informada"} /{" "}
                  {result.state || "Estado não informado"}
                </p>

                <div className="mt-5">
                  <button
                    onClick={() => handleRequestAppointment(result)}
                    disabled={submittingId === result.doctor_id}
                    className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingId === result.doctor_id
                      ? "Solicitando..."
                      : "Solicitar consulta"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}