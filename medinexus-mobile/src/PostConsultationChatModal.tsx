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
  MessageSquare,
  Clock,
  Send,
  X,
  ShieldCheck,
  Lock,
  CheckCheck,
} from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import { colors, shadows } from "./theme";

interface ChatMessage {
  id: string;
  sender: "patient" | "doctor" | "system";
  senderName: string;
  content: string;
  timestamp: string;
}

interface PostConsultationChatModalProps {
  visible: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  doctorName: string;
  appointmentDate?: string;
}

const STORAGE_PREFIX = "medinexus_post_chat_";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function PostConsultationChatModal({
  visible,
  onClose,
  appointmentId,
  patientName,
  doctorName,
  appointmentDate,
}: PostConsultationChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newText, setNewText] = useState("");

  const consultationTimestamp = appointmentDate
    ? new Date(appointmentDate).getTime()
    : Date.now() - 2 * 24 * 60 * 60 * 1000;

  const expiryTimestamp = consultationTimestamp + SEVEN_DAYS_MS;
  const now = Date.now();
  const isExpired = now > expiryTimestamp;
  const daysRemaining = Math.max(0, Math.ceil((expiryTimestamp - now) / (24 * 60 * 60 * 1000)));

  useEffect(() => {
    if (visible && appointmentId) {
      void (async () => {
        try {
          const raw = await SecureStore.getItemAsync(`${STORAGE_PREFIX}${appointmentId}`);
          if (raw) {
            setMessages(JSON.parse(raw));
          } else {
            const initial: ChatMessage[] = [
              {
                id: "msg-0",
                sender: "system",
                senderName: "MediNexus Cuidado Contínuo",
                content: `Canal de dúvidas pós-consulta com Dr(a). ${doctorName}. Conforme as diretrizes clínicas e do CFM, este canal é exclusivo para esclarecimentos sobre a receita e permanecerá ativo por 7 dias.`,
                timestamp: new Date(consultationTimestamp).toISOString(),
              },
              {
                id: "msg-1",
                sender: "doctor",
                senderName: doctorName,
                content: `Olá, ${patientName}! Caso tenha ficado alguma dúvida sobre os remédios ou exames que combinamos, pode me enviar por aqui durante esta semana.`,
                timestamp: new Date(consultationTimestamp + 5 * 60 * 1000).toISOString(),
              },
            ];
            setMessages(initial);
            await SecureStore.setItemAsync(`${STORAGE_PREFIX}${appointmentId}`, JSON.stringify(initial));
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [visible, appointmentId, consultationTimestamp, doctorName, patientName]);

  async function handleSend() {
    if (!newText.trim() || isExpired) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "patient",
      senderName: patientName,
      content: newText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    setNewText("");

    try {
      await SecureStore.setItemAsync(`${STORAGE_PREFIX}${appointmentId}`, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Resposta de confirmação automática do consultório
    setTimeout(() => {
      void (async () => {
        const reply: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "doctor",
          senderName: doctorName,
          content: "Recebi sua dúvida! Estou verificando seus apontamentos e lhe oriento em breve.",
          timestamp: new Date().toISOString(),
        };
        const withReply = [...updated, reply];
        setMessages(withReply);
        try {
          await SecureStore.setItemAsync(`${STORAGE_PREFIX}${appointmentId}`, JSON.stringify(withReply));
        } catch {
          // ignore
        }
      })();
    }, 1500);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, shadows.lg]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={styles.iconBox}>
                <MessageSquare size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Dúvidas com Dr(a). {doctorName}</Text>
                <Text style={styles.headerSub}>Canal pós-consulta com validade de 7 dias</Text>
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

          {/* Banner de Status */}
          <View
            style={[
              styles.statusBar,
              { backgroundColor: isExpired ? colors.sandDark : colors.lightSage },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {isExpired ? <Lock size={14} color={colors.muted} /> : <Clock size={14} color={colors.teal} />}
              <Text
                style={[
                  styles.statusText,
                  { color: isExpired ? colors.graphite : colors.teal },
                ]}
              >
                {isExpired
                  ? "Canal encerrado após 7 dias (diretrizes CFM)."
                  : `Canal pós-consulta ativo • Restam ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}`}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={13} color={colors.teal} />
              <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>Seguro</Text>
            </View>
          </View>

          {/* Mensagens */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContainer}
          >
            {messages.map((msg) => {
              if (msg.sender === "system") {
                return (
                  <View key={msg.id} style={styles.systemMessage}>
                    <Text style={styles.systemText}>{msg.content}</Text>
                  </View>
                );
              }

              const isMine = msg.sender === "patient";

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageWrapper,
                    isMine ? { alignItems: "flex-end" } : { alignItems: "flex-start" },
                  ]}
                >
                  <Text style={styles.senderName}>{msg.senderName}</Text>
                  <View
                    style={[
                      styles.bubble,
                      isMine ? styles.myBubble : styles.theirBubble,
                    ]}
                  >
                    <Text style={[styles.bubbleText, isMine && styles.myBubbleText]}>
                      {msg.content}
                    </Text>
                    <View style={styles.bubbleFooter}>
                      <Text style={[styles.bubbleTime, isMine && { color: "rgba(255,255,255,0.7)" }]}>
                        {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {isMine && <CheckCheck size={12} color="white" />}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Input Footer */}
          <View style={styles.footer}>
            {isExpired ? (
              <View style={styles.expiredNotice}>
                <Lock size={16} color={colors.muted} />
                <Text style={styles.expiredText}>
                  Prazo de 7 dias pós-consulta finalizado. Para novas dúvidas ou sintomas, agende uma nova consulta.
                </Text>
              </View>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="Tire sua dúvida sobre remédio ou orientação..."
                  placeholderTextColor={colors.muted}
                  value={newText}
                  onChangeText={setNewText}
                  style={styles.textInput}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleSend()}
                  disabled={!newText.trim()}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    { opacity: !newText.trim() ? 0.4 : pressed ? 0.8 : 1 },
                  ]}
                >
                  <Send size={18} color="white" />
                </Pressable>
              </View>
            )}
          </View>
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
    height: "85%",
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.graphite,
  },
  headerSub: {
    fontSize: 11,
    color: colors.muted,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: colors.sand,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  messagesContainer: {
    padding: 18,
    gap: 12,
  },
  systemMessage: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  systemText: {
    fontSize: 11,
    color: "#1E40AF",
    textAlign: "center",
    lineHeight: 16,
  },
  messageWrapper: {
    gap: 2,
  },
  senderName: {
    fontSize: 10,
    color: colors.muted,
    paddingHorizontal: 4,
    fontWeight: "600",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: colors.teal,
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 13,
    color: colors.graphite,
    lineHeight: 18,
  },
  myBubbleText: {
    color: "white",
  },
  bubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 9,
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.graphite,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  expiredNotice: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.sandDark,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  expiredText: {
    fontSize: 11,
    color: colors.muted,
    flex: 1,
    lineHeight: 16,
  },
});
