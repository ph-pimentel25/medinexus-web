"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../lib/supabase";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/perfil", label: "Perfil" },
  { href: "/busca", label: "Nova busca" },
  { href: "/solicitacoes", label: "Solicitações" },
  { href: "/clinica/solicitacoes", label: "Clínica" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleNavigate() {
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            onClick={handleNavigate}
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <Image
                src="/brand/medinexus-logo.png"
                alt="Logo MediNexus"
                fill
                className="object-cover"
                sizes="44px"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900">
                MediNexus
              </p>
              <p className="truncate text-xs text-slate-500">
                Saúde digital inteligente
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: "var(--brand-teal)" }
                      : undefined
                  }
                >
                  {link.label}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="ml-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sair
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 md:hidden"
            aria-label="Abrir menu"
          >
            <span className="text-xl">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {mobileOpen && (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
            <nav className="flex flex-col gap-2">
              {links.map((link) => {
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
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: "var(--brand-teal)" }
                        : undefined
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Sair
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}