"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type AppointmentRow = {
  id: string;
  status: string | null;

  patient_id: string | null;
  doctor_id: string | null;
  clinic_id: string | null;

  requested_start_at: string | null;
  requested_end_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;

  patient_confirmation_status: string | null;
  patient_confirmed_at: string | null;
  patient_cancelled_at: string | null;
  patient_cancellation_reason: string | null;
  reschedule_requested_at: string | null;
  reschedule_reason: string | null;
  confirmation_requested_at: string | null;
  confirmation_deadline_at: string | null;

  created_at: string | null;

  patients:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;

  doctors:
    | {
        name: string | null;
        crm: string | null;
        crm_state: string | null;
      }
    | {
        name: string | null;
        crm: string | null;
        crm_state: string | null;
      }[]
    | null;

  clinics:
    | {
        trade_name: string | null;
        legal_name: string | null;
        city: string | null;
        state: string | null;
        address_city: string | null;
        address_state: string | null;
        address_neighborhood: string | null;
      }
    | {
        trade_name: string | null;
        legal_name: string | null;
        city: string | null;
        state: string | null;
        address_city: string | null;
        address_state: string | null;
        address_neighborhood: string | null;
      }[]
    | null;

  specialties:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

type FilterType =
  | "all"
  | "pending"
  | "confirmed"
  | "awaiting_confirmation"
  | "patient_confirmed"
  | "cancelled"
  | "completed";

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmada",
    cancelled_by_patient: "Cancelada por você",
    cancelled_by_clinic: "Cancelada pela clínica",
    completed: "Concluída",
    no_show: "Não compareceu",
  };

  return labels[status || ""] || status || "Status não informado";
}

function getStatusTone(status?: string | null) {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    status === "cancelled_by_patient" ||
    status === "cancelled_by_clinic" ||
    status === "no_show"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "completed") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getConfirmationLabel(status?: string | null) {
  const labels: Record<string, string> = {
    not_requested: "Sem confirmação necessária",
    awaiting_confirmation: "Confirme sua presença",
    confirmed: "Presença confirmada",
    cancelled_by_patient: "Você cancelou",
    reschedule_requested: "Você pediu remarcação",
    no_response: "Sem resposta",
    no_show: "Não compareceu",
  };

  return labels[status || ""] || "Sem confirmação necessária";
}

function getConfirmationTone(status?: string | null) {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "awaiting_confirmation") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "reschedule_requested") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "cancelled_by_patient" || status === "no_show") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getClinicName(item: AppointmentRow) {
  const clinic = pickOne(item.clinics);
  return clinic?.trade_name || clinic?.legal_name || "Clínica não informada";
}

function getPatientName(item: AppointmentRow) {
  const patient = pickOne(item.patients);
  return patient?.full_name || "Paciente não informado";
}

function getDoctorName(item: AppointmentRow) {
  const doctor = pickOne(item.doctors);
  return doctor?.name || "Médico não informado";
}

function getSpecialtyName(item: AppointmentRow) {
  const specialty = pickOne(item.specialties);
  return specialty?.name || "Especialidade";
}

export default function SolicitacoesPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para ver suas solicitações.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        status,
        patient_id,
        doctor_id,
        clinic_id,
        requested_start_at,
        requested_end_at,
        confirmed_start_at,
        confirmed_end_at,
        patient_confirmation_status,
        patient_confirmed_at,
        patient_cancelled_at,
        patient_cancellation_reason,
        reschedule_requested_at,
        reschedule_reason,
        confirmation_requested_at,
        confirmation_deadline_at,
        created_at,
        patients (
          full_name
        ),
        doctors (
          name,
          crm,
          crm_state
        ),
        clinics (
          trade_name,
          legal_name,
          city,
          state,
          address_city,
          address_state,
          address_neighborhood
        ),
        specialties (
          name
        )
      `
      )
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Erro ao carregar solicitações: ${error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setAppointments((data || []) as AppointmentRow[]);
    setLoading(false);
  }

  const filteredAppointments = useMemo(() => {
    const query = normalize(search);

    return appointments.filter((item) => {
      const status = item.status || "";
      const confirmation = item.patient_confirmation_status || "";

      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && status === "pending") ||
        (filter === "confirmed" && status === "confirmed") ||
        (filter === "awaiting_confirmation" &&
          confirmation === "awaiting_confirmation") ||
        (filter === "patient_confirmed" && confirmation === "confirmed") ||
        (filter === "cancelled" &&
          (status === "cancelled_by_patient" ||
            status === "cancelled_by_clinic")) ||
        (filter === "completed" && status === "completed");

      const searchable = normalize(
        [
          getClinicName(item),
          getPatientName(item),
          getDoctorName(item),
          getSpecialtyName(item),
          item.status,
          item.patient_confirmation_status,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesSearch = !query || searchable.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [appointments, filter, search]);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((item) => item.status === "pending").length,
      confirmed: appointments.filter((item) => item.status === "confirmed")
        .length,
      toConfirm: appointments.filter(
        (item) => item.patient_confirmation_status === "awaiting_confirmation"
      ).length,
    };
  }, [appointments]);

  async function createEvent(
    appointment: AppointmentRow,
    eventType: string,
    title: string,
    description?: string
  ) {
    await supabase.from("appointment_events").insert({
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      clinic_id: appointment.clinic_id,
      event_type: eventType,
      title,
      description: description || null,
      metadata: {
        source: "patient_requests_page",
      },
    });
  }

  async function handleCancelPendingAppointment(appointment: AppointmentRow) {
    const confirmCancel = window.confirm(
      "Tem certeza que deseja cancelar esta consulta?"
    );

    if (!confirmCancel) return;

    setActionLoadingId(appointment.id);
    setMessage("");

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled_by_patient",
        patient_confirmation_status: "cancelled_by_patient",
        patient_cancelled_at: now,
        patient_cancellation_reason:
          "Cancelada pelo paciente antes da confirmação.",
      })
      .eq("id", appointment.id)
      .eq("patient_id", appointment.patient_id);

    if (error) {
      setMessage(`Erro ao cancelar consulta: ${error.message}`);
      setMessageType("error");
      setActionLoadingId(null);
      return;
    }

    await createEvent(
      appointment,
      "cancelled_by_patient",
      "Paciente cancelou a consulta",
      "Consulta cancelada pelo paciente na área de solicitações."
    );

    setMessage("Consulta cancelada com sucesso.");
    setMessageType("success");
    await loadAppointments();
    setActionLoadingId(null);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />

        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pb-12 lg:pt-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-[#D9D6F4] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#283C7A] shadow-sm">
                Minhas solicitações
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950">
                Acompanhe suas consultas
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Veja solicitações pendentes, consultas confirmadas e confirme
                presença quando o médico liberar o atendimento.
              </p>
            </div>

            <div className="rounded-[38px] bg-gradient-to-br from-[#283C7A] via-[#4B4EA3] to-[#6E56CF] p-7 text-white shadow-[0_28px_90px_-65px_rgba(40,60,122,0.9)]">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/60">
                Resumo
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-[28px] bg-white/12 p-5 ring-1 ring-white/15">
                  <p className="text-4xl font-bold">{stats.total}</p>
                  <p className="mt-1 text-sm text-white/70">
                    solicitações no total
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="mt-1 text-xs text-white/70">pendentes</p>
                  </div>

                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.confirmed}</p>
                    <p className="mt-1 text-xs text-white/70">confirmadas</p>
                  </div>

                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.toConfirm}</p>
                    <p className="mt-1 text-xs text-white/70">a confirmar</p>
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

        <div className="rounded-[38px] border border-[#D9D6F4] bg-white p-6 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Buscar consulta
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6E56CF] focus:bg-white"
                placeholder="Busque por clínica, médico, especialidade ou status"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todas" },
                { value: "pending", label: "Pendentes" },
                { value: "confirmed", label: "Confirmadas" },
                { value: "awaiting_confirmation", label: "Confirmar presença" },
                { value: "patient_confirmed", label: "Confirmadas por mim" },
                { value: "cancelled", label: "Canceladas" },
                { value: "completed", label: "Concluídas" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value as FilterType)}
                  className={`rounded-2xl px-5 py-4 text-sm font-bold transition ${
                    filter === item.value
                      ? "bg-[#283C7A] text-white"
                      : "border border-[#D9D6F4] bg-white text-[#5E4B9A] hover:bg-[#F6F3FF]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[34px] border border-[#D9D6F4] bg-white p-8 text-slate-600 shadow-sm">
            Carregando solicitações...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="mt-8 rounded-[34px] border border-[#D9D6F4] bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950">
              Nenhuma solicitação encontrada
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
              Quando você solicitar consultas, elas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6">
            {filteredAppointments.map((item) => {
              const patient = pickOne(item.patients);
              const doctor = pickOne(item.doctors);
              const clinic = pickOne(item.clinics);

              const clinicLocation = [
                clinic?.address_neighborhood,
                clinic?.address_city || clinic?.city,
                clinic?.address_state || clinic?.state,
              ]
                .filter(Boolean)
                .join(" • ");

              const canConfirmPresence =
                item.status === "confirmed" &&
                item.patient_confirmation_status === "awaiting_confirmation";

              return (
                <article
                  key={item.id}
                  className="rounded-[34px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[#BAE6FD] bg-[#F0F9FF] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#0369A1]">
                          {getSpecialtyName(item)}
                        </span>

                        <span
                          className={`rounded-full border px-4 py-1.5 text-xs font-bold ${getStatusTone(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>

                        <span
                          className={`rounded-full border px-4 py-1.5 text-xs font-bold ${getConfirmationTone(
                            item.patient_confirmation_status
                          )}`}
                        >
                          {getConfirmationLabel(item.patient_confirmation_status)}
                        </span>
                      </div>

                      <h2 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
                        {getClinicName(item)}
                      </h2>

                      <p className="mt-2 text-slate-500">
                        {clinicLocation || "Localização não informada"}
                      </p>

                      <div className="mt-6 grid gap-3 text-sm leading-7 text-slate-700">
                        <p>
                          <strong>Paciente:</strong>{" "}
                          {patient?.full_name || "Paciente não informado"}
                        </p>

                        <p>
                          <strong>Médico:</strong>{" "}
                          {doctor?.name || "Médico não informado"} • CRM{" "}
                          {doctor?.crm || "N/I"}
                          {doctor?.crm_state ? ` / ${doctor.crm_state}` : ""}
                        </p>

                        <p>
                          <strong>Solicitada em:</strong>{" "}
                          {formatDateTime(item.created_at)}
                        </p>

                        <p>
                          <strong>Horário sugerido:</strong>{" "}
                          {formatDateTime(item.requested_start_at)} até{" "}
                          {formatDateTime(item.requested_end_at)}
                        </p>

                        <p>
                          <strong>Horário confirmado:</strong>{" "}
                          {item.confirmed_start_at
                            ? `${formatDateTime(
                                item.confirmed_start_at
                              )} até ${formatDateTime(item.confirmed_end_at)}`
                            : "Ainda não confirmado"}
                        </p>

                        <p>
                          <strong>Confirmação:</strong>{" "}
                          {getConfirmationLabel(item.patient_confirmation_status)}
                        </p>

                        {item.confirmation_deadline_at && (
                          <p>
                            <strong>Prazo para confirmar:</strong>{" "}
                            {formatDateTime(item.confirmation_deadline_at)}
                          </p>
                        )}

                        {item.patient_confirmed_at && (
                          <p>
                            <strong>Confirmada por você em:</strong>{" "}
                            {formatDateTime(item.patient_confirmed_at)}
                          </p>
                        )}

                        {item.reschedule_reason && (
                          <p>
                            <strong>Pedido de remarcação:</strong>{" "}
                            {item.reschedule_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex min-w-[220px] flex-col gap-3">
                      {canConfirmPresence && (
                        <Link
                          href={`/consultas/${item.id}/confirmar`}
                          className="rounded-2xl bg-[#283C7A] px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-[#213366]"
                        >
                          Confirmar presença
                        </Link>
                      )}

                      {item.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleCancelPendingAppointment(item)}
                          disabled={actionLoadingId === item.id}
                          className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {actionLoadingId === item.id
                            ? "Cancelando..."
                            : "Cancelar consulta"}
                        </button>
                      )}

                      {item.status === "confirmed" &&
                        item.patient_confirmation_status === "confirmed" && (
                          <Link
                            href={`/consultas/${item.id}/confirmar`}
                            className="rounded-2xl border border-[#D9D6F4] bg-white px-6 py-4 text-center text-sm font-bold text-[#5E4B9A] transition hover:bg-[#F6F3FF]"
                          >
                            Ver confirmação
                          </Link>
                        )}
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