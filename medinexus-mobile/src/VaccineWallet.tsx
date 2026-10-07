import React, { useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Syringe,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  X,
} from "lucide-react-native";
import { colors, shadows } from "./theme";
import { Badge, Button } from "./ui";

export interface MobileVaccine {
  id: string;
  dependentId: string;
  name: string;
  dose: string;
  appliedAt: string;
  nextBooster?: string;
  status: "em_dia" | "reforco_pendente";
}

export const INITIAL_VACCINES: MobileVaccine[] = [
  {
    id: "v1",
    dependentId: "self",
    name: "Gripe (Influenza Quadrivalente)",
    dose: "Dose Anual 2026",
    appliedAt: "12/04/2026",
    nextBooster: "Abril de 2027",
    status: "em_dia",
  },
  {
    id: "v2",
    dependentId: "self",
    name: "Tétano e Difteria (dT adulto)",
    dose: "Reforço 10 anos",
    appliedAt: "10/08/2021",
    nextBooster: "Agosto de 2031",
    status: "em_dia",
  },
  {
    id: "v3",
    dependentId: "self",
    name: "Covid-19 (Bivalente Atualizada)",
    dose: "Dose de Reforço",
    appliedAt: "18/06/2025",
    nextBooster: "Junho de 2026",
    status: "reforco_pendente",
  },
  {
    id: "v4",
    dependentId: "self",
    name: "Hepatite B (Recombinante)",
    dose: "3 Doses Completas",
    appliedAt: "15/03/2018",
    status: "em_dia",
  },
  {
    id: "v5",
    dependentId: "self",
    name: "Febre Amarela (Dose Única CIVP)",
    dose: "Dose Única",
    appliedAt: "04/11/2019",
    status: "em_dia",
  },
  {
    id: "v6",
    dependentId: "dep-lucas",
    name: "HPV Quadrivalente",
    dose: "1ª Dose",
    appliedAt: "10/10/2025",
    nextBooster: "10/04/2026 (2ª dose)",
    status: "reforco_pendente",
  },
  {
    id: "v7",
    dependentId: "dep-maria",
    name: "Gripe (Influenza Idoso Alta Dosagem)",
    dose: "Dose Anual 2026",
    appliedAt: "05/04/2026",
    nextBooster: "Abril de 2027",
    status: "em_dia",
  },
];

interface VaccineWalletProps {
  activeDependentId: string;
  patientName: string;
}

export default function VaccineWallet({
  activeDependentId,
  patientName,
}: VaccineWalletProps) {
  const [vaccines, setVaccines] = useState<MobileVaccine[]>(INITIAL_VACCINES);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [vacName, setVacName] = useState("");
  const [vacDose, setVacDose] = useState("Dose única");
  const [vacDate, setVacDate] = useState("07/10/2026");
  const [vacBooster, setVacBooster] = useState("");

  const handleOpenMeuSUS = async () => {
    try {
      await Linking.openURL("https://meususdigital.saude.gov.br");
    } catch {
      // fallback
    }
  };

  const handleAddVaccine = () => {
    if (!vacName.trim()) return;
    const newVac: MobileVaccine = {
      id: `v-${Date.now()}`,
      dependentId: activeDependentId,
      name: vacName.trim(),
      dose: vacDose,
      appliedAt: vacDate.trim(),
      nextBooster: vacBooster.trim() || undefined,
      status: vacBooster.trim() ? "reforco_pendente" : "em_dia",
    };
    setVaccines([newVac, ...vaccines]);
    setVacName("");
    setVacBooster("");
    setModalOpen(false);
  };

  const list = vaccines.filter(
    (v) => v.dependentId === activeDependentId || activeDependentId === "all"
  );

  return (
    <View style={{ gap: 10 }}>
      {/* Banner Principal com Conexão Meu SUS Digital */}
      <View style={[styles.banner, shadows.sm]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.bannerIconBox}>
            <ShieldCheck size={22} color={colors.teal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Carteira de Vacinação Digital</Text>
            <Text style={styles.bannerSubtitle}>
              Sincronize com a Rede Nacional de Dados em Saúde (RNDS) e receba alertas de reforços anuais.
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          <Pressable
            accessibilityRole="button"
            onPress={handleOpenMeuSUS}
            style={[styles.susBtn, shadows.sm]}
          >
            <Text style={styles.susBtnText}>Abrir Meu SUS Digital</Text>
            <ArrowUpRight size={14} color="white" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setModalOpen(true)}
            style={[styles.addDoseBtn, shadows.sm]}
          >
            <Plus size={14} color={colors.teal} />
            <Text style={styles.addDoseBtnText}>Registrar dose</Text>
          </Pressable>
        </View>
      </View>

      {/* Alerta de Lembrete Preventivo */}
      <View style={styles.reminderBar}>
        <AlertTriangle size={16} color={colors.warning} />
        <Text style={styles.reminderText}>
          Campanha Anual: Reforço da vacina contra Gripe (Influenza) e Covid-19 recomendado.
        </Text>
      </View>

      {/* Lista de Vacinas */}
      {list.length === 0 ? (
        <View style={[styles.card, shadows.sm, { alignItems: "center", paddingVertical: 24 }]}>
          <Syringe size={32} color={colors.muted} />
          <Text style={[styles.cardTitle, { marginTop: 8 }]}>Nenhuma vacina cadastrada</Text>
          <Text style={styles.copy}>
            Cadastre doses tomadas por {patientName} para acompanhar reforços.
          </Text>
        </View>
      ) : (
        list.map((vac) => {
          const isUpToDate = vac.status === "em_dia";
          return (
            <View key={vac.id} style={[styles.card, shadows.sm]}>
              <View style={styles.cardHeaderRow}>
                <Badge
                  label={isUpToDate ? "EM DIA" : "REFORÇO PENDENTE"}
                  variant={isUpToDate ? "confirmed" : "pending"}
                />
                <Text style={styles.date}>Aplicada em {vac.appliedAt}</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.vacIconBox}>
                  <Syringe size={18} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{vac.name}</Text>
                  <Text style={styles.vacDoseText}>{vac.dose}</Text>
                </View>
              </View>

              {vac.nextBooster && (
                <View style={styles.boosterRow}>
                  <Clock size={13} color={colors.teal} />
                  <Text style={styles.boosterText}>Próximo reforço: {vac.nextBooster}</Text>
                </View>
              )}
            </View>
          );
        })
      )}

      {/* Modal Registrar Dose */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Syringe size={20} color={colors.teal} />
                <Text style={styles.modalTitle}>Registrar Dose de Vacina</Text>
              </View>
              <Pressable onPress={() => setModalOpen(false)} style={styles.closeBtn}>
                <X size={18} color={colors.graphite} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Nome da Vacina</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Gripe (Influenza), Tétano (dT), HPV..."
                  placeholderTextColor="#9CA3AF"
                  value={vacName}
                  onChangeText={setVacName}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Dose</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Dose Anual 2026, 1ª Dose, Reforço..."
                  placeholderTextColor="#9CA3AF"
                  value={vacDose}
                  onChangeText={setVacDose}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Data da Aplicação</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#9CA3AF"
                  value={vacDate}
                  onChangeText={setVacDate}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Próximo Reforço (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Em 1 ano, 10 anos, Em 6 meses..."
                  placeholderTextColor="#9CA3AF"
                  value={vacBooster}
                  onChangeText={setVacBooster}
                />
              </View>

              <Button title="Salvar na Carteira" onPress={handleAddVaccine} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.lightSage,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.teal,
    padding: 16,
    gap: 10,
  },
  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.tealDark,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: colors.graphite,
    lineHeight: 16,
    marginTop: 2,
  },
  susBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.teal,
    paddingVertical: 10,
    borderRadius: 12,
  },
  susBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  addDoseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.teal,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addDoseBtnText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "700",
  },
  reminderBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.warningBg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  reminderText: {
    flex: 1,
    fontSize: 12,
    color: colors.warning,
    fontWeight: "600",
    lineHeight: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.graphite,
  },
  date: {
    fontSize: 12,
    color: colors.muted,
  },
  vacIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
  },
  vacDoseText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.teal,
    marginTop: 1,
  },
  boosterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.sand,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 2,
  },
  boosterText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.teal,
  },
  copy: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
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
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.graphite,
  },
  input: {
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.graphite,
  },
});
