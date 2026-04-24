"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import StatusBadge from "../../components/status-badge";
import { supabase } from "../../lib/supabase";


type Status = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
type PatientConfirmationStatus =
  | "not_required"
  | "waiting"
  | "confirmed"
  | "cancelled_by_patient"
  | "expired";

type MemberRow = {
  doctor_id: string | null;
  member_role: "owner" | "admin" | "doctor";
};

type ProfileInfo = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type AvailabilityRule = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

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
  patients?: {
    id: string;
    profiles?: ProfileInfo | null;
  } | null;
  clinics?: {
    trade_name: string | null;
    city: string | null;
    state: string | null;
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
  patients?: { id: string } | { id: string }[] | null;
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

function getLocalDayOfWeek(dateString: string) {
  return new Date(`${dateString}T12:00:00`).getDay();
}

function toMinutes(timeValue: string) {
  const [hours, minutes] = timeValue.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function isWithinAvailability(
  date: string,
  startTime: string,
  endTime: string,
  rules: AvailabilityRule[]
) {
  const dayOfWeek = getLocalDayOfWeek(date);
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  return rules.some((rule) => {
    if (!rule.is_active) return false;
    if (rule.day_of_week !== dayOfWeek) return false;

    const ruleStart = toMinutes(rule.start_time);
    const ruleEnd = toMinutes(rule.end_time);

    return start >= ruleStart && end <= ruleEnd;
  });
}

function getPatientConfirmationText(
  status: PatientConfirmationStatus,
  shortNotice: boolean
) {
  if (shortNotice) return "Consulta de encaixe";
  if (status === "waiting") return "Aguardando confirmação do paciente";
  if (status === "confirmed") return "Paciente confirmou presença";
  if (status === "cancelled_by_patient") return "Paciente cancelou";
  if (status === "expired") return "Confirmação expirada";
  return "Sem confirmação necessária";
}

export default function MedicoSolicitacoesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>(
    []
  );

  const [confirmData, setConfirmData] = useState<{
    [key: string]: { date: string; startTime: string; endTime: string };
  }>({});

  const [rejectReasons, setRejectReasons] = useState<{ [key: string]: string }>(
    {}
  );

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
      router.push("/login");
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from("clinic_members")
      .select("doctor_id, member_role")
      .eq("user_id", user.id)
      .eq("member_role", "doctor")
      .single();

    const typedMember = member as MemberRow | null;

    if (memberError || !typedMember || !typedMember.doctor_id) {
      setMessage("Você não possui acesso à área médica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data: availabilityData } = await supabase
      .from("doctor_availability")
      .select("day_of_week, start_time, end_time, is_active")
      .eq("doctor_id", typedMember.doctor_id)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    setAvailabilityRules((availabilityData || []) as AvailabilityRule[]);

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
        patients (
          id
        ),
        clinics (
          trade_name,
          city,
          state
        ),
        specialties (
          name
        )
      `)
      .eq("doctor_id", typedMember.doctor_id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Erro ao carregar as solicitações do médico.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const rawAppointments = (data || []) as RawAppointmentItem[];

    const patientIds = rawAppointments
      .map((item) => pickOne(item.patients)?.id)
      .filter(Boolean) as string[];

    let profilesMap: Record<string, ProfileInfo> = {};

    if (patientIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", patientIds);

      profilesMap = Object.fromEntries(
        (profilesData || []).map((profile: any) => [
          profile.id,
          {
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
          },
        ])
      );
    }

    const mergedAppointments: AppointmentItem[] = rawAppointments.map((item) => {
      const patient = pickOne(item.patients);
      const clinic = pickOne(item.clinics);
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
        patient_confirmation_requested_at: item.patient_confirmation_requested_at,
        patient_confirmation_deadline_at: item.patient_confirmation_deadline_at,
        patient_confirmed_at: item.patient_confirmed_at,
        patients: patient
          ? {
              id: patient.id,
              profiles: profilesMap[patient.id] || null,
            }
          : null,
        clinics: clinic
          ? {
              trade_name: clinic.trade_name,
              city: clinic.city,
              state: clinic.state,
            }
          : null,
        specialties: specialty ? { name: specialty.name } : null,
      };
    });

    setAppointments(mergedAppointments);
    setLoading(false);
  }

  function handleConfirmFieldChange(
    appointmentId: string,
    field: "date" | "startTime" | "endTime",
    value: string
  ) {
    setConfirmData((prev) => ({
      ...prev,
      [appointmentId]: {
        date: prev[appointmentId]?.date || "",
        startTime: prev[appointmentId]?.startTime || "",
        endTime: prev[appointmentId]?.endTime || "",
        [field]: value,
      },
    }));
  }

  async function handleConfirm(appointmentId: string) {
    setMessage("");
    setActingId(appointmentId);

    const current = confirmData[appointmentId];

    if (!current?.date || !current?.startTime || !current?.endTime) {
      setMessage("Preencha data, hora inicial e hora final para confirmar.");
      setMessageType("error");
      setActingId(null);
      return;
    }

    if (
      !isWithinAvailability(
        current.date,
        current.startTime,
        current.endTime,
        availabilityRules
      )
    ) {
      setMessage(
        "Esse horário está fora da sua disponibilidade cadastrada. Ajuste a agenda ou escolha outro horário."
      );
      setMessageType("error");
      setActingId(null);
      return;
    }

    const confirmedStartAt = `${current.date}T${current.startTime}:00`;
    const confirmedEndAt = `${current.date}T${current.endTime}:00`;

    const startDate = new Date(confirmedStartAt);
    const now = new Date();
    const isShortNotice =
      startDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000;

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "confirmed",
        confirmed_start_at: confirmedStartAt,
        confirmed_end_at: confirmedEndAt,
        rejection_reason: null,
        short_notice: isShortNotice,
        patient_confirmation_status: isShortNotice ? "not_required" : "waiting",
        patient_confirmation_requested_at: isShortNotice
          ? null
          : new Date().toISOString(),
        patient_confirmation_deadline_at: isShortNotice
          ? null
          : new Date(
              startDate.getTime() - 24 * 60 * 60 * 1000
            ).toISOString(),
        patient_confirmed_at: null,
      })
      .eq("id", appointmentId);

    if (error) {
      setMessage("Erro ao confirmar a consulta.");
      setMessageType("error");
      setActingId(null);
      return;
    }

    setMessage("Consulta confirmada com sucesso.");
    setMessageType("success");
    setActingId(null);
    await loadDoctorAppointments();
  }

  async function handleReject(appointmentId: string) {
    setMessage("");
    setActingId(appointmentId);

    const reason = rejectReasons[appointmentId];

    if (!reason?.trim()) {
      setMessage("Informe o motivo da recusa.");
      setMessageType("error");
      setActingId(null);
      return;
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "rejected",
        rejection_reason: reason.trim(),
        confirmed_start_at: null,
        confirmed_end_at: null,
        short_notice: false,
        patient_confirmation_status: "not_required",
        patient_confirmation_requested_at: null,
        patient_confirmation_deadline_at: null,
        patient_confirmed_at: null,
      })
      .eq("id", appointmentId);

    if (error) {
      setMessage("Erro ao recusar a consulta.");
      setMessageType("error");
      setActingId(null);
      return;
    }

    setMessage("Consulta recusada com sucesso.");
    setMessageType("success");
    setActingId(null);
    await loadDoctorAppointments();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando solicitações do médico...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/medico/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para o dashboard médico
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Solicitações do médico
          </p>
          <h1 className="mt-3 app-section-title">
            Gerencie apenas as consultas atribuídas a você
          </h1>
          <p className="app-section-subtitle">
            Confirme, recuse e acompanhe somente as solicitações do seu próprio
            atendimento.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-6 app-card p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Disponibilidade ativa
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {availabilityRules.length > 0 ? (
              availabilityRules.map((rule, index) => (
                <span
                  key={`${rule.day_of_week}-${rule.start_time}-${rule.end_time}-${index}`}
                  className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 ring-1 ring-sky-200"
                >
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][rule.day_of_week]}{" "}
                  {rule.start_time.slice(0, 5)}–{rule.end_time.slice(0, 5)}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">
                Nenhuma disponibilidade ativa cadastrada.
              </span>
            )}
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="app-card p-8">
            <p className="text-slate-700">
              Nenhuma solicitação encontrada para este médico.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((item) => (
              <div key={item.id} className="app-card p-8">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">
                      {item.patients?.profiles?.full_name ||
                        "Paciente não identificado"}
                    </h2>

                    <div className="mt-4 grid gap-2 text-slate-700">
                      <p>
                        <span className="font-semibold">Especialidade:</span>{" "}
                        {item.specialties?.name || "Não informada"}
                      </p>
                      <p>
                        <span className="font-semibold">Clínica:</span>{" "}
                        {item.clinics?.trade_name || "Não informada"}
                      </p>
                      <p>
                        <span className="font-semibold">Local:</span>{" "}
                        {item.clinics?.city || "Cidade não informada"} /{" "}
                        {item.clinics?.state || "Estado não informado"}
                      </p>
                      <p>
                        <span className="font-semibold">E-mail:</span>{" "}
                        {item.patients?.profiles?.email || "Não informado"}
                      </p>
                      <p>
                        <span className="font-semibold">Telefone:</span>{" "}
                        {item.patients?.profiles?.phone || "Não informado"}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={item.status} />
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
                    <span className="font-semibold">Data confirmada:</span>{" "}
                    {item.confirmed_start_at
                      ? `${formatDateTime(
                          item.confirmed_start_at
                        )} até ${formatDateTime(item.confirmed_end_at)}`
                      : "Ainda não definido"}
                  </p>

                  <p>
                    <span className="font-semibold">
                      Confirmação do paciente:
                    </span>{" "}
                    {getPatientConfirmationText(
                      item.patient_confirmation_status,
                      item.short_notice
                    )}
                  </p>

                  {item.patient_confirmation_deadline_at && (
                    <p>
                      <span className="font-semibold">Prazo:</span>{" "}
                      {formatDateTime(item.patient_confirmation_deadline_at)}
                    </p>
                  )}

                  {item.patient_confirmed_at && (
                    <p>
                      <span className="font-semibold">
                        Confirmado pelo paciente em:
                      </span>{" "}
                      {formatDateTime(item.patient_confirmed_at)}
                    </p>
                  )}
                </div>

                {item.status === "rejected" && item.rejection_reason && (
                  <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span className="font-semibold">Motivo da recusa:</span>{" "}
                    {item.rejection_reason}
                  </div>
                )}

                {item.short_notice && item.status === "confirmed" && (
                  <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Esta consulta foi tratada como <span className="font-semibold">encaixe</span>,
                    pois foi marcada com menos de 24 horas de antecedência.
                    Pode haver maior tempo de espera no atendimento.
                  </div>
                )}

                {item.patient_confirmation_status === "cancelled_by_patient" && (
                  <div className="mt-5 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    O paciente cancelou esta consulta.
                  </div>
                )}

                {item.status === "pending" && (
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl border border-green-200 bg-green-50 p-5">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Confirmar consulta
                      </h3>

                      <div className="mt-4 grid gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Data
                          </label>
                          <input
                            type="date"
                            value={confirmData[item.id]?.date || ""}
                            onChange={(e) =>
                              handleConfirmFieldChange(
                                item.id,
                                "date",
                                e.target.value
                              )
                            }
                            className="app-input"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Hora inicial
                          </label>
                          <input
                            type="time"
                            value={confirmData[item.id]?.startTime || ""}
                            onChange={(e) =>
                              handleConfirmFieldChange(
                                item.id,
                                "startTime",
                                e.target.value
                              )
                            }
                            className="app-input"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Hora final
                          </label>
                          <input
                            type="time"
                            value={confirmData[item.id]?.endTime || ""}
                            onChange={(e) =>
                              handleConfirmFieldChange(
                                item.id,
                                "endTime",
                                e.target.value
                              )
                            }
                            className="app-input"
                          />
                        </div>

                        <button
                          onClick={() => handleConfirm(item.id)}
                          disabled={actingId === item.id}
                          className="app-button-primary"
                        >
                          {actingId === item.id
                            ? "Salvando..."
                            : "Confirmar consulta"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Recusar consulta
                      </h3>

                      <div className="mt-4 grid gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Motivo da recusa
                          </label>
                          <textarea
                            value={rejectReasons[item.id] || ""}
                            onChange={(e) =>
                              setRejectReasons((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="Ex: agenda indisponível, horário não atendido, etc."
                            className="app-textarea"
                          />
                        </div>

                        <button
                          onClick={() => handleReject(item.id)}
                          disabled={actingId === item.id}
                          className="rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actingId === item.id
                            ? "Salvando..."
                            : "Recusar consulta"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}