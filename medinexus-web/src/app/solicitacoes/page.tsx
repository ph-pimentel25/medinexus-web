"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "../components/alert";
import StatusBadge from "../components/status-badge";
import { supabase } from "../lib/supabase";

type Status = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
type PatientConfirmationStatus =
  | "not_required"
  | "waiting"
  | "confirmed"
  | "cancelled_by_patient"
  | "expired";

type AppointmentItem = {
  id: string;
  status: Status;
  created_at: string;
  requested_start_at: string | null;
  requested_end_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  rejection_reason: string | null;
  short_notice: boolean;
  patient_confirmation_status: PatientConfirmationStatus;
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
  } | null;
  specialties?: {
    name: string | null;
  } | null;
};

type RawAppointmentItem = {
  id: string;
  status: Status;
  created_at: string;
  requested_start_at: string | null;
  requested_end_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  rejection_reason: string | null;
  short_notice: boolean;
  patient_confirmation_status: PatientConfirmationStatus;
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
  doctors?: { name: string | null } | { name: string | null }[] | null;
  specialties?: { name: string | null } | { name: string | null }[] | null;
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

function getConfirmationBadge(
  status: PatientConfirmationStatus,
  shortNotice: boolean
) {
  if (shortNotice) {
    return {
      label: "Consulta de encaixe",
      className:
        "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    };
  }

  switch (status) {
    case "waiting":
      return {
        label: "Aguardando sua confirmação",
        className:
          "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
      };
    case "confirmed":
      return {
        label: "Presença confirmada",
        className:
          "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      };
    case "cancelled_by_patient":
      return {
        label: "Cancelada por você",
        className:
          "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      };
    case "expired":
      return {
        label: "Confirmação expirada",
        className:
          "bg-red-50 text-red-700 ring-1 ring-red-200",
      };
    default:
      return {
        label: "Sem confirmação necessária",
        className:
          "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
      };
  }
}

export default function SolicitacoesPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

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
          name
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
          doctors: doctor ? { name: doctor.name } : null,
          specialties: specialty ? { name: specialty.name } : null,
        };
      }
    );

    setAppointments(normalizedAppointments);
    setLoading(false);
  }

  async function handleCancelPendingRequest(appointmentId: string) {
    setMessage("");
    setActingId(appointmentId);

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        patient_confirmation_status: "cancelled_by_patient",
      })
      .eq("id", appointmentId);

    if (error) {
      setMessage(`Erro ao cancelar solicitação: ${error.message}`);
      setMessageType("error");
      setActingId(null);
      return;
    }

    setMessage("Solicitação cancelada com sucesso.");
    setMessageType("success");
    setActingId(null);
    await loadAppointments();
  }

  async function handlePatientConfirm(appointmentId: string) {
    setMessage("");
    setActingId(appointmentId);

    const { error } = await supabase
      .from("appointments")
      .update({
        patient_confirmation_status: "confirmed",
        patient_confirmed_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (error) {
      setMessage(`Erro ao confirmar presença: ${error.message}`);
      setMessageType("error");
      setActingId(null);
      return;
    }

    setMessage("Sua presença foi confirmada com sucesso.");
    setMessageType("success");
    setActingId(null);
    await loadAppointments();
  }

  async function handlePatientCancelConfirmed(appointmentId: string) {
    setMessage("");
    setActingId(appointmentId);

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        patient_confirmation_status: "cancelled_by_patient",
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando suas solicitações...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para o dashboard
          </Link>

          <Link href="/busca" className="app-button-secondary">
            Nova busca
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Minhas solicitações
          </p>
          <h1 className="mt-3 app-section-title">
            Acompanhe seus pedidos de consulta
          </h1>
          <p className="app-section-subtitle">
            Veja o status de cada solicitação e acompanhe a resposta das clínicas.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="app-card p-8">
            <p className="text-slate-700">
              Você ainda não possui solicitações cadastradas.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((item) => {
              const confirmationBadge = getConfirmationBadge(
                item.patient_confirmation_status,
                item.short_notice
              );

              return (
                <div key={item.id} className="app-card p-8">
                  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">
                        {item.clinics?.trade_name || "Clínica não informada"}
                      </h2>

                      <div className="mt-4 grid gap-2 text-slate-700">
                        <p>
                          <span className="font-semibold">Especialidade:</span>{" "}
                          {item.specialties?.name || "Não informada"}
                        </p>
                        <p>
                          <span className="font-semibold">Médico:</span>{" "}
                          {item.doctors?.name || "Não informado"}
                        </p>
                        <p>
                          <span className="font-semibold">Local:</span>{" "}
                          {item.clinics?.city || "Cidade não informada"} /{" "}
                          {item.clinics?.state || "Estado não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <StatusBadge status={item.status} />
                      <span
                        className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${confirmationBadge.className}`}
                      >
                        {confirmationBadge.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 text-slate-700">
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

                    {!item.short_notice &&
                      item.patient_confirmation_status === "waiting" &&
                      item.patient_confirmation_deadline_at && (
                        <p>
                          <span className="font-semibold">
                            Confirme até:
                          </span>{" "}
                          {formatDateTime(item.patient_confirmation_deadline_at)}
                        </p>
                      )}

                    {item.patient_confirmation_status === "confirmed" &&
                      item.patient_confirmed_at && (
                        <p>
                          <span className="font-semibold">
                            Presença confirmada em:
                          </span>{" "}
                          {formatDateTime(item.patient_confirmed_at)}
                        </p>
                      )}
                  </div>

                  {item.short_notice && item.status === "confirmed" && (
                    <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Esta consulta foi tratada como <span className="font-semibold">encaixe</span>,
                      pois foi marcada com menos de 24 horas de antecedência.
                      Pode haver maior tempo de espera no atendimento.
                    </div>
                  )}

                  {item.status === "rejected" && item.rejection_reason && (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      <span className="font-semibold">Motivo da recusa:</span>{" "}
                      {item.rejection_reason}
                    </div>
                  )}

                  {item.status === "pending" && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => handleCancelPendingRequest(item.id)}
                        disabled={actingId === item.id}
                        className="app-button-danger"
                      >
                        {actingId === item.id
                          ? "Cancelando..."
                          : "Cancelar solicitação"}
                      </button>
                    </div>
                  )}

                  {item.status === "confirmed" &&
                    !item.short_notice &&
                    item.patient_confirmation_status === "waiting" && (
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => handlePatientConfirm(item.id)}
                          disabled={actingId === item.id}
                          className="app-button-primary"
                        >
                          {actingId === item.id
                            ? "Confirmando..."
                            : "Confirmar presença"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePatientCancelConfirmed(item.id)}
                          disabled={actingId === item.id}
                          className="app-button-danger"
                        >
                          {actingId === item.id
                            ? "Cancelando..."
                            : "Cancelar consulta"}
                        </button>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}