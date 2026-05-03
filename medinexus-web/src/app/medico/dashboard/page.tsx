"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type DoctorRow = {
  id: string;
  user_id: string | null;
  clinic_id: string | null;
  name: string | null;
  crm: string | null;
  crm_state: string | null;
  bio: string | null;
  is_active: boolean | null;
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
  patient_confirmed_at: string | null;
  patient_cancelled_at: string | null;
  patient_cancellation_reason: string | null;
  reschedule_requested_at: string | null;
  reschedule_reason: string | null;
  confirmation_requested_at: string | null;
  confirmation_deadline_at: string | null;

  created_at: string | null;

  patient_name: string | null;
  patient_cpf: string | null;
  patient_phone: string | null;
  patient_email: string | null;
  patient_health_plan_operator: string | null;
  patient_health_plan_product_name: string | null;

  doctor_name: string | null;
  doctor_crm: string | null;
  doctor_crm_state: string | null;

  clinic_name: string | null;
  clinic_city: string | null;
  clinic_state: string | null;
  clinic_neighborhood: string | null;
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
  medical_document_id?: string | null;
  document_id?: string | null;
  link_href?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
};

function getFirstName(value?: string | null) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "Doutor(a)";
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
  return item.patient_name || "Paciente não informado";
}

function getClinicName(item: AppointmentRow) {
  return item.clinic_name || "Clínica não informada";
}

function getClinicLocation(item: AppointmentRow) {
  const parts = [
    item.clinic_neighborhood,
    item.clinic_city,
    item.clinic_state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Localização não informada";
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

function getNotificationHref(item: NotificationRow) {
  if (item.link_href) return item.link_href;

  if (item.medical_document_id) {
    return `/documentos-medicos/${item.medical_document_id}`;
  }

  if (item.document_id) {
    return `/documentos-medicos/${item.document_id}`;
  }

  if (item.resource_type === "document" && item.resource_id) {
    return `/documentos-medicos/${item.resource_id}`;
  }

  if (item.appointment_id) {
    return `/medico/consultas/${item.appointment_id}`;
  }

  if (item.resource_type === "appointment" && item.resource_id) {
    return `/medico/consultas/${item.resource_id}`;
  }

  return "/notificacoes";
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

export default function MedicoDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [doctor, setDoctor] = useState<DoctorRow | null>(null);
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
      setMessage("Você precisa estar logado como médico.");
      setLoading(false);
      return;
    }

    const { data: doctorData, error: doctorError } = await supabase
      .from("doctors")
      .select("id, user_id, clinic_id, name, crm, crm_state, bio, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (doctorError) {
      setMessage(`Erro ao carregar médico: ${doctorError.message}`);
      setLoading(false);
      return;
    }

    if (!doctorData?.id) {
      setMessage("Nenhum cadastro médico encontrado para este usuário.");
      setLoading(false);
      return;
    }

    const { data: appointmentsData, error: appointmentsError } =
      await supabase.rpc("get_my_doctor_appointments");

    if (appointmentsError) {
      setMessage(`Erro ao carregar consultas: ${appointmentsError.message}`);
      setLoading(false);
      return;
    }

    const { data: notificationsData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6);

    setDoctor(doctorData as DoctorRow);
    setAppointments((appointmentsData || []) as AppointmentRow[]);
    setNotifications((notificationsData || []) as NotificationRow[]);
    setLoading(false);
  }

  const summary = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((item) => item.status === "pending").length,
      confirmed: appointments.filter((item) => item.status === "confirmed")
        .length,
      awaitingPatient: appointments.filter(
        (item) => item.patient_confirmation_status === "awaiting_confirmation"
      ).length,
      patientConfirmed: appointments.filter(
        (item) => item.patient_confirmation_status === "confirmed"
      ).length,
      completed: appointments.filter((item) => item.status === "completed")
        .length,
      unread: notifications.filter((item) => !item.is_read).length,
    };
  }, [appointments, notifications]);

  const nextAppointments = useMemo(() => {
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

  const recentAppointments = useMemo(() => {
    return [...appointments].slice(0, 5);
  }, [appointments]);

  const firstName = getFirstName(doctor?.name);

  return (
    <main className="min-h-screen bg-[#F6F8FC]">
      <section className="border-b border-[#E8EAF4] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.55fr_1fr] lg:px-8">
          <div className="rounded-[32px] border border-[#E3E8F4] bg-gradient-to-r from-[#F4F8FF] to-[#F8F5FF] p-8">
            <span className="inline-flex rounded-full border border-[#D8DDF0] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4660A9]">
              Área médica
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Olá, {firstName}
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Gerencie solicitações, acompanhe confirmações de pacientes e abra
              prontuários de consultas confirmadas.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/medico/solicitacoes"
                className="rounded-2xl bg-[#283C7A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#22356E]"
              >
                Ver solicitações
              </Link>

              <Link
                href="/medico/disponibilidade"
                className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-3 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
              >
                Configurar disponibilidade
              </Link>

              <Link
                href="/medico/perfil"
                className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-3 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
              >
                Perfil médico
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
                <p className="mt-1 text-sm text-white/80">
                  solicitações no total
                </p>
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
                  <p className="text-2xl font-bold">{summary.awaitingPatient}</p>
                  <p className="mt-1 text-sm text-white/80">
                    aguardando paciente
                  </p>
                </div>

                <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur">
                  <p className="text-2xl font-bold">{summary.patientConfirmed}</p>
                  <p className="mt-1 text-sm text-white/80">
                    presença confirmada
                  </p>
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
            Carregando painel médico...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Próximas consultas
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Consultas futuras atribuídas ao seu cadastro.
                    </p>
                  </div>

                  <Link
                    href="/medico/solicitacoes"
                    className="text-sm font-semibold text-[#4660A9] hover:underline"
                  >
                    Ver tudo
                  </Link>
                </div>

                {nextAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#D8DEEF] bg-[#FAFBFF] p-5 text-sm text-slate-500">
                    Nenhuma consulta futura encontrada.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nextAppointments.map((item) => (
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
                              {getClinicName(item)}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {getClinicLocation(item)}
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

                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.status === "confirmed" && (
                            <Link
                              href={`/medico/consultas/${item.id}`}
                              className="rounded-2xl bg-[#283C7A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#22356E]"
                            >
                              Abrir prontuário
                            </Link>
                          )}

                          <Link
                            href="/medico/solicitacoes"
                            className="rounded-2xl border border-[#D9DDF0] bg-white px-4 py-3 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F8FAFF]"
                          >
                            Ver detalhes
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-slate-950">
                    Ações rápidas
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Atalhos principais da sua rotina médica.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/medico/solicitacoes"
                    className="rounded-2xl bg-[#283C7A] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#22356E]"
                  >
                    Ver solicitações
                  </Link>

                  <Link
                    href="/medico/disponibilidade"
                    className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-4 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
                  >
                    Configurar disponibilidade
                  </Link>

                  <Link
                    href="/medico/perfil"
                    className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-4 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
                  >
                    Editar perfil médico
                  </Link>

                  <Link
                    href="/notificacoes"
                    className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-4 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
                  >
                    Abrir notificações
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
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
              </div>

              <div className="rounded-[28px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">
                  Dados profissionais
                </h2>

                <div className="mt-4 rounded-2xl bg-[#F7F9FD] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Nome profissional
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-950">
                    {doctor?.name || "Médico não informado"}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#E9EDF7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      CRM
                    </p>
                    <p className="mt-2 text-xl font-bold text-[#283C7A]">
                      {doctor?.crm || "N/I"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E9EDF7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      UF
                    </p>
                    <p className="mt-2 text-xl font-bold text-[#5E4B9A]">
                      {doctor?.crm_state || "N/I"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E9EDF7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Concluídas
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#0F8A5F]">
                      {summary.completed}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E9EDF7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Não lidas
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#B26B00]">
                      {summary.unread}
                    </p>
                  </div>
                </div>

                {doctor?.bio && (
                  <div className="mt-4 rounded-2xl bg-[#FAFBFF] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Bio
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {doctor.bio}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <Link
                    href="/medico/perfil"
                    className="inline-flex rounded-2xl border border-[#D9DDF0] bg-white px-4 py-3 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F7F9FF]"
                  >
                    Atualizar perfil
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