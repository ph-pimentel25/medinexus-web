"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type DoctorRow = {
  id: string;
  name: string | null;
  crm: string | null;
  crm_state: string | null;
};

type AvailabilityRow = {
  id: string;
  doctor_id: string;
  weekday: number | null;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type WeekdayOption = {
  value: number;
  label: string;
  short: string;
};

const WEEKDAYS: WeekdayOption[] = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "TerÃ§a-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
  { value: 6, label: "SÃ¡bado", short: "SÃ¡b" },
];

function getAvailabilityWeekday(item: AvailabilityRow) {
  return item.weekday ?? item.day_of_week ?? 1;
}

function formatTime(value?: string | null) {
  if (!value) return "--:--";
  return value.slice(0, 5);
}

function sortAvailability(a: AvailabilityRow, b: AvailabilityRow) {
  const dayA = getAvailabilityWeekday(a);
  const dayB = getAvailabilityWeekday(b);

  if (dayA !== dayB) return dayA - dayB;
  return a.start_time.localeCompare(b.start_time);
}

export default function MedicoDisponibilidadePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [doctor, setDoctor] = useState<DoctorRow | null>(null);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);

  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [slotMinutes, setSlotMinutes] = useState(30);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("VocÃª precisa estar logado como mÃ©dico.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data: doctorData, error: doctorError } = await supabase
      .from("doctors")
      .select("id, name, crm, crm_state")
      .eq("user_id", user.id)
      .maybeSingle();

    if (doctorError) {
      setMessage(`Erro ao carregar mÃ©dico: ${doctorError.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (!doctorData?.id) {
      setMessage("Nenhum cadastro mÃ©dico encontrado para este usuÃ¡rio.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setDoctor(doctorData as DoctorRow);

    const { data: availabilityData, error: availabilityError } = await supabase
      .from("doctor_availability")
      .select(
        "id, doctor_id, weekday, day_of_week, start_time, end_time, slot_minutes, is_active, created_at, updated_at"
      )
      .eq("doctor_id", doctorData.id)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });

    if (availabilityError) {
      setMessage(`Erro ao carregar disponibilidade: ${availabilityError.message}`);
      setMessageType("error");
      setAvailability([]);
      setLoading(false);
      return;
    }

    setAvailability(((availabilityData || []) as AvailabilityRow[]).sort(sortAvailability));
    setLoading(false);
  }

  async function handleCreateAvailability(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!doctor?.id) {
      setMessage("Cadastro mÃ©dico nÃ£o encontrado.");
      setMessageType("error");
      return;
    }

    if (!startTime || !endTime) {
      setMessage("Informe o horÃ¡rio inicial e final.");
      setMessageType("error");
      return;
    }

    if (startTime >= endTime) {
      setMessage("O horÃ¡rio final precisa ser maior que o horÃ¡rio inicial.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("doctor_availability").insert({
      doctor_id: doctor.id,
      weekday,
      day_of_week: weekday,
      start_time: startTime,
      end_time: endTime,
      slot_minutes: slotMinutes,
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(`Erro ao salvar disponibilidade: ${error.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("Disponibilidade adicionada com sucesso.");
    setMessageType("success");
    await loadPage();
    setSaving(false);
  }

  async function handleToggleAvailability(item: AvailabilityRow) {
    setActionLoadingId(item.id);
    setMessage("");

    const currentWeekday = getAvailabilityWeekday(item);

    const { error } = await supabase
      .from("doctor_availability")
      .update({
        is_active: !item.is_active,
        weekday: currentWeekday,
        day_of_week: currentWeekday,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      setMessage(`Erro ao atualizar disponibilidade: ${error.message}`);
      setMessageType("error");
      setActionLoadingId(null);
      return;
    }

    await loadPage();
    setActionLoadingId(null);
  }

  async function handleDeleteAvailability(item: AvailabilityRow) {
    const confirmed = window.confirm(
      "Tem certeza que deseja remover este horÃ¡rio de disponibilidade?"
    );

    if (!confirmed) return;

    setActionLoadingId(item.id);
    setMessage("");

    const { error } = await supabase
      .from("doctor_availability")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(`Erro ao remover disponibilidade: ${error.message}`);
      setMessageType("error");
      setActionLoadingId(null);
      return;
    }

    setMessage("HorÃ¡rio removido com sucesso.");
    setMessageType("success");
    await loadPage();
    setActionLoadingId(null);
  }

  const stats = useMemo(() => {
    const active = availability.filter((item) => item.is_active).length;
    const inactive = availability.filter((item) => !item.is_active).length;
    const weekdaysWithAvailability = new Set(
      availability.filter((item) => item.is_active).map((item) => getAvailabilityWeekday(item))
    ).size;

    return {
      total: availability.length,
      active,
      inactive,
      weekdaysWithAvailability,
    };
  }, [availability]);

  const groupedAvailability = useMemo(() => {
    return WEEKDAYS.map((day) => ({
      ...day,
      items: availability
        .filter((item) => getAvailabilityWeekday(item) === day.value)
        .sort(sortAvailability),
    }));
  }, [availability]);

  return (
    <main className="min-h-screen bg-[#FAF6F3]">
      <section className="border-b border-[#E7DDD7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-[#D8CCC5] bg-[#FAF6F3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#164957]">
              Agenda mÃ©dica
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Disponibilidade
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Defina os dias, horÃ¡rios e duraÃ§Ã£o dos atendimentos para organizar
              sua agenda mÃ©dica.
            </p>

            {doctor && (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                {doctor.name || "MÃ©dico"} â€¢ CRM {doctor.crm || "N/I"}
                {doctor.crm_state ? ` / ${doctor.crm_state}` : ""}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/medico/dashboard"
              className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
            >
              Dashboard
            </Link>

            <Link
              href="/medico/solicitacoes"
              className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
            >
              SolicitaÃ§Ãµes
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total", value: stats.total, tone: "text-slate-950" },
            { label: "Ativos", value: stats.active, tone: "text-[#7A9D8C]" },
            { label: "Inativos", value: stats.inactive, tone: "text-[#B26B00]" },
            {
              label: "Dias com agenda",
              value: stats.weekdaysWithAvailability,
              tone: "text-[#164957]",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-[#E7DDD7] bg-white p-5 shadow-sm"
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

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
          <section className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Adicionar horÃ¡rio
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Crie blocos de atendimento para sua agenda.
            </p>

            <form onSubmit={handleCreateAvailability} className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Dia da semana
                </label>
                <select
                  value={weekday}
                  onChange={(event) => setWeekday(Number(event.target.value))}
                  className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#A7B5E5] focus:bg-white"
                >
                  {WEEKDAYS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    InÃ­cio
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#A7B5E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#A7B5E5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  DuraÃ§Ã£o por atendimento
                </label>
                <select
                  value={slotMinutes}
                  onChange={(event) => setSlotMinutes(Number(event.target.value))}
                  className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#A7B5E5] focus:bg-white"
                >
                  {[10, 15, 20, 30, 45, 60, 90, 120].map((item) => (
                    <option key={item} value={item}>
                      {item} minutos
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={saving || loading}
                className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46] disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Adicionar disponibilidade"}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Agenda semanal
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  HorÃ¡rios cadastrados por dia da semana.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-[#E7DDD7] bg-[#FAF6F3] p-5 text-sm text-slate-500">
                Carregando disponibilidade...
              </div>
            ) : availability.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D8DEEF] bg-[#FAFBFF] p-8 text-center">
                <h3 className="text-lg font-bold text-slate-950">
                  Nenhum horÃ¡rio cadastrado
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Adicione seu primeiro bloco de disponibilidade ao lado.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {groupedAvailability.map((day) => (
                  <div
                    key={day.value}
                    className="rounded-2xl border border-[#E7DDD7] bg-[#FAF6F3] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-950">
                          {day.label}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {day.items.length} bloco
                          {day.items.length === 1 ? "" : "s"} cadastrado
                          {day.items.length === 1 ? "" : "s"}
                        </p>
                      </div>

                      <span className="rounded-full bg-[#EEF3EF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#164957]">
                        {day.short}
                      </span>
                    </div>

                    {day.items.length === 0 ? (
                      <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-400">
                        Sem horÃ¡rios neste dia.
                      </p>
                    ) : (
                      <div className="grid gap-3">
                        {day.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-3 rounded-2xl border border-[#E7DDD7] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-bold text-slate-950">
                                  {formatTime(item.start_time)} â€”{" "}
                                  {formatTime(item.end_time)}
                                </span>

                                <span
                                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                                    item.is_active
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {item.is_active ? "Ativo" : "Inativo"}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-slate-500">
                                Atendimento de {item.slot_minutes} minutos
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleAvailability(item)}
                                disabled={actionLoadingId === item.id}
                                className="rounded-2xl border border-[#D8CCC5] bg-white px-4 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3] disabled:opacity-50"
                              >
                                {item.is_active ? "Desativar" : "Ativar"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteAvailability(item)}
                                disabled={actionLoadingId === item.id}
                                className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}


