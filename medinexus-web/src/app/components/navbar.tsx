"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import NotificationBell from "./notification-bell";
import WorkspaceSearch from "./workspace-search";
import { useAuth } from "./auth-provider";
import { supabase } from "../lib/supabase";
import { getRoleDashboardPath, getRoleProfilePath } from "../lib/auth";
import { getNavigation, getSidebarNavigation, isActivePath, roleLabels } from "../lib/navigation";

export default function Navbar({ workspace = false }: { workspace?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { access, loading, error } = useAuth();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const [accountAt, setAccountAt] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState("");
  const wrapper = useRef<HTMLElement>(null);
  const mobileOpen = openAt === pathname;
  const accountOpen = accountAt === pathname;
  const signedIn = !!access.userId;
  const links = workspace ? getSidebarNavigation(access.role) : getNavigation(access.role);
  const home = signedIn ? getRoleDashboardPath(access.role) : "/";
  const name = access.name || access.email?.split("@")[0] || "Minha conta";
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();


  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) { setLogoutError("Não foi possível sair. Tente novamente."); return; }
    setOpenAt(null); setAccountAt(null); setLogoutError("");
    router.replace("/login");
  }


  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) { setOpenAt(null); setAccountAt(null); }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpenAt(null); setAccountAt(null); }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);

  const closeMenus = () => { setOpenAt(null); setAccountAt(null); };
  return (
    <header ref={wrapper} className={`mn-topbar sticky top-0 z-50 border-b border-mn-border bg-white/95 backdrop-blur-xl no-print ${workspace ? "mn-topbar-workspace" : ""}`}>
      <div className="mn-topbar-inner mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href={home} onClick={closeMenus} aria-label="MediNexus — início" className={`flex h-12 shrink-0 items-center gap-2 ${workspace ? "lg:hidden" : ""}`}>
          <Image src="/icon-light.svg" alt="" width={38} height={38} priority /><span className="text-xl font-bold tracking-tight text-mn-teal sm:text-2xl">Medi<span className="font-normal text-mn-purple">Nexus</span></span>
        </Link>
        {workspace && <div className="hidden lg:block"><p className="text-xs text-mn-graphite/60">Seu espaço de cuidado</p><p className="mt-1 text-sm font-semibold text-mn-teal">{roleLabels[access.role]}</p></div>}
        {workspace && <WorkspaceSearch />}
        <nav aria-label="Navegação principal" className={workspace ? "hidden" : "hidden items-center gap-1 xl:flex"}>
          {links.map(item => <Link key={item.href} href={item.href} aria-current={isActivePath(pathname, item.href) ? "page" : undefined} className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActivePath(pathname, item.href) ? "bg-mn-teal text-white" : "text-mn-graphite/70 hover:bg-mn-sand"}`}>{item.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          {!loading && signedIn && <NotificationBell />}
          {!loading && !signedIn && <Link href="/login" className="hidden rounded-xl bg-mn-teal px-4 py-2.5 text-sm font-semibold text-white sm:block">Entrar</Link>}
          {!loading && signedIn && <div className={`relative hidden ${workspace ? "lg:block" : "xl:block"}`}>
            <button onClick={() => setAccountAt(accountOpen ? null : pathname)} aria-expanded={accountOpen} aria-controls="account-menu" className="flex min-h-11 items-center gap-2 rounded-xl border border-mn-border px-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mn-sage-light text-xs font-bold text-mn-teal">{initials}</span>
              <span className="max-w-32 truncate text-left text-xs"><strong className="block truncate">{name}</strong><span className="text-mn-graphite/60">{roleLabels[access.role]}</span></span><ChevronDown size={14} />
            </button>
            {accountOpen && <div id="account-menu" className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-mn-border bg-white p-2 shadow-xl">
              <Link onClick={closeMenus} href={getRoleProfilePath(access.role)} className="block rounded-xl p-3 text-sm hover:bg-mn-sand">Perfil e configurações</Link>
              {access.role === "clinic" && <><Link onClick={closeMenus} href="/clinica/publico" className="block rounded-xl p-3 text-sm hover:bg-mn-sand">Página pública</Link><Link onClick={closeMenus} href="/clinica/planos" className="block rounded-xl p-3 text-sm hover:bg-mn-sand">Convênios</Link></>}
              <button onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-xl p-3 text-sm text-red-700 hover:bg-red-50"><LogOut size={16} />Sair da conta</button>
            </div>}
          </div>}
          <button onClick={() => setOpenAt(mobileOpen ? null : pathname)} aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen} aria-controls="mobile-menu" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-mn-border text-mn-teal ${workspace ? "lg:hidden" : "xl:hidden"}`}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
      {(error || logoutError) && <p role="alert" className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">{logoutError || error}</p>}
      {mobileOpen && <nav id="mobile-menu" aria-label="Menu do celular" className={`max-h-[calc(100dvh-76px)] overflow-y-auto border-t border-mn-border bg-white px-4 py-4 shadow-lg ${workspace ? "lg:hidden" : "xl:hidden"}`}>
        {signedIn && <div className="mb-3 rounded-xl bg-mn-sand p-3"><p className="truncate text-sm font-bold text-mn-teal">{name}</p><p className="text-xs text-mn-graphite/65">{roleLabels[access.role]}</p></div>}
        <div className="grid grid-cols-2 gap-2">{links.map(item => <Link key={item.href} onClick={closeMenus} href={item.href} aria-current={isActivePath(pathname, item.href) ? "page" : undefined} className={`rounded-xl p-3 text-sm font-semibold ${isActivePath(pathname, item.href) ? "bg-mn-teal text-white" : "bg-mn-sand text-mn-teal"}`}>{item.label}</Link>)}</div>
        {access.role === "patient" && <Link onClick={closeMenus} href="/busca" className="mt-2 block rounded-xl bg-mn-sage-light p-3 text-sm font-semibold text-mn-teal">Buscar por convênio e distância</Link>}
        {!workspace && access.role === "clinic" && <div className="mt-2 grid grid-cols-2 gap-2"><Link onClick={closeMenus} href="/clinica/publico" className="rounded-xl bg-mn-sand p-3 text-sm">Página pública</Link><Link onClick={closeMenus} href="/clinica/planos" className="rounded-xl bg-mn-sand p-3 text-sm">Convênios</Link></div>}
        {signedIn ? <button onClick={() => void logout()} className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-700"><LogOut size={16} />Sair da conta</button> : <div className="mt-3 flex gap-2"><Link onClick={closeMenus} href="/login" className="app-button-primary flex-1">Entrar</Link><Link onClick={closeMenus} href="/cadastro" className="app-button-secondary flex-1">Criar conta</Link></div>}
      </nav>}
    </header>
  );
}
