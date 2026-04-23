"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import StatusBadge from "../../components/status-badge";
import { supabase } from "../../lib/supabase";

type Status = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";

type MemberRow = {
  doctor_id: string | null;
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
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  rejection_reason: string | null;
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
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  rejection_reason: string | null;
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

export default function MedicoSolicitacoesPage() {
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
      .single<MemberRow>();

    if (memberError || !member || !member.doctor_id) {
      setMessage("Você não possui acesso à área médica.");
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
        confirmed_start_at,
        confirmed_end_at,
        rejection_reason,
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
      .eq("doctor_id", member.doctor_id)
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
        confirmed_start_at: item.confirmed_start_at,
        confirmed_end_at: item.confirmed_end_at,
        rejection_reason: item.rejection_reason,
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

  function formatDateTime(value: string | null) {
    if (!value) return "Ainda não definido";

    return new Date(value).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
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

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "confirmed",
        confirmed_start_at: confirmedStartAt,
        confirmed_end_at: confirmedEndAt,
        rejection_reason: null,
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
                    <span className="font-semibold">Data confirmada:</span>{" "}
                    {formatDateTime(item.confirmed_start_at)}
                  </p>
                </div>

                {item.status === "rejected" && item.rejection_reason && (
                  <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span className="font-semibold">Motivo da recusa:</span>{" "}
                    {item.rejection_reason}
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