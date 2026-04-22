"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type AppointmentItem = {
  id: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  created_at: string;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  rejection_reason: string | null;
  doctors?: any;
  clinics?: any;
  specialties?: any;
};

export default function SolicitacoesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
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
        confirmed_end_at,
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
      setCancelingId(null);
      return;
    }

    setMessage("Solicitação cancelada com sucesso.");
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
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para o dashboard
          </Link>

          <Link
            href="/busca"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Nova busca
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          Minhas solicitações
        </h1>
        <p className="mb-8 text-slate-600">
          Acompanhe o status das suas consultas solicitadas.
        </p>

        {message && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">{message}</p>
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">
                        {getDoctorName(item) || "Médico não informado"}
                      </h2>
                      <p className="mt-1 text-slate-700">
                        <span className="font-medium">Especialidade:</span>{" "}
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

                  <p className="text-slate-700">
                    <span className="font-medium">Clínica:</span>{" "}
                    {clinic?.trade_name || "Não informada"}
                  </p>

                  <p className="mt-1 text-slate-700">
                    <span className="font-medium">Local:</span>{" "}
                    {clinic?.city || "Cidade não informada"} /{" "}
                    {clinic?.state || "Estado não informado"}
                  </p>

                  <p className="mt-1 text-slate-700">
                    <span className="font-medium">Solicitada em:</span>{" "}
                    {formatDateTime(item.created_at)}
                  </p>

                  <p className="mt-1 text-slate-700">
                    <span className="font-medium">Data confirmada:</span>{" "}
                    {formatDateTime(item.confirmed_start_at)}
                  </p>

                  {item.status === "rejected" && item.rejection_reason && (
                    <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      <span className="font-medium">Motivo da recusa:</span>{" "}
                      {item.rejection_reason}
                    </p>
                  )}

                  {item.status === "pending" && (
                    <div className="mt-5">
                      <button
                        onClick={() => handleCancelAppointment(item.id)}
                        disabled={cancelingId === item.id}
                        className="rounded-xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
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
      </div>
    </main>
  );
}