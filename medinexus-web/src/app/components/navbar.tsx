"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type LinkItem = {
  href: string;
  label: string;
};

type AreaType = "public" | "patient" | "doctor" | "clinic";

const publicLinks: LinkItem[] = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/pacotes", label: "Pacotes" },
  { href: "/login", label: "Entrar" },
];

const patientLinks: LinkItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/perfil", label: "Perfil" },
  { href: "/busca", label: "Nova busca" },
  { href: "/solicitacoes", label: "Solicitações" },
  { href: "/clinicas", label: "Clínicas" },
  { href: "/historico-clinico", label: "Histórico" },
  { href: "/documentos-medicos", label: "Documentos" },
];

const doctorLinks: LinkItem[] = [
  { href: "/medico/dashboard", label: "Dashboard" },
  { href: "/medico/solicitacoes", label: "Solicitações" },
  { href: "/medico/disponibilidade", label: "Disponibilidade" },
  { href: "/medico/perfil", label: "Perfil" },
];

const clinicLinks: LinkItem[] = [
  { href: "/clinica/dashboard", label: "Dashboard" },
  { href: "/clinica/solicitacoes", label: "Solicitações" },
  { href: "/clinica/medicos", label: "Médicos" },
  { href: "/clinica/planos", label: "Planos" },
  { href: "/clinica/publico", label: "Página pública" },
  { href: "/clinica/configuracoes", label: "Configurações" },
];

function getAreaFromPath(pathname: string): AreaType {
  if (pathname.startsWith("/medico")) return "doctor";
  if (pathname.startsWith("/clinica")) return "clinic";

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/busca") ||
    pathname.startsWith("/resultados") ||
    pathname.startsWith("/solicitacoes") ||
    pathname.startsWith("/clinicas") ||
    pathname.startsWith("/historico-clinico") ||
    pathname.startsWith("/documentos-medicos")
  ) {
    return "patient";
  }

  return "public";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const currentPath = pathname || "/";
  const area = getAreaFromPath(currentPath);

  const links = useMemo<LinkItem[]>(() => {
    if (area === "doctor") return doctorLinks;
    if (area === "clinic") return clinicLinks;
    if (area === "patient") return patientLinks;
    return publicLinks;
  }, [area]);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setIsLogged(Boolean(user));
      }
    }

    checkAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLogged(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return currentPath === "/";
    return currentPath === href || currentPath.startsWith(`${href}/`);
  }

  const showLogout = isLogged && area !== "public";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-[0_12px_40px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl">
      <nav className="mx-auto flex min-h-[104px] w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center">
          <div className="flex h-[78px] min-w-[250px] items-center">
            <img
              src="/brand/medinexus-logo.png"
              alt="MediNexus"
              className="h-[68px] w-auto object-contain transition duration-200 group-hover:scale-[1.015] sm:h-[72px] lg:h-[76px]"
            />
          </div>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center gap-1 rounded-[26px] border border-slate-200/80 bg-slate-50/80 p-1.5">
            {links.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-white text-[#1B4B58] shadow-sm ring-1 ring-slate-200"
                      : "text-slate-600 hover:bg-white/80 hover:text-[#1B4B58]",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {showLogout && (
            <button
              type="button"
              onClick={handleLogout}
              className="ml-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1B4B58]/30 hover:text-[#1B4B58]"
            >
              Sair
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
          aria-label="Abrir menu"
        >
          <span className="text-2xl leading-none">{mobileOpen ? "×" : "☰"}</span>
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2 px-4 py-4 sm:px-6">
            {links.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-[#EAF1F0] text-[#1B4B58] ring-1 ring-[#D7E6E2]"
                      : "text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}

            {showLogout && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}