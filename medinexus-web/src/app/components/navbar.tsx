"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/busca", label: "Nova busca" },
  { href: "/solicitacoes", label: "Solicitações" },
  { href: "/clinica/solicitacoes", label: "Clínica" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-lg font-bold text-white shadow-lg shadow-sky-500/20">
            M
          </div>

          <div>
            <p className="text-base font-bold text-white">MediNexus</p>
            <p className="text-xs text-slate-400">
              Saúde digital inteligente
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
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
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="ml-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}