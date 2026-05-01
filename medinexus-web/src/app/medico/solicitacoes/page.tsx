"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type MemberRow = {
  doctor_id: string | null;
};

type AppointmentRow = {
  id: string;
  patient_id: string | null;
  clinic_id: string | null;
  doctor_id: string | null;
  specialty_id: string | null;
  status: string | null;
  created_at: string | null;
  requested_start_at: string | null;
  requested_end_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  rejection_reason: string | null;
  appointment_mode: string | null;
  distance_km: number | null;
  appointment_duration_minutes: number | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type PatientRow = {
  id: string;
  birth_date: string | null;
  health_plan_operator: string | null;
  health_plan_product_name: string | null;
  health_plan_card_number: string | null;
  accepts_private_consultation: boolean | null;
};

type SpecialtyRow = {
  id: string;
  name: string | null;
};

type AppointmentItem = AppointmentRow & {
  patientProfile: ProfileRow | null;
  patientData: PatientRow | null;
  specialtyName: string;
};

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDate(value: string | null) {
  if (!value) return "Não informado";

  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function getStatusLabel(status: string | null) {
  if (status === "pending") return "Pendente";
  if (status === "confirmed") return "Confirmada";
  if (status === "completed") return "Concluída";
  if (status === "rejected") return "Recusada";
  if (status === "cancelled") return "Cancelada";
  return status || "Não informado";
}

function getStatusClass(status: string | null) {
  if (status === "pending") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (status === "confirmed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "completed") {
    return "bg-sky-50 text-sky-700 ring-sky-200";
  }

  if (status === "rejected" || status === "cancelled") {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function getMainStartAt(item: AppointmentRow) {
  return item.confirmed_start_at || item.requested_start_at;
}

function getMainEndAt(item: AppointmentRow) {
  return item.confirmed_end_at || item.requested_end_at;
}

export default function MedicoSolicitacoesPage() {
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadDoctorAppointments();
  }, []);

  async function loadDoctorAppointments() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado como médico.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from("clinic_members")
      .select("doctor_id")
      .eq("user_id", user.id)
      .eq("member_role", "doctor")
      .maybeSingle<MemberRow>();

    if (memberError || !member?.doctor_id) {
      setMessage("Não encontramos um médico vinculado a esta conta.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setDoctorId(member.doctor_id);

    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        patient_id,
        clinic_id,
        doctor_id,
        specialty_id,
        status,
        created_at,
        requested_start_at,
        requested_end_at,
        confirmed_start_at,
        confirmed_end_at,
        rejection_reason,
        appointment_mode,
        distance_km,
        appointment_duration_minutes
      `
      )
      .eq("doctor_id", member.doctor_id)
      .order("created_at", { ascending: false });

    if (appointmentsError) {
      setMessage(`Erro ao carregar solicitações: ${appointmentsError.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    const loadedAppointments = (appointmentsData || []) as AppointmentRow[];

    const patientIds = Array.from(
      new Set(
        loadedAppointments
          .map((item) => item.patient_id)
          .filter(Boolean) as string[]
      )
    );

    const specialtyIds = Array.from(
      new Set(
        loadedAppointments
          .map((item) => item.specialty_id)
          .filter(Boolean) as string[]
      )
    );

    const [profilesResponse, patientsResponse, specialtiesResponse] =
      await Promise.all([
        patientIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, full_name, email, phone")
              .in("id", patientIds)
          : Promise.resolve({ data: [], error: null }),

        patientIds.length > 0
          ? supabase
              .from("patients")
              .select(
                `
                id,
                birth_date,
                health_plan_operator,
                health_plan_product_name,
                health_plan_card_number,
                accepts_private_consultation
              `
              )
              .in("id", patientIds)
          : Promise.resolve({ data: [], error: null }),

        specialtyIds.length > 0
          ? supabase
              .from("specialties")
              .select("id, name")
              .in("id", specialtyIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (profilesResponse.error) {
      setMessage(`Erro ao carregar pacientes: ${profilesResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (patientsResponse.error) {
      setMessage(
        `Erro ao carregar dados dos pacientes: ${patientsResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (specialtiesResponse.error) {
      setMessage(
        `Erro ao carregar especialidades: ${specialtiesResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    const profilesMap = new Map(
      ((profilesResponse.data || []) as ProfileRow[]).map((item) => [
        item.id,
        item,
      ])
    );

    const patientsMap = new Map(
      ((patientsResponse.data || []) as PatientRow[]).map((item) => [
        item.id,
        item,
      ])
    );

    const specialtiesMap = new Map(
      ((specialtiesResponse.data || []) as SpecialtyRow[]).map((item) => [
        item.id,
        item.name || "Especialidade não informada",
      ])
    );

    const formatted = loadedAppointments.map((item) => ({
      ...item,
      patientProfile: item.patient_id
        ? profilesMap.get(item.patient_id) || null
        : null,
      patientData: item.patient_id
        ? patientsMap.get(item.patient_id) || null
        : null,
      specialtyName: item.specialty_id
        ? specialtiesMap.get(item.specialty_id) || "Especialidade não informada"
        : "Especialidade não informada",
    }));

    setAppointments(formatted);
    setLoading(false);
  }

  async function handleConfirmAppointment(appointment: AppointmentItem) {
    setUpdatingId(appointment.id);
    setMessage("");

    if (!appointment.requested_start_at || !appointment.requested_end_at) {
      setMessage(
        "Esta solicitação não possui horário sugerido. Peça para o paciente refazer a busca."
      );
      setMessageType("error");
      setUpdatingId(null);
      return;
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "confirmed",
        confirmed_start_at: appointment.requested_start_at,
        confirmed_end_at: appointment.requested_end_at,
      })
      .eq("id", appointment.id)
      .eq("doctor_id", doctorId);

    if (error) {
      setMessage(`Erro ao confirmar consulta: ${error.message}`);
      setMessageType("error");
      setUpdatingId(null);
      return;
    }

    setMessage("Consulta confirmada com sucesso.");
    setMessageType("success");
    setUpdatingId(null);
    await loadDoctorAppointments();
  }

  async function handleRejectAppointment(appointmentId: string) {
    setUpdatingId(appointmentId);
    setMessage("");

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "rejected",
        rejection_reason:
          rejectionReason.trim() || "Solicitação recusada pelo médico.",
      })
      .eq("id", appointmentId)
      .eq("doctor_id", doctorId);

    if (error) {
      setMessage(`Erro ao recusar consulta: ${error.message}`);
      setMessageType("error");
      setUpdatingId(null);
      return;
    }

    setMessage("Consulta recusada.");
    setMessageType("success");
    setRejectingId(null);
    setRejectionReason("");
    setUpdatingId(null);
    await loadDoctorAppointments();
  }

  const pendingAppointments = useMemo(
    () => appointments.filter((item) => item.status === "pending"),
    [appointments]
  );

  const confirmedAppointments = useMemo(
    () =>
      appointments.filter((item) =>
        ["confirmed", "completed"].includes(String(item.status || ""))
      ),
    [appointments]
  );

  const otherAppointments = useMemo(
    () =>
      appointments.filter(
        (item) =>
          !["pending", "confirmed", "completed"].includes(
            String(item.status || "")
          )
      ),
    [appointments]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando solicitações...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#EAF1F0_0,#F8FAFC_34%,#FFFFFF_100%)]">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1B4B58]">
              Solicitações médicas
            </p>
            <h1 className="mt-3 app-section-title">
              Confirme seus atendimentos
            </h1>
            <p className="app-section-subtitle">
              O horário já é sugerido automaticamente pelo sistema. Você só precisa confirmar ou recusar.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/medico/dashboard"
              className="app-button-secondary text-center"
            >
              Dashboard
            </Link>

            <Link
              href="/medico/disponibilidade"
              className="app-button-secondary text-center"
            >
              Disponibilidade
            </Link>
          </div>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="app-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-600">
              Pendentes
            </p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {pendingAppointments.length}
            </p>
          </div>

          <div className="app-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">
              Confirmadas
            </p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {confirmedAppointments.length}
            </p>
          </div>

          <div className="app-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
              Outras
            </p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {otherAppointments.length}
            </p>
          </div>
        </div>

        <div className="grid gap-8">
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-950">
                Pendentes
              </h2>
            </div>

            {pendingAppointments.length === 0 ? (
              <div className="app-card p-6">
                <p className="text-slate-600">
                  Nenhuma solicitação pendente no momento.
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {pendingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    updating={updatingId === appointment.id}
                    rejectingId={rejectingId}
                    rejectionReason={rejectionReason}
                    setRejectingId={setRejectingId}
                    setRejectionReason={setRejectionReason}
                    onConfirm={() => handleConfirmAppointment(appointment)}
                    onReject={() => handleRejectAppointment(appointment.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-950">
              Confirmadas e concluídas
            </h2>

            {confirmedAppointments.length === 0 ? (
              <div className="app-card p-6">
                <p className="text-slate-600">
                  Nenhuma consulta confirmada ainda.
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {confirmedAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    updating={false}
                    rejectingId={rejectingId}
                    rejectionReason={rejectionReason}
                    setRejectingId={setRejectingId}
                    setRejectionReason={setRejectionReason}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </section>

          {otherAppointments.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl font-black text-slate-950">
                Recusadas ou canceladas
              </h2>

              <div className="grid gap-5">
                {otherAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    updating={false}
                    rejectingId={rejectingId}
                    rejectionReason={rejectionReason}
                    setRejectingId={setRejectingId}
                    setRejectionReason={setRejectionReason}
                    showActions={false}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

type AppointmentCardProps = {
  appointment: AppointmentItem;
  updating: boolean;
  rejectingId: string | null;
  rejectionReason: string;
  setRejectingId: (value: string | null) => void;
  setRejectionReason: (value: string) => void;
  onConfirm?: () => void;
  onReject?: () => void;
  showActions?: boolean;
};

function AppointmentCard({
  appointment,
  updating,
  rejectingId,
  rejectionReason,
  setRejectingId,
  setRejectionReason,
  onConfirm,
  onReject,
  showActions = true,
}: AppointmentCardProps) {
  const startAt = getMainStartAt(appointment);
  const endAt = getMainEndAt(appointment);

  return (
    <article className="app-card p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ring-1 ${getStatusClass(
                appointment.status
              )}`}
            >
              {getStatusLabel(appointment.status)}
            </span>

            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-200">
              {appointment.appointment_mode === "private"
                ? "Particular"
                : "Plano de saúde"}
            </span>

            {appointment.distance_km !== null && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-600 ring-1 ring-slate-200">
                {appointment.distance_km} km
              </span>
            )}
          </div>

          <h3 className="text-2xl font-black text-slate-950">
            {appointment.patientProfile?.full_name || "Paciente não informado"}
          </h3>

          <p className="mt-2 text-slate-600">
            {appointment.specialtyName} • solicitado em{" "}
            {formatDateTime(appointment.created_at)}
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                Horário sugerido
              </p>
              <p className="mt-2 text-xl font-black text-slate-950">
                {formatDateTime(startAt)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Término previsto: {formatDateTime(endAt)}
              </p>
              {appointment.appointment_duration_minutes && (
                <p className="mt-1 text-sm text-slate-600">
                  Duração: {appointment.appointment_duration_minutes} minutos
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                Dados do paciente
              </p>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold">E-mail:</span>{" "}
                {appointment.patientProfile?.email || "Não informado"}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Telefone:</span>{" "}
                {appointment.patientProfile?.phone || "Não informado"}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Nascimento:</span>{" "}
                {formatDate(appointment.patientData?.birth_date || null)}
              </p>
            </div>
          </div>

          {appointment.appointment_mode !== "private" && (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1B4B58]">
                Plano de saúde
              </p>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold">Operadora:</span>{" "}
                {appointment.patientData?.health_plan_operator || "Não informado"}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Modelo:</span>{" "}
                {appointment.patientData?.health_plan_product_name ||
                  "Não informado"}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Carteirinha:</span>{" "}
                {appointment.patientData?.health_plan_card_number ||
                  "Não informado"}
              </p>
            </div>
          )}

          {appointment.rejection_reason && (
            <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <span className="font-bold">Motivo da recusa:</span>{" "}
              {appointment.rejection_reason}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-[280px]">
          {showActions && appointment.status === "pending" && (
            <>
              <button
                type="button"
                onClick={onConfirm}
                disabled={updating}
                className="rounded-2xl bg-[#1B4B58] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#163F4A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? "Confirmando..." : "Confirmar consulta"}
              </button>

              {rejectingId === appointment.id ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
                  <label className="mb-2 block text-sm font-semibold text-red-800">
                    Motivo da recusa
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[90px] w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400"
                    placeholder="Ex: indisponibilidade, agenda cheia..."
                  />

                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={onReject}
                      disabled={updating}
                      className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Confirmar recusa
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectionReason("");
                      }}
                      className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRejectingId(appointment.id)}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  Recusar
                </button>
              )}
            </>
          )}

          {["confirmed", "completed"].includes(String(appointment.status || "")) && (
            <Link
              href={`/medico/consultas/${appointment.id}`}
              className="rounded-2xl bg-[#594E86] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#4D4278]"
            >
              Abrir prontuário
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}