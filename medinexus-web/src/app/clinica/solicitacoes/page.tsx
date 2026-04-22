"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type AppointmentItem = {
  id: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  created_at: string;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  rejection_reason: string | null;
  patients?: {
    id: string;
    profiles?: {
      full_name: string | null;
      email: string | null;
      phone: string | null;
    };
  } | null;
  doctors?: {
    name: string;
  } | null;
  specialties?: {
    name: string;
  } | null;
};

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

  const [rejectReasons, setRejectReasons] = useState<{ [key: string]: string }>({});

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
        doctors (
          name
        ),
        specialties (
          name
        )
      `)
      .eq("clinic_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Erro ao carregar as solicitações da clínica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const appointmentsData: AppointmentItem[] = (data ?? []) as unknown as AppointmentItem[];

    const patientIds = appointmentsData
      .map((item) => item.patients?.id)
      .filter(Boolean) as string[];

    let profilesMap: Record<
      string,
      { full_name: string | null; email: string | null; phone: string | null }
    > = {};

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

    const mergedAppointments = appointmentsData.map((item) => ({
      ...item,
      patients: item.patients
        ? {
            ...item.patients,
            profiles: profilesMap[item.patients.id] || null,
          }
        : null,
    }));

    setAppointments(mergedAppointments);
    setLoading(false);
  }

  function getStatusLabel(status: AppointmentItem["status"]) {
    switch (status) {
      case "pending":
        return "Pendente";
      case "confirmed":
        return "Confirmada";
      case "rejected":
        return "Recusada";
      case "cancelled":
        return "Cancelada";
      case "completed":
        return "Concluída";
      default:
        return status;
    }
  }

  function getStatusClasses(status: AppointmentItem["status"]) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-slate-200 text-slate-700";
      case "completed":
        return "bg-sky-100 text-sky-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
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
            href="/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para o dashboard
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Painel da clínica
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Gerencie as solicitações recebidas
          </h1>
          <p className="mt-2 text-slate-600">
            Confirme ou recuse consultas e acompanhe os pedidos dos pacientes.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-700">
              Nenhuma solicitação encontrada para esta clínica.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">
                      {item.patients?.profiles?.full_name || "Paciente não identificado"}
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

                  <span
                    className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${getStatusClasses(
                      item.status
                    )}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
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
                              handleConfirmFieldChange(item.id, "date", e.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
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
                              handleConfirmFieldChange(item.id, "startTime", e.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
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
                              handleConfirmFieldChange(item.id, "endTime", e.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          />
                        </div>

                        <button
                          onClick={() => handleConfirm(item.id)}
                          disabled={actingId === item.id}
                          className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actingId === item.id ? "Salvando..." : "Confirmar consulta"}
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
                            className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
                          />
                        </div>

                        <button
                          onClick={() => handleReject(item.id)}
                          disabled={actingId === item.id}
                          className="rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actingId === item.id ? "Salvando..." : "Recusar consulta"}
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