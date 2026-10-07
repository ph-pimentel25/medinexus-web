// Paleta original e moderna da MediNexus, compartilhada por todas as telas nativas.
export const colors = {
  teal: "#164957",
  tealDark: "#0F323D",
  tealLight: "#1D5C6E",
  graphite: "#2E393F",
  graphiteLight: "#4A555C",
  muted: "#6B7280",
  sand: "#FAF6F3",
  sandDark: "#F0EAE3",
  purple: "#5A4C86",
  sage: "#7A9D8C",
  border: "#E7E2DD",
  lightTeal: "#D4E8EE",
  lightPurple: "#EAE7F4",
  lightSage: "#D8EBE4",
  white: "#FFFFFF",

  // Cores semânticas para status e feedback visual
  success: "#137333",
  successBg: "#E6F4EA",
  warning: "#B06000",
  warningBg: "#FEF7E0",
  danger: "#C5221F",
  dangerBg: "#FCE8E6",
  info: "#1A73E8",
  infoBg: "#E8F0FE",
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;
