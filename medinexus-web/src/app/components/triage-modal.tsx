"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  X,
  ChevronRight,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  generateAiTriageSummary,
  saveTriage,
  loadTriage,
  type PreConsultationTriage,
} from "../lib/pre-consultation-triage";

interface TriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  doctorName?: string;
}

const COMMON_COMPLAINTS = [
  "Dor de cabeça / Enxaqueca",
  "Dor no peito / Palpitação",
  "Dor de estômago / Queimação",
  "Dor nas costas / Lombalgia",
  "Dor de garganta / Tosse",
  "Febre e indisposição geral",
  "Alergia cutânea / Manchas",
  "Ansiedade / Insônia",
  "Check-up preventivo",
];

const DURATION_OPTIONS = [
  "Iniciou hoje (< 24h)",
  "Há 2 a 3 dias",
  "Há cerca de 1 semana",
  "Há mais de 1 mês (crônico)",
];

const ASSOCIATED_SYMPTOMS_OPTIONS = [
  "Febre alta (> 38°C)",
  "Náusea ou vômito",
  "Tontura ou vertigem",
  "Falta de ar / Cansaço fácil",
  "Sensibilidade à luz / Som",
  "Diarreia",
  "Nenhum outro sintoma",
];

export function TriageModal({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  doctorName = "o médico",
}: TriageModalProps) {
  const [existingTriage, setExistingTriage] = useState<PreConsultationTriage | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [duration, setDuration] = useState(DURATION_OPTIONS[1]);
  const [painLevel, setPainLevel] = useState<number>(3);
  const [associatedSymptoms, setAssociatedSymptoms] = useState<string[]>([]);
  const [aggravatingFactors, setAggravatingFactors] = useState("");
  const [previousMedication, setPreviousMedication] = useState("");
  const [result, setResult] = useState<PreConsultationTriage | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      const saved = loadTriage(appointmentId);
      if (saved) {
        setExistingTriage(saved);
        setResult(saved);
      } else {
        setExistingTriage(null);
        setResult(null);
      }
    }
  }, [appointmentId, isOpen]);

  if (!isOpen) return null;

  function toggleSymptom(symptom: string) {
    if (symptom === "Nenhum outro sintoma") {
      setAssociatedSymptoms(["Nenhum outro sintoma"]);
      return;
    }
    setAssociatedSymptoms((prev) => {
      const filtered = prev.filter((s) => s !== "Nenhum outro sintoma");
      if (filtered.includes(symptom)) {
        return filtered.filter((s) => s !== symptom);
      }
      return [...filtered, symptom];
    });
  }

  function handleGenerate() {
    if (!chiefComplaint.trim()) {
      alert("Por favor, selecione ou descreva o motivo principal da consulta.");
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      const triage = generateAiTriageSummary({
        appointmentId,
        patientName,
        chiefComplaint: chiefComplaint.trim(),
        duration,
        painLevel,
        associatedSymptoms,
        aggravatingFactors,
        previousMedication,
      });

      saveTriage(triage);
      setResult(triage);
      setExistingTriage(triage);
      setIsAnalyzing(false);
    }, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-mn-border bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-mn-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F3EE] text-mn-teal">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Triagem Pré-Consulta com IA
                </h2>
                <span className="rounded-full bg-mn-teal/10 px-2.5 py-0.5 text-[11px] font-bold text-mn-teal">
                  Análise Guiada
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Responda em 1 minuto para adiantar o sumário clínico para {doctorName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {result ? (
            /* Visualização do Sumário Gerado */
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-700" />
                    <h3 className="font-bold text-emerald-900">
                      Triagem Concluída com Sucesso!
                    </h3>
                  </div>
                  <span className="text-xs text-emerald-700">
                    {new Date(result.completedAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-emerald-800">
                  As respostas foram sintetizadas e já estão disponíveis no prontuário que o médico visualizará ao iniciar a consulta.
                </p>
              </div>

              {/* Card de Prioridade & Hipóteses */}
              <div className="rounded-2xl border border-mn-border bg-mn-sand/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nível de Classificação
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      result.aiSummary.urgencyLevel.includes("Prioritário")
                        ? "bg-amber-100 text-amber-800"
                        : result.aiSummary.urgencyLevel.includes("Moderado")
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {result.aiSummary.urgencyLevel}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Hipóteses Clínicas Sugeridas pela IA
                  </h4>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {result.aiSummary.suggestedHypotheses.map((hypo, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-mn-teal font-bold">•</span>
                        <span>{hypo}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-mn-border/80 bg-white p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Sumário para o Prontuário Médico
                  </h4>
                  <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-800">
                    {result.aiSummary.clinicalSummaryText}
                  </pre>
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-blue-50/80 p-3 text-xs text-blue-900 border border-blue-200">
                  <ShieldCheck size={18} className="shrink-0 text-blue-700 mt-0.5" />
                  <p>
                    {result.aiSummary.preliminaryGuidance} Em caso de piora súbita ou emergência, procure um pronto atendimento hospitalar imediato.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="rounded-2xl border border-mn-border px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Refazer Triagem
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl bg-mn-teal px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#123B46] transition"
                >
                  Confirmar e Fechar
                </button>
              </div>
            </div>
          ) : (
            /* Formulário Guiado de Triagem */
            <div className="space-y-6">
              {/* 1. Motivo Principal */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">
                  1. Qual é o motivo principal da consulta?
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Selecione uma opção rápida ou descreva seu sintoma com suas palavras.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_COMPLAINTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setChiefComplaint(item)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                        chiefComplaint === item
                          ? "bg-mn-teal text-white shadow-sm"
                          : "border border-mn-border bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Ou descreva seu sintoma aqui..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full rounded-2xl border border-mn-border bg-mn-sand/60 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-mn-teal focus:bg-white"
                />
              </div>

              {/* 2. Duração dos Sintomas */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">
                  2. Há quanto tempo você sente esse sintoma?
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DURATION_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDuration(item)}
                      className={`rounded-xl p-2.5 text-xs font-medium text-center transition ${
                        duration === item
                          ? "border-2 border-mn-teal bg-mn-teal/10 font-bold text-mn-teal"
                          : "border border-mn-border bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Escala Analógica de Dor (0 a 10) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-slate-900">
                    3. Intensidade da dor ou incômodo:
                  </label>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      painLevel >= 7
                        ? "bg-red-100 text-red-700"
                        : painLevel >= 4
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    Nota {painLevel} / 10 (
                    {painLevel === 0
                      ? "Sem dor"
                      : painLevel <= 3
                      ? "Leve"
                      : painLevel <= 6
                      ? "Moderada"
                      : "Severa"}
                    )
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painLevel}
                  onChange={(e) => setPainLevel(parseInt(e.target.value, 10))}
                  className="w-full accent-[#164957] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1 mt-1">
                  <span>0 (Sem dor)</span>
                  <span>5 (Moderada)</span>
                  <span>10 (Insuportável)</span>
                </div>
              </div>

              {/* 4. Sintomas Associados */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">
                  4. Sente algum outro sintoma associado?
                </label>
                <div className="flex flex-wrap gap-2">
                  {ASSOCIATED_SYMPTOMS_OPTIONS.map((item) => {
                    const selected = associatedSymptoms.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleSymptom(item)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                          selected
                            ? "bg-mn-teal text-white shadow-sm"
                            : "border border-mn-border bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {selected ? "✓ " : "+ "}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Fatores Moduladores e Remédio */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    O que piora ou alivia o quadro?
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Piora com luz, melhora deitado..."
                    value={aggravatingFactors}
                    onChange={(e) => setAggravatingFactors(e.target.value)}
                    className="w-full rounded-xl border border-mn-border bg-mn-sand/60 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-mn-teal focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tomou algum remédio por conta própria?
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Paracetamol 750mg, Dipirona..."
                    value={previousMedication}
                    onChange={(e) => setPreviousMedication(e.target.value)}
                    className="w-full rounded-xl border border-mn-border bg-mn-sand/60 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-mn-teal focus:bg-white"
                  />
                </div>
              </div>

              {/* Botão de Envio com IA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isAnalyzing || !chiefComplaint.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-mn-teal px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#123B46] disabled:opacity-50 transition"
                >
                  <Sparkles size={18} />
                  <span>
                    {isAnalyzing
                      ? "A IA do MediNexus está analisando seus sintomas..."
                      : "Gerar Sumário Clínico com IA"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
