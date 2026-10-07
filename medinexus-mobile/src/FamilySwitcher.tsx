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
import { Users, UserRound, Baby, Heart, Plus, X } from "lucide-react-native";
import { colors, shadows } from "./theme";
import { Button } from "./ui";

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthDate: string;
  cpf?: string;
  healthPlan?: string;
}

export const INITIAL_DEPENDENTS: FamilyMember[] = [];

interface FamilySwitcherProps {
  activeId: string;
  onSelect: (id: string) => void;
  dependents: FamilyMember[];
  onAdd: (member: FamilyMember) => void;
}

export default function FamilySwitcher({
  activeId,
  onSelect,
  dependents,
  onAdd,
}: FamilySwitcherProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Filho(a)");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    const newMember: FamilyMember = {
      id: `dep-${Date.now()}`,
      name: name.trim(),
      relationship,
      birthDate: birthDate.trim() || "Não informada",
      cpf: cpf.trim() || undefined,
    };
    onAdd(newMember);
    setName("");
    setBirthDate("");
    setCpf("");
    setModalOpen(false);
    onSelect(newMember.id);
  };

  const activeDependent = dependents.find((d) => d.id === activeId);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Users size={15} color={colors.teal} />
        </View>
        <Text style={styles.title}>
          {activeId === "self"
            ? "Gestão Familiar: Você (Titular)"
            : `Gestão Familiar: ${activeDependent?.name} (${activeDependent?.relationship})`}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelect("self")}
          style={[styles.pill, activeId === "self" && styles.pillActive, shadows.sm]}
        >
          <UserRound size={13} color={activeId === "self" ? "white" : colors.graphite} />
          <Text style={[styles.pillText, activeId === "self" && styles.pillTextActive]}>Você</Text>
        </Pressable>

        {dependents.map((dep) => {
          const isSelected = activeId === dep.id;
          const isChild = dep.relationship.toLowerCase().includes("filh");
          return (
            <Pressable
              key={dep.id}
              accessibilityRole="button"
              onPress={() => onSelect(dep.id)}
              style={[styles.pill, isSelected && styles.pillActive, shadows.sm]}
            >
              {isChild ? (
                <Baby size={13} color={isSelected ? "white" : colors.graphite} />
              ) : (
                <Heart size={13} color={isSelected ? "white" : colors.graphite} />
              )}
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                {dep.name.split(" ")[0]} ({dep.relationship})
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          onPress={() => setModalOpen(true)}
          style={[styles.addPill, shadows.sm]}
        >
          <Plus size={13} color={colors.teal} />
          <Text style={styles.addPillText}>+ Familiar</Text>
        </Pressable>
      </ScrollView>

      {/* Modal Adicionar Familiar */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Users size={20} color={colors.teal} />
                <Text style={styles.modalTitle}>Cadastrar Familiar</Text>
              </View>
              <Pressable onPress={() => setModalOpen(false)} style={styles.closeBtn}>
                <X size={18} color={colors.graphite} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              <Text style={styles.copy}>
                Cadastre filhos menores ou pais idosos para gerenciar consultas, remédios e vacinas de toda a família.
              </Text>

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Nome completo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Lucas Henrique Pimentel"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Grau de parentesco</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {["Filho(a)", "Pai/Mãe", "Cônjuge", "Outro"].map((rel) => (
                    <Pressable
                      key={rel}
                      onPress={() => setRelationship(rel)}
                      style={[
                        styles.relPill,
                        relationship === rel && styles.relPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.relPillText,
                          relationship === rel && styles.relPillTextActive,
                        ]}
                      >
                        {rel}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Data de Nascimento (DD/MM/AAAA)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 14/05/2018"
                  placeholderTextColor="#9CA3AF"
                  value={birthDate}
                  onChangeText={setBirthDate}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>CPF (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000.000.000-00"
                  placeholderTextColor="#9CA3AF"
                  value={cpf}
                  onChangeText={setCpf}
                />
              </View>

              <Button title="Salvar Familiar" onPress={handleCreate} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.teal,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  pillActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.graphite,
  },
  pillTextActive: {
    color: "white",
    fontWeight: "700",
  },
  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.lightSage,
    borderWidth: 1,
    borderColor: colors.teal,
    borderStyle: "dashed",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.teal,
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
  copy: {
    fontSize: 13,
    color: colors.graphiteLight,
    lineHeight: 18,
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
  relPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relPillActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  relPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.graphite,
  },
  relPillTextActive: {
    color: "white",
    fontWeight: "700",
  },
});
