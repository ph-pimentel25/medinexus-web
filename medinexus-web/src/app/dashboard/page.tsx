"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type PatientRow = {
  default_health_plan_id: string | null;
  birth_date: string | null;
};

type HealthPlanRow = {
  name: string | null;
};

type AppointmentRow = {
  id: string;
  status: string;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [healthPlanName, setHealthPlanName] = useState("Não informado");
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para acessar o dashboard.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const [profileResponse, patientResponse, appointmentsResponse] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>(),
        supabase
          .from("patients")
          .select("default_health_plan_id, birth_date")
          .eq("id", user.id)
          .maybeSingle<PatientRow>(),
        supabase
          .from("appointments")
          .select("id, status")
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

    if (profileResponse.error) {
      setMessage(`Erro ao carregar perfil: ${profileResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (patientResponse.error) {
      setMessage(`Erro ao carregar dados do paciente: ${patientResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (appointmentsResponse.error) {
      setMessage(
        `Erro ao carregar solicitações: ${appointmentsResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    setProfile(profileResponse.data || null);
    setPatient(patientResponse.data || null);
    setAppointments((appointmentsResponse.data || []) as AppointmentRow[]);

    if (patientResponse.data?.default_health_plan_id) {
      const { data: planData } = await supabase
        .from("health_plans")
        .select("name")
        .eq("id", patientResponse.data.default_health_plan_id)
        .maybeSingle<HealthPlanRow>();

      setHealthPlanName(planData?.name || "Não informado");
    }

    setLoading(false);
  }

  const pendingCount = appointments.filter((item) => item.status === "pending").length;
  const confirmedCount = appointments.filter(
    (item) => item.status === "confirmed"
  ).length;
  const completedCount = appointments.filter(
    (item) => item.status === "completed"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-10">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Área do paciente
          </p>
          <h1 className="mt-3 app-section-title">
            Olá, {profile?.full_name || "paciente"}
          </h1>
          <p className="app-section-subtitle">
            Acompanhe suas solicitações, consulte clínicas e veja seu histórico clínico.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Plano atual</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {healthPlanName}
            </h3>
          </div>

          <div className="metric-card metric-card--warning">
            <p className="text-sm text-yellow-700">Pendentes</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {pendingCount}
            </h3>
          </div>

          <div className="metric-card metric-card--success">
            <p className="text-sm text-green-700">Confirmadas</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {confirmedCount}
            </h3>
          </div>

          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Histórico</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {completedCount}
            </h3>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="app-card p-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Ações rápidas
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link href="/busca" className="app-button-primary text-center">
                Nova busca
              </Link>

              <Link
                href="/solicitacoes"
                className="app-button-secondary text-center"
              >
                Ver solicitações
              </Link>

              <Link
                href="/clinicas"
                className="app-button-secondary text-center"
              >
                Ver clínicas
              </Link>

              <Link
                href="/historico-clinico"
                className="app-button-secondary text-center"
              >
                Histórico clínico
              </Link>

              <Link
                href="/perfil"
                className="app-button-secondary text-center sm:col-span-2"
              >
                Editar perfil
              </Link>
            </div>
          </div>

          <div className="app-card p-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Seus dados
            </h2>

            <div className="mt-6 grid gap-3 text-slate-700">
              <p>
                <span className="font-semibold">Nome:</span>{" "}
                {profile?.full_name || "Não informado"}
              </p>
              <p>
                <span className="font-semibold">E-mail:</span>{" "}
                {profile?.email || "Não informado"}
              </p>
              <p>
                <span className="font-semibold">Telefone:</span>{" "}
                {profile?.phone || "Não informado"}
              </p>
              <p>
                <span className="font-semibold">Data de nascimento:</span>{" "}
                {patient?.birth_date
                  ? new Date(`${patient.birth_date}T12:00:00`).toLocaleDateString(
                      "pt-BR"
                    )
                  : "Não informada"}
              </p>
              <p>
                <span className="font-semibold">Plano:</span>{" "}
                {healthPlanName}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 app-card p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Histórico clínico
              </h2>
              <p className="mt-2 text-slate-600">
                Consulte registros de atendimentos concluídos, resumos clínicos e documentos médicos.
              </p>
            </div>

            <Link href="/historico-clinico" className="app-button-primary text-center">
              Abrir histórico
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}