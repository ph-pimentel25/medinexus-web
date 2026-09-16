"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Settings,
  LogOut 
} from "lucide-react";
import { supabase } from "../lib/supabase";

const menuItems = [
  { label: "Início", href: "/medico/dashboard", icon: LayoutDashboard },
  { label: "Agendamentos", href: "/medico/consultas", icon: CalendarDays },
  { label: "Pacientes", href: "/medico/solicitacoes", icon: Users },
  { label: "Documentos", href: "/documentos-medicos", icon: FileText },
  { label: "Mensagens", href: "/medico/consultas", icon: MessageSquare },
  { label: "Relatórios", href: "/medico/dashboard", icon: TrendingUp },
  { label: "Configurações", href: "/medico/perfil", icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-mn-teal text-white min-h-screen p-5 justify-between flex-shrink-0 border-r border-mn-teal/30">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg text-mn-sage border border-mn-sage/20">
            N
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            Medi<span className="text-mn-sage font-normal">Nexus</span>
          </span>
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/15 text-white shadow-sm font-semibold"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-mn-sage" : "text-white/60"}`} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white w-full transition-colors text-left"
        >
          <LogOut className="w-4 h-4 text-white/60" strokeWidth={1.8} />
          <span>Sair da conta</span>
        </button>
        <div className="px-3.5 pt-4 text-[11px] font-mono text-white/40">
          MediNexus Health OS v1.0
        </div>
      </div>
    </aside>
  );
}