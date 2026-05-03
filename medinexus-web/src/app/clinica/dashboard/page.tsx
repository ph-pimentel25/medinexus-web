"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type ClinicRow = {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
  city: string | null;
  state: string | null;
  address_city: string | null;
  address_state: string | null;
  address_neighborhood: string | null;
};

type DoctorRow = {
  id: string;
  name: string | null;
  crm: string | null;
  crm_state: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type AppointmentRow = {
  id: string;
  status: string | null;
  patient_id: string | null;
  doctor_id: string | null;
  clinic_id: string | null;
  requested_start_at: string | null;
  requested_end_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  patient_confirmation_status: string | null;
  created_at: string | null;

  patients:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;

  doctors:
    | {
        name: string | null;
        crm: string | null;
        crm_state: string | null;
      }
    | {
        name: string | null;
        crm: string | null;
        crm_state: string | null;
      }[]
    | null;
};

type NotificationRow = {
  id: string;
  title?: string | null;
  body?: string | null;
  message?: string | null;
  notification_type?: string | null;
  type?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
  appointment_id?: string | null;
  link_href?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getClinicName(clinic: ClinicRow | null) {
  return clinic?.trade_name || clinic?.legal_name || "Clínica";
}

function getClinicLocation(clinic: ClinicRow | null) {
  const parts = [
    clinic?.address_neighborhood,
    clinic?.address_city || clinic?.city,
    clinic?.address_state || clinic?.state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Localização não informada";
}

function getFirstName(value?: string | null) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "Clínica";
  return cleaned.split(" ")[0];
}

function formatDate(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getAppointmentDate(item: AppointmentRow) {
  return item.confirmed_start_at || item.requested_start_at || item.created_at;
}

function getPatientName(item: AppointmentRow) {
  const patient = pickOne(item.patients);
  return patient?.full_name || "Paciente não informado";
}

function getDoctorName(item: AppointmentRow) {
  const doctor = pickOne(item.doctors);
  return doctor?.name || "Médico não informado";
}

function getDoctorCrm(item: AppointmentRow) {
  const doctor = pickOne(item.doctors);
  if (!doctor?.crm) return "CRM não informado";
  return `CRM ${doctor.crm}${doctor.crm_state ? ` / ${doctor.crm_state}` : ""}`;
}

function getStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmada",
    cancelled_by_patient: "Cancelada pelo paciente",
    cancelled_by_clinic: "Cancelada pela clínica",
    completed: "Concluída",
    no_show: "Não compareceu",
  };

  return labels[status || ""] || status || "Status não informado";
}

function getConfirmationLabel(status?: string | null) {
  const labels: Record<string, string> = {
    not_requested: "Sem confirmação necessária",
    awaiting_confirmation: "Aguardando paciente",
    confirmed: "Paciente confirmou",
    cancelled_by_patient: "Paciente cancelou",
    cancelled_by_clinic: "Cancelada pela clínica",
    reschedule_requested: "Pedido de remarcação",
    no_response: "Sem resposta",
    no_show: "Não compareceu",
  };

  return labels[status || ""] || "Sem confirmação necessária";
}

function getRawNotificationType(item: NotificationRow) {
  return String(item.notification_type || item.type || "").toLowerCase();
}

function getNotificationTitle(item: NotificationRow) {
  return item.title || "Nova notificação";
}

function getNotificationMessage(item: NotificationRow) {
  return item.body || item.message || "Você recebeu uma nova atualização.";
}

function getNotificationTypeLabel(item: NotificationRow) {
  const raw = getRawNotificationType(item);

  if (raw.includes("document")) return "Documento";
  if (raw.includes("appointment")) return "Consulta";
  if (raw.includes("consulta")) return "Consulta";
  if (raw.includes("confirm")) return "Confirmação";
  if (raw.includes("cancel")) return "Cancelamento";

  return "Aviso";
}

function getNotificationHref(item: NotificationRow) {
  if (item.link_href) return item.link_href;

  if (item.appointment_id) {
    return "/clinica/solicitacoes";
  }

  if (item.resource_type === "appointment" && item.resource_id) {
    return "/clinica/solicitacoes";
  }

  return "/notificacoes";
}

export default function ClinicaDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [clinic, setClinic] = useState<ClinicRow | null>(null);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

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
      setMessage("Você precisa estar logado como clínica.");
      setLoading(false);
      return;
    }

    const { data: memberData, error: memberError } = await supabase
      .from("clinic_members")
      .select("clinic_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (memberError) {
      setMessage(`Erro ao carregar vínculo da clínica: ${memberError.message}`);
      setLoading(false);
      return;
    }

    if (!memberData?.clinic_id) {
      setMessage("Nenhuma clínica vinculada a este usuário.");
      setLoading(false);
      return;
    }

    const { data: clinicData, error: clinicError } = await supabase
      .from("clinics")
      .select(
        "id, trade_name, legal_name, city, state, address_city, address_state, address_neighborhood"
      )
      .eq("id", memberData.clinic_id)
      .maybeSingle();

    if (clinicError) {
      setMessage(`Erro ao carregar clínica: ${clinicError.message}`);
      setLoading(false);
      return;
    }

    const { data: doctorsData } = await supabase
      .from("doctors")
      .select("id, name, crm, crm_state, is_active, created_at")
      .eq("clinic_id", memberData.clinic_id)
      .order("created_at", { ascending: false });

    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select(
        `
        id,
        status,
        patient_id,
        doctor_id,
        clinic_id,
        requested_start_at,
        requested_end_at,
        confirmed_start_at,
        confirmed_end_at,
        patient_confirmation_status,
        created_at,
        patients (
          full_name
        ),
        doctors (
          name,
          crm,
          crm_state
        )
      `
      )
      .eq("clinic_id", memberData.clinic_id)
      .order("created_at", { ascending: false })
      .limit(12);

    const { data: notificationsData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6);

    setClinic((clinicData as ClinicRow) || null);
    setDoctors((doctorsData || []) as DoctorRow[]);
    setAppointments((appointmentsData || []) as AppointmentRow[]);
    setNotifications((notificationsData || []) as NotificationRow[]);
    setLoading(false);
  }

  const summary = useMemo(() => {
    return {
      doctors: doctors.length,
      activeDoctors: doctors.filter((item) => item.is_active !== false).length,
      totalAppointments: appointments.length,
      pending: appointments.filter((item) => item.status === "pending").length,
      confirmed: appointments.filter((item) => item.status === "confirmed")
        .length,
      awaitingPatient: appointments.filter(
        (item) => item.patient_confirmation_status === "awaiting_confirmation"
      ).length,
      unread: notifications.filter((item) => !item.is_read).length,
    };
  }, [doctors, appointments, notifications]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return [...appointments]
      .filter((item) => {
        const date = getAppointmentDate(item);
        if (!date) return false;
        return new Date(date) >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(getAppointmentDate(a) || 0).getTime();
        const dateB = new Date(getAppointmentDate(b) || 0).getTime();
        return dateA - dateB;
      })
      .slice(0, 4);
  }, [appointments]);

  return (
    <main className="min-h-screen bg-[#F6F8FC]">
      <section className="border-b border-[#E8EAF4] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.55fr_1fr] lg:px-8">
          <div className="rounded-[32px] border border-[#E3E8F4] bg-gradient-to-r from-[#F4F8FF] to-[#F8F5FF] p-8">
            <span className="inline-flex rounded-full border border-[#D8DDF0] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4660A9]">
              Área da clínica
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Olá, {getFirstName(getClinicName(clinic))}
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Gerencie médicos vinculados, acompanhe solicitações de consulta e
              mantenha os dados da clínica organizados.
            </p>

            <p className="mt-3 text-sm font-semibold text-slate-500">
              {getClinicName(clinic)} • {getClinicLocation(clinic)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/clinica/solicitacoes"
                className="rounded-2xl bg-[#283C7A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#22356E]"
              >
                Ver solicitações
              </Link>

              <Link
                href="/clinica/medicos"
                className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-3 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
              >
                Médicos da clínica
              </Link>

              <Link
                href="/clinica/configuracoes"
                className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-3 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
              >
                Configurações
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] bg-gradient-to-br from-[#3A4DA0] to-[#7058D8] p-6 text-white shadow-[0_30px_80px_-35px_rgba(58,77,160,0.7)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
              Resumo rápido
            </p>

            <div className="mt-4 grid gap-3">
              <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur">
                <p className="text-3xl font-bold">{summary.totalAppointments}</p>
                <p className="mt-1 text-sm text-white/80">
                  solicitações recentes
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur">
                  <p className="text-2xl font-bold">{summary.doctors}</p>
                  <p className="mt-1 text-sm text-white/80">médicos</p>
                </div>

                <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur">
                  <p className="text-2xl font-bold">{summary.activeDoctors}</p>
                  <p className="mt-1 text-sm text-white/80">ativos</p>
                </div>

                <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur">
                  <p className="text-2xl font-bold">{summary.pending}</p>
                  <p className="mt-1 text-sm text-white/80">pendentes</p>
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
        {message && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 text-sm text-slate-500 shadow-sm">
            Carregando painel da clínica...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Próximas consultas
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Solicitações futuras vinculadas à clínica.
                    </p>
                  </div>

                  <Link
                    href="/clinica/solicitacoes"
                    className="text-sm font-semibold text-[#4660A9] hover:underline"
                  >
                    Ver tudo
                  </Link>
                </div>

                {upcomingAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#D8DEEF] bg-[#FAFBFF] p-5 text-sm text-slate-500">
                    Nenhuma consulta futura encontrada.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-[#E9EDF7] bg-[#FCFDFF] p-5"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="mb-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#283C7A]">
                                {getStatusLabel(item.status)}
                              </span>

                              <span className="rounded-full bg-[#F4F1FF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6E56CF]">
                                {getConfirmationLabel(
                                  item.patient_confirmation_status
                                )}
                              </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-950">
                              {getPatientName(item)}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              {getDoctorName(item)}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {getDoctorCrm(item)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#F5F7FD] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Data
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-950">
                              {formatDate(getAppointmentDate(item))}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-slate-950">
                    Ações rápidas
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Atalhos principais da administração da clínica.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/clinica/solicitacoes"
                    className="rounded-2xl bg-[#283C7A] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#22356E]"
                  >
                    Ver solicitações
                  </Link>

                  <Link
                    href="/clinica/medicos"
                    className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-4 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
                  >
                    Gerenciar médicos
                  </Link>

                  <Link
                    href="/clinica/configuracoes"
                    className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-4 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
                  >
                    Configurações
                  </Link>

                  <Link
                    href="/notificacoes"
                    className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-4 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
                  >
                    Notificações
                  </Link>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Médicos vinculados
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Profissionais cadastrados nessa clínica.
                    </p>
                  </div>

                  <Link
                    href="/clinica/medicos"
                    className="text-sm font-semibold text-[#4660A9] hover:underline"
                  >
                    Ver tudo
                  </Link>
                </div>

                {doctors.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#D8DEEF] bg-[#FAFBFF] p-5 text-sm text-slate-500">
                    Nenhum médico vinculado ainda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doctors.slice(0, 5).map((doctor) => (
                      <div
                        key={doctor.id}
                        className="rounded-2xl border border-[#E9EDF7] bg-[#FCFDFF] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-950">
                              {doctor.name || "Médico sem nome"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              CRM {doctor.crm || "N/I"}
                              {doctor.crm_state ? ` / ${doctor.crm_state}` : ""}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                              doctor.is_active === false
                                ? "bg-slate-100 text-slate-500"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {doctor.is_active === false ? "Inativo" : "Ativo"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
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
                    className="text-sm font-semibold text-[#4660A9] hover:underline"
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
                        className="block rounded-2xl border border-[#E9EDF7] bg-[#FCFDFF] p-4 transition hover:bg-white"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-bold text-[#283C7A]">
                            {getNotificationTypeLabel(item)}
                          </span>

                          {!item.is_read && (
                            <span className="rounded-full bg-[#E9F7EF] px-2.5 py-1 text-[11px] font-bold text-[#0F8A5F]">
                              Nova
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-slate-950">
                          {getNotificationTitle(item)}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {getNotificationMessage(item)}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatDate(item.created_at)}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}