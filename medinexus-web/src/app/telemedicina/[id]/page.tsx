"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ShieldCheck,
  MessageSquare,
  Maximize2,
  Minimize2,
  Send,
  Activity,
  Heart,
  Footprints,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  Stethoscope,
  Lock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface ChatMessage {
  id: string;
  sender: "doctor" | "patient" | "system";
  name: string;
  time: string;
  text: string;
}

export default function TelemedicineRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const appointmentId = resolvedParams.id;

  // Local media stream
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);

  // Call status
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      sender: "system",
      name: "MediNexus Seguro",
      time: "Agora",
      text: "Sala de Telemedicina criptografada ponta a ponta (E2E). Atendimento regulamentado pela Resolução CFM nº 2.314/2022.",
    },
    {
      id: "msg-1",
      sender: "doctor",
      name: "Dr. Rafael Macedo",
      time: "14:02",
      text: "Olá! Boa tarde. Estou com seu prontuário aberto e revisando seus exames recentes. Consegue me ouvir e me ver bem?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  // Start webcam
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initMedia() {
      try {
        if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          activeStream = stream;
          setLocalStream(stream);
          setCameraPermissionGranted(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("Dispositivo sem webcam ou permissão negada; ativando modo simulado seguro.", err);
        setCameraPermissionGranted(false);
      }
    }

    initMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !micActive;
      });
    }
    setMicActive(!micActive);
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoActive;
      });
    }
    setVideoActive(!videoActive);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "patient",
      name: "Você",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      text: inputMessage.trim(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    router.push("/solicitacoes");
  };

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Bar */}
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mn-teal text-white shadow-md">
            <Stethoscope size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base">MediNexus Telemedicina</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AO VIVO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Dr. Rafael Macedo · CRM/SP 198421</p>
          </div>
        </div>

        {/* Status Central e Criptografia */}
        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-300">
            <Lock size={12} className="text-emerald-400" />
            <span>Criptografia E2E Ponta a Ponta</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-800/60 px-3 py-1 text-xs font-mono text-slate-300">
            <Clock size={12} className="text-mn-teal" />
            <span>{formatTimer(callDuration)}</span>
          </div>
        </div>

        {/* Ações Topo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVitals(!showVitals)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              showVitals ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Activity size={15} />
            <span className="hidden sm:inline">Métricas de Saúde</span>
          </button>

          <button
            type="button"
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              showChat ? "bg-mn-teal text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <MessageSquare size={15} />
            <span className="hidden sm:inline">Chat</span>
            {chatMessages.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Video Arena */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Remote Doctor Video Container */}
        <div className="relative flex flex-1 items-center justify-center bg-slate-900/60 p-2 sm:p-4">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
            {/* Doctor Feed Mock / Connected Stream */}
            <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#102730] to-slate-950 p-6 text-center">
              <div className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-full border-4 border-mn-teal/40 bg-gradient-to-tr from-mn-teal to-mn-purple text-4xl font-bold text-white shadow-2xl sm:h-40 sm:w-40">
                <span>RM</span>
                <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-slate-950">
                  <CheckCircle2 size={14} />
                </span>
              </div>

              <h2 className="text-xl font-bold text-white sm:text-2xl">Dr. Rafael Macedo</h2>
              <p className="mt-1 text-sm text-slate-400">Cardiologia Clínica & Preventiva • Hospital Israelita Albert Einstein</p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300 border border-slate-700">
                  <Activity size={12} className="text-emerald-400" /> Áudio HD Estável (32 kbps)
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300 border border-slate-700">
                  <ShieldCheck size={12} className="text-mn-teal" /> Conexão Segura E2E
                </span>
              </div>
            </div>

            {/* Local Patient Video (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 z-20 h-36 w-48 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl transition hover:scale-105 sm:h-44 sm:w-60">
              {videoActive ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover -scale-x-100"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-800 text-slate-400">
                  <VideoOff size={24} />
                  <span className="mt-1 text-[11px]">Câmera desativada</span>
                </div>
              )}

              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                <span>Você</span>
                {!micActive && <MicOff size={10} className="text-rose-400" />}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Direita: Métricas de Saúde (Apple Health / Google Fit) */}
        {showVitals && (
          <aside className="w-80 shrink-0 border-l border-slate-800 bg-slate-900/95 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="text-rose-500" size={18} />
                <h3 className="font-bold text-sm text-white">Apple Health & Google Fit</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVitals(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Frequência Cardíaca</span>
                <p className="mt-1 text-2xl font-bold text-white">68 <span className="text-xs font-normal text-slate-400">bpm (repouso)</span></p>
                <p className="mt-1 text-[11px] text-slate-400">Pico no mês: <strong className="text-rose-300">142 bpm</strong> em 24/Set</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mn-teal">Pressão Arterial Recente</span>
                <p className="mt-1 text-2xl font-bold text-white">120 / 78 <span className="text-xs font-normal text-slate-400">mmHg</span></p>
                <p className="mt-1 text-[11px] text-emerald-400">Classificação: Ótima / Controlada</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Atividade Mensal</span>
                <p className="mt-1 text-2xl font-bold text-white">218.400 <span className="text-xs font-normal text-slate-400">passos</span></p>
                <p className="mt-1 text-[11px] text-slate-400">Média diária: 7.280 passos/dia</p>
              </div>

              <div className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-3 text-[11px] text-blue-200">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles size={12} className="text-blue-400" />
                  Tendência Preventiva:
                </p>
                <p className="mt-1 text-slate-300">
                  Dados integrados sincronizados em tempo real com o prontuário para suporte ao diagnóstico médico durante a teleconsulta.
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* Sidebar Direita: Chat Criptografado */}
        {showChat && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-slate-800 bg-slate-900/95 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-mn-teal" size={18} />
                <h3 className="font-bold text-sm text-white">Chat Seguro E2E</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Lista de mensagens */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "patient"
                      ? "items-end"
                      : msg.sender === "system"
                      ? "items-center"
                      : "items-start"
                  }`}
                >
                  {msg.sender === "system" ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-center text-[10px] text-slate-400">
                      {msg.text}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 ${
                        msg.sender === "patient"
                          ? "bg-mn-teal text-white"
                          : "border border-slate-800 bg-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] opacity-75">
                        <span className="font-bold">{msg.name}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="border-t border-slate-800 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-mn-teal"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-mn-teal text-white hover:bg-[#123B46]"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {/* Floating Bottom Control Dock */}
      <footer className="z-20 flex h-20 shrink-0 items-center justify-center border-t border-slate-800/80 bg-slate-900/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Microfone */}
          <button
            type="button"
            onClick={toggleMic}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition shadow-lg ${
              micActive
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-rose-600 text-white hover:bg-rose-500"
            }`}
            title={micActive ? "Desativar Microfone" : "Ativar Microfone"}
          >
            {micActive ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Câmera */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition shadow-lg ${
              videoActive
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-rose-600 text-white hover:bg-rose-500"
            }`}
            title={videoActive ? "Desativar Câmera" : "Ativar Câmera"}
          >
            {videoActive ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Desligar chamada */}
          <button
            type="button"
            onClick={() => setLeaveModalOpen(true)}
            className="flex h-12 items-center gap-2 rounded-2xl bg-rose-600 px-6 font-bold text-white shadow-lg transition hover:bg-rose-500 active:scale-95"
          >
            <PhoneOff size={20} />
            <span className="hidden sm:inline text-xs">Encerrar Chamada</span>
          </button>
        </div>
      </footer>

      {/* Modal Confirmação Encerramento */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-500">
              <PhoneOff size={24} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Deseja sair da teleconsulta?</h3>
            <p className="mt-2 text-xs text-slate-400">
              Sua evolução clínica e receitas emitidas permanecerão salvas com segurança na sua conta MediNexus.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Voltar à consulta
              </button>
              <button
                type="button"
                onClick={handleEndCall}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500"
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
