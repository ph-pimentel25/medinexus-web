import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Heart,
  Footprints,
  Activity,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
  X,
} from "lucide-react-native";
import { colors, shadows } from "./theme";

interface HealthMetricsModalProps {
  visible: boolean;
  onClose: () => void;
  patientName: string;
}

export default function HealthMetricsModal({
  visible,
  onClose,
  patientName,
}: HealthMetricsModalProps) {
  const weeklySteps = [
    { label: "Sem 1", steps: 52, pct: 85 },
    { label: "Sem 2", steps: 58, pct: 95 },
    { label: "Sem 3", steps: 49, pct: 80 },
    { label: "Sem 4", steps: 59, pct: 98 },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, shadows.lg]}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Heart size={20} color="#E11D48" />
              <Text style={styles.modalTitle}>Apple Health & Google Fit</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.graphite} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
            {/* Banner de Sincronização Ativa */}
            <View style={styles.syncBanner}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Smartphone size={16} color="#10B981" />
                <Text style={styles.syncBannerTitle}>Sincronização Biometria Ativa</Text>
              </View>
              <Text style={styles.syncBannerSubtitle}>
                Dados preventivos coletados para {patientName} • Última leitura: Hoje às 08:32
              </Text>
            </View>

            {/* Card 1: Passos & Atividade */}
            <View style={[styles.metricCard, shadows.sm]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Footprints size={18} color={colors.teal} />
                  <Text style={styles.cardHeaderTitle}>Registro Mensal de Passos</Text>
                </View>
                <Text style={styles.cardBadge}>Setembro / 2026</Text>
              </View>

              <Text style={styles.bigNumber}>
                218.400 <Text style={styles.unitText}>passos</Text>
              </Text>
              <Text style={styles.subNumber}>
                Média diária: 7.280 passos/dia (Meta de 8k atingida em 74% dos dias)
              </Text>

              {/* Mini gráfico semanal */}
              <View style={styles.chartContainer}>
                {weeklySteps.map((w) => (
                  <View key={w.label} style={styles.chartCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${w.pct}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{w.label}</Text>
                    <Text style={styles.barSub}>{w.steps}k</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Card 2: Frequência Cardíaca & Dia com Maior Pico */}
            <View style={[styles.metricCard, shadows.sm]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Heart size={18} color="#E11D48" />
                  <Text style={styles.cardHeaderTitle}>Frequência Cardíaca</Text>
                </View>
                <Text style={[styles.cardBadge, { color: "#E11D48", backgroundColor: "#FFE4E6" }]}>
                  Sensor Óptico
                </Text>
              </View>

              <Text style={styles.bigNumber}>
                68 <Text style={styles.unitText}>bpm (repouso)</Text>
              </Text>
              <Text style={styles.subNumber}>Faixa habitual em repouso: 52 a 60 bpm</Text>

              {/* Destaque Maior Pico */}
              <View style={styles.peakBox}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Zap size={14} color="#E11D48" />
                  <Text style={styles.peakBoxTitle}>Dia com Maior Pico no Mês</Text>
                </View>
                <Text style={styles.peakBoxNumber}>142 bpm em 24 de Setembro</Text>
                <Text style={styles.peakBoxDesc}>
                  Registrado às 07:45 durante exercício aeróbico matinal. Recuperação cardiovascular rápida e fisiológica.
                </Text>
              </View>
            </View>

            {/* Card 3: Pressão Arterial */}
            <View style={[styles.metricCard, shadows.sm]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Activity size={18} color={colors.purple} />
                  <Text style={styles.cardHeaderTitle}>Pressão Arterial Recente</Text>
                </View>
                <Text style={[styles.cardBadge, { color: "#10B981", backgroundColor: "#E6F4EA" }]}>
                  Classificação Ótima
                </Text>
              </View>

              <Text style={styles.bigNumber}>
                120 / 78 <Text style={styles.unitText}>mmHg</Text>
              </Text>
              <Text style={styles.subNumber}>Última aferição: 02/Out às 07:15</Text>
            </View>

            {/* Tendência Preventiva IA */}
            <View style={styles.preventiveCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Sparkles size={16} color={colors.teal} />
                <Text style={styles.preventiveTitle}>Análise Preventiva Médica</Text>
              </View>
              <Text style={styles.preventiveText}>
                Risco cardiovascular baixo. Variação de frequência cardíaca e pressão arterial compatíveis com hábitos saudáveis. Dados acessíveis pelo médico durante suas consultas.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "88%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.graphite,
  },
  closeBtn: {
    padding: 6,
  },
  syncBanner: {
    backgroundColor: colors.sand,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  syncBannerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.graphite,
  },
  syncBannerSubtitle: {
    fontSize: 11,
    color: colors.muted,
  },
  metricCard: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.graphite,
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.teal,
    backgroundColor: colors.lightSage,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bigNumber: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.graphite,
    marginTop: 2,
  },
  unitText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  subNumber: {
    fontSize: 11,
    color: colors.muted,
  },
  chartContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barTrack: {
    width: "100%",
    height: 48,
    backgroundColor: colors.sand,
    borderRadius: 6,
    justifyContent: "flex-end",
    padding: 2,
  },
  barFill: {
    width: "100%",
    backgroundColor: colors.teal,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.graphite,
  },
  barSub: {
    fontSize: 9,
    color: colors.muted,
  },
  peakBox: {
    backgroundColor: "#FFF1F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECDD3",
    padding: 10,
    marginTop: 6,
    gap: 2,
  },
  peakBoxTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9F1239",
  },
  peakBoxNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#BE123C",
  },
  peakBoxDesc: {
    fontSize: 11,
    color: "#9F1239",
    lineHeight: 15,
  },
  preventiveCard: {
    backgroundColor: colors.lightSage,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.teal,
    gap: 4,
  },
  preventiveTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.tealDark,
  },
  preventiveText: {
    fontSize: 11,
    color: colors.graphite,
    lineHeight: 16,
  },
});
