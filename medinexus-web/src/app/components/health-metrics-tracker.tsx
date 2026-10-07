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
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setIsConnected(true);
      }
    } catch {}
  }, []);

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
                    <ShieldCheck size={12} /> Apple Saúde (HealthKit)
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 max-w-xl">
                  Conecte seus sensores e biometria coletados pelo iPhone ou Apple Watch. Seus dados de passos, frequência cardíaca e pressão arterial ficam disponíveis com segurança para o médico durante as consultas.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-300/90">
                  <Lock size={12} />
                  <span>Privacidade total • Dados criptografados em conformidade com a LGPD</span>
                </div>
              </div>
            </div>

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
                  <span>Conectar Apple Saúde (HealthKit)</span>
                </>
              )}
            </button>
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
                    <CheckCircle2 size={12} /> Apple Saúde Conectado
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Métricas preventivas de {patientName} • Última sincronização: {lastSyncTime}
                </p>
              </div>
            </div>

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
          </div>
        </div>
      )}

      {/* Exibir cards biométricos quando conectado */}
      {isConnected && (
        <>

      {/* Cards de Métricas Principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Passos & Atividade */}
        <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-mn-teal">
              <Footprints size={20} />
              <h4 className="font-bold text-sm text-slate-900">Registro Mensal de Passos</h4>
            </div>
            <span className="rounded-full bg-mn-sage-light px-2.5 py-0.5 text-[10px] font-bold text-mn-teal">
              Setembro / 2026
            </span>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900">
              218.400 <span className="text-xs font-semibold text-slate-500">passos</span>
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Média diária: <strong className="text-mn-teal">7.280 passos/dia</strong> (Meta de 8k atingida em 74% dos dias)
            </p>
          </div>

          {/* Mini Gráfico de Barras por Semana */}
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-3">
            <span className="text-[11px] font-semibold text-slate-500">Evolução por semana no mês:</span>
            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              {weeklySteps.map((w) => (
                <div key={w.label} className="flex flex-col items-center gap-1">
                  <div className="flex h-16 w-full items-end justify-center rounded-lg bg-slate-100 p-1">
                    <div
                      className="w-full rounded-md bg-mn-teal transition-all"
                      style={{ height: `${w.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">{w.label}</span>
                  <span className="text-[9px] text-slate-500">{Math.round(w.steps / 1000)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Frequência Cardíaca & Maior Pico */}
        <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-500">
              <Heart size={20} />
              <h4 className="font-bold text-sm text-slate-900">Frequência Cardíaca</h4>
            </div>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
              Sensor Óptico
            </span>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900">
              68 <span className="text-xs font-semibold text-slate-500">bpm (média em repouso)</span>
            </p>
            <p className="mt-1 text-xs text-slate-600">Faixa habitual de sono: 52 a 60 bpm</p>
          </div>

          {/* Destaque do Dia com Maior Pico */}
          <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/60 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-rose-900">
              <Zap size={14} className="text-rose-600" />
              <span>Dia com Maior Pico de FC</span>
            </div>
            <p className="mt-1 text-xl font-bold text-rose-700">
              142 bpm <span className="text-xs font-normal text-rose-900/80">em 24 de Setembro</span>
            </p>
            <p className="mt-1 text-[11px] text-rose-800/80">
              Horário: 07:45 às 08:30 • Compatível com treino aeróbico matinal. Recuperação em menos de 2 minutos.
            </p>
          </div>
        </div>

        {/* Pressão Arterial */}
        <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-mn-purple">
              <Activity size={20} />
              <h4 className="font-bold text-sm text-slate-900">Pressão Arterial Recente</h4>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              Classificação Ótima
            </span>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900">
              120 / 78 <span className="text-xs font-semibold text-slate-500">mmHg</span>
            </p>
            <p className="mt-1 text-xs text-slate-600">Última aferição: 02/Out às 07:15</p>
          </div>

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Média sistólica semanal:</span>
              <strong className="text-slate-800">118 mmHg</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Média diastólica semanal:</span>
              <strong className="text-slate-800">76 mmHg</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Pressão de pulso:</span>
              <strong className="text-slate-800">42 mmHg (Normal)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Tendências Preventivas para o Médico / Paciente */}
      <div className="rounded-3xl border border-mn-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mn-sage-light text-mn-teal">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Tendências Preventivas & Análise Longitudinal</h4>
            <p className="text-xs text-slate-500">
              Cruzamento de dados biométricos com diretrizes da Sociedade Brasileira de Cardiologia (SBC)
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div className="rounded-2xl border border-slate-100 bg-mn-sand p-3.5">
            <strong className="block text-slate-900 font-semibold">1. Risco Cardiovascular Global</strong>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Baixo risco. Frequência de repouso &lt; 70 bpm e PA sistólica abaixo de 130 mmHg indicam excelente condicionamento autonômico.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-mn-sand p-3.5">
            <strong className="block text-slate-900 font-semibold">2. Padrão de Recuperação de Frequência</strong>
            <p className="mt-1 text-slate-600 leading-relaxed">
              O pico de 142 bpm no dia 24/Set retornou à linha de base em 1min 45s, demonstrando reserva funcional preservada.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-mn-sand p-3.5">
            <strong className="block text-slate-900 font-semibold">3. Regularidade de Movimento</strong>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Atividade física consistente (mais de 7.000 passos na maioria dos dias), associada à redução de mortalidade por todas as causas.
            </p>
          </div>
        </div>
      </div>
    </>
  )}
</div>
  );
}
