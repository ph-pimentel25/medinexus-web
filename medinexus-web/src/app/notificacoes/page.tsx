"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type NotificationRow = {
  id: string;
  user_id: string | null;
  appointment_id: string | null;
  medical_document_id: string | null;
  notification_type: string | null;
  title: string | null;
  body: string | null;
  is_read: boolean | null;
  read_at: string | null;
  channel: string | null;
  delivery_status: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
};

type FilterType = "all" | "unread" | "read" | "appointments" | "documents";

function formatDateTime(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getNotificationLabel(type?: string | null) {
  const labels: Record<string, string> = {
    appointment_confirmation_needed: "Confirmação necessária",
    appointment_confirmed: "Consulta confirmada",
    appointment_cancelled: "Consulta cancelada",
    reschedule_requested: "Remarcação solicitada",
    appointment_tomorrow: "Consulta próxima",
    document_available: "Documento disponível",
    clinic_alert: "Aviso da clínica",
    doctor_alert: "Aviso médico",
    general: "Notificação",
  };

  return labels[type || ""] || "Notificação";
}

function getNotificationTone(type?: string | null, isRead?: boolean | null) {
  if (isRead) {
    return "border-slate-200 bg-white text-slate-600";
  }

  if (type === "appointment_confirmation_needed") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (type === "appointment_confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (type === "appointment_cancelled") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (type === "reschedule_requested") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (type === "document_available") {
    return "border-violet-200 bg-violet-50 text-violet-800";
  }

  return "border-[#D9D6F4] bg-[#F8FAFC] text-slate-700";
}

function getNotificationHref(notification: NotificationRow) {
  const type = notification.notification_type || "";

  if (type === "appointment_confirmation_needed") {
    return notification.appointment_id
      ? `/consultas/${notification.appointment_id}/confirmar`
      : "/solicitacoes";
  }

  if (
    type === "appointment_confirmed" ||
    type === "appointment_cancelled" ||
    type === "appointment_tomorrow" ||
    type === "reschedule_requested"
  ) {
    return "/solicitacoes";
  }

  if (type === "document_available") {
    return notification.medical_document_id
      ? `/documentos-medicos/${notification.medical_document_id}`
      : "/documentos";
  }

  if (type === "doctor_alert" || type === "clinic_alert") {
    return "/medico/solicitacoes";
  }

  return "/dashboard";
}

function isAppointmentNotification(type?: string | null) {
  return [
    "appointment_confirmation_needed",
    "appointment_confirmed",
    "appointment_cancelled",
    "reschedule_requested",
    "appointment_tomorrow",
    "clinic_alert",
    "doctor_alert",
  ].includes(type || "");
}

function isDocumentNotification(type?: string | null) {
  return type === "document_available";
}

export default function NotificacoesPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para ver suas notificações.");
      setMessageType("error");
      setNotifications([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        id,
        user_id,
        appointment_id,
        medical_document_id,
        notification_type,
        title,
        body,
        is_read,
        read_at,
        channel,
        delivery_status,
        scheduled_for,
        sent_at,
        created_at,
        metadata
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Erro ao carregar notificações: ${error.message}`);
      setMessageType("error");
      setNotifications([]);
      setLoading(false);
      return;
    }

    setNotifications((data || []) as NotificationRow[]);
    setLoading(false);
  }

  const filteredNotifications = useMemo(() => {
    const query = normalize(search);

    return notifications.filter((notification) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !notification.is_read) ||
        (filter === "read" && notification.is_read) ||
        (filter === "appointments" &&
          isAppointmentNotification(notification.notification_type)) ||
        (filter === "documents" &&
          isDocumentNotification(notification.notification_type));

      const searchable = normalize(
        [
          notification.title,
          notification.body,
          notification.notification_type,
          getNotificationLabel(notification.notification_type),
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesSearch = !query || searchable.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [notifications, filter, search]);

  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((item) => !item.is_read).length,
      read: notifications.filter((item) => item.is_read).length,
      appointments: notifications.filter((item) =>
        isAppointmentNotification(item.notification_type)
      ).length,
      documents: notifications.filter((item) =>
        isDocumentNotification(item.notification_type)
      ).length,
    };
  }, [notifications]);

  async function markAsRead(notification: NotificationRow) {
    if (notification.is_read) return;

    setActionLoadingId(notification.id);
    setMessage("");

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", notification.id)
      .eq("user_id", notification.user_id);

    if (error) {
      setMessage(`Erro ao marcar notificação como lida: ${error.message}`);
      setMessageType("error");
      setActionLoadingId(null);
      return;
    }

    await loadNotifications();
    setActionLoadingId(null);
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado.");
      setMessageType("error");
      setMarkingAll(false);
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      setMessage(`Erro ao marcar notificações como lidas: ${error.message}`);
      setMessageType("error");
      setMarkingAll(false);
      return;
    }

    setMessage("Todas as notificações foram marcadas como lidas.");
    setMessageType("success");
    await loadNotifications();
    setMarkingAll(false);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />

        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pb-12 lg:pt-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-[#D9D6F4] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#283C7A] shadow-sm">
                Central de notificações
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950">
                Seus avisos importantes
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Acompanhe confirmações de consulta, documentos liberados,
                cancelamentos e solicitações de remarcação.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-6 py-4 text-sm font-bold text-[#5E4B9A] shadow-sm transition hover:bg-[#F6F3FF]"
                >
                  Voltar ao dashboard
                </Link>

                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={markingAll || stats.unread === 0}
                  className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#213366] disabled:opacity-50"
                >
                  {markingAll ? "Marcando..." : "Marcar todas como lidas"}
                </button>
              </div>
            </div>

            <div className="rounded-[38px] bg-gradient-to-br from-[#283C7A] via-[#4B4EA3] to-[#6E56CF] p-7 text-white shadow-[0_28px_90px_-65px_rgba(40,60,122,0.9)]">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/60">
                Resumo
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-[28px] bg-white/12 p-5 ring-1 ring-white/15">
                  <p className="text-4xl font-bold">{stats.unread}</p>
                  <p className="mt-1 text-sm text-white/70">
                    notificações não lidas
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="mt-1 text-xs text-white/70">total</p>
                  </div>

                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.read}</p>
                    <p className="mt-1 text-xs text-white/70">lidas</p>
                  </div>

                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.appointments}</p>
                    <p className="mt-1 text-xs text-white/70">consultas</p>
                  </div>

                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.documents}</p>
                    <p className="mt-1 text-xs text-white/70">documentos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="rounded-[38px] border border-[#D9D6F4] bg-white p-6 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Buscar notificação
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6E56CF] focus:bg-white"
                placeholder="Busque por consulta, documento, confirmação ou aviso"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todas" },
                { value: "unread", label: "Não lidas" },
                { value: "read", label: "Lidas" },
                { value: "appointments", label: "Consultas" },
                { value: "documents", label: "Documentos" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value as FilterType)}
                  className={`rounded-2xl px-5 py-4 text-sm font-bold transition ${
                    filter === item.value
                      ? "bg-[#283C7A] text-white"
                      : "border border-[#D9D6F4] bg-white text-[#5E4B9A] hover:bg-[#F6F3FF]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[34px] border border-[#D9D6F4] bg-white p-8 text-slate-600 shadow-sm">
            Carregando notificações...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="mt-8 rounded-[34px] border border-[#D9D6F4] bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950">
              Nenhuma notificação encontrada
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
              Quando houver avisos sobre consultas, documentos ou confirmações,
              eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5">
            {filteredNotifications.map((notification) => {
              const href = getNotificationHref(notification);

              return (
                <article
                  key={notification.id}
                  className={`rounded-[34px] border p-6 shadow-[0_24px_80px_-75px_rgba(40,60,122,0.35)] ${getNotificationTone(
                    notification.notification_type,
                    notification.is_read
                  )}`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-current/20 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em]">
                          {getNotificationLabel(
                            notification.notification_type
                          )}
                        </span>

                        <span className="rounded-full border border-current/20 bg-white/70 px-4 py-1.5 text-xs font-bold">
                          {notification.is_read ? "Lida" : "Não lida"}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                        {notification.title || "Notificação"}
                      </h2>

                      {notification.body && (
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                          {notification.body}
                        </p>
                      )}

                      <p className="mt-4 text-xs font-semibold text-slate-400">
                        Criada em {formatDateTime(notification.created_at)}
                      </p>
                    </div>

                    <div className="flex min-w-[220px] flex-col gap-3">
                      <Link
                        href={href}
                        onClick={() => {
                          void markAsRead(notification);
                        }}
                        className="rounded-2xl bg-[#283C7A] px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-[#213366]"
                      >
                        Abrir
                      </Link>

                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification)}
                          disabled={actionLoadingId === notification.id}
                          className="rounded-2xl border border-[#D9D6F4] bg-white px-6 py-4 text-sm font-bold text-[#5E4B9A] transition hover:bg-[#F6F3FF] disabled:opacity-50"
                        >
                          {actionLoadingId === notification.id
                            ? "Marcando..."
                            : "Marcar como lida"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}