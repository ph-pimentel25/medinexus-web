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
  clinic_id: string;
  member_role: "owner" | "admin" | "doctor";
};

type ProfileInfo = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
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
  patients?: { id: string } | { id: string }[] | null;
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

export default function ClinicaSolicitacoesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

  const [confirmData, setConfirmData] = useState<{
    [key: string]: { date: string; startTime: string; endTime: string };
  }>({});

  const [rejectReasons, setRejectReasons] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    loadClinicAppointments();
  }, []);

  async function loadClinicAppointments() {
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
      .select("clinic_id, member_role")
      .eq("user_id", user.id)
      .single();

    const typedMember = member as MemberRow | null;

    if (memberError || !typedMember) {
      setMessage("Você não possui acesso à área da clínica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (typedMember.member_role === "doctor") {
      router.push("/medico/solicitacoes");
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
        patients (
          id
        ),
        doctors (
          name
        ),
        specialties (
          name
        )
      `)
      .eq("clinic_id", typedMember.clinic_id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Erro ao carregar as solicitações da clínica.");
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
        patient_confirmation_requested_at: item.patient_confirmation_requested_at,
        patient_confirmation_deadline_at: item.patient_confirmation_deadline_at,
        patient_confirmed_at: item.patient_confirmed_at,
        patients: patient
          ? {
              id: patient.id,
              profiles: profilesMap[patient.id] || null,
            }
          : null,
        doctors: doctor ? { name: doctor.name } : null,
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
    await loadClinicAppointments();
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
    await loadClinicAppointments();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando painel da clínica...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/clinica/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para o dashboard da clínica
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Painel da clínica
          </p>
          <h1 className="mt-3 app-section-title">
            Gerencie as solicitações recebidas
          </h1>
          <p className="app-section-subtitle">
            Confirme ou recuse consultas e acompanhe os pedidos dos pacientes.
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
              Nenhuma solicitação encontrada para esta clínica.
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
                        <span className="font-semibold">Médico:</span>{" "}
                        {item.doctors?.name || "Não informado"}
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
                    Esta consulta foi classificada como <span className="font-semibold">encaixe</span>,
                    pois foi marcada com menos de 24 horas de antecedência.
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
                            placeholder="Ex: agenda indisponível, profissional não atende neste dia, etc."
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