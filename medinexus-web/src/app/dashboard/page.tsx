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
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-300">Carregando dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-sky-950/30">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300">
              Dashboard do paciente
            </p>
            <h1 className="mt-3 text-4xl font-bold text-white">
              Olá, {data.fullName} 👋
            </h1>
            <p className="mt-2 text-slate-400">{data.email}</p>
          </div>

          {message && (
            <div className="mb-6">
              <Alert variant="info">{message}</Alert>
            </div>
          )}

          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm text-slate-400">Plano atual</p>
              <h3 className="mt-3 text-2xl font-bold text-white">
                {data.healthPlanName}
              </h3>
            </div>

            <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">
              <p className="text-sm text-yellow-200">Pendentes</p>
              <h3 className="mt-3 text-3xl font-bold text-white">
                {data.pendingCount}
              </h3>
            </div>

            <div className="rounded-3xl border border-green-400/20 bg-green-400/10 p-6">
              <p className="text-sm text-green-200">Confirmadas</p>
              <h3 className="mt-3 text-3xl font-bold text-white">
                {data.confirmedCount}
              </h3>
            </div>

            <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6">
              <p className="text-sm text-red-200">Recusadas</p>
              <h3 className="mt-3 text-3xl font-bold text-white">
                {data.rejectedCount}
              </h3>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white">
                Ações rápidas
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/busca"
                  className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-4 font-semibold text-white transition hover:scale-[1.02]"
                >
                  Nova busca de consulta
                </Link>

                <Link
                  href="/solicitacoes"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
                >
                  Ver minhas solicitações
                </Link>

                <Link
                  href="/resultados"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
                >
                  Ver resultados
                </Link>

                <Link
                  href="/clinica/solicitacoes"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
                >
                  Painel da clínica
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-slate-400">Canceladas</p>
              <h3 className="mt-3 text-3xl font-bold text-white">
                {data.cancelledCount}
              </h3>

              <div className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                <p className="text-sm font-medium text-sky-200">
                  Resumo do momento
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Você pode iniciar novas buscas, acompanhar retornos das clínicas
                  e validar o fluxo completo da MediNexus.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}