"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../../components/alert";
import { supabase } from "../../../lib/supabase";

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
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function formatShortDateTime(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    not_requested: "Confirmação ainda não solicitada",
    awaiting_confirmation: "Aguardando confirmação",
    confirmed: "Presença confirmada",
    cancelled_by_patient: "Cancelada pelo paciente",
    reschedule_requested: "Remarcação solicitada",
    no_response: "Sem resposta",
    no_show: "Não compareceu",
  };

  return labels[status || ""] || "Status não informado";
}

function getStatusTone(status?: string | null) {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled_by_patient" || status === "no_show") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "reschedule_requested") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

export default function ConfirmarConsultaPage() {
  const params = useParams<{ id: string }>();
  const appointmentId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<
    "confirm" | "cancel" | "reschedule" | null
  >(null);

  const [appointment, setAppointment] = useState<AppointmentRow | null>(null);
  const [reason, setReason] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  async function loadAppointment() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para confirmar a consulta.");
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
        )
      `
      )
      .eq("id", appointmentId)
      .eq("patient_id", user.id)
      .maybeSingle<AppointmentRow>();

    if (error || !data) {
      setMessage(
        `Erro ao carregar consulta: ${
          error?.message || "consulta não encontrada para este paciente"
        }`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    setAppointment(data);
    setReason(data.patient_cancellation_reason || data.reschedule_reason || "");
    setLoading(false);
  }

  const doctor = pickOne(appointment?.doctors);
  const clinic = pickOne(appointment?.clinics);

  const appointmentStart =
    appointment?.confirmed_start_at || appointment?.requested_start_at;

  const clinicName =
    clinic?.trade_name || clinic?.legal_name || "Clínica não informada";

  const clinicLocation = useMemo(() => {
    const parts = [
      clinic?.address_neighborhood,
      clinic?.address_city || clinic?.city,
      clinic?.address_state || clinic?.state,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(" â€¢ ") : "Localização não informada";
  }, [clinic]);

  const isFinalStatus =
    appointment?.patient_confirmation_status === "confirmed" ||
    appointment?.patient_confirmation_status === "cancelled_by_patient" ||
    appointment?.patient_confirmation_status === "reschedule_requested" ||
    appointment?.status === "completed";

  async function createEvent(
    eventType: string,
    title: string,
    description?: string
  ) {
    if (!appointment) return;

    await supabase.from("appointment_events").insert({
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      clinic_id: appointment.clinic_id,
      event_type: eventType,
      title,
      description: description || null,
      metadata: {
        source: "patient_confirmation_page",
      },
    });
  }

  async function createNotification(
    userId: string | null | undefined,
    notificationType: string,
    title: string,
    body: string
  ) {
    if (!userId || !appointment) return;

    await supabase.from("notifications").insert({
      user_id: userId,
      appointment_id: appointment.id,
      notification_type: notificationType,
      title,
      body,
      channel: "in_app",
      delivery_status: "pending",
    });
  }

  async function handleConfirmPresence() {
    if (!appointment) return;

    setSavingAction("confirm");
    setMessage("");

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("appointments")
      .update({
        patient_confirmation_status: "confirmed",
        patient_confirmed_at: now,
      })
      .eq("id", appointment.id)
      .eq("patient_id", appointment.patient_id);

    if (error) {
      setMessage(`Erro ao confirmar presença: ${error.message}`);
      setMessageType("error");
      setSavingAction(null);
      return;
    }

    await createEvent(
      "confirmed_by_patient",
      "Paciente confirmou presença",
      "O paciente confirmou presença na consulta."
    );

    await createNotification(
      appointment.doctor_id,
      "appointment_confirmed",
      "Paciente confirmou presença",
      `O paciente confirmou presença na consulta de ${formatShortDateTime(
        appointmentStart
      )}.`
    );

    setMessage("Presença confirmada com sucesso.");
    setMessageType("success");
    await loadAppointment();
    setSavingAction(null);
  }

  async function handleCancelAppointment() {
    if (!appointment) return;

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setMessage("Informe o motivo do cancelamento.");
      setMessageType("error");
      return;
    }

    const confirmCancel = window.confirm(
      "Tem certeza que deseja cancelar esta consulta?"
    );

    if (!confirmCancel) return;

    setSavingAction("cancel");
    setMessage("");

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled_by_patient",
        patient_confirmation_status: "cancelled_by_patient",
        patient_cancelled_at: now,
        patient_cancellation_reason: trimmedReason,
      })
      .eq("id", appointment.id)
      .eq("patient_id", appointment.patient_id);

    if (error) {
      setMessage(`Erro ao cancelar consulta: ${error.message}`);
      setMessageType("error");
      setSavingAction(null);
      return;
    }

    await createEvent(
      "cancelled_by_patient",
      "Paciente cancelou a consulta",
      trimmedReason
    );

    await createNotification(
      appointment.doctor_id,
      "appointment_cancelled",
      "Paciente cancelou a consulta",
      `O paciente cancelou a consulta de ${formatShortDateTime(
        appointmentStart
      )}. Motivo: ${trimmedReason}`
    );

    setMessage("Consulta cancelada com sucesso.");
    setMessageType("success");
    await loadAppointment();
    setSavingAction(null);
  }

  async function handleRequestReschedule() {
    if (!appointment) return;

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setMessage("Informe o motivo ou sugestão para remarcação.");
      setMessageType("error");
      return;
    }

    setSavingAction("reschedule");
    setMessage("");

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("appointments")
      .update({
        patient_confirmation_status: "reschedule_requested",
        reschedule_requested_at: now,
        reschedule_reason: trimmedReason,
      })
      .eq("id", appointment.id)
      .eq("patient_id", appointment.patient_id);

    if (error) {
      setMessage(`Erro ao solicitar remarcação: ${error.message}`);
      setMessageType("error");
      setSavingAction(null);
      return;
    }

    await createEvent(
      "reschedule_requested",
      "Paciente solicitou remarcação",
      trimmedReason
    );

    await createNotification(
      appointment.doctor_id,
      "reschedule_requested",
      "Paciente solicitou remarcação",
      `O paciente solicitou remarcação da consulta de ${formatShortDateTime(
        appointmentStart
      )}. Motivo: ${trimmedReason}`
    );

    setMessage("Solicitação de remarcação enviada com sucesso.");
    setMessageType("success");
    await loadAppointment();
    setSavingAction(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-slate-600">Carregando consulta...</p>
        </section>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          {message && <Alert variant={messageType}>{message}</Alert>}

          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-2xl bg-[#164957] px-6 py-4 text-sm font-bold text-white"
          >
            Voltar ao dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />

        <section className="relative mx-auto max-w-5xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pb-12 lg:pt-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#164957]">
                Confirmação de consulta
              </p>

              <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950">
                Confirme sua presença
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Confirme, cancele ou solicite remarcação da sua consulta de
                forma rápida e segura.
              </p>
            </div>

            <Link
              href="/solicitacoes"
              className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-6 py-4 text-sm font-bold text-[#5A4C86] shadow-sm transition hover:bg-[#F6F3FF]"
            >
              Minhas solicitações
            </Link>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[38px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#164957]">
              Consulta
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
              {formatDateTime(appointmentStart)}
            </h2>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[28px] bg-[#F8FAFC] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Médico
                </p>
                <p className="mt-2 font-bold text-slate-950">
                  {doctor?.name || "Médico não informado"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  CRM {doctor?.crm || "não informado"}
                  {doctor?.crm_state ? ` / ${doctor.crm_state}` : ""}
                </p>
              </div>

              <div className="rounded-[28px] bg-[#F8FAFC] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Clínica
                </p>
                <p className="mt-2 font-bold text-slate-950">{clinicName}</p>
                <p className="mt-1 text-sm text-slate-500">{clinicLocation}</p>
              </div>

              <div
                className={`rounded-[28px] border p-5 ${getStatusTone(
                  appointment.patient_confirmation_status
                )}`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
                  Status da confirmação
                </p>
                <p className="mt-2 font-bold">
                  {getStatusLabel(appointment.patient_confirmation_status)}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[38px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#5A4C86]">
              Sua resposta
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
              O que deseja fazer?
            </h2>

            {isFinalStatus ? (
              <div className="mt-6 rounded-[28px] bg-[#F8FAFC] p-6 text-slate-600">
                Esta consulta já recebeu uma resposta do paciente.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                <button
                  type="button"
                  onClick={handleConfirmPresence}
                  disabled={savingAction !== null}
                  className="rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingAction === "confirm"
                    ? "Confirmando..."
                    : "Confirmar presença"}
                </button>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Motivo ou observação
                  </label>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="min-h-[130px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#5A4C86] focus:bg-white"
                    placeholder="Use este campo para cancelar ou pedir remarcação."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleRequestReschedule}
                    disabled={savingAction !== null}
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                  >
                    {savingAction === "reschedule"
                      ? "Enviando..."
                      : "Solicitar remarcação"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelAppointment}
                    disabled={savingAction !== null}
                    className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {savingAction === "cancel"
                      ? "Cancelando..."
                      : "Cancelar consulta"}
                  </button>
                </div>
              </div>
            )}
          </article>
        </div>

        <div className="mt-8 rounded-[34px] border border-[#D9D6F4] bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm">
          <strong className="text-slate-950">Importante:</strong> confirme sua
          presença apenas se realmente puder comparecer. Cancelamentos e
          remarcações podem ficar registrados para controle de disponibilidade e
          avaliação futura.
        </div>
      </section>
    </main>
  );
}

