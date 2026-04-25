"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type LinkItem = {
  href: string;
  label: string;
};

type AreaType = "public" | "patient" | "doctor" | "clinic";

const publicLinks: LinkItem[] = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/login", label: "Entrar" },
];

const patientLinks: LinkItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/perfil", label: "Perfil" },
  { href: "/busca", label: "Nova busca" },
  { href: "/solicitacoes", label: "Solicitações" },
  { href: "/clinicas", label: "Clínicas" },
  { href: "/historico-clinico", label: "Histórico" },
];

const doctorLinks: LinkItem[] = [
  { href: "/medico/dashboard", label: "Dashboard" },
  { href: "/medico/solicitacoes", label: "Solicitações" },
  { href: "/medico/disponibilidade", label: "Disponibilidade" },
];

const clinicLinks: LinkItem[] = [
  { href: "/clinica/dashboard", label: "Dashboard" },
  { href: "/clinica/solicitacoes", label: "Solicitações" },
  { href: "/clinica/medicos", label: "Médicos" },
  { href: "/clinica/planos", label: "Planos" },
  { href: "/clinica/publico", label: "Página pública" },
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
    pathname.startsWith("/historico-clinico")
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

  const area = getAreaFromPath(pathname || "/");

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
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  const showLogout = isLogged && area !== "public";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <nav className="app-shell flex min-h-[86px] items-center justify-between py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/medinexus-logo.png"
            alt="MediNexus"
            width={210}
            height={64}
            priority
            className="h-14 w-auto object-contain"
          />
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                isActive(link.href)
                  ? "bg-slate-100 text-[var(--brand-petrol,#1B4B58)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[var(--brand-petrol,#1B4B58)]"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {showLogout && (
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--brand-petrol,#1B4B58)] hover:text-[var(--brand-petrol,#1B4B58)]"
            >
              Sair
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 lg:hidden"
          aria-label="Abrir menu"
        >
          <span className="text-2xl leading-none">{mobileOpen ? "×" : "☰"}</span>
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="app-shell grid gap-2 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive(link.href)
                    ? "bg-slate-100 text-[var(--brand-petrol,#1B4B58)]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {showLogout && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700"
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