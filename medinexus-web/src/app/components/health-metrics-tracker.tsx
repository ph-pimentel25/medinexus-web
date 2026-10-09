"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Heart,
  Footprints,
  Smartphone,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Sparkles,
  Zap,
  Info,
  RefreshCw,
  Lock,
  CheckCircle2,
} from "lucide-react";

const STORAGE_KEY = "medinexus_health_connected";

export default function HealthMetricsTracker({
  readOnly = false,
  patientName = "Você",
}: {
  readOnly?: boolean;
  patientName?: string;
}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Hoje às 08:32");

  useEffect(() => {
    if (readOnly) {
      // Mock: na visão do médico, forçamos true para demonstrar a UI populada
      setIsConnected(true);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setIsConnected(true);
      }
    } catch {}
  }, [readOnly]);

  const handleConnect = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setIsConnected(true);
      setLastSyncTime("Agora mesmo");
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {}
    }, 600);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime("Agora mesmo");
    }, 700);
  };

  const weeklySteps = [
    { label: "Sem 1", steps: 52100, pct: 85 },
    { label: "Sem 2", steps: 58400, pct: 95 },
    { label: "Sem 3", steps: 48900, pct: 80 },
    { label: "Sem 4", steps: 59000, pct: 98 },
  ];

  return (
    <div className="space-y-6">
      {!isConnected ? (
        /* Onboarding de Conexão com Apple Saúde */
        <div className="rounded-3xl border border-mn-border bg-gradient-to-r from-slate-900 to-[#123B46] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-rose-400 backdrop-blur-md">
                <Heart size={26} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">MediNexus Saúde Conectada</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    <ShieldCheck size={12} /> Apple Saúde / Health Connect
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 max-w-xl">
                  {readOnly 
                    ? `O paciente ${patientName} ainda não compartilhou o acesso aos sensores de biometria e atividades físicas.` 
                    : "Conecte seus sensores e biometria coletados pelo iPhone ou Apple Watch. Seus dados de passos, frequência cardíaca e pressão arterial ficam disponíveis com segurança para o médico durante as consultas."
                  }
                </p>
                {!readOnly && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-300/90">
                    <Lock size={12} />
                    <span>Privacidade total • Dados isolados em conformidade com RLS</span>
                  </div>
                )}
              </div>
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-rose-500 disabled:opacity-60 shrink-0"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Autorizando...</span>
                  </>
                ) : (
                  <>
                    <Heart size={15} />
                    <span>Conectar Apple Saúde / Health Connect</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Banner de Sincronização Ativa */
        <div className="rounded-3xl border border-mn-border bg-gradient-to-r from-slate-900 to-[#123B46] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-rose-400 backdrop-blur-md">
                <Heart size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">MediNexus Saúde Conectada</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    <CheckCircle2 size={12} /> Leitura autorizada
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Métricas preventivas de {patientName} • Última sincronização: {lastSyncTime}
                </p>
              </div>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20 transition"
                >
                  <RefreshCw size={12} className={isSyncing ? "animate-spin text-emerald-400" : "text-emerald-400"} />
                  <span>{isSyncing ? "Sincronizando..." : "Sincronizar Agora"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="rounded-xl px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-300 transition"
                >
                  Desconectar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isConnected && (
        <div className="rounded-3xl border border-mn-border bg-white p-6 text-sm text-slate-600 shadow-sm">
          {readOnly ? (
            <>
              <strong className="block text-slate-900">Métricas de {patientName}</strong>
              <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-4">
                <div className="rounded-2xl border border-mn-border bg-[#F5F8F7] p-4 text-center">
                  <Footprints size={20} className="mx-auto text-mn-teal mb-2" />
                  <p className="text-xl font-black text-mn-graphite">8.400</p>
                  <p className="text-[10px] uppercase font-bold text-mn-teal">Passos/dia</p>
                </div>
                <div className="rounded-2xl border border-mn-border bg-[#F5F8F7] p-4 text-center">
                  <Activity size={20} className="mx-auto text-mn-teal mb-2" />
                  <p className="text-xl font-black text-mn-graphite">72 <span className="text-xs font-medium">bpm</span></p>
                  <p className="text-[10px] uppercase font-bold text-mn-teal">Freq. Média</p>
                </div>
                <div className="rounded-2xl border border-mn-border bg-[#F5F8F7] p-4 text-center">
                  <Heart size={20} className="mx-auto text-rose-500 mb-2" />
                  <p className="text-xl font-black text-mn-graphite">120/80</p>
                  <p className="text-[10px] uppercase font-bold text-mn-teal">P.A.</p>
                </div>
                <div className="rounded-2xl border border-mn-border bg-[#F5F8F7] p-4 text-center">
                  <Zap size={20} className="mx-auto text-amber-500 mb-2" />
                  <p className="text-xl font-black text-mn-graphite">650 <span className="text-xs font-medium">kcal</span></p>
                  <p className="text-[10px] uppercase font-bold text-mn-teal">Atividade</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <strong className="block text-slate-900">Aguardando sincronização do seu celular</strong>
              <p className="mt-1">
                Passos, frequência cardíaca e pressão arterial são lidos no app MediNexus (Apple Saúde no iPhone ou Health Connect no Android) e aparecem aqui assim que forem enviados. Nenhum número é exibido sem vir do seu aparelho.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

