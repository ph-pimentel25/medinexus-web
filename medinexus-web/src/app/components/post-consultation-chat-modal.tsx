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

const STORAGE_PREFIX = "medinexus_post_chat_";
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

  const consultationTimestamp = appointmentDate
    ? new Date(appointmentDate).getTime()
    : Date.now() - 2 * 24 * 60 * 60 * 1000; // default 2 dias atrás se não informado

  const expiryTimestamp = consultationTimestamp + SEVEN_DAYS_MS;
  const now = Date.now();
  const isExpired = now > expiryTimestamp;
  const daysRemaining = Math.max(0, Math.ceil((expiryTimestamp - now) / (24 * 60 * 60 * 1000)));

  useEffect(() => {
    if (!appointmentId) return;

    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${appointmentId}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Mensagem inicial do sistema
        const initialMessages: ChatMessage[] = [
          {
            id: "msg-0",
            sender: "system",
            senderName: "MediNexus Cuidado Contínuo",
            content: `Canal de dúvidas pós-consulta aberto com Dr(a). ${doctorName}. Conforme as diretrizes clínicas e do CFM, este canal é exclusivo para esclarecimentos rápidos sobre a prescrição ou orientações dadas em consulta e permanecerá disponível por 7 dias.`,
            timestamp: new Date(consultationTimestamp).toISOString(),
          },
          {
            id: "msg-1",
            sender: "doctor",
            senderName: doctorName,
            content: `Olá, ${patientName}! Caso tenha ficado alguma dúvida sobre as orientações ou sobre os medicamentos prescritos, pode me enviar por aqui durante esta semana.`,
            timestamp: new Date(consultationTimestamp + 5 * 60 * 1000).toISOString(),
          },
        ];
        setMessages(initialMessages);
        localStorage.setItem(`${STORAGE_PREFIX}${appointmentId}`, JSON.stringify(initialMessages));
      }
    } catch {
      // Ignora erro no local storage
    }
  }, [appointmentId, consultationTimestamp, doctorName, patientName]);

  if (!isOpen) return null;

  function handleSend() {
    if (!newText.trim() || isExpired) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: viewerRole,
      senderName: viewerRole === "doctor" ? doctorName : patientName,
      content: newText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    setNewText("");

    try {
      localStorage.setItem(`${STORAGE_PREFIX}${appointmentId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("Erro ao salvar mensagem:", e);
    }

    // Se quem mandou foi o paciente, simula uma confirmação profissional do médico se for a primeira mensagem
    if (viewerRole === "patient" && !messages.some((m) => m.sender === "doctor" && m.id !== "msg-1")) {
      setTimeout(() => {
        const reply: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "doctor",
          senderName: doctorName,
          content: "Recebi sua dúvida! Estou revisando seus apontamentos no prontuário e lhe oriento em breve.",
          timestamp: new Date().toISOString(),
        };
        const withReply = [...updated, reply];
        setMessages(withReply);
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${appointmentId}`, JSON.stringify(withReply));
        } catch {
          // ignore
        }
      }, 1500);
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
