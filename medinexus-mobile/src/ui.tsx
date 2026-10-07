import { colors, shadows } from "./theme";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, Switch, type StyleProp, type ViewStyle } from "react-native";
import type { ComponentType } from "react";

export type BadgeVariant = "confirmed" | "pending" | "cancelled" | "completed" | "brand" | "neutral" | "external";

export function Badge({ label, variant = "neutral" }: { label: string; variant?: BadgeVariant }) {
  const badgeColors: Record<BadgeVariant, { bg: string; text: string }> = {
    confirmed: { bg: colors.successBg, text: colors.success },
    pending: { bg: colors.warningBg, text: colors.warning },
    cancelled: { bg: colors.dangerBg, text: colors.danger },
    completed: { bg: colors.infoBg, text: colors.info },
    brand: { bg: colors.lightSage, text: colors.teal },
    external: { bg: colors.lightPurple, text: colors.purple },
    neutral: { bg: colors.sandDark, text: colors.graphiteLight },
  };

  const scheme = badgeColors[variant] || badgeColors.neutral;

  return (
    <View style={[ui.badge, { backgroundColor: scheme.bg }]}>
      <Text style={[ui.badgeText, { color: scheme.text }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: ComponentType<{ size?: number; color?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={ui.emptyState}>
      {Icon && (
        <View style={ui.emptyIconContainer}>
          <Icon size={32} color={colors.teal} />
        </View>
      )}
      <Text style={ui.emptyTitle}>{title}</Text>
      <Text style={ui.emptyDescription}>{description}</Text>
      {actionLabel && onAction && (
        <View style={{ marginTop: 12, width: "100%", maxWidth: 260 }}>
          <Button title={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  loading = false,
  icon: Icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ComponentType<{ size?: number; color?: string }>;
}) {
  const isActionDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isActionDisabled}
      onPress={onPress}
      accessibilityState={{ disabled: isActionDisabled }}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondary,
        danger && ui.dangerButton,
        (isActionDisabled || pressed) && { opacity: 0.72 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={secondary ? colors.teal : colors.white} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {Icon && (
            <Icon
              size={18}
              color={danger ? colors.danger : secondary ? colors.teal : colors.white}
            />
          )}
          <Text
            style={[
              ui.buttonText,
              secondary && { color: colors.teal },
              danger && { color: colors.danger },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function Toggle({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={ui.toggle}>
      <Text style={[ui.copy, { flex: 1 }]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.teal }}
      />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[ui.panel, shadows.sm, style]}>{children}</View>;
}

export const ui = StyleSheet.create({
  panel: {
    backgroundColor: "white",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  heading: { fontSize: 21, color: colors.graphite, fontWeight: "700", letterSpacing: -0.3 },
  copy: { fontSize: 14, lineHeight: 22, color: colors.graphiteLight },
  label: { fontSize: 13, color: colors.graphite, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 15,
    fontSize: 15,
    color: colors.graphite,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: colors.teal,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  secondary: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerButton: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: "#F7C5C2",
  },
  buttonText: { color: "white", fontSize: 15, fontWeight: "600", letterSpacing: 0.1 },
  message: {
    padding: 14,
    backgroundColor: colors.lightSage,
    borderRadius: 12,
    color: colors.graphite,
    fontSize: 14,
    lineHeight: 21,
  },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  emptyState: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.graphite,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 280,
  },
});
