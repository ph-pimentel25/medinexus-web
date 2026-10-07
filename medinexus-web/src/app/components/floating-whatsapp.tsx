"use client";

import { MessageCircle } from "lucide-react";

export default function FloatingWhatsApp() {
  const whatsappUrl =
    "https://wa.me/5521979828341?text=" +
    encodeURIComponent("Olá! Preciso de ajuda com a plataforma MediNexus.");

  return (
    <aside aria-label="Suporte WhatsApp" className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir suporte no WhatsApp"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#20BA5C] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        <span className="sr-only">Suporte no WhatsApp</span>
        <MessageCircle size={28} className="transition-transform group-hover:scale-110" />
        
        {/* Indicador de status online */}
        <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-300" />
        </span>

        {/* Tooltip ao passar o mouse */}
        <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-md opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100 sm:inline-block">
          Suporte MediNexus
        </span>
      </a>
    </aside>
  );
}
