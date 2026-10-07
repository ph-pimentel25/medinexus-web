"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Clock,
  User,
  MapPin,
  Stethoscope,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Radio,
} from "lucide-react";

interface TVCall {
  id: string;
  patientName: string;
  roomName: string;
  doctorName: string;
  specialty: string;
  calledAt: string;
}

const INITIAL_CALLS: TVCall[] = [
  {
    id: "call-1",
    patientName: "MARIA EDUARDA SILVA",
    roomName: "CONSULTÓRIO 03",
    doctorName: "Dra. Camila Vasconcelos",
    specialty: "Cardiologia",
    calledAt: "14:45",
  },
  {
    id: "call-2",
    patientName: "JOÃO PEDRO SANTOS",
    roomName: "SALA DE ULTRASSOM",
    doctorName: "Dr. Marcelo Bittencourt",
    specialty: "Radiologia & Diagnóstico",
    calledAt: "14:38",
  },
  {
    id: "call-3",
    patientName: "ANA CLARA ALBUQUERQUE",
    roomName: "CONSULTÓRIO 01",
    doctorName: "Dr. André Valente",
    specialty: "Clínica Geral",
    calledAt: "14:25",
  },
  {
    id: "call-4",
    patientName: "CARLOS HENRIQUE LIMA",
    roomName: "CONSULTÓRIO 02",
    doctorName: "Dra. Beatriz Menezes",
    specialty: "Dermatologia",
    calledAt: "14:10",
  },
];

export default function PainelTVPage() {
  const [currentCall, setCurrentCall] = useState<TVCall>(INITIAL_CALLS[0]);
  const [history, setHistory] = useState<TVCall[]>(INITIAL_CALLS.slice(1));
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Play hospital-grade two-tone chime via Web Audio API
  const playChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Primeiro tom (C5 - 523Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.7);

      // Segundo tom harmônico (E5 - 659Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.22);
      gain2.gain.setValueAtTime(0.45, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 1.2);
    } catch (e) {
      console.warn("Chime Web Audio API indisponível", e);
    }
  };

  // Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleNextPatient = (newCall: TVCall) => {
    playChime();
    setHistory((prev) => [currentCall, ...prev.slice(0, 3)]);
    setCurrentCall(newCall);
  };

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#0A1A22] font-sans text-white select-none">
      {/* Header da TV */}
      <header className="z-10 flex h-24 shrink-0 items-center justify-between border-b border-teal-900/60 bg-[#07131B]/90 px-8 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mn-teal text-white shadow-lg">
            <Radio size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">MediNexus</span>
              <span className="rounded-md bg-mn-teal/30 px-2 py-0.5 text-xs font-bold text-teal-300 uppercase">
                Painel Recepção
              </span>
            </div>
            <p className="text-xs text-teal-200/70">Centro Médico & Diagnóstico Especializado</p>
          </div>
        </div>

        {/* Relógio e Data em Alta Visibilidade */}
        <div className="text-right">
          <p className="font-mono text-3xl font-bold tracking-wider text-emerald-400 drop-shadow-md">
            {currentTime || "--:--:--"}
          </p>
          <p className="text-xs font-medium text-slate-300 capitalize">{currentDate}</p>
        </div>

        {/* Controles de Som & Fullscreen */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime();
            }}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
              soundEnabled ? "bg-teal-900/60 text-emerald-300 hover:bg-teal-800" : "bg-slate-800 text-slate-500"
            }`}
            title={soundEnabled ? "Som Ativado (clique para mutar)" : "Som Mutado"}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-900/60 text-teal-200 transition hover:bg-teal-800"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </header>

      {/* Grid Principal da TV */}
      <main className="grid flex-1 grid-cols-12 overflow-hidden p-6 gap-6">
        {/* Painel Central: Chamada Atual */}
        <section className="col-span-12 lg:col-span-8 flex flex-col justify-between rounded-3xl border-2 border-teal-500/40 bg-gradient-to-br from-[#0C222B] via-[#0E2C37] to-[#08171E] p-10 shadow-2xl relative overflow-hidden">
          {/* Efeito Glow */}
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-extrabold text-emerald-400 border border-emerald-500/40 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                CHAMADA ATUAL
              </span>
              <span className="text-sm font-mono text-slate-400">Chamado às {currentCall.calledAt}</span>
            </div>

            {/* Nome do Paciente em Destaque Gigante */}
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-300">Paciente</p>
              <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-lg leading-tight uppercase">
                {currentCall.patientName}
              </h1>
            </div>
          </div>

          {/* Destino / Consultório em Super Destaque */}
          <div className="mt-8 rounded-3xl border border-teal-400/40 bg-teal-950/60 p-8 backdrop-blur-md">
            <div className="grid sm:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">Local de Atendimento</p>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {currentCall.roomName}
                </p>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-teal-800/80 pt-4 sm:pt-0 sm:pl-6">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Médico / Especialista</p>
                <p className="mt-1 text-xl font-bold text-teal-100">{currentCall.doctorName}</p>
                <p className="text-sm text-teal-300/80">{currentCall.specialty}</p>
              </div>
            </div>
          </div>

          {/* Rodapé Informativo */}
          <div className="mt-6 flex items-center justify-between border-t border-teal-900/50 pt-4 text-xs text-slate-400">
            <span>Por favor, dirija-se à porta indicada. Se precisar de auxílio, procure nossa recepção.</span>
            <span className="font-semibold text-emerald-400">Atendimento prioritário respeitado</span>
          </div>
        </section>

        {/* Painel Lateral: Histórico das Últimas Chamadas */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col justify-between rounded-3xl border border-teal-900/60 bg-[#081921]/80 p-6 shadow-xl backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 border-b border-teal-900/60 pb-4">
              <Clock size={18} className="text-teal-400" />
              <h2 className="text-base font-bold uppercase tracking-wider text-teal-200">
                Últimas Chamadas
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {history.map((call, idx) => (
                <div
                  key={call.id + idx}
                  className="rounded-2xl border border-teal-900/40 bg-[#0B212B]/90 p-4 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-teal-400/80">{call.calledAt}</span>
                    <span className="rounded-md bg-teal-950 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-800">
                      {call.roomName}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-white uppercase truncate">{call.patientName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{call.doctorName} • {call.specialty}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Painel de Controle Rápido para a Recepção */}
          <div className="mt-4 border-t border-teal-900/60 pt-4">
            <button
              type="button"
              onClick={() => setShowControls(!showControls)}
              className="text-[11px] font-bold text-teal-300 hover:text-white"
            >
              {showControls ? "Ocultar botões de simulação da recepção" : "Mostrar botões de recepção"}
            </button>

            {showControls && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleNextPatient({
                      id: `call-${Date.now()}`,
                      patientName: "GABRIEL NOGUEIRA PINTO",
                      roomName: "CONSULTÓRIO 02",
                      doctorName: "Dra. Camila Vasconcelos",
                      specialty: "Cardiologia",
                      calledAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    })
                  }
                  className="rounded-xl bg-mn-teal px-3 py-2 text-xs font-bold text-white hover:bg-teal-600 transition"
                >
                  Chamar Gabriel (Cons. 02)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleNextPatient({
                      id: `call-${Date.now()}`,
                      patientName: "JULIANA SANTORO",
                      roomName: "SALA DE PEQUENAS CIRURGIAS",
                      doctorName: "Dr. André Valente",
                      specialty: "Procedimentos",
                      calledAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    })
                  }
                  className="rounded-xl bg-teal-800 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700 transition"
                >
                  Chamar Juliana (Cirurgia)
                </button>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
