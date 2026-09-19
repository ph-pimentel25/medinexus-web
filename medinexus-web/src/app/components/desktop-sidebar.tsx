"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, CalendarDays, Users, FileText, Settings, LogOut, Search, Activity, Star, Bell, Clock, Building2, CreditCard, Stethoscope } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./auth-provider";
import { getSidebarNavigation, isActivePath, roleLabels } from "../lib/navigation";
import { getRoleDashboardPath } from "../lib/auth";

function iconFor(href: string) {
  if (href.endsWith("dashboard")) return LayoutDashboard;
  if (href.includes("solicitacoes")) return CalendarDays;
  if (href.includes("disponibilidade")) return Clock;
  if (href.includes("descobrir")) return Search;
  if (href.includes("documentos")) return FileText;
  if (href.includes("historico")) return Activity;
  if (href.includes("avaliacoes")) return Star;
  if (href.includes("notificacoes")) return Bell;
  if (href.includes("publico")) return Building2;
  if (href.includes("planos")) return CreditCard;
  if (href.includes("medicos")) return Users;
  if (href.includes("consultas")) return Stethoscope;
  return Settings;
}
export function DesktopSidebar() {
  const pathname = usePathname(), router = useRouter();
  const { access, loading } = useAuth();
  const [error, setError] = useState("");
  async function signOut() {
    const result = await supabase.auth.signOut();
    if (result.error) { setError("Não foi possível sair. Tente novamente."); return; }
    router.replace("/login");
  }
  return <aside className="mn-sidebar no-print" aria-label="Menu lateral">
    <Link href={getRoleDashboardPath(access.role)} className="mn-sidebar-brand" aria-label="MediNexus — início">
      <Image src="/icon-dark.svg" alt="" width={34} height={34} />
      <span>Medi<span className="font-normal opacity-80">Nexus</span></span>
    </Link>
    <div className="mn-sidebar-caption">{loading ? "Sua conta" : roleLabels[access.role]}</div>
    <nav aria-label="Navegação da área" className="mn-sidebar-links">
      {!loading && getSidebarNavigation(access.role).map(item => {
        const Icon = iconFor(item.href), active = isActivePath(pathname, item.href);
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={active ? "mn-sidebar-link is-active" : "mn-sidebar-link"}>
          <Icon size={18} strokeWidth={1.7} /><span>{item.label}</span>
        </Link>;
      })}
    </nav>
    <div className="mn-sidebar-footer">
      <div className="mn-sidebar-note"><Activity size={20} strokeWidth={1.5} /><p>Conectando pessoas.<br />Integrando saúde.</p></div>
      {!!access.userId && <button type="button" onClick={() => void signOut()} className="mn-sidebar-link"><LogOut size={17} />Sair da conta</button>}
      {!!error && <p role="alert" className="px-3 text-xs text-white">{error}</p>}
    </div>
  </aside>;
}
