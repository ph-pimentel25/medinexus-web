"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, FileText, UserRound, Users, Clock, Star } from "lucide-react";
import { useAuth } from "./auth-provider";
import { getNavigation, isActivePath } from "../lib/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const { access, loading } = useAuth();
  if (loading || !access.userId || pathname.includes("/cadastro") || pathname === "/login" || pathname.startsWith("/validar-documentos")) return null;
  const icons = [Home, CalendarDays, access.role === "doctor" ? Clock : access.role === "clinic" ? Users : FileText, Star, UserRound];
  return <nav aria-label="Navegação inferior" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-mn-border bg-white/95 px-2 pt-2 backdrop-blur-xl lg:hidden no-print">
    <div className="mx-auto flex max-w-lg justify-around">{getNavigation(access.role).map((item, index) => {
      const Icon = icons[index];
      const active = isActivePath(pathname, item.href);
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-12 min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${active ? "bg-mn-sage-light/65 text-mn-teal" : "text-mn-graphite/60"}`}><Icon size={20} strokeWidth={active ? 2.2 : 1.7} />{item.label}</Link>;
    })}</div>
  </nav>;
}
