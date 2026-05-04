"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type ProfileRow = {
  id: string;
  full_name?: string | null;
};

type AppointmentRow = {
  id: string;
  status: string | null;
  doctor_id: string | null;
  clinic_id: string | null;
  requested_start_at: string | null;
  confirmed_start_at: string | null;
  patient_confirmation_status: string | null;
  created_at: string | null;
};

type DoctorRow = {
  id: string;
  name: string | null;
};

type ClinicRow = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
};

type NotificationRow = {
  id: string;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
  appointment_id?: string | null;
  document_id?: string | null;
  link_href?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
};

type DashboardAppointment = AppointmentRow & {
  doctor_name?: string;
  clinic_name?: string;
  clinic_location?: string;
};

function getFirstName(fullName?: string | null) {
  const cleaned = (fullName || "").trim();
  if (!cleaned) return "Paciente";
  return cleaned.split(" ")[0];
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "Não informado";

  const date = new Date(dateString);
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatShortDate(dateString?: string | null) {
  if (!dateString) return "Sem data";
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getBestAppointmentDate(appointment: AppointmentRow) {
  return appointment.confirmed_start_at || appointment.requested_start_at || appointment.created_at;
}

function getAppointmentHref() {
  return "/solicitacoes";
}

function getNotificationHref(item: NotificationRow) {
  if (item.link_href) return item.link_href;
  if (item.document_id) return `/documentos-medicos/${item.document_id}`;
  if (item.resource_type === "document" && item.resource_id) {
    return `/documentos-medicos/${item.resource_id}`;
  }
  if (item.appointment_id) return "/solicitacoes";
  if (item.resource_type === "appointment" && item.resource_id) {
    return "/solicitacoes";
  }
  return "/notificacoes";
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage("Você precisa estar logado para visualizar o dashboard.");
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setErrorMessage(`Erro ao carregar perfil: ${profileError.message}`);
      setLoading(false);
      return;
    }

    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select(
        "id, status, doctor_id, clinic_id, requested_start_at, confirmed_start_at, patient_confirmation_status, created_at"
      )
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (appointmentsError) {
      setErrorMessage(`Erro ao carregar consultas: ${appointmentsError.message}`);
      setLoading(false);
      return;
    }

    const safeAppointments = (appointmentsData as AppointmentRow[]) || [];

    const doctorIds = Array.from(
      new Set(safeAppointments.map((item) => item.doctor_id).filter(Boolean))
    ) as string[];

    const clinicIds = Array.from(
      new Set(safeAppointments.map((item) => item.clinic_id).filter(Boolean))
    ) as string[];

    let doctorsMap = new Map<string, DoctorRow>();
    let clinicsMap = new Map<string, ClinicRow>();

    if (doctorIds.length > 0) {
      const { data: doctorsData } = await supabase
        .from("doctors")
        .select("id, name")
        .in("id", doctorIds);

      doctorsMap = new Map(
        ((doctorsData as DoctorRow[]) || []).map((item) => [item.id, item])
      );
    }

    if (clinicIds.length > 0) {
      const { data: clinicsData } = await supabase
        .from("clinics")
        .select("id, name, city, state")
        .in("id", clinicIds);

      clinicsMap = new Map(
        ((clinicsData as ClinicRow[]) || []).map((item) => [item.id, item])
      );
    }

    const enrichedAppointments: DashboardAppointment[] = safeAppointments.map(
      (item) => {
        const doctor = item.doctor_id ? doctorsMap.get(item.doctor_id) : undefined;
        const clinic = item.clinic_id ? clinicsMap.get(item.clinic_id) : undefined;

        return {
          ...item,
          doctor_name: doctor?.name || "Médico não informado",
          clinic_name: clinic?.name || "Clínica não informada",
          clinic_location:
            clinic?.city && clinic?.state
              ? `${clinic.city} / ${clinic.state}`
              : "Local não informado",
        };
      }
    );

    const { data: notificationsData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6);

    setProfile(profileData as ProfileRow);
    setAppointments(enrichedAppointments);
    setNotifications((notificationsData as NotificationRow[]) || []);
    setLoading(false);
  }

  const firstName = getFirstName(profile?.full_name);

  const summary = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((item) => item.status === "pending").length;
    const confirmed = appointments.filter((item) => item.status === "confirmed").length;
    const completed = appointments.filter((item) => item.status === "completed").length;
    const unread = notifications.filter((item) => !item.is_read).length;

    return {
      total,
      pending,
      confirmed,
      completed,
      unread,
    };
  }, [appointments, notifications]);

  const nextAppointments = useMemo(() => {
    const now = new Date();

    return [...appointments]
      .filter((item) => {
        const bestDate = getBestAppointmentDate(item);
        return bestDate ? new Date(bestDate) >= now : false;
      })
      .sort((a, b) => {
        const dateA = new Date(getBestAppointmentDate(a) || 0).getTime();
        const dateB = new Date(getBestAppointmentDate(b) || 0).getTime();
        return dateA - dateB;
      })
      .slice(0, 3);
  }, [appointments]);

  return (
    <main className="min-h-screen bg-[#FAF6F3]">
      <section className="border-b border-[#E7DDD7] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.6fr_1fr] lg:px-8">
          <div className="rounded-[32px] border border-[#E7DDD7] bg-gradient-to-r from-[#FAF6F3] to-[#F8F5FF] p-8">
            <span className="inline-flex rounded-full border border-[#D8CCC5] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#164957]">
              Área do paciente
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Olá, {firstName}
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Acompanhe suas consultas, veja documentos liberados, confira suas
              notificações e continue sua jornada de atendimento com mais
              praticidade.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/busca"
                className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
              >
                Nova busca
              </Link>

              <Link
                href="/solicitacoes"
                className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
              >
                Ver solicitações
              </Link>

              <Link
                href="/documentos"
                className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
              >
                Meus documentos
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] bg-gradient-to-br from-[#3A4DA0] to-[#7058D8] p-6 text-white shadow-[0_30px_80px_-35px_rgba(58,77,160,0.7)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
              Resumo rápido
            </p>

            <div className="mt-4 grid gap-3">
              <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur">
                <p className="text-3xl font-bold">{summary.total}</p>
                <p className="mt-1 text-sm text-white/80">consultas no total</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur">
                  <p className="text-2xl font-bold">{summary.pending}</p>
                  <p className="mt-1 text-sm text-white/80">pendentes</p>
                </div>

                <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur">
                  <p className="text-2xl font-bold">{summary.confirmed}</p>
                  <p className="mt-1 text-sm text-white/80">confirmadas</p>
                </div>

                <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur">
                  <p className="text-2xl font-bold">{summary.completed}</p>
                  <p className="mt-1 text-sm text-white/80">concluídas</p>
                </div>

                <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur">
                  <p className="text-2xl font-bold">{summary.unread}</p>
                  <p className="mt-1 text-sm text-white/80">não lidas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 text-sm text-slate-500 shadow-sm">
            Carregando dashboard...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
            {/* COLUNA ESQUERDA */}
            <div className="space-y-6">
              <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Próximas consultas
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Seus próximos atendimentos agendados.
                    </p>
                  </div>

                  <Link
                    href="/solicitacoes"
                    className="text-sm font-semibold text-[#164957] hover:underline"
                  >
                    Ver tudo
                  </Link>
                </div>

                {nextAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#D8DEEF] bg-[#FAFBFF] p-5 text-sm text-slate-500">
                    Você ainda não tem próximas consultas agendadas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nextAppointments.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[#E7DDD7] bg-[#FAF6F3] p-5"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="mb-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-[#EEF3EF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#164957]">
                                {item.status || "sem status"}
                              </span>

                              {item.patient_confirmation_status && (
                                <span className="rounded-full bg-[#F0EDF7] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5A4C86]">
                                  {item.patient_confirmation_status}
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-bold text-slate-950">
                              {item.clinic_name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              Médico: {item.doctor_name}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {item.clinic_location}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#F5F7FD] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Data
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-950">
                              {formatShortDate(getBestAppointmentDate(item))}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Link
                            href={getAppointmentHref()}
                            className="inline-flex rounded-2xl bg-[#164957] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
                          >
                            Abrir solicitações
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Ações rápidas
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Atalhos principais da sua conta.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/busca"
                    className="rounded-2xl bg-[#164957] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#123B46]"
                  >
                    Nova busca
                  </Link>

                  <Link
                    href="/solicitacoes"
                    className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-4 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
                  >
                    Ver solicitações
                  </Link>

                  <Link
                    href="/documentos"
                    className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-4 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
                  >
                    Abrir documentos
                  </Link>

                  <Link
                    href="/perfil"
                    className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-4 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
                  >
                    Editar perfil
                  </Link>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA */}
            <div className="space-y-6">
              <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Notificações recentes
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Últimos avisos da plataforma.
                    </p>
                  </div>

                  <Link
                    href="/notificacoes"
                    className="text-sm font-semibold text-[#164957] hover:underline"
                  >
                    Ver tudo
                  </Link>
                </div>

                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#D8DEEF] bg-[#FAFBFF] p-5 text-sm text-slate-500">
                    Nenhuma notificação por enquanto.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((item) => (
                      <Link
                        key={item.id}
                        href={getNotificationHref(item)}
                        className="block rounded-2xl border border-[#E7DDD7] bg-[#FAF6F3] p-4 transition hover:bg-white"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-[#EEF3EF] px-2.5 py-1 text-[11px] font-bold text-[#164957]">
                            {item.type || "aviso"}
                          </span>

                          {!item.is_read && (
                            <span className="rounded-full bg-[#E9F7EF] px-2.5 py-1 text-[11px] font-bold text-[#7A9D8C]">
                              Nova
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-slate-950">
                          {item.title || "Nova notificação"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.message || "Você recebeu uma atualização."}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatDate(item.created_at)}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">
                  Sua conta
                </h2>

                <div className="mt-4 rounded-2xl bg-[#F7F9FD] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Nome cadastrado
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-950">
                    {profile?.full_name || "Paciente não informado"}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#E7DDD7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Consultas pendentes
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#B26B00]">
                      {summary.pending}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E7DDD7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Não lidas
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#164957]">
                      {summary.unread}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    href="/perfil"
                    className="inline-flex rounded-2xl border border-[#D8CCC5] bg-white px-4 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
                  >
                    Atualizar meus dados
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}


