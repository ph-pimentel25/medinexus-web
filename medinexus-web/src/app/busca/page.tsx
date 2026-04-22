"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Specialty = {
  id: string;
  name: string;
};

type TimeWindow = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type Weekdays = {
  [key: number]: TimeWindow;
};

const weekdayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const initialWeekdays: Weekdays = {
  0: { enabled: false, startTime: "", endTime: "" },
  1: { enabled: false, startTime: "", endTime: "" },
  2: { enabled: false, startTime: "", endTime: "" },
  3: { enabled: false, startTime: "", endTime: "" },
  4: { enabled: false, startTime: "", endTime: "" },
  5: { enabled: false, startTime: "", endTime: "" },
  6: { enabled: false, startTime: "", endTime: "" },
};

export default function BuscaPage() {
  const router = useRouter();

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    specialtyId: "",
    searchCity: "",
    searchState: "",
    maxRadiusKm: "10",
    preferredStartDate: "",
    preferredEndDate: "",
    notes: "",
  });

  const [weekdays, setWeekdays] = useState<Weekdays>(initialWeekdays);

  useEffect(() => {
    async function loadSpecialties() {
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        setMessage("Erro ao carregar as especialidades.");
      } else {
        setSpecialties(data || []);
      }

      setLoadingSpecialties(false);
    }

    loadSpecialties();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleWeekdayToggle(weekday: number) {
    setWeekdays((prev) => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        enabled: !prev[weekday].enabled,
      },
    }));
  }

  function handleWeekdayTimeChange(
    weekday: number,
    field: "startTime" | "endTime",
    value: string
  ) {
    setWeekdays((prev) => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        [field]: value,
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para fazer uma busca.");
      setSubmitting(false);
      return;
    }

    const enabledWindows = Object.entries(weekdays)
      .filter(([, value]) => value.enabled)
      .map(([weekday, value]) => ({
        weekday: Number(weekday),
        start_time: value.startTime,
        end_time: value.endTime,
      }));

    if (enabledWindows.length === 0) {
      setMessage("Selecione pelo menos um dia e horário disponível.");
      setSubmitting(false);
      return;
    }

    const invalidWindow = enabledWindows.find(
      (window) => !window.start_time || !window.end_time
    );

    if (invalidWindow) {
      setMessage("Preencha os horários de todos os dias selecionados.");
      setSubmitting(false);
      return;
    }

    const { data: searchPreference, error: searchError } = await supabase
      .from("patient_search_preferences")
      .insert({
        patient_id: user.id,
        specialty_id: formData.specialtyId,
        max_radius_km: Number(formData.maxRadiusKm),
        search_city: formData.searchCity || null,
        search_state: formData.searchState || null,
        preferred_start_date: formData.preferredStartDate || null,
        preferred_end_date: formData.preferredEndDate || null,
        notes: formData.notes || null,
      })
      .select("id")
      .single();

    if (searchError || !searchPreference) {
      setMessage("Erro ao salvar a busca.");
      setSubmitting(false);
      return;
    }

    const windowsToInsert = enabledWindows.map((window) => ({
      search_preference_id: searchPreference.id,
      weekday: window.weekday,
      start_time: window.start_time,
      end_time: window.end_time,
    }));

    const { error: windowsError } = await supabase
      .from("patient_search_time_windows")
      .insert(windowsToInsert);

    if (windowsError) {
      setMessage("A busca foi criada, mas houve erro ao salvar os horários.");
      setSubmitting(false);
      return;
    }

    setMessage("Busca criada com sucesso!");

    setTimeout(() => {
      router.push("/resultados");
    }, 1500);

    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-sky-700 hover:underline">
            ← Voltar para o dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Nova busca</h1>
          <p className="mb-8 text-slate-600">
            Informe a especialidade, o raio e os dias e horários em que você pode ir.
          </p>

          <form onSubmit={handleSubmit} className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Especialidade
              </label>
              <select
                name="specialtyId"
                value={formData.specialtyId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                required
                disabled={loadingSpecialties}
              >
                <option value="">
                  {loadingSpecialties
                    ? "Carregando especialidades..."
                    : "Selecione a especialidade"}
                </option>
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
                  Cidade
                </label>
                <input
                  name="searchCity"
                  type="text"
                  value={formData.searchCity}
                  onChange={handleChange}
                  placeholder="Ex: Rio de Janeiro"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Estado
                </label>
                <input
                  name="searchState"
                  type="text"
                  value={formData.searchState}
                  onChange={handleChange}
                  placeholder="Ex: RJ"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Raio máximo de busca (km)
              </label>
              <input
                name="maxRadiusKm"
                type="number"
                min="1"
                value={formData.maxRadiusKm}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                required
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Data inicial desejada
                </label>
                <input
                  name="preferredStartDate"
                  type="date"
                  value={formData.preferredStartDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Data final desejada
                </label>
                <input
                  name="preferredEndDate"
                  type="date"
                  value={formData.preferredEndDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <p className="mb-3 block text-sm font-medium text-slate-700">
                Dias e horários em que você pode ir
              </p>

              <div className="grid gap-4">
                {Object.entries(weekdayLabels).map(([weekday, label]) => {
                  const day = Number(weekday);
                  const current = weekdays[day];

                  return (
                    <div
                      key={day}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <input
                          id={`weekday-${day}`}
                          type="checkbox"
                          checked={current.enabled}
                          onChange={() => handleWeekdayToggle(day)}
                        />
                        <label
                          htmlFor={`weekday-${day}`}
                          className="font-medium text-slate-800"
                        >
                          {label}
                        </label>
                      </div>

                      {current.enabled && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm text-slate-700">
                              Hora inicial
                            </label>
                            <input
                              type="time"
                              value={current.startTime}
                              onChange={(e) =>
                                handleWeekdayTimeChange(day, "startTime", e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-slate-700">
                              Hora final
                            </label>
                            <input
                              type="time"
                              value={current.endTime}
                              onChange={(e) =>
                                handleWeekdayTimeChange(day, "endTime", e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Observações
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Ex: prefiro clínica perto de metrô, atendimento pela manhã, etc."
                className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            {message && (
              <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Salvando busca..." : "Salvar busca"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}