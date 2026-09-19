import { colors } from "./theme";
import { Pressable, StyleSheet, Text, View, Switch } from "react-native";

export function Button({ title, onPress, secondary = false, disabled = false }: {
  title: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    accessibilityState={{ disabled }}
    style={({ pressed }) => [ui.button, secondary && ui.secondary, (disabled || pressed) && { opacity: .65 }]}>
    <Text style={[ui.buttonText, secondary && { color: colors.teal }]}>{title}</Text>
  </Pressable>;
}
export function Toggle({ label, value, onChange, disabled = false }: {
  label: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean;
}) {
  return <View style={ui.toggle}><Text style={[ui.copy, { flex: 1 }]}>{label}</Text>
    <Switch accessibilityLabel={label} value={value} onValueChange={onChange} disabled={disabled}
      trackColor={{ false: colors.border, true: colors.teal }} /></View>;
}
export const ui = StyleSheet.create({
  panel: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 12 },
  heading: { fontSize: 22, color: colors.graphite, fontWeight: "600" },
  copy: { fontSize: 14, lineHeight: 22, color: colors.graphite },
  label: { fontSize: 13, color: colors.graphite, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: colors.graphite, backgroundColor: "white" },
  button: { backgroundColor: colors.teal, minHeight: 48, justifyContent: "center", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 4 },
  secondary: { backgroundColor: "white", borderWidth: 1, borderColor: colors.border },
  buttonText: { color: "white", fontSize: 14, fontWeight: "600" },
  message: { padding: 14, backgroundColor: colors.lightSage, borderRadius: 12, color: colors.graphite, fontSize: 14, lineHeight: 21 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12 },
});
