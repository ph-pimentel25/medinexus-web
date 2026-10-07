import React, { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
} from "lucide-react-native";
import { colors, shadows } from "./theme";
import {
  generateAiTriageSummary,
  saveMobileTriage,
  loadMobileTriage,
  type PreConsultationTriage,
} from "./triage";

interface TriageModalProps {
  visible: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  doctorName?: string;
}

const COMMON_COMPLAINTS = [
  "Dor de cabeça / Enxaqueca",
  "Dor no peito / Palpitação",
  "Dor de estômago / Queimação",
  "Dor nas costas / Lombar",
  "Gripe / Tosse / Garganta",
  "Febre e mal-estar",
  "Alergia na pele",
  "Ansiedade / Insônia",
  "Check-up preventivo",
];

const DURATION_OPTIONS = [
  "Iniciou hoje (< 24h)",
  "Há 2 a 3 dias",
  "Há cerca de 1 semana",
  "Mais de 1 mês",
];

const ASSOCIATED_SYMPTOMS_OPTIONS = [
  "Febre alta",
  "Náusea ou vômito",
  "Tontura intensa",
  "Falta de ar / Cansaço",
  "Sensibilidade à luz",
  "Nenhum outro",
];

export default function TriageModal({
  visible,
  onClose,
  appointmentId,
  patientName,
  doctorName = "o médico",
}: TriageModalProps) {
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [duration, setDuration] = useState(DURATION_OPTIONS[1]);
  const [painLevel, setPainLevel] = useState<number>(3);
  const [associatedSymptoms, setAssociatedSymptoms] = useState<string[]>([]);
  const [aggravatingFactors, setAggravatingFactors] = useState("");
  const [previousMedication, setPreviousMedication] = useState("");
  const [result, setResult] = useState<PreConsultationTriage | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (visible && appointmentId) {
      void (async () => {
        const saved = await loadMobileTriage(appointmentId);
        if (saved) {
          setResult(saved);
        } else {
          setResult(null);
        }
      })();
    }
  }, [visible, appointmentId]);

  function toggleSymptom(symptom: string) {
    if (symptom === "Nenhum outro") {
      setAssociatedSymptoms(["Nenhum outro"]);
      return;
    }
    setAssociatedSymptoms((prev) => {
      const filtered = prev.filter((s) => s !== "Nenhum outro");
      if (filtered.includes(symptom)) {
        return filtered.filter((s) => s !== symptom);
      }
      return [...filtered, symptom];
    });
  }

  function handleGenerate() {
    if (!chiefComplaint.trim()) {
      alert("Por favor, selecione ou descreva o motivo da consulta.");
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

      void saveMobileTriage(triage);
      setResult(triage);
      setIsAnalyzing(false);
    }, 700);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, shadows.lg]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={styles.sparkleIconBox}>
                <Sparkles size={20} color={colors.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Triagem Pré-Consulta IA</Text>
                <Text style={styles.headerSub}>
                  Oriente seu atendimento com {doctorName}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <X size={20} color={colors.graphite} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {result ? (
              /* Resultado da Triagem */
              <View style={{ gap: 16 }}>
                <View style={styles.successBanner}>
                  <CheckCircle2 size={20} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.successTitle}>Triagem Concluída com IA!</Text>
                    <Text style={styles.successSub}>
                      Seu resumo clínico foi gerado e já está visível para o profissional antes da consulta.
                    </Text>
                  </View>
                </View>

                {/* Card de Nível e Hipóteses */}
                <View style={[styles.card, shadows.sm]}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.badgeLabel}>Classificação de Risco</Text>
                    <View
                      style={[
                        styles.urgencyBadge,
                        {
                          backgroundColor: result.aiSummary.urgencyLevel.includes("Prioritário")
                            ? "#FFE4E6"
                            : result.aiSummary.urgencyLevel.includes("Moderado")
                            ? "#FEF3C7"
                            : "#E8F3EE",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.urgencyBadgeText,
                          {
                            color: result.aiSummary.urgencyLevel.includes("Prioritário")
                              ? "#B91C1C"
                              : result.aiSummary.urgencyLevel.includes("Moderado")
                              ? "#B45309"
                              : colors.teal,
                          },
                        ]}
                      >
                        {result.aiSummary.urgencyLevel}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>Hipóteses Clínicas Preliminares</Text>
                  {result.aiSummary.suggestedHypotheses.map((h, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{h}</Text>
                    </View>
                  ))}

                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>Sumário para o Médico</Text>
                    <Text style={styles.summaryText}>{result.aiSummary.clinicalSummaryText}</Text>
                  </View>

                  <View style={styles.guidanceBox}>
                    <ShieldCheck size={16} color={colors.teal} />
                    <Text style={styles.guidanceText}>{result.aiSummary.preliminaryGuidance}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setResult(null)}
                    style={styles.secondaryBtn}
                  >
                    <Text style={styles.secondaryBtnText}>Refazer</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={onClose}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>Confirmar e Fechar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Formulário */
              <View style={{ gap: 18 }}>
                {/* 1. Motivo Principal */}
                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>1. Qual o motivo principal da consulta?</Text>
                  <View style={styles.chipsContainer}>
                    {COMMON_COMPLAINTS.map((item) => {
                      const selected = chiefComplaint === item;
                      return (
                        <Pressable
                          key={item}
                          onPress={() => setChiefComplaint(item)}
                          style={[styles.chip, selected && styles.chipSelected]}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <TextInput
                    placeholder="Ou descreva seu sintoma aqui..."
                    placeholderTextColor={colors.muted}
                    value={chiefComplaint}
                    onChangeText={setChiefComplaint}
                    style={styles.input}
                  />
                </View>

                {/* 2. Duração */}
                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>2. Há quanto tempo sente esse sintoma?</Text>
                  <View style={styles.durationGrid}>
                    {DURATION_OPTIONS.map((item) => {
                      const selected = duration === item;
                      return (
                        <Pressable
                          key={item}
                          onPress={() => setDuration(item)}
                          style={[styles.durationCard, selected && styles.durationCardSelected]}
                        >
                          <Text style={[styles.durationText, selected && styles.durationTextSelected]}>
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Escala de Dor (0 a 10) */}
                <View style={{ gap: 8 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.label}>3. Intensidade do incômodo / dor:</Text>
                    <Text style={[styles.painBadge, { color: painLevel >= 7 ? "#B91C1C" : painLevel >= 4 ? "#B45309" : colors.teal }]}>
                      Nota {painLevel} / 10
                    </Text>
                  </View>
                  <View style={styles.painSelectorRow}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const selected = painLevel === num;
                      return (
                        <Pressable
                          key={num}
                          onPress={() => setPainLevel(num)}
                          style={[
                            styles.painNumberBtn,
                            selected && styles.painNumberBtnSelected,
                          ]}
                        >
                          <Text style={[styles.painNumberText, selected && styles.painNumberTextSelected]}>
                            {num}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* 4. Sintomas Associados */}
                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>4. Sente algum outro sintoma associado?</Text>
                  <View style={styles.chipsContainer}>
                    {ASSOCIATED_SYMPTOMS_OPTIONS.map((item) => {
                      const selected = associatedSymptoms.includes(item);
                      return (
                        <Pressable
                          key={item}
                          onPress={() => toggleSymptom(item)}
                          style={[styles.chip, selected && styles.chipSelected]}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {selected ? "✓ " : "+ "}
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* 5. Agravantes & Remédios */}
                <View style={{ gap: 10 }}>
                  <View style={{ gap: 4 }}>
                    <Text style={styles.label}>O que piora ou alivia?</Text>
                    <TextInput
                      placeholder="Ex: Piora com esforço, melhora deitado..."
                      placeholderTextColor={colors.muted}
                      value={aggravatingFactors}
                      onChangeText={setAggravatingFactors}
                      style={styles.input}
                    />
                  </View>
                  <View style={{ gap: 4 }}>
                    <Text style={styles.label}>Tomou algum remédio por conta própria?</Text>
                    <TextInput
                      placeholder="Ex: Paracetamol 750mg, Dipirona..."
                      placeholderTextColor={colors.muted}
                      value={previousMedication}
                      onChangeText={setPreviousMedication}
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Botão de Análise com IA */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleGenerate}
                  disabled={isAnalyzing || !chiefComplaint.trim()}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { opacity: isAnalyzing || !chiefComplaint.trim() ? 0.5 : pressed ? 0.9 : 1 },
                  ]}
                >
                  <Sparkles size={18} color="white" />
                  <Text style={styles.primaryBtnText}>
                    {isAnalyzing ? "Analisando sintomas com IA..." : "Gerar Sumário Clínico com IA"}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sparkleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.graphite,
  },
  headerSub: {
    fontSize: 12,
    color: colors.muted,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: colors.sand,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  successBanner: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 14,
    borderRadius: 16,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  successSub: {
    fontSize: 12,
    color: "#15803D",
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.sand,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.graphite,
    textTransform: "uppercase",
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  bulletDot: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.teal,
  },
  bulletText: {
    fontSize: 12,
    color: colors.graphite,
    flex: 1,
    lineHeight: 17,
  },
  summaryBox: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 11,
    color: colors.graphite,
    lineHeight: 16,
  },
  guidanceBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  guidanceText: {
    fontSize: 11,
    color: "#0369A1",
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.graphite,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  chipText: {
    fontSize: 12,
    color: colors.graphite,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "white",
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.graphite,
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationCard: {
    flexBasis: "48%",
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  durationCardSelected: {
    backgroundColor: colors.lightSage,
    borderColor: colors.teal,
    borderWidth: 2,
  },
  durationText: {
    fontSize: 12,
    color: colors.graphite,
    fontWeight: "500",
  },
  durationTextSelected: {
    color: colors.teal,
    fontWeight: "700",
  },
  painBadge: {
    fontSize: 12,
    fontWeight: "700",
  },
  painSelectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  painNumberBtn: {
    width: 28,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.sand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  painNumberBtnSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  painNumberText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.graphite,
  },
  painNumberTextSelected: {
    color: "white",
    fontWeight: "700",
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.teal,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: colors.graphite,
    fontWeight: "600",
    fontSize: 13,
  },
});
