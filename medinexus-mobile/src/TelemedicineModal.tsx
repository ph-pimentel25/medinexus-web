import React, { useEffect, useState } from "react";
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
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Lock,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  X,
  Stethoscope,
} from "lucide-react-native";
import { colors, shadows } from "./theme";

interface TelemedicineModalProps {
  visible: boolean;
  appointment: Record<string, unknown> | null;
  onClose: () => void;
}

export default function TelemedicineModal({
  visible,
  appointment,
  onClose,
}: TelemedicineModalProps) {
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: "doctor" | "patient" | "system"; text: string; time: string }[]
  >([
    {
      id: "m0",
      sender: "system",
      text: "Sala Segura MediNexus com Criptografia E2E (Resolução CFM 2.314/2022).",
      time: "Agora",
    },
    {
      id: "m1",
      sender: "doctor",
      text: "Olá! Boa tarde. Estou com seu prontuário aberto. Consegue me ouvir bem?",
      time: "14:02",
    },
  ]);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (!visible) {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const formatTimer = (total: number) => {
    const mins = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const secs = (total % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        sender: "patient",
        text: inputText.trim(),
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInputText("");
  };

  const doctorData = (appointment?.doctors as Record<string, unknown>) || null;
  const doctorName = String(doctorData?.name || "Dr. Rafael Macedo");

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={styles.badgeLive}>
              <View style={styles.pulseDot} />
              <Text style={styles.badgeLiveText}>AO VIVO</Text>
            </View>
            <View>
              <Text style={styles.doctorName} numberOfLines={1}>{doctorName}</Text>
              <Text style={styles.specialty}>Telemedicina MediNexus</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={styles.timerBox}>
              <Clock size={12} color={colors.lightTeal} />
              <Text style={styles.timerText}>{formatTimer(callDuration)}</Text>
            </View>

            <Pressable onPress={() => setShowChat(!showChat)} style={styles.chatToggleBtn}>
              <MessageSquare size={18} color="white" />
              {chatMessages.length > 0 && (
                <View style={styles.chatCountBadge}>
                  <Text style={styles.chatCountText}>{chatMessages.length}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Video Stage */}
        <View style={styles.videoStage}>
          {/* Doctor Video Feed Simulation */}
          <View style={styles.doctorFeed}>
            <View style={styles.doctorAvatarCircle}>
              <Text style={styles.doctorInitials}>
                {doctorName
                  .split(" ")
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")}
              </Text>
              <View style={styles.onlineBadge}>
                <CheckCircle2 size={12} color="white" />
              </View>
            </View>
            <Text style={styles.doctorFeedName}>{doctorName}</Text>
            <Text style={styles.doctorFeedStatus}>Áudio HD Estável • Câmera Ativa</Text>
          </View>

          {/* Local Patient Self-Preview (PiP) */}
          <View style={styles.pipView}>
            {camActive ? (
              <View style={styles.pipFeed}>
                <View style={styles.pipAvatarMini}>
                  <Text style={{ color: "white", fontSize: 13, fontWeight: "700" }}>Você</Text>
                </View>
              </View>
            ) : (
              <View style={styles.pipDisabled}>
                <VideoOff size={16} color="#9CA3AF" />
                <Text style={styles.pipDisabledText}>Câmera off</Text>
              </View>
            )}
            <View style={styles.pipLabel}>
              <Text style={styles.pipLabelText}>Você</Text>
              {!micActive && <MicOff size={10} color="#F87171" />}
            </View>
          </View>

          {/* Selo Criptografia */}
          <View style={styles.encryptionSeal}>
            <Lock size={12} color="#34D399" />
            <Text style={styles.encryptionSealText}>
              Criptografia E2E Ponta a Ponta · CFM 2.314/2022
            </Text>
          </View>
        </View>

        {/* Chat Drawer lateral/inferior */}
        {showChat && (
          <View style={styles.chatDrawer}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Chat Seguro da Consulta</Text>
              <Pressable onPress={() => setShowChat(false)}>
                <X size={16} color="white" />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1, padding: 10 }}>
              {chatMessages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.chatMsgBubble,
                    m.sender === "patient"
                      ? styles.chatMsgPatient
                      : m.sender === "system"
                      ? styles.chatMsgSystem
                      : styles.chatMsgDoctor,
                  ]}
                >
                  <Text style={styles.chatMsgText}>{m.text}</Text>
                  <Text style={styles.chatMsgTime}>{m.time}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Digite sua mensagem..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
              />
              <Pressable onPress={handleSendMessage} style={styles.chatSendBtn}>
                <Send size={15} color="white" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Floating Bottom Dock */}
        <View style={styles.bottomDock}>
          <Pressable
            onPress={() => setMicActive(!micActive)}
            style={[styles.dockBtn, !micActive && styles.dockBtnMuted]}
          >
            {micActive ? <Mic size={22} color="white" /> : <MicOff size={22} color="white" />}
          </Pressable>

          <Pressable
            onPress={() => setCamActive(!camActive)}
            style={[styles.dockBtn, !camActive && styles.dockBtnMuted]}
          >
            {camActive ? <Video size={22} color="white" /> : <VideoOff size={22} color="white" />}
          </Pressable>

          <Pressable onPress={onClose} style={styles.dockEndCallBtn}>
            <PhoneOff size={24} color="white" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07131B",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0B212B",
    borderBottomWidth: 1,
    borderBottomColor: "#133747",
  },
  badgeLive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  badgeLiveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#34D399",
  },
  doctorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    maxWidth: 160,
  },
  specialty: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#133747",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    fontFamily: "monospace",
  },
  chatToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#133747",
    alignItems: "center",
    justifyContent: "center",
  },
  chatCountBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 7,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  chatCountText: {
    fontSize: 9,
    fontWeight: "800",
    color: "white",
  },
  videoStage: {
    flex: 1,
    backgroundColor: "#050F15",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  doctorFeed: {
    alignItems: "center",
    gap: 12,
  },
  doctorAvatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.teal,
    borderWidth: 3,
    borderColor: colors.lightTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  doctorInitials: {
    fontSize: 34,
    fontWeight: "800",
    color: "white",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#10B981",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  doctorFeedName: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },
  doctorFeedStatus: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  pipView: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#1E4F63",
    backgroundColor: "#0B212B",
    overflow: "hidden",
  },
  pipFeed: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#113240",
  },
  pipAvatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  pipDisabled: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#1C2D37",
  },
  pipDisabledText: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  pipLabel: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pipLabelText: {
    fontSize: 9,
    fontWeight: "700",
    color: "white",
  },
  encryptionSeal: {
    position: "absolute",
    top: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  encryptionSealText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D1FAE5",
  },
  chatDrawer: {
    position: "absolute",
    bottom: 100,
    left: 12,
    right: 12,
    height: 240,
    backgroundColor: "#0B212B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E4F63",
    overflow: "hidden",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#07131B",
  },
  chatHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
  },
  chatMsgBubble: {
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
    maxWidth: "85%",
  },
  chatMsgPatient: {
    backgroundColor: colors.teal,
    alignSelf: "flex-end",
  },
  chatMsgDoctor: {
    backgroundColor: "#163847",
    alignSelf: "flex-start",
  },
  chatMsgSystem: {
    backgroundColor: "#0F2633",
    alignSelf: "center",
  },
  chatMsgText: {
    fontSize: 12,
    color: "white",
  },
  chatMsgTime: {
    fontSize: 9,
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "right",
  },
  chatInputRow: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#07131B",
    gap: 6,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#0B212B",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "white",
    fontSize: 12,
  },
  chatSendBtn: {
    backgroundColor: colors.teal,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomDock: {
    height: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    backgroundColor: "#07131B",
    borderTopWidth: 1,
    borderTopColor: "#133747",
    paddingBottom: 20,
  },
  dockBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#163847",
    alignItems: "center",
    justifyContent: "center",
  },
  dockBtnMuted: {
    backgroundColor: "#EF4444",
  },
  dockEndCallBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
});
