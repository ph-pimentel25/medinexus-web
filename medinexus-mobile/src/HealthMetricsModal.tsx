import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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
  RefreshCw,
  Check,
  CheckCircle2,
  Lock,
  X,
} from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import { colors, shadows } from "./theme";
import { Button } from "./ui";

const HEALTH_STORAGE_KEY = "medinexus_health_connected";

interface HealthMetricsModalProps {
  visible: boolean;
  onClose: () => void;
  patientName: string;
  isConnected?: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

export default function HealthMetricsModal({
  visible,
  onClose,
  patientName,
  isConnected: externalConnected,
  onConnectionChange,
}: HealthMetricsModalProps) {
  const isIOS = Platform.OS === "ios";
  // Google Fit foi descontinuado pelo Google; o substituto oficial no Android é o Health Connect.
  const providerName = isIOS ? "Apple Saúde (HealthKit)" : "Health Connect (Google)";
  const providerShort = isIOS ? "Apple Saúde" : "Health Connect";

  const [connected, setConnected] = useState<boolean>(externalConnected ?? false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(HEALTH_STORAGE_KEY);
        if (stored === "true") {
          setConnected(true);
          onConnectionChange?.(true);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (externalConnected !== undefined) setConnected(externalConnected);
  }, [externalConnected]);

  const handleConnect = async () => {
    setConnected(true);
    onConnectionChange?.(true);
    try {
      await SecureStore.setItemAsync(HEALTH_STORAGE_KEY, "true");
    } catch {}
  };

  const handleDisconnect = async () => {
    setConnected(false);
    onConnectionChange?.(false);
    try {
      await SecureStore.deleteItemAsync(HEALTH_STORAGE_KEY);
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, shadows.lg]}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Heart size={20} color="#E11D48" />
              <View>
                <Text style={styles.modalTitle}>MediNexus Saúde Conectada</Text>
                <Text style={styles.modalSubtitle}>Monitor de Biometria & Hábitos Preventivos</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.graphite} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
            {!connected ? (
              <View style={[styles.connectBox, shadows.sm]}>
                <View style={styles.connectIconRow}>
                  <View style={styles.connectIconCircle}>
                    <Smartphone size={24} color={colors.teal} />
                  </View>
                  <View style={styles.connectIconCircleHeart}>
                    <Heart size={22} color="#E11D48" />
                  </View>
                </View>

                <Text style={styles.connectTitle}>Vincular ao {providerName}</Text>
                <Text style={styles.connectCopy}>
                  {isIOS
                    ? "Permita que o MediNexus leia seus passos, frequência cardíaca e pressão arterial registrados no iPhone ou Apple Watch."
                    : "Permita que o MediNexus leia seus passos, frequência cardíaca e pressão arterial registrados no Health Connect (que reúne Google Fit, Samsung Health, Fitbit e outros)."}
                </Text>

                <View style={styles.securityBadge}>
                  <Lock size={13} color="#059669" />
                  <Text style={styles.securityText}>
                    Você escolhe o que compartilhar e pode desconectar a qualquer momento (LGPD).
                  </Text>
                </View>

                <Pressable accessibilityRole="button" onPress={handleConnect} style={[styles.connectBtn, shadows.md]}>
                  <Heart size={16} color="white" />
                  <Text style={styles.connectBtnText}>Conectar {providerShort}</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.syncBanner}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <Text style={styles.syncBannerTitle}>{providerShort} autorizado</Text>
                    </View>
                    <Pressable onPress={handleDisconnect} style={styles.disconnectBtn}>
                      <Text style={styles.disconnectBtnText}>Desconectar</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.syncBannerSubtitle}>
                    Aguardando a primeira sincronização de {patientName}. Os números aparecem aqui somente quando vierem do seu aparelho.
                  </Text>
                </View>

                <View style={[styles.metricCard, shadows.sm]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Footprints size={18} color={colors.teal} />
                      <Text style={styles.cardHeaderTitle}>Passos</Text>
                    </View>
                  </View>
                  <Text style={styles.bigNumber}>—</Text>
                  <Text style={styles.subNumber}>Sem dados ainda</Text>
                </View>

                <View style={[styles.metricCard, shadows.sm]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Heart size={18} color="#E11D48" />
                      <Text style={styles.cardHeaderTitle}>Frequência cardíaca</Text>
                    </View>
                  </View>
                  <Text style={styles.bigNumber}>—</Text>
                  <Text style={styles.subNumber}>Sem dados ainda</Text>
                </View>

                <View style={[styles.metricCard, shadows.sm]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Activity size={18} color={colors.purple} />
                      <Text style={styles.cardHeaderTitle}>Pressão arterial</Text>
                    </View>
                  </View>
                  <Text style={styles.bigNumber}>—</Text>
                  <Text style={styles.subNumber}>Sem dados ainda</Text>
                </View>
              </>
            )}
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
    fontSize: 16,
    fontWeight: "800",
    color: colors.graphite,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.muted,
  },
  closeBtn: {
    padding: 6,
  },
  connectBox: {
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  connectIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  connectIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
  },
  connectIconCircleHeart: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFE4E6",
    alignItems: "center",
    justifyContent: "center",
  },
  connectTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.graphite,
    textAlign: "center",
  },
  connectCopy: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    padding: 10,
  },
  securityText: {
    fontSize: 11,
    color: "#065F46",
    flex: 1,
    lineHeight: 15,
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E11D48",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: "100%",
    marginTop: 6,
  },
  connectBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  disconnectBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.sand,
  },
  disconnectBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
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

