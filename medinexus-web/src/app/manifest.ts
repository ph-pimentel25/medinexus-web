import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "MediNexus", short_name: "MediNexus",
    description: "Conectando pessoas. Integrando saúde.",
    lang: "pt-BR", start_url: "/dashboard", scope: "/", display: "standalone",
    background_color: "#FAF6F3", theme_color: "#164957",
    icons: [
      { src: "/icons/medinexus-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/medinexus-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/medinexus-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
