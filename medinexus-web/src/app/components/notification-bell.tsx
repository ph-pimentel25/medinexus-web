"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "./auth-provider";
import { getRoleRequestsPath } from "../lib/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type NotificationRow = {
  id: string;
  title?: string | null;
  message?: string | null;
  body?: string | null;
  notification_type?: string | null;
  type?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
  appointment_id?: string | null;
  document_id?: string | null;
  link_href?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
};

function formatRelativeDate(dateString?: string | null) {
  if (!dateString) return "Agora há pouco";

  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "Agora há pouco";
  if (minutes < 60) return `${minutes} min atrás`;
  if (hours < 24) return `${hours} h atrás`;
  if (days < 30) return `${days} dia${days > 1 ? "s" : ""} atrás`;

  return date.toLocaleDateString("pt-BR");
}

function getNotificationTitle(item: NotificationRow) {
  return item.title || "Nova notificação";
}

function getNotificationMessage(item: NotificationRow) {
  return item.message || item.body || "Você recebeu uma nova atualização.";
}

function getTypeLabel(item: NotificationRow) {
  const raw = (item.type || item.notification_type || "").toLowerCase();

  if (raw.includes("document")) return "Documento";
  if (raw.includes("consulta")) return "Consulta";
  if (raw.includes("appointment")) return "Consulta";
  if (raw.includes("confirm")) return "Confirmação";
  if (raw.includes("cancel")) return "Cancelamento";
  return "Aviso";
}

function getNotificationHref(item: NotificationRow, role: string) {
  if (item.link_href) return item.link_href;
  if (item.document_id) return `/documentos-medicos/${item.document_id}`;
  if (item.resource_type === "document" && item.resource_id) {
    return `/documentos-medicos/${item.resource_id}`;
  }
  if (item.appointment_id) return getRoleRequestsPath(role);
  if (item.resource_type === "appointment" && item.resource_id) {
    return getRoleRequestsPath(role);
  }
  return "/notificacoes";
}

export default function NotificationBell() {
  const { access } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const wrapperRef = useRef<HTMLDivElement | null>(null);


  async function loadNotifications() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    setItems((data as NotificationRow[]) || []);
    setLoading(false);
  }


  useEffect(() => {
    const initialLoad = setTimeout(() => void loadNotifications(), 0);

    const interval = setInterval(() => {
      loadNotifications();
    }, 20000);

    return () => { clearTimeout(initialLoad); clearInterval(interval); };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.is_read).length,
    [items]
  );

  const previewItems = useMemo(
    () => items.slice(0, 4),
    [items]
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-mn-border bg-white text-lg shadow-sm transition hover:bg-mn-sand"
        aria-label="Abrir notificações"
        aria-expanded={open}
        aria-controls="notification-preview"
      >
        <Bell size={19} strokeWidth={1.8} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-mn-purple px-1.5 text-[11px] font-bold text-white shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div id="notification-preview" className="absolute right-0 top-[calc(100%+12px)] z-[9999] w-[min(390px,calc(100vw-80px))] overflow-hidden rounded-2xl border border-mn-border bg-white shadow-[0_35px_90px_-30px_rgba(40,60,122,0.4)]">
          <div className="border-b border-mn-border bg-gradient-to-r from-mn-sand to-mn-purple-light p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mn-purple">
                  Notificações
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  Resumo rápido
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Veja as atualizações mais recentes da sua conta.
                </p>
              </div>

              <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                <p className="text-right text-xl font-bold text-mn-teal">
                  {unreadCount}
                </p>
                <p className="text-[11px] text-slate-500">não lidas</p>
              </div>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-3">
            {loading ? (
              <div className="rounded-2xl border border-mn-border bg-mn-sand p-4 text-sm text-slate-500">
                Carregando notificações...
              </div>
            ) : previewItems.length === 0 ? (
              <div className="rounded-2xl border border-mn-border bg-mn-sand p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Nenhuma notificação no momento.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Quando houver novidades, elas aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {previewItems.map((item) => (
                  <Link
                    key={item.id}
                    href={getNotificationHref(item, access.role)}
                    className="block rounded-2xl border border-mn-border bg-white p-4 transition hover:border-mn-purple-light hover:bg-mn-sand"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-mn-sage-light px-2.5 py-1 text-[11px] font-bold text-mn-teal">
                        {getTypeLabel(item)}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatRelativeDate(item.created_at)}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-950">
                      {getNotificationTitle(item)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {getNotificationMessage(item)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-mn-border p-3">
            <Link
              href="/notificacoes"
              className="flex w-full items-center justify-center rounded-2xl bg-mn-teal px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
            >
              Ver notificações completas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}


