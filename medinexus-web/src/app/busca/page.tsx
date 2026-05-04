"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type Specialty = {
  id: string;
  name: string;
};

type ClinicMini = {
  id: string;
  trade_name: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  accepts_private_consultation: boolean | null;
};

type ProfileRow = {
  latitude: number | null;
  longitude: number | null;
  profile_completed: boolean | null;
};

type PatientRow = {
  default_health_plan_id: string | null;
  health_plan_operator: string | null;
  health_plan_product_name: string | null;
  health_plan_accommodation: string | null;
  health_plan_network: string | null;
  health_plan_segment: string | null;
  accepts_private_consultation: boolean | null;
};

type TimeWindow = {
  weekday: string;
  startTime: string;
  endTime: string;
};

type AppointmentMode = "health_plan" | "private";

const weekdayOptions = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
];

function BuscaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clinicIdFromQuery = searchParams.get("clinicId");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<ClinicMini | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [patient, setPatient] = useState<PatientRow | null>(null);

  const [specialtyId, setSpecialtyId] = useState("");
  const [preferredStartDate, setPreferredStartDate] = useState("");
  const [preferredEndDate, setPreferredEndDate] = useState("");
  const [maxRadiusKm, setMaxRadiusKm] = useState("10");
  const [appointmentMode, setAppointmentMode] =
    useState<AppointmentMode>("health_plan");

  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([
    {
      weekday: String(new Date().getDay()),
      startTime: "08:00",
      endTime: "12:00",
    },
  ]);

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicIdFromQuery]);

  async function loadPage() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para criar uma busca.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const [
      specialtiesResponse,
      profileResponse,
      patientResponse,
      clinicResponse,
    ] = await Promise.all([
      supabase
        .from("specialties")
        .select("id, name")
        .order("name", { ascending: true }),

      supabase
        .from("profiles")
        .select("latitude, longitude, profile_completed")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>(),

      supabase
        .from("patients")
        .select(`
          default_health_plan_id,
          health_plan_operator,
          health_plan_product_name,
          health_plan_accommodation,
          health_plan_network,
          health_plan_segment,
          accepts_private_consultation
        `)
        .eq("id", user.id)
        .maybeSingle<PatientRow>(),

      clinicIdFromQuery
        ? supabase
            .from("clinics")
            .select(
              "id, trade_name, city, state, neighborhood, accepts_private_consultation"
            )
            .eq("id", clinicIdFromQuery)
            .maybeSingle<ClinicMini>()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (specialtiesResponse.error) {
      setMessage(`Erro ao carregar especialidades: ${specialtiesResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (profileResponse.error) {
      setMessage(`Erro ao carregar localização do paciente: ${profileResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (patientResponse.error) {
      setMessage(`Erro ao carregar dados do paciente: ${patientResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (clinicResponse.error) {
      setMessage(`Erro ao carregar clínica selecionada: ${clinicResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setSpecialties((specialtiesResponse.data || []) as Specialty[]);
    setProfile(profileResponse.data || null);
    setPatient(patientResponse.data || null);
    setSelectedClinic((clinicResponse.data as ClinicMini) || null);

    const hasHealthPlan = Boolean(
      patientResponse.data?.health_plan_operator ||
        patientResponse.data?.health_plan_product_name ||
        patientResponse.data?.default_health_plan_id
    );

    if (hasHealthPlan) {
      setAppointmentMode("health_plan");
    } else {
      setAppointmentMode("private");
    }

    setLoading(false);
  }

  const isClinicPrefiltered = useMemo(
    () => Boolean(selectedClinic?.id),
    [selectedClinic]
  );

  const hasPreciseLocation = useMemo(() => {
    return Boolean(profile?.latitude && profile?.longitude);
  }, [profile]);

  const hasHealthPlanData = useMemo(() => {
    return Boolean(
      patient?.health_plan_operator ||
        patient?.health_plan_product_name ||
        patient?.default_health_plan_id
    );
  }, [patient]);

  function handleTimeWindowChange(
    index: number,
    field: keyof TimeWindow,
    value: string
  ) {
    setTimeWindows((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function handleAddWindow() {
    setTimeWindows((prev) => [
      ...prev,
      {
        weekday: "1",
        startTime: "08:00",
        endTime: "12:00",
      },
    ]);
  }

  function handleRemoveWindow(index: number) {
    setTimeWindows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para salvar a busca.");
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (!specialtyId) {
      setMessage("Selecione uma especialidade.");
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (!hasPreciseLocation && !selectedClinic?.id) {
      setMessage(
        "Para buscar por raio, atualize seu perfil e use a localização atual do dispositivo."
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (appointmentMode === "health_plan" && !hasHealthPlanData) {
      setMessage(
        "Você escolheu plano de saúde, mas seu perfil não possui dados de plano. Atualize o perfil ou selecione consulta particular."
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (appointmentMode === "private" && patient?.accepts_private_consultation === false) {
      setMessage(
        "Seu perfil não está marcado para aceitar consulta particular. Atualize seu perfil ou escolha plano de saúde."
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    const radiusNumber = Number(maxRadiusKm);

    if (Number.isNaN(radiusNumber) || radiusNumber <= 0) {
      setMessage("Informe um raio de busca válido.");
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    const validWindows = timeWindows.filter(
      (window) =>
        window.weekday !== "" &&
        window.startTime &&
        window.endTime &&
        window.startTime < window.endTime
    );

    if (validWindows.length === 0) {
      setMessage("Informe pelo menos uma faixa de horário válida.");
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    const { data: searchPreference, error: searchError } = await supabase
      .from("patient_search_preferences")
      .insert({
        patient_id: user.id,
        specialty_id: specialtyId,
        preferred_start_date: preferredStartDate || null,
        preferred_end_date: preferredEndDate || null,
        preferred_clinic_id: selectedClinic?.id || null,
        max_radius_km: selectedClinic?.id ? 999 : radiusNumber,
        accepts_private_consultation: appointmentMode === "private",
        health_plan_operator:
          appointmentMode === "health_plan"
            ? patient?.health_plan_operator || null
            : null,
        health_plan_product_name:
          appointmentMode === "health_plan"
            ? patient?.health_plan_product_name || null
            : null,
        health_plan_accommodation:
          appointmentMode === "health_plan"
            ? patient?.health_plan_accommodation || null
            : null,
        health_plan_network:
          appointmentMode === "health_plan"
            ? patient?.health_plan_network || null
            : null,
        health_plan_segment:
          appointmentMode === "health_plan"
            ? patient?.health_plan_segment || null
            : null,
      })
      .select("id")
      .single();

    if (searchError || !searchPreference) {
      setMessage(`Erro ao salvar a busca: ${searchError?.message}`);
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    const { error: windowsError } = await supabase
      .from("patient_search_time_windows")
      .insert(
        validWindows.map((window) => ({
          search_preference_id: searchPreference.id,
          weekday: Number(window.weekday),
          start_time: window.startTime,
          end_time: window.endTime,
        }))
      );

    if (windowsError) {
      setMessage(`Erro ao salvar horários: ${windowsError.message}`);
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    setMessage("Busca salva com sucesso. Redirecionando para os resultados...");
    setMessageType("success");
    setSubmitting(false);

    setTimeout(() => {
      router.push(`/resultados?searchId=${searchPreference.id}`);
    }, 700);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando busca...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#EAF1F0_0,#F8FAFC_34%,#FFFFFF_100%)]">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1B4B58]">
              Nova busca
            </p>
            <h1 className="mt-3 app-section-title">
              Encontre a melhor opção para consulta
            </h1>
            <p className="app-section-subtitle">
              Defina especialidade, raio, forma de atendimento e horários desejados.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="app-button-secondary text-center">
              Voltar ao dashboard
            </Link>
            <Link href="/clinicas" className="app-button-secondary text-center">
              Ver clínicas
            </Link>
          </div>
        </div>

        {!hasPreciseLocation && !selectedClinic?.id && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="font-bold">Localização precisa não encontrada</p>
            <p className="mt-1 text-sm">
              Para usar busca por raio, abra seu perfil e clique em{" "}
              <span className="font-semibold">Usar minha localização atual</span>.
            </p>
            <div className="mt-4">
              <Link href="/perfil" className="app-button-secondary">
                Atualizar perfil
              </Link>
            </div>
          </div>
        )}

        {isClinicPrefiltered && selectedClinic && (
          <div className="mb-6 app-card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Busca restrita Ã  clínica
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {selectedClinic.trade_name || "Clínica"}
                </h2>
                <p className="mt-1 text-slate-600">
                  {selectedClinic.city || "Cidade não informada"} /{" "}
                  {selectedClinic.state || "Estado não informado"}
                  {selectedClinic.neighborhood
                    ? ` • ${selectedClinic.neighborhood}`
                    : ""}
                </p>
              </div>

              <Link href="/busca" className="app-button-secondary text-center">
                Remover filtro da clínica
              </Link>
            </div>
          </div>
        )}

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Especialidade e datas
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Especialidade *
                </label>
                <select
                  value={specialtyId}
                  onChange={(e) => setSpecialtyId(e.target.value)}
                  className="app-input"
                  required
                >
                  <option value="">Selecione uma especialidade</option>
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Data inicial preferida
                </label>
                <input
                  type="date"
                  value={preferredStartDate}
                  onChange={(e) => setPreferredStartDate(e.target.value)}
                  className="app-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Data final preferida
                </label>
                <input
                  type="date"
                  value={preferredEndDate}
                  onChange={(e) => setPreferredEndDate(e.target.value)}
                  className="app-input"
                />
              </div>
            </div>
          </div>

          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Forma de atendimento
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setAppointmentMode("health_plan")}
                disabled={!hasHealthPlanData}
                className={`rounded-3xl border p-6 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  appointmentMode === "health_plan"
                    ? "border-[#1B4B58] bg-[#EAF1F0] text-[#1B4B58]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <p className="text-lg font-black">Usar plano de saúde</p>
                <p className="mt-2 text-sm">
                  Buscar clínicas compatíveis com os dados do seu plano.
                </p>
                {!hasHealthPlanData && (
                  <p className="mt-3 text-xs font-semibold text-red-600">
                    Complete os dados do plano no perfil para usar esta opção.
                  </p>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAppointmentMode("private")}
                className={`rounded-3xl border p-6 text-left transition ${
                  appointmentMode === "private"
                    ? "border-[#594E86] bg-[#F4F1FB] text-[#594E86]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <p className="text-lg font-black">Consulta particular</p>
                <p className="mt-2 text-sm">
                  Mostrar médicos e clínicas que aceitam atendimento particular.
                </p>
              </button>
            </div>

            {appointmentMode === "health_plan" && (
              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Operadora:</span>{" "}
                  {patient?.health_plan_operator || "Não informado"}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Modelo:</span>{" "}
                  {patient?.health_plan_product_name || "Não informado"}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Rede:</span>{" "}
                  {patient?.health_plan_network || "Não informado"}
                </p>
              </div>
            )}
          </div>

          {!isClinicPrefiltered && (
            <div className="app-card p-8">
              <h2 className="text-2xl font-black text-slate-950">
                Raio de busca
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                O raio usa a localização precisa salva no seu perfil.
              </p>

              <div className="mt-6 max-w-md">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Distância máxima
                </label>
                <select
                  value={maxRadiusKm}
                  onChange={(e) => setMaxRadiusKm(e.target.value)}
                  className="app-input"
                >
                  <option value="3">Até 3 km</option>
                  <option value="5">Até 5 km</option>
                  <option value="10">Até 10 km</option>
                  <option value="15">Até 15 km</option>
                  <option value="25">Até 25 km</option>
                  <option value="50">Até 50 km</option>
                </select>
              </div>
            </div>
          )}

          <div className="app-card p-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Faixas de horário desejadas
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  O sistema vai tentar encaixar a consulta dentro dessas janelas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddWindow}
                className="app-button-secondary"
              >
                Adicionar faixa
              </button>
            </div>

            <div className="grid gap-4">
              {timeWindows.map((window, index) => (
                <div
                  key={`${window.weekday}-${index}`}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Dia da semana
                      </label>
                      <select
                        value={window.weekday}
                        onChange={(e) =>
                          handleTimeWindowChange(index, "weekday", e.target.value)
                        }
                        className="app-input"
                      >
                        {weekdayOptions.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Hora inicial
                      </label>
                      <input
                        type="time"
                        value={window.startTime}
                        onChange={(e) =>
                          handleTimeWindowChange(
                            index,
                            "startTime",
                            e.target.value
                          )
                        }
                        className="app-input"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Hora final
                      </label>
                      <input
                        type="time"
                        value={window.endTime}
                        onChange={(e) =>
                          handleTimeWindowChange(
                            index,
                            "endTime",
                            e.target.value
                          )
                        }
                        className="app-input"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveWindow(index)}
                        disabled={timeWindows.length === 1}
                        className="app-button-danger w-full"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="app-button-primary"
          >
            {submitting ? "Salvando busca..." : "Buscar opções"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function BuscaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-600">Carregando busca...</p>
        </main>
      }
    >
      <BuscaPageContent />
    </Suspense>
  );
}


