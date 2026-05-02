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
    <header className="sticky top-0 z-50 border-b border-[#E8EAF4] bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-[1500px] grid-cols-[auto_1fr_auto] items-center gap-5 px-5 py-3 sm:px-8 lg:px-10">
        <Link href={user ? homeHref : "/"} className="flex shrink-0 items-center">
          <div className="relative h-[86px] w-[330px] sm:h-[92px] sm:w-[370px] lg:h-[96px] lg:w-[410px]">
            <Image
              src={LOGO_SRC}
              alt="MediNexus"
              fill
              priority
              sizes="410px"
              className="object-contain object-left"
            />
          </div>
        </Link>

        <div className="hidden justify-center xl:flex">
          <nav className="flex items-center gap-1 rounded-full border border-[#DDE2F1] bg-[#FCFCFF] px-3 py-2 shadow-sm">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-5 py-3 text-[15px] font-semibold transition ${
                  isActive(pathname, item.href)
                    ? "bg-[#EEF2FF] text-[#283C7A]"
                    : "text-slate-600 hover:bg-[#F6F8FD] hover:text-[#283C7A]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center justify-end gap-3 xl:flex">
          {!loading && user && <NotificationBell />}

          {!loading && !user && (
            <>
              <Link
                href="/login"
                className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-3 text-sm font-semibold text-[#5E4B9A] transition hover:bg-[#F6F8FD]"
              >
                Entrar
              </Link>

              <Link
                href="/cadastro"
                className="rounded-2xl bg-[#283C7A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#22356E]"
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
                className="flex items-center gap-3 rounded-2xl border border-[#D9DDF0] bg-white px-3 py-2 shadow-sm transition hover:bg-[#F8FAFF]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#283C7A] to-[#6E56CF] text-sm font-bold text-white">
                  {initials}
                </div>

                <div className="text-left">
                  <p className="max-w-[130px] truncate text-sm font-bold text-slate-950">
                    {firstName}
                  </p>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
                </div>

                <span className="text-xs font-bold text-slate-400">▼</span>
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-[9999] w-[280px] overflow-hidden rounded-[28px] border border-[#D9DDF0] bg-white shadow-[0_30px_80px_-30px_rgba(40,60,122,0.45)]">
                  <div className="border-b border-[#ECEFFC] bg-gradient-to-r from-[#F4F8FF] to-[#F7F2FF] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#283C7A] to-[#6E56CF] text-sm font-bold text-white">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {firstName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user.email || "Usuário"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="space-y-2">
                      <Link
                        href={homeHref}
                        className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F6F8FD] hover:text-[#283C7A]"
                      >
                        Dashboard
                      </Link>

                      <Link
                        href={profileHref}
                        className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F6F8FD] hover:text-[#283C7A]"
                      >
                        Perfil / Conta
                      </Link>

                      <Link
                        href="/notificacoes"
                        className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F6F8FD] hover:text-[#283C7A]"
                      >
                        Notificações
                      </Link>
                    </div>

                    <div className="mt-3 border-t border-[#EEF1FA] pt-3">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
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

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="justify-self-end inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D9DDF0] bg-white text-xl font-bold text-[#283C7A] xl:hidden"
          aria-label="Abrir menu"
        >
          {mobileOpen ? "×" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#EEF1FA] bg-white px-4 py-4 xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive(pathname, item.href)
                    ? "bg-[#EEF2FF] text-[#283C7A]"
                    : "bg-[#FAFBFF] text-slate-600 hover:bg-[#F6F8FD] hover:text-[#283C7A]"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {!loading && user && (
              <>
                <Link
                  href="/notificacoes"
                  className="mt-2 rounded-2xl border border-[#D9DDF0] bg-white px-5 py-3 text-center text-sm font-semibold text-[#283C7A]"
                >
                  Notificações
                </Link>

                <Link
                  href={profileHref}
                  className="rounded-2xl border border-[#D9DDF0] bg-white px-5 py-3 text-center text-sm font-semibold text-[#5E4B9A]"
                >
                  Perfil / Conta
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600"
                >
                  Sair
                </button>
              </>
            )}

            {!loading && !user && (
              <>
                <Link
                  href="/login"
                  className="mt-2 rounded-2xl border border-[#D9DDF0] bg-white px-5 py-3 text-center text-sm font-semibold text-[#5E4B9A]"
                >
                  Entrar
                </Link>

                <Link
                  href="/cadastro"
                  className="rounded-2xl bg-[#283C7A] px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}