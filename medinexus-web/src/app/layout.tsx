import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/navbar";

export const metadata: Metadata = {
  title: "MediNexus",
  description: "Encontre e solicite sua consulta com menos burocracia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}