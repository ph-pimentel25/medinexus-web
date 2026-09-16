import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mn: {
          teal: "#164957",          // Azul Petróleo (Primário / Sidebar)[cite: 8, 9]
          "teal-light": "#D4E8EE",   //[cite: 9]
          purple: "#5A4C86",        // Roxo (Secundário / Destaques IA)[cite: 8, 9]
          "purple-light": "#EAE7F4", //[cite: 9]
          sage: "#7A9D8C",          // Verde Sálvia (Acento / Sucesso)[cite: 8, 9]
          "sage-light": "#D8EBE4",   //[cite: 9]
          graphite: "#2E393F",      // Grafite (Texto principal / Contraste)[cite: 8, 9]
          sand: "#FAF6F3",          // Off-White (Fundo geral da aplicação)[cite: 8, 9]
          card: "#FFFFFF",
          border: "#E7E2DD",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"], //[cite: 9]
        editorial: ["var(--font-fraunces)", "serif"], //[cite: 9]
        mono: ["var(--font-mono)", "monospace"], //[cite: 9]
      },
    },
  },
  plugins: [],
};

export default config;