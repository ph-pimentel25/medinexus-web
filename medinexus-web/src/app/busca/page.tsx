"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
};

type TimeWindow = {
  weekday: string;
  startTime: string;
  endTime: string;
};

const weekdayOptions = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
];

export default function BuscaPage() {
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

  const [specialtyId, setSpecialtyId] = useState("");
  const [preferredStartDate, setPreferredStartDate] = useState("");
  const [preferredEndDate, setPreferredEndDate] = useState("");
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([
    {
      weekday: String(new Date().getDay()),
      startTime: "08:00",
      endTime: "12:00",
    },
  ]);

  useEffect(() => {
    loadPage();
  }, [clinicIdFromQuery]);

  async function loadPage() {
    setLoading(true);
    setMessage("");

    const { data: specialtiesData, error: specialtiesError } = await supabase
      .from("specialties")
      .select("id, name")
      .order("name", { ascending: true });

    if (specialtiesError) {
      setMessage(`Erro ao carregar especialidades: ${specialtiesError.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setSpecialties((specialtiesData || []) as Specialty[]);

    if (clinicIdFromQuery) {
      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .select("id, trade_name, city, state, neighborhood")
        .eq("id", clinicIdFromQuery)
        .maybeSingle<ClinicMini>();

      if (!clinicError && clinicData) {
        setSelectedClinic(clinicData);
      } else {
        setSelectedClinic(null);
      }
    } else {
      setSelectedClinic(null);
    }

    setLoading(false);
  }

  const isClinicPrefiltered = useMemo(
    () => Boolean(selectedClinic?.id),
    [selectedClinic]
  );

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
        max_radius_km: selectedClinic?.id ? 100 : 30,
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

    setMessage("Busca salva com sucesso. Redirecionando...");
    setMessageType("success");
    setSubmitting(false);

    setTimeout(() => {
      router.push("/resultados");
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
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
              Nova busca
            </p>
            <h1 className="mt-3 app-section-title">
              Encontre a melhor opção para consulta
            </h1>
            <p className="app-section-subtitle">
              Defina especialidade, datas e sua faixa de horário preferida.
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

        {isClinicPrefiltered && selectedClinic && (
          <div className="mb-6 app-card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Busca restrita à clínica
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

        <div className="app-card p-8">
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Especialidade
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

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                <label className="mb-2 block text-sm font-medium text-slate-700">
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

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Faixas de horário desejadas
                </label>

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
                    key={index}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
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
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Hora inicial
                        </label>
                        <input
                          type="time"
                          value={window.startTime}
                          onChange={(e) =>
                            handleTimeWindowChange(index, "startTime", e.target.value)
                          }
                          className="app-input"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Hora final
                        </label>
                        <input
                          type="time"
                          value={window.endTime}
                          onChange={(e) =>
                            handleTimeWindowChange(index, "endTime", e.target.value)
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
        </div>
      </section>
    </main>
  );
}