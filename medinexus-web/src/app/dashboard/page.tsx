"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type DashboardData = {
  fullName: string;
  email: string;
  healthPlanName: string;
  pendingCount: number;
  confirmedCount: number;
  rejectedCount: number;
  cancelledCount: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [data, setData] = useState<DashboardData>({
    fullName: "",
    email: "",
    healthPlanName: "Não informado",
    pendingCount: 0,
    confirmedCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
  });

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setMessage("Não foi possível carregar o perfil do usuário.");
        setLoading(false);
        return;
      }

      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("default_health_plan_id")
        .eq("id", user.id)
        .single();

      if (patientError || !patient) {
        setMessage("Não foi possível carregar os dados do paciente.");
        setLoading(false);
        return;
      }

      let healthPlanName = "Não informado";

      if (patient.default_health_plan_id) {
        const { data: healthPlan } = await supabase
          .from("health_plans")
          .select("name")
          .eq("id", patient.default_health_plan_id)
          .single();

        if (healthPlan?.name) {
          healthPlanName = healthPlan.name;
        }
      }

      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("status")
        .eq("patient_id", user.id);

      if (appointmentsError) {
        setMessage("Não foi possível carregar as solicitações do paciente.");
        setLoading(false);
        return;
      }

      setData({
        fullName: profile.full_name || "Paciente",
        email: profile.email || "",
        healthPlanName,
        pendingCount:
          appointments?.filter((item) => item.status === "pending").length || 0,
        confirmedCount:
          appointments?.filter((item) => item.status === "confirmed").length || 0,
        rejectedCount:
          appointments?.filter((item) => item.status === "rejected").length || 0,
        cancelledCount:
          appointments?.filter((item) => item.status === "cancelled").length || 0,
      });

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Carregando dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Dashboard do paciente
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Olá, {data.fullName} 👋
          </h1>
          <p className="mt-2 text-slate-600">{data.email}</p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant="info">{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Plano atual</p>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">
              {data.healthPlanName}
            </h3>
          </div>

          <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
            <p className="text-sm text-yellow-700">Pendentes</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {data.pendingCount}
            </h3>
          </div>

          <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
            <p className="text-sm text-green-700">Confirmadas</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {data.confirmedCount}
            </h3>
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">Recusadas</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {data.rejectedCount}
            </h3>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Ações rápidas
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Link
  href="/perfil"
  className="rounded-2xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-900 transition hover:bg-slate-100"
>
  Meu perfil
</Link>
              <Link
                href="/busca"
                className="rounded-2xl bg-sky-600 px-5 py-4 font-semibold text-white transition hover:bg-sky-700"
              >
                Nova busca de consulta
              </Link>

              <Link
                href="/solicitacoes"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Ver minhas solicitações
              </Link>

              <Link
                href="/resultados"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Ver resultados
              </Link>

              <Link
                href="/clinica/solicitacoes"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Painel da clínica
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Canceladas</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {data.cancelledCount}
            </h3>

            <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-medium text-sky-700">
                Resumo do momento
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Você pode iniciar novas buscas, acompanhar retornos das clínicas
                e validar o fluxo completo da MediNexus.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}