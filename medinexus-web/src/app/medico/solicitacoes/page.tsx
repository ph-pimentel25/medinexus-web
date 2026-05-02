"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled_by_patient"
  | "cancelled_by_clinic"
  | "completed"
  | "no_show"
  | string;

type AppointmentRow = {
  id: string;
  status: AppointmentStatus | null;

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

  patient_name: string | null;
  patient_cpf: string | null;
  patient_phone: string | null;
  patient_email: string | null;
  patient_health_plan_operator: string | null;
  patient_health_plan_product_name: string | null;

  doctor_name: string | null;
  doctor_crm: string | null;
  doctor_crm_state: string | null;

  clinic_name: string | null;
  clinic_city: string | null;
  clinic_state: string | null;
  clinic_neighborhood: string | null;
};

type FilterType =
  | "all"
  | "pending"
  | "confirmed"
  | "awaiting_patient"
  | "patient_confirmed"
  | "reschedule_requested"
  | "cancelled"
  | "completed";

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
    cancelled_by_patient: "Cancelada pelo paciente",
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
    awaiting_confirmation: "Aguardando confirmação do paciente",
    confirmed: "Paciente confirmou presença",
    cancelled_by_patient: "Paciente cancelou",
    cancelled_by_clinic: "Cancelada pela clínica",
    reschedule_requested: "Paciente pediu remarcação",
    no_response: "Paciente não respondeu",
    no_show: "Paciente não compareceu",
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

  if (
    status === "cancelled_by_patient" ||
    status === "cancelled_by_clinic" ||
    status === "no_show"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getAppointmentEnd(item: AppointmentRow) {
  return item.confirmed_end_at || item.requested_end_at;
}

function getSpecialtyName() {
  return "Consulta";
}

function getPatientName(item: AppointmentRow) {
  return item.patient_name || "Paciente não informado";
}

function getClinicName(item: AppointmentRow) {
  return item.clinic_name || "Clínica não informada";
}

function getDoctorName(item: AppointmentRow) {
  return item.doctor_name || "Médico não informado";
}

function getClinicLocation(item: AppointmentRow) {
  const parts = [
    item.clinic_neighborhood,
    item.clinic_city,
    item.clinic_state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Localização não informada";
}

export default function MedicoSolicitacoesPage() {
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
      setAppointments([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("get_my_doctor_appointments");

    if (error) {
      setMessage(`Erro ao carregar solicitações: ${error.message}`);
      setMessageType("error");
      setAppointments([]);
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
        (filter === "awaiting_patient" &&
          confirmation === "awaiting_confirmation") ||
        (filter === "patient_confirmed" && confirmation === "confirmed") ||
        (filter === "reschedule_requested" &&
          confirmation === "reschedule_requested") ||
        (filter === "cancelled" &&
          (status === "cancelled_by_patient" ||
            status === "cancelled_by_clinic")) ||
        (filter === "completed" && status === "completed");

      const searchable = normalize(
        [
          getClinicName(item),
          getPatientName(item),
          getDoctorName(item),
          getSpecialtyName(),
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
      awaitingPatient: appointments.filter(
        (item) => item.patient_confirmation_status === "awaiting_confirmation"
      ).length,
      patientConfirmed: appointments.filter(
        (item) => item.patient_confirmation_status === "confirmed"
      ).length,
    };
  }, [appointments]);

  async function handleConfirmAppointment(appointment: AppointmentRow) {
    setActionLoadingId(appointment.id);
    setMessage("");

    const { error } = await supabase.rpc("confirm_my_doctor_appointment", {
      p_appointment_id: appointment.id,
    });

    if (error) {
      setMessage(`Erro ao confirmar consulta: ${error.message}`);
      setMessageType("error");
      setActionLoadingId(null);
      return;
    }

    setMessage("Consulta confirmada. Agora o paciente poderá confirmar presença.");
    setMessageType("success");
    await loadAppointments();
    setActionLoadingId(null);
  }

  async function handleCancelAppointment(appointment: AppointmentRow) {
    const confirmCancel = window.confirm(
      "Tem certeza que deseja cancelar esta consulta?"
    );

    if (!confirmCancel) return;

    setActionLoadingId(appointment.id);
    setMessage("");

    const { error } = await supabase.rpc("cancel_my_doctor_appointment", {
      p_appointment_id: appointment.id,
    });

    if (error) {
      setMessage(`Erro ao cancelar consulta: ${error.message}`);
      setMessageType("error");
      setActionLoadingId(null);
      return;
    }

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
                Área do médico
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950">
                Solicitações de consulta
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Confirme consultas, acompanhe confirmação do paciente e abra o
                prontuário quando o atendimento estiver confirmado.
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

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="mt-1 text-xs text-white/70">pendentes</p>
                  </div>

                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.confirmed}</p>
                    <p className="mt-1 text-xs text-white/70">confirmadas</p>
                  </div>

                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.awaitingPatient}</p>
                    <p className="mt-1 text-xs text-white/70">
                      aguardando paciente
                    </p>
                  </div>

                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.patientConfirmed}</p>
                    <p className="mt-1 text-xs text-white/70">
                      presença confirmada
                    </p>
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
                Buscar solicitação
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6E56CF] focus:bg-white"
                placeholder="Busque por paciente, clínica, médico ou status"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todas" },
                { value: "pending", label: "Pendentes" },
                { value: "confirmed", label: "Confirmadas" },
                { value: "awaiting_patient", label: "Aguardando paciente" },
                { value: "patient_confirmed", label: "Paciente confirmou" },
                { value: "reschedule_requested", label: "Remarcação" },
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
              Quando pacientes solicitarem consultas com você, elas aparecerão
              aqui.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6">
            {filteredAppointments.map((item) => (
              <article
                key={item.id}
                className="rounded-[34px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#BAE6FD] bg-[#F0F9FF] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#0369A1]">
                        {getSpecialtyName()}
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
                      {getClinicLocation(item)}
                    </p>

                    <div className="mt-6 grid gap-3 text-sm leading-7 text-slate-700">
                      <p>
                        <strong>Paciente:</strong> {getPatientName(item)}
                      </p>

                      <p>
                        <strong>CPF:</strong>{" "}
                        {item.patient_cpf || "Não informado"}
                      </p>

                      <p>
                        <strong>Telefone:</strong>{" "}
                        {item.patient_phone || "Não informado"}
                      </p>

                      <p>
                        <strong>Médico:</strong> {getDoctorName(item)} • CRM{" "}
                        {item.doctor_crm || "N/I"}
                        {item.doctor_crm_state
                          ? ` / ${item.doctor_crm_state}`
                          : ""}
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
                            )} até ${formatDateTime(getAppointmentEnd(item))}`
                          : "Ainda não confirmado"}
                      </p>

                      <p>
                        <strong>Confirmação:</strong>{" "}
                        {getConfirmationLabel(item.patient_confirmation_status)}
                      </p>

                      {item.confirmation_deadline_at && (
                        <p>
                          <strong>Prazo para paciente confirmar:</strong>{" "}
                          {formatDateTime(item.confirmation_deadline_at)}
                        </p>
                      )}

                      {item.patient_confirmed_at && (
                        <p>
                          <strong>Paciente confirmou em:</strong>{" "}
                          {formatDateTime(item.patient_confirmed_at)}
                        </p>
                      )}

                      {item.patient_cancellation_reason && (
                        <p>
                          <strong>Motivo do cancelamento:</strong>{" "}
                          {item.patient_cancellation_reason}
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
                    {item.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleConfirmAppointment(item)}
                          disabled={actionLoadingId === item.id}
                          className="rounded-2xl bg-[#283C7A] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#213366] disabled:opacity-50"
                        >
                          {actionLoadingId === item.id
                            ? "Confirmando..."
                            : "Confirmar consulta"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(item)}
                          disabled={actionLoadingId === item.id}
                          className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </>
                    )}

                    {item.status === "confirmed" && (
                      <Link
                        href={`/medico/consultas/${item.id}`}
                        className="rounded-2xl bg-[#6E56CF] px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-[#5E4B9A]"
                      >
                        Abrir prontuário
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}