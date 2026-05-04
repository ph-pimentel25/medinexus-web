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
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "pending") return "bg-amber-50 text-amber-700";

  if (
    status === "cancelled_by_patient" ||
    status === "cancelled_by_clinic" ||
    status === "no_show"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (status === "completed") return "bg-slate-100 text-slate-700";

  return "bg-blue-50 text-blue-700";
}

function getConfirmationLabel(status?: string | null) {
  const labels: Record<string, string> = {
    not_requested: "Sem confirmação necessária",
    awaiting_confirmation: "Aguardando paciente",
    confirmed: "Paciente confirmou",
    cancelled_by_patient: "Paciente cancelou",
    cancelled_by_clinic: "Cancelada pela clínica",
    reschedule_requested: "Pedido de remarcação",
    no_response: "Sem resposta",
    no_show: "Não compareceu",
  };

  return labels[status || ""] || "Sem confirmação necessária";
}

function getConfirmationTone(status?: string | null) {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "awaiting_confirmation") return "bg-blue-50 text-blue-700";
  if (status === "reschedule_requested") return "bg-amber-50 text-amber-700";

  if (
    status === "cancelled_by_patient" ||
    status === "cancelled_by_clinic" ||
    status === "no_show"
  ) {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
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
          item.patient_cpf,
          item.patient_phone,
          item.patient_email,
          item.status,
          item.patient_confirmation_status,
        ].join(" ")
      );

      return matchesFilter && (!query || searchable.includes(query));
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
      completed: appointments.filter((item) => item.status === "completed")
        .length,
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
    <main className="min-h-screen bg-[#FAF6F3]">
      <section className="border-b border-[#E7DDD7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-[#D8CCC5] bg-[#FAF6F3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#164957]">
              Área médica
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Solicitações de consulta
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Confirme solicitações, acompanhe presença do paciente e abra o
              prontuário quando a consulta estiver confirmada.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/medico/dashboard"
              className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
            >
              Dashboard
            </Link>

            <Link
              href="/medico/disponibilidade"
              className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
            >
              Disponibilidade
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Total", value: stats.total, tone: "text-slate-950" },
            { label: "Pendentes", value: stats.pending, tone: "text-[#B26B00]" },
            { label: "Confirmadas", value: stats.confirmed, tone: "text-[#7A9D8C]" },
            {
              label: "Aguardando",
              value: stats.awaitingPatient,
              tone: "text-[#164957]",
            },
            {
              label: "Paciente confirmou",
              value: stats.patientConfirmed,
              tone: "text-[#5A4C86]",
            },
            { label: "Concluídas", value: stats.completed, tone: "text-slate-700" },
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

        <div className="mt-6 rounded-[28px] border border-[#E7DDD7] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="w-full xl:max-w-xl">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar solicitação
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
                placeholder="Busque por paciente, CPF, telefone, clínica ou status"
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
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    filter === item.value
                      ? "bg-[#164957] text-white"
                      : "border border-[#D8CCC5] bg-white text-[#5A4C86] hover:bg-[#FAF6F3]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 text-sm text-slate-500 shadow-sm">
              Carregando solicitações...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Nenhuma solicitação encontrada
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Quando pacientes solicitarem consultas com você, elas aparecerão
                aqui.
              </p>
            </div>
          ) : (
            filteredAppointments.map((item) => (
              <article
                key={item.id}
                className="rounded-[28px] border border-[#E7DDD7] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EEF3EF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#164957]">
                        {getSpecialtyName()}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getStatusTone(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getConfirmationTone(
                          item.patient_confirmation_status
                        )}`}
                      >
                        {getConfirmationLabel(item.patient_confirmation_status)}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-950">
                      {getPatientName(item)}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {getClinicName(item)} • {getClinicLocation(item)}
                    </p>

                    <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <strong className="text-slate-800">CPF:</strong>{" "}
                        {item.patient_cpf || "Não informado"}
                      </p>

                      <p>
                        <strong className="text-slate-800">Telefone:</strong>{" "}
                        {item.patient_phone || "Não informado"}
                      </p>

                      <p>
                        <strong className="text-slate-800">E-mail:</strong>{" "}
                        {item.patient_email || "Não informado"}
                      </p>

                      <p>
                        <strong className="text-slate-800">Plano:</strong>{" "}
                        {item.patient_health_plan_operator ||
                          item.patient_health_plan_product_name ||
                          "Não informado"}
                      </p>

                      <p>
                        <strong className="text-slate-800">Solicitada em:</strong>{" "}
                        {formatDateTime(item.created_at)}
                      </p>

                      <p>
                        <strong className="text-slate-800">
                          Horário sugerido:
                        </strong>{" "}
                        {formatDateTime(item.requested_start_at)}
                      </p>

                      <p>
                        <strong className="text-slate-800">
                          Horário confirmado:
                        </strong>{" "}
                        {item.confirmed_start_at
                          ? `${formatDateTime(
                              item.confirmed_start_at
                            )} até ${formatDateTime(getAppointmentEnd(item))}`
                          : "Ainda não confirmado"}
                      </p>

                      <p>
                        <strong className="text-slate-800">Confirmação:</strong>{" "}
                        {getConfirmationLabel(item.patient_confirmation_status)}
                      </p>
                    </div>

                    {item.reschedule_reason && (
                      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                        <strong>Pedido de remarcação:</strong>{" "}
                        {item.reschedule_reason}
                      </div>
                    )}

                    {item.patient_cancellation_reason && (
                      <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                        <strong>Motivo do cancelamento:</strong>{" "}
                        {item.patient_cancellation_reason}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[240px]">
                    {item.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleConfirmAppointment(item)}
                          disabled={actionLoadingId === item.id}
                          className="w-full rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46] disabled:opacity-50"
                        >
                          {actionLoadingId === item.id
                            ? "Confirmando..."
                            : "Confirmar consulta"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(item)}
                          disabled={actionLoadingId === item.id}
                          className="w-full rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </>
                    )}

                    {item.status === "confirmed" && (
                      <Link
                        href={`/medico/consultas/${item.id}`}
                        className="w-full rounded-2xl bg-[#5A4C86] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#5A4C86]"
                      >
                        Abrir prontuário
                      </Link>
                    )}

                    <Link
                      href="/medico/dashboard"
                      className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-center text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
                    >
                      Voltar ao painel
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}


