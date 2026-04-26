"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../components/alert";
import StatusBadge from "../components/status-badge";
import { supabase } from "../lib/supabase";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

type PatientConfirmationStatus =
  | "not_required"
  | "waiting"
  | "confirmed"
  | "cancelled_by_patient"
  | "expired";

type ProfileInfo = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type AppointmentItem = {
  id: string;
  status: AppointmentStatus;
  created_at: string;
  requested_start_at: string | null;
  requested_end_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  rejection_reason: string | null;
  short_notice: boolean | null;
  patient_confirmation_status: PatientConfirmationStatus | null;
  patient_confirmation_requested_at: string | null;
  patient_confirmation_deadline_at: string | null;
  patient_confirmed_at: string | null;
  clinics?: {
    trade_name: string | null;
    city: string | null;
    state: string | null;
  } | null;
  doctors?: {
    name: string | null;
    crm: string | null;
    crm_state: string | null;
  } | null;
  specialties?: {
    name: string | null;
  } | null;
};

type RawAppointmentItem = {
  id: string;
  status: AppointmentStatus;
  created_at: string;
  requested_start_at: string | null;
  requested_end_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  rejection_reason: string | null;
  short_notice: boolean | null;
  patient_confirmation_status: PatientConfirmationStatus | null;
  patient_confirmation_requested_at: string | null;
  patient_confirmation_deadline_at: string | null;
  patient_confirmed_at: string | null;
  clinics?:
    | {
        trade_name: string | null;
        city: string | null;
        state: string | null;
      }
    | {
        trade_name: string | null;
        city: string | null;
        state: string | null;
      }[]
    | null;
  doctors?:
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
  specialties?:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "Ainda não definido";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getPatientConfirmationText(
  status: PatientConfirmationStatus | null,
  shortNotice: boolean | null
) {
  if (shortNotice) return "Consulta de encaixe";
  if (status === "waiting") return "Aguardando sua confirmação";
  if (status === "confirmed") return "Presença confirmada por você";
  if (status === "cancelled_by_patient") return "Cancelada por você";
  if (status === "expired") return "Confirmação expirada";
  return "Sem confirmação necessária";
}

function getStatusDescription(status: AppointmentStatus) {
  switch (status) {
    case "pending":
      return "Sua solicitação foi enviada e aguarda análise.";
    case "confirmed":
      return "Sua consulta foi confirmada pela clínica ou pelo médico.";
    case "rejected":
      return "Sua solicitação foi recusada.";
    case "cancelled":
      return "Sua consulta foi cancelada.";
    case "completed":
      return "Seu atendimento foi concluído.";
    default:
      return "Status atualizado.";
  }
}

export default function SolicitacoesPage() {
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .maybeSingle<ProfileInfo>();

    setProfile(profileData || null);

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        status,
        created_at,
        requested_start_at,
        requested_end_at,
        confirmed_start_at,
        confirmed_end_at,
        rejection_reason,
        short_notice,
        patient_confirmation_status,
        patient_confirmation_requested_at,
        patient_confirmation_deadline_at,
        patient_confirmed_at,
        clinics (
          trade_name,
          city,
          state
        ),
        doctors (
          name,
          crm,
          crm_state
        ),
        specialties (
          name
        )
      `)
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Erro ao carregar suas solicitações: ${error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    const rawAppointments = (data || []) as RawAppointmentItem[];

    const normalizedAppointments: AppointmentItem[] = rawAppointments.map(
      (item) => {
        const clinic = pickOne(item.clinics);
        const doctor = pickOne(item.doctors);
        const specialty = pickOne(item.specialties);

        return {
          id: item.id,
          status: item.status,
          created_at: item.created_at,
          requested_start_at: item.requested_start_at,
          requested_end_at: item.requested_end_at,
          confirmed_start_at: item.confirmed_start_at,
          confirmed_end_at: item.confirmed_end_at,
          rejection_reason: item.rejection_reason,
          short_notice: item.short_notice,
          patient_confirmation_status: item.patient_confirmation_status,
          patient_confirmation_requested_at:
            item.patient_confirmation_requested_at,
          patient_confirmation_deadline_at:
            item.patient_confirmation_deadline_at,
          patient_confirmed_at: item.patient_confirmed_at,
          clinics: clinic
            ? {
                trade_name: clinic.trade_name,
                city: clinic.city,
                state: clinic.state,
              }
            : null,
          doctors: doctor
            ? {
                name: doctor.name,
                crm: doctor.crm,
                crm_state: doctor.crm_state,
              }
            : null,
          specialties: specialty
            ? {
                name: specialty.name,
              }
            : null,
        };
      }
    );

    setAppointments(normalizedAppointments);
    setLoading(false);
  }

  async function handleConfirmPresence(appointmentId: string) {
    setActingId(appointmentId);
    setMessage("");

    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from("appointments")
      .update({
        patient_confirmation_status: "confirmed",
        patient_confirmed_at: nowIso,
      })
      .eq("id", appointmentId);

    if (error) {
      setMessage(`Erro ao confirmar presença: ${error.message}`);
      setMessageType("error");
      setActingId(null);
      return;
    }

    setMessage("Presença confirmada com sucesso.");
    setMessageType("success");
    setActingId(null);
    await loadAppointments();
  }

  async function handleCancelByPatient(appointmentId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar esta consulta?"
    );

    if (!confirmed) return;

    setActingId(appointmentId);
    setMessage("");

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        patient_confirmation_status: "cancelled_by_patient",
        patient_confirmed_at: null,
      })
      .eq("id", appointmentId);

    if (error) {
      setMessage(`Erro ao cancelar consulta: ${error.message}`);
      setMessageType("error");
      setActingId(null);
      return;
    }

    setMessage("Consulta cancelada com sucesso.");
    setMessageType("success");
    setActingId(null);
    await loadAppointments();
  }

  const counters = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((item) => item.status === "pending").length,
      confirmed: appointments.filter((item) => item.status === "confirmed")
        .length,
      completed: appointments.filter((item) => item.status === "completed")
        .length,
    };
  }, [appointments]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando solicitações...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
              Minhas solicitações
            </p>
            <h1 className="mt-3 app-section-title">
              Acompanhe seus pedidos de consulta
            </h1>
            <p className="app-section-subtitle">
              Veja o status de cada solicitação, confirme presença e acompanhe o retorno.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="app-button-secondary text-center">
              Voltar ao dashboard
            </Link>
            <Link href="/busca" className="app-button-primary text-center">
              Nova busca
            </Link>
          </div>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Total</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {counters.total}
            </h3>
          </div>

          <div className="metric-card metric-card--warning">
            <p className="text-sm text-yellow-700">Pendentes</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {counters.pending}
            </h3>
          </div>

          <div className="metric-card metric-card--success">
            <p className="text-sm text-green-700">Confirmadas</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {counters.confirmed}
            </h3>
          </div>

          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Concluídas</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {counters.completed}
            </h3>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="app-card p-8">
            <p className="text-slate-700">
              Você ainda não possui solicitações cadastradas.
            </p>

            <div className="mt-6">
              <Link href="/busca" className="app-button-primary">
                Criar primeira busca
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((item) => {
              const canConfirmPresence =
                item.status === "confirmed" &&
                item.patient_confirmation_status === "waiting" &&
                !item.short_notice;

              const canCancel =
                item.status === "confirmed" || item.status === "pending";

              return (
                <div key={item.id} className="app-card p-8">
                  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-200">
                          {item.specialties?.name || "Especialidade"}
                        </span>

                        {item.short_notice && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-200">
                            Encaixe
                          </span>
                        )}
                      </div>

                      <h2 className="text-3xl font-bold text-slate-900">
                        {item.clinics?.trade_name || "Clínica não informada"}
                      </h2>

                      <p className="mt-2 text-slate-600">
                        {item.clinics?.city || "Cidade não informada"} /{" "}
                        {item.clinics?.state || "Estado não informado"}
                      </p>
                    </div>

                    <StatusBadge status={item.status} />
                  </div>

                  <div className="grid gap-3 text-slate-700">
                    <p>
                      <span className="font-semibold">Paciente:</span>{" "}
                      {profile?.full_name || "Não informado"}
                    </p>

                    <p>
                      <span className="font-semibold">Médico:</span>{" "}
                      {item.doctors?.name || "Ainda não informado"}
                      {item.doctors?.crm
                        ? ` • CRM ${item.doctors.crm}${
                            item.doctors.crm_state
                              ? ` / ${item.doctors.crm_state}`
                              : ""
                          }`
                        : ""}
                    </p>

                    <p>
                      <span className="font-semibold">Solicitada em:</span>{" "}
                      {formatDateTime(item.created_at)}
                    </p>

                    <p>
                      <span className="font-semibold">Horário sugerido:</span>{" "}
                      {item.requested_start_at
                        ? `${formatDateTime(
                            item.requested_start_at
                          )} até ${formatDateTime(item.requested_end_at)}`
                        : "Ainda não definido"}
                    </p>

                    <p>
                      <span className="font-semibold">Horário confirmado:</span>{" "}
                      {item.confirmed_start_at
                        ? `${formatDateTime(
                            item.confirmed_start_at
                          )} até ${formatDateTime(item.confirmed_end_at)}`
                        : "Ainda não confirmado"}
                    </p>

                    <p>
                      <span className="font-semibold">Confirmação:</span>{" "}
                      {getPatientConfirmationText(
                        item.patient_confirmation_status,
                        item.short_notice
                      )}
                    </p>

                    {item.patient_confirmation_deadline_at && (
                      <p>
                        <span className="font-semibold">
                          Prazo para confirmar:
                        </span>{" "}
                        {formatDateTime(item.patient_confirmation_deadline_at)}
                      </p>
                    )}

                    {item.patient_confirmed_at && (
                      <p>
                        <span className="font-semibold">
                          Confirmado por você em:
                        </span>{" "}
                        {formatDateTime(item.patient_confirmed_at)}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {getStatusDescription(item.status)}
                  </div>

                  {item.status === "rejected" && item.rejection_reason && (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      <span className="font-semibold">Motivo da recusa:</span>{" "}
                      {item.rejection_reason}
                    </div>
                  )}

                  {item.short_notice && item.status === "confirmed" && (
                    <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Esta consulta foi marcada como{" "}
                      <span className="font-semibold">encaixe</span>, pois foi
                      confirmada com menos de 24 horas de antecedência. Pode
                      haver maior tempo de espera no atendimento.
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    {canConfirmPresence && (
                      <button
                        type="button"
                        onClick={() => handleConfirmPresence(item.id)}
                        disabled={actingId === item.id}
                        className="app-button-primary"
                      >
                        {actingId === item.id
                          ? "Confirmando..."
                          : "Confirmar presença"}
                      </button>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancelByPatient(item.id)}
                        disabled={actingId === item.id}
                        className="app-button-secondary"
                      >
                        {actingId === item.id
                          ? "Processando..."
                          : "Cancelar consulta"}
                      </button>
                    )}

                    {item.status === "completed" && (
                      <Link
                        href="/historico-clinico"
                        className="app-button-secondary text-center"
                      >
                        Ver no histórico clínico
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}