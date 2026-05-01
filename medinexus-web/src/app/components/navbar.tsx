"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Role = "patient" | "doctor" | "clinic" | null;

type LinkItem = {
  href: string;
  label: string;
};

type ProfileRow = {
  role: string | null;
};

type ClinicMemberRow = {
  member_role: string | null;
};

const publicLinks: LinkItem[] = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/especialidades", label: "Especialidades" },
  { href: "/clinicas", label: "Clínicas" },
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
  { href: "/documentos", label: "Documentos" },
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

const publicMarketingRoutes = [
  "/",
  "/sobre",
  "/pacotes",
  "/especialidades",
  "/clinicas",
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/") return pathname === "/";

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getRoleFromValue(value?: string | null): Role {
  if (!value) return null;

  const normalized = value.toLowerCase();

  if (["patient", "paciente"].includes(normalized)) return "patient";
  if (["doctor", "medico", "médico"].includes(normalized)) return "doctor";
  if (["clinic", "clinica", "clínica"].includes(normalized)) return "clinic";

  return null;
}

function isPublicMarketingPath(pathname: string) {
  return (
    publicMarketingRoutes.includes(pathname) ||
    pathname.startsWith("/clinicas/")
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isPublicRoute = useMemo(
    () => isPublicMarketingPath(pathname),
    [pathname]
  );

  useEffect(() => {
    let mounted = true;

    async function loadUserRole() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setIsLogged(false);
        setRole(null);
        setLoading(false);
        return;
      }

      setIsLogged(true);

      const metadataRole = getRoleFromValue(
        (user.user_metadata?.role as string | undefined) ||
          (user.app_metadata?.role as string | undefined)
      );

      if (metadataRole) {
        setRole(metadataRole);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      if (!mounted) return;

      const profileRole = getRoleFromValue(profile?.role);

      if (profileRole) {
        setRole(profileRole);
        setLoading(false);
        return;
      }

      const { data: clinicMember } = await supabase
        .from("clinic_members")
        .select("member_role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle<ClinicMemberRow>();

      if (!mounted) return;

      if (clinicMember?.member_role === "doctor") {
        setRole("doctor");
      } else if (
        clinicMember?.member_role === "owner" ||
        clinicMember?.member_role === "admin"
      ) {
        setRole("clinic");
      } else {
        setRole("patient");
      }

      setLoading(false);
    }

    loadUserRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUserRole();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const linksToShow = useMemo(() => {
    if (isPublicRoute) return publicLinks;

    if (role === "clinic") return clinicLinks;
    if (role === "doctor") return doctorLinks;
    if (role === "patient") return patientLinks;

    return publicLinks;
  }, [isPublicRoute, role]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsLogged(false);
    setRole(null);
    router.push("/");
    router.refresh();
  }

  const dashboardHref =
    role === "clinic"
      ? "/clinica/dashboard"
      : role === "doctor"
        ? "/medico/dashboard"
        : "/dashboard";

  const logoHref = isPublicRoute ? "/" : dashboardHref;

  const showLogout = isLogged && !isPublicRoute;
  const showPublicDashboardShortcut = isLogged && isPublicRoute;

  return (
    <header className="sticky top-0 z-50 border-b border-[#E0E7FF] bg-white/88 shadow-[0_18px_60px_-48px_rgba(40,60,122,0.7)] backdrop-blur-xl">
      <div className="relative mx-auto flex h-24 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <Link
  href={logoHref}
  className="group absolute left-4 inline-flex items-center sm:left-6 lg:left-8"
  aria-label="MediNexus"
>
          <img
            src="/brand/medinexus-logo.png"
            alt="MediNexus"
            className="medinexus-navbar-logo transition duration-200 group-hover:-translate-y-0.5"
          />
        </Link>

        <nav className="hidden items-center gap-2 rounded-[28px] border border-[#D9D6F4] bg-white/82 p-2 shadow-sm lg:flex">
          {linksToShow.map((link) => {
            const active = isActiveLink(pathname, link.href);

            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-[#F1F5FF] text-[#283C7A]"
                    : "text-slate-600 hover:bg-[#F6F3FF] hover:text-[#5E4B9A]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute right-4 hidden items-center gap-3 sm:right-6 lg:right-8 lg:flex">
          {showPublicDashboardShortcut && (
            <Link
              href={dashboardHref}
              className="rounded-2xl border border-[#D9D6F4] bg-white px-5 py-3 text-sm font-bold text-[#5E4B9A] shadow-sm transition hover:bg-[#F6F3FF]"
            >
              Meu painel
            </Link>
          )}

          {showLogout && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-[#D9D6F4] bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-[#F6F3FF] hover:text-[#5E4B9A]"
            >
              Sair
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D9D6F4] bg-white text-[#283C7A] shadow-sm lg:hidden"
          aria-label="Abrir menu"
        >
          <span className="text-xl font-bold">{menuOpen ? "×" : "≡"}</span>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[#E0E7FF] bg-white px-4 pb-5 pt-3 shadow-lg lg:hidden">
          <nav className="grid gap-2">
            {linksToShow.map((link) => {
              const active = isActiveLink(pathname, link.href);

              return (
                <Link
                  key={`${link.href}-${link.label}-mobile`}
                  href={link.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    active
                      ? "bg-[#F1F5FF] text-[#283C7A]"
                      : "text-slate-600 hover:bg-[#F6F3FF] hover:text-[#5E4B9A]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {showPublicDashboardShortcut && (
              <Link
                href={dashboardHref}
                className="rounded-2xl border border-[#D9D6F4] bg-white px-4 py-3 text-sm font-bold text-[#5E4B9A]"
              >
                Meu painel
              </Link>
            )}

            {showLogout && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-[#D9D6F4] bg-white px-4 py-3 text-left text-sm font-bold text-slate-700"
              >
                Sair
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}