"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type NavRole = "guest" | "patient" | "clinic_admin" | "doctor";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [navRole, setNavRole] = useState<NavRole>("guest");
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    async function loadRole() {
      setLoadingRole(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNavRole("guest");
        setLoadingRole(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single<{ role: "patient" | "clinic_admin" | "doctor" }>();

      if (profile?.role === "doctor") {
        setNavRole("doctor");
      } else if (profile?.role === "clinic_admin") {
        setNavRole("clinic_admin");
      } else {
        setNavRole("patient");
      }

      setLoadingRole(false);
    }

    loadRole();
  }, [pathname]);

  const links = useMemo(() => {
   if (navRole === "patient") {
  return [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/perfil", label: "Perfil" },
    { href: "/busca", label: "Nova busca" },
    { href: "/clinicas", label: "Clínicas" },
    { href: "/solicitacoes", label: "Solicitações" },
  ];
}

    if (navRole === "clinic_admin") {
      return [
        { href: "/clinica/dashboard", label: "Clínica" },
        { href: "/clinica/planos", label: "Planos" },
        { href: "/clinica/medicos", label: "Médicos" },
        { href: "/clinica/solicitacoes", label: "Solicitações" },
      ];
    }

    if (navRole === "doctor") {
      return [
        { href: "/medico/dashboard", label: "Dashboard médico" },
        { href: "/medico/solicitacoes", label: "Minhas solicitações" },
        { href: "/medico/disponibilidade", label: "Disponibilidade" },
      ];
    }

    return [
      { href: "/login", label: "Entrar" },
      { href: "/cadastro", label: "Paciente" },
      { href: "/medico/cadastro", label: "Médico" },
      { href: "/sobre", label: "Sobre" },
    ];
  }, [navRole]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push("/login");
  }

  function handleNavigate() {
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="app-shell">
        <div className="flex min-h-[96px] items-center justify-between gap-6">
          <Link
            href="/"
            onClick={handleNavigate}
            className="flex min-w-0 items-center"
          >
            <Image
              src="/brand/medinexus-logo-v2.png"
              alt="MediNexus"
              width={620}
              height={160}
              className="h-[72px] w-auto object-contain sm:h-20 lg:h-24"
              priority
            />
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <nav className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm">
              {!loadingRole &&
                links.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: "var(--brand-petrol)" }
                          : undefined
                      }
                    >
                      {link.label}
                    </Link>
                  );
                })}
            </nav>

            {navRole !== "guest" && !loadingRole && (
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Sair
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-label="Abrir menu"
          >
            <span className="text-xl leading-none">
              {mobileOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>

        {mobileOpen && (
          <div className="pb-4 md:hidden">
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/60">
              <nav className="flex flex-col gap-2">
                {!loadingRole &&
                  links.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      (link.href !== "/" && pathname.startsWith(link.href));

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleNavigate}
                        className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                          isActive
                            ? "text-white"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                        style={
                          isActive
                            ? { backgroundColor: "var(--brand-petrol)" }
                            : undefined
                        }
                      >
                        {link.label}
                      </Link>
                    );
                  })}

                {navRole !== "guest" && !loadingRole && (
                  <button
                    onClick={handleLogout}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Sair
                  </button>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}