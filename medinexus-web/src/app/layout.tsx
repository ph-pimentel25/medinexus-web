import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/navbar";

export const metadata: Metadata = {
  title: "MediNexus | Conectando pessoas. Integrando saúde.",
  description: "Encontre e solicite sua consulta com menos burocracia.",
  icons: {
    icon: [
      {
        url: "/icon-light.svg?v=3",
        media: "(prefers-color-scheme: light)",
        type: "image/svg+xml",
      },
      {
        url: "/icon-dark.svg?v=3",
        media: "(prefers-color-scheme: dark)",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#FAF6F3] text-[#2E393F] antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}