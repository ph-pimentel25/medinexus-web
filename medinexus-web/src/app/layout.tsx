import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppFrame from "./components/app-frame";
import "@fontsource-variable/inter";
import { AuthProvider } from "./components/auth-provider";

export const metadata: Metadata = {
  title: "MediNexus | Conectando pessoas. Integrando saúde.",
  description: "Encontre e solicite sua consulta com menos burocracia.",
  applicationName: "MediNexus",
  appleWebApp: { capable: true, title: "MediNexus", statusBarStyle: "default" },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png?v=4", sizes: "180x180", type: "image/png" }],
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

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#164957" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-mn-sand text-mn-graphite antialiased">
        <AuthProvider>
          <AppFrame>{children}</AppFrame>
        </AuthProvider>
      </body>
    </html>
  );
}