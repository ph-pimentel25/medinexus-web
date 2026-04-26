"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type DocumentRow = {
  id: string;
};

function formatBirthDate(value: string | null) {
  if (!value) return "Não informado";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function getFirstName(value: string | null | undefined) {
  if (!value) return "Paciente";
  return value.trim().split(" ")[0] || "Paciente";
}

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
  const [documents, setDocuments] = useState<DocumentRow[]>([]);

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

    const [
      profileResponse,
      patientResponse,
      appointmentsResponse,
      documentsResponse,
    ] = await Promise.all([
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
        .eq("patient_id", user.id),
      supabase
        .from("prescriptions")
        .select("id")
        .eq("patient_id", user.id),
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
    setDocuments((documentsResponse.data || []) as DocumentRow[]);

    if (patientResponse.data?.default_health_plan_id) {
      const { data: planData } = await supabase
        .from("health_plans")
        .select("name")
        .eq("id", patientResponse.data.default_health_plan_id)
        .maybeSingle<HealthPlanRow>();

      setHealthPlanName(planData?.name || "Não informado");
    } else {
      setHealthPlanName("Não informado");
    }

    setLoading(false);
  }

  const firstName = useMemo(
    () => getFirstName(profile?.full_name),
    [profile?.full_name]
  );

  const pendingCount = appointments.filter((item) => item.status === "pending").length;
  const confirmedCount = appointments.filter(
    (item) => item.status === "confirmed"
  ).length;
  const completedCount = appointments.filter(
    (item) => item.status === "completed"
  ).length;

  const quickActions = [
    {
      href: "/busca",
      title: "Nova busca",
      description: "Encontre horários e clínicas compatíveis com sua necessidade.",
      tone: "primary",
      icon: "＋",
    },
    {
      href: "/solicitacoes",
      title: "Solicitações",
      description: "Acompanhe pedidos, confirmações e respostas das clínicas.",
      tone: "neutral",
      icon: "⌁",
    },
    {
      href: "/clinicas",
      title: "Clínicas",
      description: "Veja clínicas conveniadas, especialidades e informações.",
      tone: "neutral",
      icon: "⌂",
    },
    {
      href: "/historico-clinico",
      title: "Histórico clínico",
      description: "Consulte resumos de consultas e evolução dos atendimentos.",
      tone: "plum",
      icon: "☤",
    },
    {
      href: "/documentos-medicos",
      title: "Documentos médicos",
      description: "Acesse receitas, exames e documentos emitidos.",
      tone: "sage",
      icon: "□",
    },
    {
      href: "/perfil",
      title: "Editar perfil",
      description: "Atualize seus dados pessoais e informações de contato.",
      tone: "neutral",
      icon: "◌",
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F8FA]">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">Carregando dashboard...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#EAF1F0_0,#F6F8FA_32%,#F8FAFC_100%)]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.55fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[38px] bg-[#1B4B58] p-8 text-white shadow-[0_30px_90px_-45px_rgba(27,75,88,0.75)] sm:p-10">
            <div className="absolute right-[-80px] top-[-80px] h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-[-110px] left-[20%] h-72 w-72 rounded-full bg-[#594E86]/25 blur-3xl" />

            <div className="relative">
              <div className="mb-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/90">
                Painel do paciente
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                Olá, {firstName}. Sua saúde organizada em uma única plataforma.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/82">
                Acompanhe solicitações, encontre clínicas, acesse seu histórico
                clínico e mantenha documentos médicos disponíveis em poucos cliques.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/busca"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#1B4B58] shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Buscar consulta
                </Link>

                <Link
                  href="/documentos-medicos"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Ver documentos
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-4">
                <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">
                    Plano
                  </p>
                  <p className="mt-3 text-xl font-black">{healthPlanName}</p>
                </div>

                <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">
                    Pendentes
                  </p>
                  <p className="mt-3 text-3xl font-black">{pendingCount}</p>
                </div>

                <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">
                    Confirmadas
                  </p>
                  <p className="mt-3 text-3xl font-black">{confirmedCount}</p>
                </div>

                <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">
                    Documentos
                  </p>
                  <p className="mt-3 text-3xl font-black">{documents.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[38px] border border-slate-200 bg-white/95 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1B4B58]">
                  Seus dados
                </p>
                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  Perfil do paciente
                </h2>
              </div>

              <Link
                href="/perfil"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-[#1B4B58]/25 hover:text-[#1B4B58]"
              >
                Editar
              </Link>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Nome
                </p>
                <p className="mt-2 text-base font-bold text-slate-950">
                  {profile?.full_name || "Não informado"}
                </p>
              </div>

              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  E-mail
                </p>
                <p className="mt-2 text-base font-semibold text-slate-800">
                  {profile?.email || "Não informado"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Telefone
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-800">
                    {profile?.phone || "Não informado"}
                  </p>
                </div>

                <div className="rounded-[24px] bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Nascimento
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-800">
                    {formatBirthDate(patient?.birth_date || null)}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] bg-[#EAF1F0] p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1B4B58]/70">
                  Plano de saúde
                </p>
                <p className="mt-2 text-lg font-black text-[#1B4B58]">
                  {healthPlanName}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[38px] border border-slate-200 bg-white/95 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1B4B58]">
                Ações rápidas
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
                Acesse o que mais importa
              </h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Fluxos principais organizados para consulta, acompanhamento,
                histórico e documentos médicos.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => {
              const isPrimary = action.tone === "primary";
              const isPlum = action.tone === "plum";
              const isSage = action.tone === "sage";

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={[
                    "group rounded-[30px] border p-6 transition-all duration-200 hover:-translate-y-1",
                    isPrimary
                      ? "border-[#1B4B58]/15 bg-[#1B4B58] text-white shadow-[0_18px_50px_-30px_rgba(27,75,88,0.75)]"
                      : isPlum
                      ? "border-[#D8D0EC] bg-[#F6F3FC] text-slate-950 hover:shadow-[0_18px_50px_-36px_rgba(89,78,134,0.5)]"
                      : isSage
                      ? "border-[#D9E8E1] bg-[#F2F8F5] text-slate-950 hover:shadow-[0_18px_50px_-36px_rgba(122,157,141,0.5)]"
                      : "border-slate-200 bg-white text-slate-950 hover:border-[#C8D7D4] hover:shadow-[0_18px_50px_-38px_rgba(15,23,42,0.4)]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={[
                        "flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black",
                        isPrimary
                          ? "bg-white/12 text-white"
                          : isPlum
                          ? "bg-white text-[#594E86]"
                          : isSage
                          ? "bg-white text-[#7A9D8D]"
                          : "bg-slate-100 text-[#1B4B58]",
                      ].join(" ")}
                    >
                      {action.icon}
                    </div>

                    <div
                      className={[
                        "rounded-full p-2 transition",
                        isPrimary
                          ? "bg-white/10 text-white/80 group-hover:bg-white/15"
                          : "bg-slate-100 text-slate-500 group-hover:bg-[#EAF1F0] group-hover:text-[#1B4B58]",
                      ].join(" ")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12h14M13 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>

                  <h3
                    className={[
                      "mt-6 text-xl font-black",
                      isPrimary ? "text-white" : "text-slate-950",
                    ].join(" ")}
                  >
                    {action.title}
                  </h3>

                  <p
                    className={[
                      "mt-2 text-sm leading-6",
                      isPrimary ? "text-white/78" : "text-slate-600",
                    ].join(" ")}
                  >
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[38px] border border-slate-200 bg-white shadow-[0_24px_80px_-52px_rgba(15,23,42,0.38)]">
            <div className="h-2 bg-[#1B4B58]" />
            <div className="p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1B4B58]">
                Histórico clínico
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
                Seus atendimentos organizados
              </h2>
              <p className="mt-3 text-slate-600">
                Consulte registros de atendimentos concluídos, resumos clínicos
                e informações importantes para futuras consultas.
              </p>

              <div className="mt-7 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Atendimentos concluídos</p>
                  <p className="mt-1 text-3xl font-black text-slate-950">
                    {completedCount}
                  </p>
                </div>

                <Link
                  href="/historico-clinico"
                  className="rounded-2xl bg-[#1B4B58] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#163F4A]"
                >
                  Abrir histórico
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[38px] border border-[#D8D0EC] bg-[#F8F5FF] shadow-[0_24px_80px_-52px_rgba(89,78,134,0.35)]">
            <div className="h-2 bg-[#594E86]" />
            <div className="p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#594E86]">
                Documentos médicos
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
                Receitas, exames e documentos
              </h2>
              <p className="mt-3 text-slate-600">
                Baixe ou imprima documentos emitidos pelo médico durante seus
                atendimentos na MediNexus.
              </p>

              <div className="mt-7 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Documentos disponíveis</p>
                  <p className="mt-1 text-3xl font-black text-slate-950">
                    {documents.length}
                  </p>
                </div>

                <Link
                  href="/documentos-medicos"
                  className="rounded-2xl bg-[#594E86] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4D4278]"
                >
                  Abrir documentos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}