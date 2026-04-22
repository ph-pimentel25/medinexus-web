"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

      const pendingCount =
        appointments?.filter((item) => item.status === "pending").length || 0;

      const confirmedCount =
        appointments?.filter((item) => item.status === "confirmed").length || 0;

      const rejectedCount =
        appointments?.filter((item) => item.status === "rejected").length || 0;

      const cancelledCount =
        appointments?.filter((item) => item.status === "cancelled").length || 0;

      setData({
        fullName: profile.full_name || "Paciente",
        email: profile.email || "",
        healthPlanName,
        pendingCount,
        confirmedCount,
        rejectedCount,
        cancelledCount,
      });

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">MediNexus</h1>
            <p className="text-sm text-slate-500">Dashboard do paciente</p>
          </div>

          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/" className="text-slate-600 hover:text-slate-900">
              Início
            </Link>
            <button
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Olá, {data.fullName} 👋
          </h2>
          <p className="mt-2 text-slate-600">{data.email}</p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">{message}</p>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/busca"
            className="inline-block rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700"
          >
            Nova busca de consulta
          </Link>

          <Link
            href="/solicitacoes"
            className="inline-block rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Ver minhas solicitações
          </Link>

          <Link
            href="/clinica/solicitacoes"
            className="inline-block rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Painel da clínica
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm font-medium text-slate-500">Plano atual</p>
            <h3 className="text-xl font-semibold text-slate-900">
              {data.healthPlanName}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Plano principal salvo no seu perfil.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm font-medium text-slate-500">Pendentes</p>
            <h3 className="text-xl font-semibold text-slate-900">
              {data.pendingCount}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Solicitações aguardando resposta da clínica.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm font-medium text-slate-500">Confirmadas</p>
            <h3 className="text-xl font-semibold text-slate-900">
              {data.confirmedCount}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Consultas aprovadas pela clínica.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm font-medium text-slate-500">Recusadas</p>
            <h3 className="text-xl font-semibold text-slate-900">
              {data.rejectedCount}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Solicitações recusadas pela clínica.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm font-medium text-slate-500">
              Canceladas
            </p>
            <h3 className="text-xl font-semibold text-slate-900">
              {data.cancelledCount}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Solicitações canceladas pelo paciente.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50 p-6">
            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              Próximo passo
            </h3>
            <p className="mb-4 text-slate-700">
              Use a MediNexus para criar novas buscas, acompanhar solicitações e
              testar o fluxo da clínica.
            </p>

            <Link
              href="/busca"
              className="inline-block rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              Buscar nova consulta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}