"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type AppointmentItem = {
  id: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  created_at: string;
  confirmed_start_at: string | null;
  rejection_reason: string | null;
  doctors?: any;
  clinics?: any;
  specialties?: any;
};

export default function SolicitacoesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

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
        rejection_reason,
        doctors (
          name
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
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Erro ao carregar as solicitações.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setAppointments((data as AppointmentItem[]) || []);
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

  function getDoctorName(item: AppointmentItem) {
    return Array.isArray(item.doctors)
      ? item.doctors[0]?.name
      : item.doctors?.name;
  }

  function getClinic(item: AppointmentItem) {
    return Array.isArray(item.clinics) ? item.clinics[0] : item.clinics;
  }

  function getSpecialtyName(item: AppointmentItem) {
    return Array.isArray(item.specialties)
      ? item.specialties[0]?.name
      : item.specialties?.name;
  }

  function formatDateTime(value: string | null) {
    if (!value) return "Ainda não definido";

    const date = new Date(value);

    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  async function handleCancelAppointment(appointmentId: string) {
    setMessage("");
    setCancelingId(appointmentId);

    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (error) {
      setMessage("Erro ao cancelar a solicitação.");
      setMessageType("error");
      setCancelingId(null);
      return;
    }

    setMessage("Solicitação cancelada com sucesso.");
    setMessageType("success");
    setCancelingId(null);
    await loadAppointments();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando solicitações...</p>
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

          <Link
            href="/busca"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Nova busca
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Minhas solicitações
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Acompanhe seus pedidos de consulta
          </h1>
          <p className="mt-2 text-slate-600">
            Veja o status de cada solicitação e acompanhe a resposta das clínicas.
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
              Você ainda não possui solicitações cadastradas.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((item) => {
              const clinic = getClinic(item);

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
                >
                  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">
                        {getDoctorName(item) || "Médico não informado"}
                      </h2>
                      <p className="mt-2 text-slate-700">
                        <span className="font-semibold">Especialidade:</span>{" "}
                        {getSpecialtyName(item) || "Não informada"}
                      </p>
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
                      <span className="font-semibold">Clínica:</span>{" "}
                      {clinic?.trade_name || "Não informada"}
                    </p>

                    <p>
                      <span className="font-semibold">Local:</span>{" "}
                      {clinic?.city || "Cidade não informada"} /{" "}
                      {clinic?.state || "Estado não informado"}
                    </p>

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
                    <div className="mt-6">
                      <button
                        onClick={() => handleCancelAppointment(item.id)}
                        disabled={cancelingId === item.id}
                        className="rounded-2xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancelingId === item.id
                          ? "Cancelando..."
                          : "Cancelar solicitação"}
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