import React, { useState } from "react";
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
  Syringe,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  QrCode,
  Building2,
  Tag,
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
  batch?: string;
  manufacturer?: string;
  healthUnit?: string;
  nextBooster?: string;
  status: "em_dia" | "reforco_pendente";
}

// Sem dados de exemplo: as doses vêm do registro oficial (RNDS) ou são informadas pelo paciente.
export const INITIAL_VACCINES: MobileVaccine[] = [];

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
  const [vacDose, setVacDose] = useState("Dose Anual");
  const [vacManufacturer, setVacManufacturer] = useState("");
  const [vacBatch, setVacBatch] = useState("");
  const [vacHealthUnit, setVacHealthUnit] = useState("");
  const [vacDate, setVacDate] = useState("07/10/2026");
  const [vacBooster, setVacBooster] = useState("");

  const handleAddVaccine = () => {
    if (!vacName.trim()) return;
    const newVac: MobileVaccine = {
      id: `v-${Date.now()}`,
      dependentId: activeDependentId,
      name: vacName.trim(),
      dose: vacDose.trim() || "Dose única",
      appliedAt: vacDate.trim(),
      manufacturer: vacManufacturer.trim() || undefined,
      batch: vacBatch.trim() || undefined,
      healthUnit: vacHealthUnit.trim() || undefined,
      nextBooster: vacBooster.trim() || undefined,
      status: vacBooster.trim() ? "reforco_pendente" : "em_dia",
    };
    setVaccines([newVac, ...vaccines]);
    setVacName("");
    setVacManufacturer("");
    setVacBatch("");
    setVacHealthUnit("");
    setVacBooster("");
    setModalOpen(false);
  };

  const list = vaccines.filter(
    (v) => v.dependentId === activeDependentId || activeDependentId === "all"
  );

  return (
    <View style={{ gap: 12 }}>
      {/* Certificado Nacional Oficial de Vacinação Digital (RNDS / SUS) */}
      <View style={[styles.certCard, shadows.md]}>
        {/* Cabeçalho Federal */}
        <View style={styles.certHeader}>
          <View style={styles.certEmblemBox}>
            <ShieldCheck size={20} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.certGovText}>MEU REGISTRO PESSOAL</Text>
            <Text style={styles.certMinistryText}>Integração SUS / RNDS em breve</Text>
          </View>
          <View style={styles.certBadgeOnline}>
            <Clock size={12} color="#059669" />
            <Text style={styles.certBadgeOnlineText}>SUS: EM BREVE</Text>
          </View>
        </View>

        {/* Título Oficial */}
        <View style={styles.certTitleBlock}>
          <Text style={styles.certDocTitle}>Carteira Nacional de Vacinação Digital</Text>
          <Text style={styles.certDocSubtitle}>
            Seu registro pessoal de vacinas. A conexão oficial com o SUS chega em breve.
          </Text>
        </View>

        {/* Dados do Portador / Documento Oficial */}
        <View style={styles.certPatientBox}>
          <View style={styles.certRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.certMetaLabel}>NOME DO TITULAR</Text>
              <Text style={styles.certMetaValue}>{patientName}</Text>
            </View>
            <View>
              <Text style={styles.certMetaLabel}>CPF</Text>
              <Text style={styles.certMetaValue}>Não informado</Text>
            </View>
          </View>

          <View style={[styles.certRow, { marginTop: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.certMetaLabel}>CARTÃO NACIONAL DE SAÚDE (CNS)</Text>
              <Text style={styles.certMetaMono}>Não informado</Text>
            </View>
            <View>
              <Text style={styles.certMetaLabel}>CHAVE DE VALIDAÇÃO</Text>
              <Text style={styles.certMetaMono}>Indisponível</Text>
            </View>
          </View>
        </View>

        {/* Rodapé com Selo e Botão Adicionar */}
        <View style={styles.certFooter}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <QrCode size={16} color={colors.teal} />
            <Text style={styles.certLegalText}>
              Registro informado pelo paciente. A validação oficial exige a conexão com a RNDS (gov.br), ainda não habilitada.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setModalOpen(true)}
            style={[styles.addBtn, shadows.sm]}
          >
            <Plus size={14} color="white" />
            <Text style={styles.addBtnText}>Registrar dose</Text>
          </Pressable>
        </View>
      </View>

      {/* Alerta de Lembrete Preventivo */}
      <View style={styles.reminderBar}>
        <AlertTriangle size={16} color={colors.warning} />
        <Text style={styles.reminderText}>
          Consulte seu calendário de vacinação no posto de saúde ou com seu médico. Lembretes de reforço usarão as datas que você registrar.
        </Text>
      </View>

      {/* Lista de Vacinas / Imunobiológicos */}
      {list.length === 0 ? (
        <View style={[styles.card, shadows.sm, { alignItems: "center", paddingVertical: 26 }]}>
          <Syringe size={32} color={colors.muted} />
          <Text style={[styles.cardTitle, { marginTop: 8 }]}>Nenhuma vacina registrada</Text>
          <Text style={styles.copy}>
            Cadastre doses tomadas por {patientName} para manter a carteira nacional em dia.
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

              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <View style={styles.vacIconBox}>
                  <Syringe size={18} color={colors.teal} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.cardTitle}>{vac.name}</Text>
                  <Text style={styles.vacDoseText}>{vac.dose}</Text>
                </View>
              </View>

              {/* Informações detalhadas do imunobiológico */}
              <View style={styles.detailsBlock}>
                {vac.manufacturer && (
                  <View style={styles.detailRow}>
                    <Tag size={12} color={colors.muted} />
                    <Text style={styles.detailText}>
                      <Text style={{ fontWeight: "700" }}>Fabricante:</Text> {vac.manufacturer}
                      {vac.batch ? ` • Lote: ${vac.batch}` : ""}
                    </Text>
                  </View>
                )}

                {vac.healthUnit && (
                  <View style={styles.detailRow}>
                    <Building2 size={12} color={colors.muted} />
                    <Text style={styles.detailText}>
                      <Text style={{ fontWeight: "700" }}>Estabelecimento:</Text> {vac.healthUnit}
                    </Text>
                  </View>
                )}
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
                <Text style={styles.label}>Nome do Imunobiológico / Vacina</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Covid-19, Gripe (Influenza), Tétano (dT), HPV..."
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

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.label}>Fabricante / Laboratório</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Butantan, Pfizer, Fiocruz..."
                    placeholderTextColor="#9CA3AF"
                    value={vacManufacturer}
                    onChangeText={setVacManufacturer}
                  />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.label}>Lote</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: INF260401"
                    placeholderTextColor="#9CA3AF"
                    value={vacBatch}
                    onChangeText={setVacBatch}
                  />
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Unidade de Saúde / Estabelecimento (CNES)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: UBS Vila Mariana, Clínica MediNexus..."
                  placeholderTextColor="#9CA3AF"
                  value={vacHealthUnit}
                  onChangeText={setVacHealthUnit}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.label}>Data da Aplicação</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#9CA3AF"
                    value={vacDate}
                    onChangeText={setVacDate}
                  />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.label}>Próximo Reforço (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Abril de 2027"
                    placeholderTextColor="#9CA3AF"
                    value={vacBooster}
                    onChangeText={setVacBooster}
                  />
                </View>
              </View>

              <Button title="Salvar registro" onPress={handleAddVaccine} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  certCard: {
    backgroundColor: "#0B2B33",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E4C56",
    padding: 16,
    gap: 12,
  },
  certHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.12)",
    paddingBottom: 10,
  },
  certEmblemBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  certGovText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#99F6E4",
    letterSpacing: 0.5,
  },
  certMinistryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    marginTop: 1,
  },
  certBadgeOnline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  certBadgeOnlineText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6EE7B7",
  },
  certTitleBlock: {
    gap: 2,
  },
  certDocTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
  },
  certDocSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
  },
  certPatientBox: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  certRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  certMetaLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  certMetaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
    marginTop: 2,
  },
  certMetaMono: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "monospace",
    color: "#5EEAD4",
    marginTop: 2,
  },
  certFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 4,
  },
  certLegalText: {
    fontSize: 10,
    color: "#94A3B8",
    flex: 1,
    lineHeight: 14,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  detailsBlock: {
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 11,
    color: colors.graphite,
    flex: 1,
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


