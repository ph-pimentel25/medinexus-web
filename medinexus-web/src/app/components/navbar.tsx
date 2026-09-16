"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import NotificationBell from "./notification-bell";
import { supabase } from "../lib/supabase";

type UserRole = "public" | "patient" | "doctor" | "clinic";

type UserInfo = {
  id: string;
  email: string | null;
};

type NavItem = {
  label: string;
  href: string;
};

const LOGO_SRC = "/brand/medinexus-logo.png";

const publicLinks: NavItem[] = [
  { label: "Início", href: "/" },
  { label: "Sobre", href: "/sobre" },
  { label: "Especialidades", href: "/especialidades" },
  { label: "Clínicas", href: "/clinicas" },
  { label: "Profissionais", href: "/profissionais" },
  { label: "Pacotes", href: "/pacotes" },
];

const patientLinks: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Buscar", href: "/busca" },
  { label: "Solicitações", href: "/solicitacoes" },
  { label: "Documentos", href: "/documentos" },
];

const doctorLinks: NavItem[] = [
  { label: "Dashboard", href: "/medico/dashboard" },
  { label: "Solicitações", href: "/medico/solicitacoes" },
  { label: "Disponibilidade", href: "/medico/disponibilidade" },
  { label: "Perfil", href: "/medico/perfil" },
];

const clinicLinks: NavItem[] = [
  { label: "Dashboard", href: "/clinica/dashboard" },
  { label: "Solicitações", href: "/clinica/solicitacoes" },
  { label: "Médicos", href: "/clinica/medicos" },
  { label: "Configurações", href: "/clinica/configuracoes" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getDashboardHref(role: UserRole) {
  if (role === "doctor") return "/medico/dashboard";
  if (role === "clinic") return "/clinica/dashboard";
  if (role === "patient") return "/dashboard";
  return "/";
}

function getProfileHref(role: UserRole) {
  if (role === "doctor") return "/medico/perfil";
  if (role === "clinic") return "/clinica/configuracoes";
  if (role === "patient") return "/perfil";
  return "/";
}

function getLinks(role: UserRole) {
  if (role === "doctor") return doctorLinks;
  if (role === "clinic") return clinicLinks;
  if (role === "patient") return patientLinks;
  return publicLinks;
}

function getRoleLabel(role: UserRole) {
  if (role === "doctor") return "Médico";
  if (role === "clinic") return "Clínica";
  if (role === "patient") return "Paciente";
  return "Visitante";
}

function getInitials(name: string, email: string | null, role: UserRole) {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (role === "doctor") return "MD";
  if (role === "clinic") return "CL";
  if (role === "patient") return "PT";
  return "MN";
}

function getFirstName(fullName: string | null | undefined, email: string | null) {
  const cleaned = (fullName || "").trim();

  if (cleaned) {
    return cleaned.split(" ")[0];
  }

  if (email) {
    const raw = email.split("@")[0] || "Conta";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  return "Conta";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [role, setRole] = useState<UserRole>("public");
  const [displayName, setDisplayName] = useState("");

  const accountRef = useRef<HTMLDivElement | null>(null);

  if (
    pathname?.startsWith("/medico") ||
    pathname?.startsWith("/clinica")
  ) {
    return null;
  }

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function loadUser() {
    setLoading(true);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      setRole("public");
      setDisplayName("");
      setLoading(false);
      return;
    }

    setUser({
      id: authUser.id,
      email: authUser.email || null,
    });

    let detectedRole: UserRole = "patient";
    let foundDisplayName = "";
    let foundClinicId: string | null = null;

    const { data: doctorData } = await supabase
      .from("doctors")
      .select("id, name")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (doctorData?.id) {
      detectedRole = "doctor";
      foundDisplayName = doctorData.name || "";
    } else {
      const { data: clinicMemberData } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", authUser.id)
        .limit(1)
        .maybeSingle();

      if (clinicMemberData?.clinic_id) {
        detectedRole = "clinic";
        foundClinicId = clinicMemberData.clinic_id;
      }
    }

    if (detectedRole === "clinic" && foundClinicId) {
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("trade_name, legal_name")
        .eq("id", foundClinicId)
        .maybeSingle();

      foundDisplayName = clinicData?.trade_name || clinicData?.legal_name || "";
    }

    if (detectedRole === "patient") {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authUser.id)
        .maybeSingle();

      foundDisplayName = profileData?.full_name || "";
    }

    setRole(detectedRole);
    setDisplayName(foundDisplayName);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setRole("public");
    setDisplayName("");
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  }

  const links = useMemo(() => getLinks(role), [role]);
  const homeHref = getDashboardHref(role);
  const profileHref = getProfileHref(role);
  const roleLabel = getRoleLabel(role);
  const firstName = getFirstName(displayName, user?.email || null);
  const initials = getInitials(displayName, user?.email || null, role);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E7E2DD] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2.5 sm:px-6 lg:px-8">
        
        {/* Bloco Esquerdo: Logo + Links de Navegação Unidos */}
        <div className="flex items-center gap-8 lg:gap-10">
          <Link href={user ? homeHref : "/"} className="flex shrink-0 items-center">
            <div className="relative h-[72px] w-[240px] sm:h-[80px] sm:w-[280px] lg:h-[86px] lg:w-[300px]">
              <Image
                src={LOGO_SRC}
                alt="MediNexus"
                fill
                priority
                sizes="(max-width: 768px) 240px, 300px"
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* Links do Menu logo ao lado da Logo */}
          <nav className="hidden xl:flex items-center gap-1 rounded-full border border-[#E7E2DD] bg-[#FAF6F3]/80 px-2 py-1.5 shadow-sm backdrop-blur">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  isActive(pathname, item.href)
                    ? "bg-[#164957] text-white shadow-sm"
                    : "text-[#2E393F]/75 hover:bg-white hover:text-[#164957]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bloco Direito: Notificações e Ações/Conta */}
        <div className="hidden items-center justify-end gap-3 xl:flex">
          {!loading && user && <NotificationBell />}

          {!loading && !user && (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-[#E7E2DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
              >
                Entrar
              </Link>

              <Link
                href="/cadastro"
                className="rounded-xl bg-[#164957] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#164957]/90 shadow-sm"
              >
                Criar conta
              </Link>
            </>
          )}

          {!loading && user && (
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-xl border border-[#E7E2DD] bg-white px-3 py-1.5 shadow-sm transition hover:bg-[#FAF6F3]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#164957] text-xs font-bold text-[#FAF6F3]">
                  {initials}
                </div>

                <div className="text-left">
                  <p className="max-w-[120px] truncate text-xs font-bold text-[#2E393F]">
                    {firstName}
                  </p>
                  <p className="text-[10px] text-[#2E393F]/60 font-medium">{roleLabel}</p>
                </div>

                <span className="text-[10px] font-bold text-[#2E393F]/40 ml-1">▼</span>
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[9999] w-[260px] overflow-hidden rounded-2xl border border-[#E7E2DD] bg-white shadow-lg">
                  <div className="border-b border-[#E7E2DD] bg-[#FAF6F3] p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#164957] text-xs font-bold text-white">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#2E393F]">
                          {displayName || firstName}
                        </p>
                        <p className="truncate text-[11px] text-[#2E393F]/60">
                          {user.email || "Usuário"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    <Link
                      href={homeHref}
                      className="block rounded-lg px-3 py-2 text-xs font-semibold text-[#2E393F]/80 transition hover:bg-[#FAF6F3] hover:text-[#164957]"
                    >
                      Dashboard
                    </Link>

                    <Link
                      href={profileHref}
                      className="block rounded-lg px-3 py-2 text-xs font-semibold text-[#2E393F]/80 transition hover:bg-[#FAF6F3] hover:text-[#164957]"
                    >
                      Perfil / Conta
                    </Link>

                    <Link
                      href="/notificacoes"
                      className="block rounded-lg px-3 py-2 text-xs font-semibold text-[#2E393F]/80 transition hover:bg-[#FAF6F3] hover:text-[#164957]"
                    >
                      Notificações
                    </Link>

                    <div className="pt-1.5 border-t border-[#E7E2DD]">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão Mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7E2DD] bg-white text-lg font-bold text-[#164957] xl:hidden"
          aria-label="Menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#E7E2DD] bg-white px-4 py-3 xl:hidden">
          <div className="flex flex-col gap-1.5">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  isActive(pathname, item.href)
                    ? "bg-[#164957] text-white"
                    : "bg-[#FAF6F3] text-[#2E393F]/80 hover:text-[#164957]"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {!loading && user && (
              <>
                <Link
                  href="/notificacoes"
                  className="rounded-xl border border-[#E7E2DD] bg-white px-4 py-2.5 text-center text-xs font-semibold text-[#164957]"
                >
                  Notificações
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600"
                >
                  Sair
                </button>
              </>
            )}

            {!loading && !user && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-[#E7E2DD] bg-white px-4 py-2 text-center text-xs font-semibold text-[#5A4C86]"
                >
                  Entrar
                </Link>

                <Link
                  href="/cadastro"
                  className="rounded-xl bg-[#164957] px-4 py-2 text-center text-xs font-semibold text-white"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}