"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type DoctorData = {
  id: string;
  name: string;
  professional_email: string | null;
  crm: string | null;
  crm_state: string | null;
  bio_short: string | null;
  is_active: boolean;
};

type ClinicData = {
  id: string;
  trade_name: string;
  city: string | null;
  state: string | null;
};

export default function MedicoDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);

  const [pendingCount, setPendingCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  useEffect(() => {
    async function loadDoctorDashboard() {
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
        .select("clinic_id, doctor_id, member_role")
        .eq("user_id", user.id)
        .eq("member_role", "doctor")
        .single();

      if (memberError || !member || !member.doctor_id) {
        setMessage("Você não possui acesso à área médica.");
        setLoading(false);
        return;
      }

      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .select("id, trade_name, city, state")
        .eq("id", member.clinic_id)
        .single();

      if (clinicError || !clinicData) {
        setMessage("Não foi possível carregar os dados da clínica.");
        setLoading(false);
        return;
      }

      setClinic(clinicData);

      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select(
          "id, name, professional_email, crm, crm_state, bio_short, is_active"
        )
        .eq("id", member.doctor_id)
        .single();

      if (doctorError || !doctorData) {
        setMessage("Não foi possível carregar os dados do médico.");
        setLoading(false);
        return;
      }

      setDoctor(doctorData);

      const { data: dsData, error: dsError } = await supabase
        .from("doctor_specialties")
        .select(
          `
          specialty_id,
          specialties (
            name
          )
        `
        )
        .eq("doctor_id", member.doctor_id);

      if (!dsError) {
        const specialtyNames =
          (dsData || [])
            .map((row: any) =>
              Array.isArray(row.specialties)
                ? row.specialties[0]?.name
                : row.specialties?.name
            )
            .filter(Boolean) || [];

        setSpecialties(specialtyNames);
      }

      const { data: appointments } = await supabase
        .from("appointments")
        .select("status")
        .eq("doctor_id", member.doctor_id);

      setPendingCount(
        appointments?.filter((item) => item.status === "pending").length || 0
      );
      setConfirmedCount(
        appointments?.filter((item) => item.status === "confirmed").length || 0
      );
      setRejectedCount(
        appointments?.filter((item) => item.status === "rejected").length || 0
      );

      setLoading(false);
    }

    loadDoctorDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando dashboard médico...</p>
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
            Área privada do médico
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            {doctor?.name || "Médico"}
          </h1>
          <p className="mt-2 text-slate-600">
            {clinic?.trade_name || "Clínica"} •{" "}
            {clinic?.city || "Cidade não informada"} /{" "}
            {clinic?.state || "Estado não informado"}
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant="info">{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="metric-card metric-card--warning">
            <p className="text-sm text-yellow-700">Solicitações pendentes</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {pendingCount}
            </h3>
          </div>

          <div className="metric-card metric-card--success">
            <p className="text-sm text-green-700">Consultas confirmadas</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {confirmedCount}
            </h3>
          </div>

          <div className="metric-card metric-card--danger">
            <p className="text-sm text-red-700">Recusas</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {rejectedCount}
            </h3>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="app-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Dados profissionais
            </h2>

            <div className="mt-5 grid gap-3 text-slate-700">
              <p>
                <span className="font-semibold">E-mail profissional:</span>{" "}
                {doctor?.professional_email || "Não informado"}
              </p>
              <p>
                <span className="font-semibold">CRM:</span>{" "}
                {doctor?.crm || "Não informado"}
                {doctor?.crm_state ? ` / ${doctor.crm_state}` : ""}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {doctor?.is_active ? "Ativo" : "Inativo"}
              </p>
              <p>
                <span className="font-semibold">Especialidades:</span>{" "}
                {specialties.length > 0
                  ? specialties.join(", ")
                  : "Nenhuma vinculada"}
              </p>
            </div>

            {doctor?.bio_short && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-700">{doctor.bio_short}</p>
              </div>
            )}
          </div>

          <div className="app-card p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Ações rápidas do médico
            </h2>

            <div className="mt-5 grid gap-3">
              <Link
                href="/medico/solicitacoes"
                className="app-button-primary text-center"
              >
                Ver minhas solicitações
              </Link>

              <Link
                href="/login"
                className="app-button-secondary text-center"
              >
                Trocar usuário
              </Link>
            </div>

            <div
              className="mt-6 rounded-2xl border p-4"
              style={{
                borderColor: "rgba(27,75,88,0.12)",
                backgroundColor: "rgba(27,75,88,0.05)",
              }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: "var(--brand-petrol)" }}
              >
                Visão médica
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Aqui você acompanha apenas os atendimentos atribuídos ao seu
                cadastro profissional.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}