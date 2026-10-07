"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
  Download,
  Building2,
  Users,
  Printer,
  Sparkles,
} from "lucide-react";

export default function ClinicaRelatoriosPage() {
  const [period, setPeriod] = useState<"mes" | "trimestre" | "ano">("mes");

  const peakHours = [
    { hour: "08h - 10h", rate: 92, status: "Alta", count: 184 },
    { hour: "10h - 12h", rate: 78, status: "Normal", count: 156 },
    { hour: "14h - 16h", rate: 96, status: "Pico Máximo", count: 192 },
    { hour: "16h - 18h", rate: 88, status: "Alta", count: 176 },
    { hour: "18h - 20h", rate: 62, status: "Moderada", count: 124 },
  ];

  const roomOccupancy = [
    { name: "Consultório 02 (Cardiologia)", rate: 94, totalHours: 150, occupiedHours: 141 },
    { name: "Sala de Ultrassonografia", rate: 92, totalHours: 140, occupiedHours: 128 },
    { name: "Consultório 01 (Clínica / Pediatria)", rate: 88, totalHours: 160, occupiedHours: 140 },
    { name: "Consultório 03 (Dermatologia)", rate: 81, totalHours: 130, occupiedHours: 105 },
    { name: "Sala de Pequenas Cirurgias", rate: 68, totalHours: 90, occupiedHours: 61 },
  ];

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <main className="min-h-screen bg-mn-sand pb-16">
      {/* Top Banner */}
      <section className="border-b border-mn-border bg-white no-print">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-mn-border bg-mn-sand px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-mn-teal">
              Inteligência de Gestão Clínica
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Relatório Executivo de Ocupação
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Taxa de ocupação de consultórios, distribuição de horários de pico e indicadores de pontualidade da equipe.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-2xl bg-mn-teal px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123B46]"
            >
              <Printer size={16} />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Filtro de Período */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-mn-teal" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Período selecionado:
            </span>
          </div>

          <div className="flex gap-2">
            {(["mes", "trimestre", "ano"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  period === p ? "bg-mn-teal text-white" : "bg-white text-slate-700 border border-mn-border"
                }`}
              >
                {p === "mes" ? "Últimos 30 dias" : p === "trimestre" ? "Trimestre Atual" : "Ano 2026"}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Grandes Indicadores Executivos */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Taxa de Ocupação Geral</span>
              <Building2 className="text-mn-teal" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-mn-teal">84.6%</p>
            <p className="mt-1 text-xs text-emerald-600 font-semibold">↑ +4.2% em relação ao período anterior</p>
          </div>

          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Índice de Pontualidade</span>
              <CheckCircle2 className="text-emerald-600" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-emerald-600">91.2%</p>
            <p className="mt-1 text-xs text-slate-500">Início em até 10 minutos de tolerância</p>
          </div>

          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Taxa de No-Show (Faltas)</span>
              <AlertCircle className="text-amber-500" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-amber-600">4.8%</p>
            <p className="mt-1 text-xs text-emerald-600 font-semibold">↓ Redução de 62% com avisos via WhatsApp</p>
          </div>

          <div className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Tempo Médio de Espera</span>
              <Clock className="text-mn-purple" size={18} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-mn-purple">11 min</p>
            <p className="mt-1 text-xs text-slate-500">Desde o check-in na recepção</p>
          </div>
        </div>

        {/* Gráfico Visual: Horários de Pico */}
        <div className="rounded-3xl border border-mn-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1 border-b border-mn-border pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-mn-teal" />
              <h3 className="text-lg font-bold text-slate-900">Distribuição dos Horários de Pico</h3>
            </div>
            <p className="text-xs text-slate-500">
              Identificação de janelas com saturação e horários ociosos para balanceamento de escala médica.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {peakHours.map((slot) => (
              <div key={slot.hour} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{slot.hour}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{slot.count} atendimentos</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        slot.rate >= 95
                          ? "bg-red-100 text-red-700"
                          : slot.rate >= 85
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {slot.rate}% • {slot.status}
                    </span>
                  </div>
                </div>

                <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      slot.rate >= 95
                        ? "bg-gradient-to-r from-teal-600 to-rose-600"
                        : slot.rate >= 85
                        ? "bg-gradient-to-r from-teal-500 to-amber-500"
                        : "bg-mn-teal"
                    }`}
                    style={{ width: `${slot.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detalhamento de Ocupação por Sala / Consultório */}
        <div className="rounded-3xl border border-mn-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1 border-b border-mn-border pb-4">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-mn-purple" />
              <h3 className="text-lg font-bold text-slate-900">Taxa de Utilização por Consultório & Equipamento</h3>
            </div>
            <p className="text-xs text-slate-500">
              Horas efetivamente utilizadas vs capacidade total instalada no período.
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Ambiente / Equipamento</th>
                  <th className="py-3 px-3 text-right">Horas Disponíveis</th>
                  <th className="py-3 px-3 text-right">Horas em Atendimento</th>
                  <th className="py-3 px-3 text-right">Taxa de Ocupação</th>
                  <th className="py-3 px-3 text-center">Status Operacional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roomOccupancy.map((r) => (
                  <tr key={r.name} className="hover:bg-mn-sand/50 transition">
                    <td className="py-3.5 px-3 font-bold text-slate-800">{r.name}</td>
                    <td className="py-3.5 px-3 text-right text-slate-600">{r.totalHours}h</td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-900">{r.occupiedHours}h</td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-extrabold text-mn-teal">{r.rate}%</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          r.rate >= 90
                            ? "bg-teal-50 text-mn-teal border border-teal-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.rate >= 90 ? "Alta Demanda" : "Equilibrado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
