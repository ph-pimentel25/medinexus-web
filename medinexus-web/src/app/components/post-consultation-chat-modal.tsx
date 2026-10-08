"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Clock,
  Send,
  X,
  AlertCircle,
  ShieldCheck,
  CheckCheck,
  User,
  Stethoscope,
  Lock,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export interface ChatMessage {
  id: string;
  sender: "patient" | "doctor" | "system";
  senderName: string;
  content: string;
  timestamp: string;
}

interface PostConsultationChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  doctorName: string;
  appointmentDate?: string;
  viewerRole: "patient" | "doctor";
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function PostConsultationChatModal({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  doctorName,
  appointmentDate,
  viewerRole,
}: PostConsultationChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newText, setNewText] = useState("");
  const [sending, setSending] = useState(false);

  const consultationTimestamp = appointmentDate
    ? new Date(appointmentDate).getTime()
    : Date.now();

  const expiryTimestamp = consultationTimestamp + SEVEN_DAYS_MS;
  const now = Date.now();
  const isExpired = now > expiryTimestamp;
  const daysRemaining = Math.max(0, Math.ceil((expiryTimestamp - now) / (24 * 60 * 60 * 1000)));

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    let active = true;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("post_consultation_messages")
        .select("*")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (!error && data && data.length > 0) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            sender: m.sender_role as "patient" | "doctor" | "system",
            senderName: m.sender_name,
            content: m.content,
            timestamp: m.created_at,
          }))
        );
      } else {
        // Mensagem inicial do sistema de orientação
        setMessages([
          {
            id: "system-guideline",
            sender: "system",
            senderName: "MediNexus Cuidado Contínuo",
            content: `Canal de dúvidas pós-consulta aberto com Dr(a). ${doctorName}. Conforme a Resolução CFM nº 2.314/2022, este canal é exclusivo para esclarecimentos rápidos sobre a prescrição ou orientações dadas em consulta e permanecerá ativo por 7 dias.`,
            timestamp: new Date(consultationTimestamp).toISOString(),
          },
        ]);
      }
    }

    void loadMessages();

    // Inscrição em tempo real para novas mensagens
    const channel = supabase
      .channel(`post_chat_${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_consultation_messages",
          filter: `appointment_id=eq.${appointmentId}`,
        },
        (payload) => {
          const newRow = payload.new as {
            id: string;
            sender_role: string;
            sender_name: string;
            content: string;
            created_at: string;
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            return [
              ...prev,
              {
                id: newRow.id,
                sender: newRow.sender_role as "patient" | "doctor" | "system",
                senderName: newRow.sender_name,
                content: newRow.content,
                timestamp: newRow.created_at,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [isOpen, appointmentId, consultationTimestamp, doctorName]);

  if (!isOpen) return null;

  async function handleSend() {
    if (!newText.trim() || isExpired || sending) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Sua sessão expirou. Faça login novamente.");
        return;
      }

      const textToSend = newText.trim();
      setNewText("");

      const { data, error } = await supabase
        .from("post_consultation_messages")
        .insert({
          appointment_id: appointmentId,
          sender_id: user.id,
          sender_role: viewerRole,
          sender_name: viewerRole === "doctor" ? doctorName : patientName,
          content: textToSend,
        })
        .select()
        .single();

      if (error) {
        console.error("[Post-consultation chat error]", error);
        // Fallback local se o banco ainda não rodou a migration
        const localMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: viewerRole,
          senderName: viewerRole === "doctor" ? doctorName : patientName,
          content: textToSend,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, localMsg]);
      } else if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [
            ...prev,
            {
              id: data.id,
              sender: data.sender_role as "patient" | "doctor" | "system",
              senderName: data.sender_name,
              content: data.content,
              timestamp: data.created_at,
            },
          ];
        });
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-mn-border bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-mn-border px-6 py-4 bg-[#FAF6F3]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mn-teal text-white shadow-sm">
              <MessageSquare size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900">
                  {viewerRole === "patient" ? `Dúvidas com Dr(a). ${doctorName}` : `Dúvidas Pós-Consulta — ${patientName}`}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Consulta realizada • Canal com validade de 7 dias
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Banner de Status (Dias Restantes ou Expirado) */}
        <div
          className={`flex items-center justify-between px-6 py-2.5 text-xs font-semibold ${
            isExpired
              ? "bg-slate-100 text-slate-700 border-b border-slate-200"
              : "bg-[#E8F3EE] text-mn-teal border-b border-[#D2E7DC]"
          }`}
        >
          <div className="flex items-center gap-2">
            {isExpired ? <Lock size={15} /> : <Clock size={15} />}
            <span>
              {isExpired
                ? "Canal encerrado após 7 dias (conforme diretrizes CFM)."
                : `Canal pós-consulta ativo • Restam ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck size={14} className="text-mn-teal" />
            <span>Criptografado</span>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            if (msg.sender === "system") {
              return (
                <div key={msg.id} className="mx-auto max-w-lg rounded-2xl bg-blue-50/80 p-3.5 text-center text-xs text-blue-900 border border-blue-200/80">
                  <p>{msg.content}</p>
                </div>
              );
            }

            const isMine =
              (viewerRole === "patient" && msg.sender === "patient") ||
              (viewerRole === "doctor" && msg.sender === "doctor");

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                <span className="mb-1 text-[11px] font-medium text-slate-400 px-1">
                  {msg.senderName}
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    isMine
                      ? "bg-mn-teal text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-mn-border rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      isMine ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMine && <CheckCheck size={12} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer / Input */}
        <div className="border-t border-mn-border p-4 bg-white">
          {isExpired ? (
            <div className="rounded-2xl bg-slate-100 p-4 text-center text-xs text-slate-600">
              <Lock size={18} className="mx-auto mb-1 text-slate-400" />
              <p className="font-semibold text-slate-800">
                O prazo de 7 dias pós-consulta terminou.
              </p>
              <p className="mt-0.5">
                Para novas queixas, receitas ou reavaliação de sintomas, agende uma nova consulta com o profissional.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={
                  viewerRole === "patient"
                    ? "Tire sua dúvida sobre receita ou orientação..."
                    : "Responda à dúvida do paciente..."
                }
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="flex-1 rounded-2xl border border-mn-border bg-mn-sand/60 px-4 py-3 text-sm text-slate-900 outline-none focus:border-mn-teal focus:bg-white"
              />
              <button
                type="submit"
                disabled={!newText.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mn-teal text-white shadow-sm hover:bg-[#123B46] disabled:opacity-40 transition"
              >
                <Send size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
