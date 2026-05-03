"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

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

type FilterType = "all" | "unread" | "read" | "consultas" | "documentos";

function formatDate(dateString?: string | null) {
  if (!dateString) return "Agora hÃ¡ pouco";

  return new Date(dateString).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatRelativeDate(dateString?: string | null) {
  if (!dateString) return "Agora hÃ¡ pouco";

  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "Agora hÃ¡ pouco";
  if (minutes < 60) return `${minutes} min atrÃ¡s`;
  if (hours < 24) return `${hours} h atrÃ¡s`;
  if (days < 30) return `${days} dia${days > 1 ? "s" : ""} atrÃ¡s`;

  return date.toLocaleDateString("pt-BR");
}

function getNotificationTitle(item: NotificationRow) {
  return item.title || "Nova notificaÃ§Ã£o";
}

function getNotificationMessage(item: NotificationRow) {
  return item.body || item.message || "VocÃª recebeu uma nova atualizaÃ§Ã£o.";
}

function getRawType(item: NotificationRow) {
  return (item.notification_type || item.type || "").toLowerCase();
}

function getTypeLabel(item: NotificationRow) {
  const raw = getRawType(item);

  if (raw.includes("document")) return "Documento";
  if (raw.includes("consulta")) return "Consulta";
  if (raw.includes("appointment")) return "Consulta";
  if (raw.includes("confirm")) return "ConfirmaÃ§Ã£o";
  if (raw.includes("cancel")) return "Cancelamento";
  return "Aviso";
}

function isConsulta(item: NotificationRow) {
  const raw = getRawType(item);

  return (
    raw.includes("consulta") ||
    raw.includes("appointment") ||
    raw.includes("confirm") ||
    !!item.appointment_id ||
    item.resource_type === "appointment"
  );
}

function isDocumento(item: NotificationRow) {
  const raw = getRawType(item);

  return (
    raw.includes("document") ||
    !!item.medical_document_id ||
    !!item.document_id ||
    item.resource_type === "document"
  );
}

function getNotificationHref(item: NotificationRow) {
  if (item.link_href) return item.link_href;
  if (item.medical_document_id) {
    return `/documentos-medicos/${item.medical_document_id}`;
  }
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

export default function NotificacoesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

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
      setNotifications([]);
      setMessage("VocÃª precisa estar logado para visualizar suas notificaÃ§Ãµes.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setNotifications([]);
      setMessage(`Erro ao carregar notificaÃ§Ãµes: ${error.message}`);
      setLoading(false);
      return;
    }

    setNotifications((data as NotificationRow[]) || []);
    setLoading(false);
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications
      .filter((item) => !item.is_read)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (!error) {
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true }))
      );
    }
  }

  async function handleOpen(item: NotificationRow) {
    if (!item.is_read) {
      await markAsRead(item.id);
    }

    router.push(getNotificationHref(item));
  }

  const summary = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((item) => !item.is_read).length,
      read: notifications.filter((item) => item.is_read).length,
      consultas: notifications.filter((item) => isConsulta(item)).length,
      documentos: notifications.filter((item) => isDocumento(item)).length,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notifications.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        getNotificationTitle(item).toLowerCase().includes(normalizedQuery) ||
        getNotificationMessage(item).toLowerCase().includes(normalizedQuery) ||
        getTypeLabel(item).toLowerCase().includes(normalizedQuery);

      if (!matchesQuery) return false;

      if (filter === "unread") return !item.is_read;
      if (filter === "read") return !!item.is_read;
      if (filter === "consultas") return isConsulta(item);
      if (filter === "documentos") return isDocumento(item);

      return true;
    });
  }, [notifications, query, filter]);

  return (
    <main className="min-h-screen bg-[#FAF6F3]">
      <section className="border-b border-[#E7DDD7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-[#D8CCC5] bg-[#FAF6F3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#164957]">
              Central
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              NotificaÃ§Ãµes
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Consulte avisos de consultas, confirmaÃ§Ãµes, documentos liberados e
              atualizaÃ§Ãµes importantes da sua conta.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
            >
              Dashboard
            </Link>

            <button
              type="button"
              onClick={markAllAsRead}
              className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
            >
              Marcar todas como lidas
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Total", value: summary.total, tone: "text-slate-950" },
            { label: "NÃ£o lidas", value: summary.unread, tone: "text-[#164957]" },
            { label: "Lidas", value: summary.read, tone: "text-[#5A4C86]" },
            { label: "Consultas", value: summary.consultas, tone: "text-[#7A9D8C]" },
            { label: "Documentos", value: summary.documentos, tone: "text-[#B26B00]" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-[#E7DDD7] bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>
              <p className={`mt-3 text-3xl font-bold ${item.tone}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-[#E7DDD7] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="w-full xl:max-w-xl">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar notificaÃ§Ã£o
              </label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busque por consulta, documento, confirmaÃ§Ã£o ou aviso"
                className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "Todas" },
                { key: "unread", label: "NÃ£o lidas" },
                { key: "read", label: "Lidas" },
                { key: "consultas", label: "Consultas" },
                { key: "documentos", label: "Documentos" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key as FilterType)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    filter === item.key
                      ? "bg-[#164957] text-white"
                      : "border border-[#D8CCC5] bg-white text-[#5A4C86] hover:bg-[#FAF6F3]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 text-sm text-slate-500 shadow-sm">
              Carregando notificaÃ§Ãµes...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Nenhuma notificaÃ§Ã£o encontrada
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                NÃ£o hÃ¡ itens com os filtros aplicados no momento.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const unread = !item.is_read;

              return (
                <div
                  key={item.id}
                  className={`rounded-[28px] border bg-white p-5 shadow-sm transition ${
                    unread ? "border-[#D7DEF7]" : "border-[#E7EAF4]"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#EEF3EF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#164957]">
                          {getTypeLabel(item)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                            unread
                              ? "bg-[#E9F7EF] text-[#7A9D8C]"
                              : "bg-[#F3F5FA] text-slate-500"
                          }`}
                        >
                          {unread ? "NÃ£o lida" : "Lida"}
                        </span>

                        <span className="text-xs text-slate-400">
                          {formatRelativeDate(item.created_at)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-950">
                        {getNotificationTitle(item)}
                      </h3>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {getNotificationMessage(item)}
                      </p>

                      <p className="mt-3 text-xs text-slate-400">
                        Recebida em {formatDate(item.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {!item.is_read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(item.id)}
                          className="rounded-2xl border border-[#D8CCC5] bg-white px-4 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
                        >
                          Marcar como lida
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpen(item)}
                        className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
                      >
                        Abrir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}


