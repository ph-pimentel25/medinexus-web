"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

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
  if (!value) return "NÃ£o informado";

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
    cancelled_by_clinic: "Cancelada pela clÃ­nica",
    completed: "ConcluÃ­da",
    no_show: "NÃ£o compareceu",
  };

  return labels[status || ""] || status || "Status nÃ£o informado";
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
    not_requested: "Sem confirmaÃ§Ã£o necessÃ¡ria",
    awaiting_confirmation: "Aguardando paciente",
    confirmed: "Paciente confirmou",
    cancelled_by_patient: "Paciente cancelou",
    cancelled_by_clinic: "Cancelada pela clÃ­nica",
    reschedule_requested: "Pedido de remarcaÃ§Ã£o",
    no_response: "Sem resposta",
    no_show: "NÃ£o compareceu",
  };

  return labels[status || ""] || "Sem confirmaÃ§Ã£o necessÃ¡ria";
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

function getPatientName(item: AppointmentRow) {
  const patient = pickOne(item.patients);
  return patient?.full_name || "Paciente nÃ£o informado";
}

function getDoctorName(item: AppointmentRow) {
  const doctor = pickOne(item.doctors);
  return doctor?.name || "MÃ©dico nÃ£o informado";
}

function getDoctorCrm(item: AppointmentRow) {
  const doctor = pickOne(item.doctors);
  if (!doctor?.crm) return "CRM nÃ£o informado";
  return `CRM ${doctor.crm}${doctor.crm_state ? ` / ${doctor.crm_state}` : ""}`;
}

function getSpecialtyName(item: AppointmentRow) {
  const specialty = pickOne(item.specialties);
  return specialty?.name || "Consulta";
}

function getAppointmentEnd(item: AppointmentRow) {
  return item.confirmed_end_at || item.requested_end_at;
}

export default function ClinicaSolicitacoesPage() {
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

  async function getClinicIdForCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        clinicId: null,
        errorMessage: "VocÃª precisa estar logado como clÃ­nica.",
      };
    }

    const { data: memberData, error: memberError } = await supabase
      .from("clinic_members")
      .select("clinic_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (memberError) {
      return {
        clinicId: null,
        errorMessage: `Erro ao carregar vÃ­nculo da clÃ­nica: ${memberError.message}`,
      };
    }

    if (!memberData?.clinic_id) {
      return {
        clinicId: null,
        errorMessage: "Nenhuma clÃ­nica vinculada a este usuÃ¡rio.",
      };
    }

    return {
      clinicId: memberData.clinic_id as string,
      errorMessage: "",
    };
  }

  async function loadAppointments() {
    setLoading(true);
    setMessage("");

    const { clinicId, errorMessage } = await getClinicIdForCurrentUser();

    if (!clinicId) {
      setMessage(errorMessage);
      setMessageType("error");
      setAppointments([]);
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
        specialties (
          name
        )
      `
      )
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Erro ao carregar solicitaÃ§Ãµes: ${error.message}`);
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
        (filter === "awaiting_confirmation" &&
          confirmation === "awaiting_confirmation") ||
        (filter === "patient_confirmed" && confirmation === "confirmed") ||
        (filter === "cancelled" &&
          (status === "cancelled_by_patient" ||
            status === "cancelled_by_clinic")) ||
        (filter === "completed" && status === "completed");

      const searchable = normalize(
        [
          getPatientName(item),
          getDoctorName(item),
          getDoctorCrm(item),
          getSpecialtyName(item),
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

  async function handleCancelAppointment(appointment: AppointmentRow) {
    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar esta consulta pela clÃ­nica?"
    );

    if (!confirmed) return;

    setActionLoadingId(appointment.id);
    setMessage("");

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled_by_clinic",
        patient_confirmation_status: "cancelled_by_clinic",
        patient_cancelled_at: now,
        patient_cancellation_reason: "Cancelada pela clÃ­nica.",
      })
      .eq("id", appointment.id)
      .eq("clinic_id", appointment.clinic_id);

    if (error) {
      setMessage(`Erro ao cancelar consulta: ${error.message}`);
      setMessageType("error");
      setActionLoadingId(null);
      return;
    }

    await supabase.from("appointment_events").insert({
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      clinic_id: appointment.clinic_id,
      event_type: "cancelled_by_clinic",
      title: "ClÃ­nica cancelou a consulta",
      description: "Consulta cancelada pela clÃ­nica.",
      metadata: {
        source: "clinic_requests_page",
      },
    });

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
              SolicitaÃ§Ãµes
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Consultas da clÃ­nica
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Acompanhe solicitaÃ§Ãµes vinculadas Ã  clÃ­nica, mÃ©dicos responsÃ¡veis
              e status de confirmaÃ§Ã£o dos pacientes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/clinica/dashboard"
              className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
            >
              Dashboard
            </Link>

            <Link
              href="/clinica/medicos"
              className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
            >
              MÃ©dicos
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
            { label: "ConcluÃ­das", value: stats.completed, tone: "text-slate-700" },
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
                Buscar consulta
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Busque por paciente, mÃ©dico, CRM ou status"
                className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todas" },
                { value: "pending", label: "Pendentes" },
                { value: "confirmed", label: "Confirmadas" },
                { value: "awaiting_confirmation", label: "Aguardando paciente" },
                { value: "patient_confirmed", label: "Paciente confirmou" },
                { value: "cancelled", label: "Canceladas" },
                { value: "completed", label: "ConcluÃ­das" },
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
              Carregando solicitaÃ§Ãµes...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Nenhuma solicitaÃ§Ã£o encontrada
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                As consultas vinculadas Ã  clÃ­nica aparecerÃ£o aqui.
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
                        {getSpecialtyName(item)}
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
                      {getDoctorName(item)} â€¢ {getDoctorCrm(item)}
                    </p>

                    <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <strong className="text-slate-800">Solicitada em:</strong>{" "}
                        {formatDateTime(item.created_at)}
                      </p>

                      <p>
                        <strong className="text-slate-800">
                          HorÃ¡rio sugerido:
                        </strong>{" "}
                        {formatDateTime(item.requested_start_at)}
                      </p>

                      <p>
                        <strong className="text-slate-800">
                          HorÃ¡rio confirmado:
                        </strong>{" "}
                        {item.confirmed_start_at
                          ? `${formatDateTime(
                              item.confirmed_start_at
                            )} atÃ© ${formatDateTime(getAppointmentEnd(item))}`
                          : "Ainda nÃ£o confirmado"}
                      </p>

                      <p>
                        <strong className="text-slate-800">ConfirmaÃ§Ã£o:</strong>{" "}
                        {getConfirmationLabel(item.patient_confirmation_status)}
                      </p>
                    </div>

                    {item.reschedule_reason && (
                      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                        <strong>Pedido de remarcaÃ§Ã£o:</strong>{" "}
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
                    {item.status === "confirmed" && (
                      <Link
                        href={`/medico/consultas/${item.id}`}
                        className="w-full rounded-2xl bg-[#5A4C86] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#5A4C86]"
                      >
                        Abrir prontuÃ¡rio
                      </Link>
                    )}

                    {item.status !== "cancelled_by_patient" &&
                      item.status !== "cancelled_by_clinic" &&
                      item.status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(item)}
                          disabled={actionLoadingId === item.id}
                          className="w-full rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {actionLoadingId === item.id
                            ? "Cancelando..."
                            : "Cancelar consulta"}
                        </button>
                      )}

                    <Link
                      href="/clinica/dashboard"
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


