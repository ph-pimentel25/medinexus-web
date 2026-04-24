"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type ClinicMember = {
  clinic_id: string;
  member_role: "owner" | "admin" | "doctor";
};

type ClinicData = {
  id: string;
  trade_name: string;
  city: string | null;
  state: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

export default function ClinicaDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [memberRole, setMemberRole] = useState<string>("");

  const [doctorCount, setDoctorCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [acceptedPlansCount, setAcceptedPlansCount] = useState(0);

  useEffect(() => {
    async function loadClinicDashboard() {
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

      if (memberError || !member) {
        setMessage("Você não possui acesso à área da clínica.");
        setLoading(false);
        return;
      }

      setMemberRole(member.member_role);

      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .select("id, trade_name, city, state, contact_email, contact_phone")
        .eq("id", member.clinic_id)
        .single();

      if (clinicError || !clinicData) {
        setMessage("Não foi possível carregar os dados da clínica.");
        setLoading(false);
        return;
      }

      setClinic(clinicData);

      const { count: doctorsCountValue } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", member.clinic_id);

      const { data: appointments } = await supabase
        .from("appointments")
        .select("status")
        .eq("clinic_id", member.clinic_id);

      const { count: plansCountValue } = await supabase
        .from("clinic_health_plans")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", member.clinic_id);

      setDoctorCount(doctorsCountValue || 0);
      setAcceptedPlansCount(plansCountValue || 0);
      setPendingCount(
        appointments?.filter((item) => item.status === "pending").length || 0
      );

      setLoading(false);
    }

    loadClinicDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando dashboard da clínica...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-8 sm:py-10">
        <div
          className="mb-8 rounded-[32px] border border-slate-200 p-8 shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, rgba(27,75,88,0.08) 0%, rgba(122,157,141,0.10) 100%)",
          }}
        >
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Área privada da clínica
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            {clinic?.trade_name || "Clínica"}
          </h1>
          <p className="mt-2 text-slate-600">
            {clinic?.city || "Cidade não informada"} /{" "}
            {clinic?.state || "Estado não informado"} • Perfil: {memberRole}
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant="info">{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Médicos cadastrados</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {doctorCount}
            </h3>
          </div>

          <div className="metric-card metric-card--warning">
            <p className="text-sm text-yellow-700">Solicitações pendentes</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {pendingCount}
            </h3>
          </div>

          <div className="metric-card metric-card--success">
            <p className="text-sm text-green-700">Planos aceitos</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {acceptedPlansCount}
            </h3>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="app-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Ações rápidas da clínica
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
  <Link
    href="/clinica/planos"
    className="app-button-primary text-center"
  >
    Gerenciar planos aceitos
  </Link>

  <Link
    href="/clinica/solicitacoes"
    className="app-button-secondary text-center"
  >
    Ver solicitações
  </Link>

  <Link
    href="/clinica/medicos"
    className="app-button-secondary text-center"
  >
    Ver médicos
  </Link>

  <Link
    href="/clinica/medicos/novo"
    className="app-button-secondary text-center"
  >
    Cadastrar médico
  </Link>

  <Link
    href="/clinica/publico"
    className="app-button-secondary text-center sm:col-span-2"
  >
    Editar página pública da clínica
  </Link>
</div>

          </div>

          <div className="app-card p-6">
            <p className="text-sm text-slate-500">Contato principal</p>
            <div className="mt-4 grid gap-2 text-slate-700">
              <p>
                <span className="font-semibold">E-mail:</span>{" "}
                {clinic?.contact_email || "Não informado"}
              </p>
              <p>
                <span className="font-semibold">Telefone:</span>{" "}
                {clinic?.contact_phone || "Não informado"}
              </p>
            </div>

            <div
              className="mt-6 rounded-2xl border p-4"
              style={{
                borderColor: "rgba(27,75,88,0.12)",
                backgroundColor: "rgba(27,75,88,0.05)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--brand-petrol)" }}>
                Próxima etapa
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Agora vamos ligar os planos aceitos da clínica e, em seguida,
                cadastrar os médicos.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}