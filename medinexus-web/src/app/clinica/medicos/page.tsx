"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type DoctorRow = {
  id: string;
  name: string;
  crm: string | null;
  crm_state: string | null;
  bio_short: string | null;
  is_active: boolean;
};

type DoctorSpecialtyRow = {
  doctor_id: string;
  specialty_id: string;
};

type Specialty = {
  id: string;
  name: string;
};

type DoctorItem = {
  id: string;
  name: string;
  crm: string | null;
  crmState: string | null;
  bioShort: string | null;
  isActive: boolean;
  specialtyIds: string[];
};

export default function ClinicaMedicosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [clinicId, setClinicId] = useState("");
  const [memberRole, setMemberRole] = useState<"owner" | "admin" | "doctor" | "">(
    ""
  );

  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  const specialtyNameMap = useMemo(() => {
    return Object.fromEntries(specialties.map((item) => [item.id, item.name]));
  }, [specialties]);

  useEffect(() => {
    loadDoctorsPage();
  }, []);

  async function loadDoctorsPage() {
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
      setMessageType("error");
      setLoading(false);
      return;
    }

    setClinicId(member.clinic_id);
    setMemberRole(member.member_role);

    const { data: specialtiesData, error: specialtiesError } = await supabase
      .from("specialties")
      .select("id, name")
      .order("name", { ascending: true });

    if (specialtiesError) {
      setMessage("Erro ao carregar especialidades.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setSpecialties(specialtiesData || []);

    const { data: doctorsData, error: doctorsError } = await supabase
      .from("doctors")
      .select("id, name, crm, crm_state, bio_short, is_active")
      .eq("clinic_id", member.clinic_id)
      .order("name", { ascending: true });

    if (doctorsError) {
      setMessage("Erro ao carregar médicos da clínica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const doctorIds = (doctorsData || []).map((doctor) => doctor.id);

    let doctorSpecialtiesData: DoctorSpecialtyRow[] = [];

    if (doctorIds.length > 0) {
      const { data: dsData, error: dsError } = await supabase
        .from("doctor_specialties")
        .select("doctor_id, specialty_id")
        .in("doctor_id", doctorIds);

      if (dsError) {
        setMessage("Erro ao carregar especialidades dos médicos.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      doctorSpecialtiesData = dsData || [];
    }

    const specialtyMap: Record<string, string[]> = {};
    doctorIds.forEach((id) => {
      specialtyMap[id] = [];
    });

    doctorSpecialtiesData.forEach((row) => {
      if (!specialtyMap[row.doctor_id]) {
        specialtyMap[row.doctor_id] = [];
      }
      specialtyMap[row.doctor_id].push(row.specialty_id);
    });

    const combinedDoctors: DoctorItem[] = ((doctorsData || []) as DoctorRow[]).map(
      (doctor) => ({
        id: doctor.id,
        name: doctor.name,
        crm: doctor.crm,
        crmState: doctor.crm_state,
        bioShort: doctor.bio_short,
        isActive: doctor.is_active,
        specialtyIds: specialtyMap[doctor.id] || [],
      })
    );

    setDoctors(combinedDoctors);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando médicos...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/clinica/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para o dashboard da clínica
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/clinica/solicitacoes" className="app-button-secondary text-center">
              Ver solicitações
            </Link>
            <Link href="/clinica/medicos/novo" className="app-button-primary text-center">
              Cadastrar médico
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Médicos da clínica
          </p>
          <h1 className="mt-3 app-section-title">
            Gerencie a equipe médica
          </h1>
          <p className="app-section-subtitle">
            Visualize os médicos cadastrados, confira status e edite os dados de cada profissional.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Total de médicos</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {doctors.length}
            </h3>
          </div>

          <div className="metric-card metric-card--success">
            <p className="text-sm text-green-700">Ativos</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {doctors.filter((doctor) => doctor.isActive).length}
            </h3>
          </div>

          <div className="metric-card metric-card--danger">
            <p className="text-sm text-red-700">Inativos</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {doctors.filter((doctor) => !doctor.isActive).length}
            </h3>
          </div>
        </div>

        {doctors.length === 0 ? (
          <div className="app-card p-8">
            <p className="text-slate-700">Nenhum médico cadastrado ainda.</p>

            {(memberRole === "owner" || memberRole === "admin") && (
              <div className="mt-6">
                <Link href="/clinica/medicos/novo" className="app-button-primary inline-block">
                  Cadastrar primeiro médico
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="app-card p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-900">
                        {doctor.name}
                      </h2>

                      <span
                        className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                          doctor.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                        }`}
                      >
                        {doctor.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="app-card-soft p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          CRM
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {doctor.crm || "Não informado"}
                          {doctor.crmState ? ` / ${doctor.crmState}` : ""}
                        </p>
                      </div>

                      <div className="app-card-soft p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Especialidades
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {doctor.specialtyIds.length > 0 ? (
                            doctor.specialtyIds.map((specialtyId) => (
                              <span
                                key={specialtyId}
                                className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 ring-1 ring-sky-200"
                              >
                                {specialtyNameMap[specialtyId] || "Especialidade"}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">
                              Sem especialidades vinculadas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {doctor.bioShort && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-700">{doctor.bioShort}</p>
                      </div>
                    )}
                  </div>

                  <div className="lg:w-[220px]">
                    {(memberRole === "owner" || memberRole === "admin") ? (
                      <Link
                        href={`/clinica/medicos/${doctor.id}`}
                        className="app-button-secondary block text-center"
                      >
                        Editar médico
                      </Link>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Visualização somente leitura
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {clinicId && (
          <div className="mt-8 text-sm text-slate-500">
            Clínica vinculada: {clinicId}
          </div>
        )}
      </section>
    </main>
  );
}