export interface TriageInput {
  appointmentId: string;
  patientName: string;
  chiefComplaint: string;
  duration: string;
  painLevel: number; // 0 a 10
  associatedSymptoms: string[];
  aggravatingFactors: string;
  previousMedication: string;
}

export interface PreConsultationTriage {
  id: string;
  appointmentId: string;
  patientName: string;
  chiefComplaint: string;
  duration: string;
  painLevel: number;
  associatedSymptoms: string[];
  aggravatingFactors: string;
  previousMedication: string;
  aiSummary: {
    urgencyLevel: "Habitual (Verde)" | "Moderado (Amarelo)" | "Prioritário (Laranja)";
    suggestedHypotheses: string[];
    clinicalSummaryText: string;
    preliminaryGuidance: string;
  };
  completedAt: string;
}

const STORAGE_PREFIX = "medinexus_triage_";

/**
 * Motor com IA para análise de sintomas e geração de sumário clínico pré-consulta.
 */
export function generateAiTriageSummary(input: TriageInput): PreConsultationTriage {
  const pain = input.painLevel;
  const symptoms = input.associatedSymptoms;
  const complaint = input.chiefComplaint.toLowerCase();

  let urgencyLevel: PreConsultationTriage["aiSummary"]["urgencyLevel"] = "Habitual (Verde)";
  if (pain >= 8 || symptoms.includes("Falta de ar") || symptoms.includes("Dor precordial / peito")) {
    urgencyLevel = "Prioritário (Laranja)";
  } else if (pain >= 5 || symptoms.includes("Febre alta") || symptoms.includes("Tontura intensa")) {
    urgencyLevel = "Moderado (Amarelo)";
  }

  const hypotheses: string[] = [];
  if (complaint.includes("cabeça") || complaint.includes("enxaqueca")) {
    hypotheses.push("Cefaleia tensional vs. Crise de migrânea com foto/fonofobia");
    hypotheses.push("Possível componente tensional musculoesquelético cervical");
  } else if (complaint.includes("peito") || complaint.includes("coração") || complaint.includes("palpitação")) {
    hypotheses.push("Desconforto precordial atípico a investigar (origem musculoesquelética vs. cardiovascular)");
    hypotheses.push("Síndrome ansiosa com somatização autonômica");
  } else if (complaint.includes("estômago") || complaint.includes("barriga") || complaint.includes("azia")) {
    hypotheses.push("Dispepsia funcional vs. Doença do refluxo gastroesofágico");
    hypotheses.push("Gastroenterite aguda ou intolerância alimentar recente");
  } else if (complaint.includes("garganta") || complaint.includes("tosse") || complaint.includes("gripe")) {
    hypotheses.push("Infecção de vias aéreas superiores (IVAS) de etiologia viral");
    hypotheses.push("Faringoamigdalite a correlacionar com oroscopia");
  } else {
    hypotheses.push(`Investigação de ${input.chiefComplaint} de evolução ${input.duration.toLowerCase()}`);
    hypotheses.push("Quadro clínico inicial sem sinais de choque ou alarme imediato");
  }

  const clinicalSummaryText = [
    `[TRIAGEM PRÉ-CONSULTA MEDINEXUS AI]`,
    `• Queixa principal: ${input.chiefComplaint} (Evolução: ${input.duration})`,
    `• Escala analógica de dor: ${input.painLevel}/10 (${input.painLevel >= 7 ? "Severa" : input.painLevel >= 4 ? "Moderada" : "Leve/Ausente"})`,
    `• Sintomas associados relatados: ${symptoms.length > 0 ? symptoms.join(", ") : "Nenhum relatado"}`,
    `• Fatores moduladores: ${input.aggravatingFactors || "Não informado"}`,
    `• Medicação prévia em domicílio: ${input.previousMedication || "Nenhuma relatada"}`,
    `• Classificação preliminar de risco: ${urgencyLevel}`,
  ].join("\n");

  const preliminaryGuidance =
    urgencyLevel === "Prioritário (Laranja)"
      ? "Paciente apresenta intensidade de sintomas elevada. Recomenda-se priorizar o acolhimento na chamada/consultório e avaliar sinais vitais."
      : "Paciente estável. Dados coletados prontos para subsidiar a anamnese e acelerar o preenchimento do prontuário.";

  return {
    id: `triage-${Date.now()}`,
    appointmentId: input.appointmentId,
    patientName: input.patientName,
    chiefComplaint: input.chiefComplaint,
    duration: input.duration,
    painLevel: input.painLevel,
    associatedSymptoms: input.associatedSymptoms,
    aggravatingFactors: input.aggravatingFactors,
    previousMedication: input.previousMedication,
    aiSummary: {
      urgencyLevel,
      suggestedHypotheses: hypotheses,
      clinicalSummaryText,
      preliminaryGuidance,
    },
    completedAt: new Date().toISOString(),
  };
}

export function saveTriage(triage: PreConsultationTriage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${triage.appointmentId}`, JSON.stringify(triage));
  } catch (err) {
    console.warn("Erro ao salvar triagem:", err);
  }
}

export function loadTriage(appointmentId: string): PreConsultationTriage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${appointmentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
