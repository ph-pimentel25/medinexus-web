"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRoleDashboardPath, getRoleProfilePath } from "../lib/auth";
import { useAuth } from "./auth-provider";
import { supabase } from "../lib/supabase";

export default function RoleGuard({ area, children }: {
  area: "patient" | "doctor" | "clinic";
  children: React.ReactNode;
}) {
  const { access, loading, error, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const registration = pathname === "/medico/cadastro" || pathname === "/clinica/cadastro";
  const allowed = access.role === area && !!access.id;

  useEffect(() => {
    if (registration || loading || error) return;
    if (access.role === "public") {
      router.replace("/login");
    } else if (access.role !== area) {
      router.replace(pathname === "/perfil" ? getRoleProfilePath(access.role) : getRoleDashboardPath(access.role));
    }
  }, [access.role, area, error, loading, pathname, registration, router]);

  if (registration) return <>{children}</>;
  if (error || (!loading && access.role !== "public" && !access.id)) {
    return (
      <main className="app-shell flex min-h-[65vh] items-center justify-center py-10">
        <div className="app-card max-w-lg p-8 text-center" role="alert">
          <h1 className="text-xl font-bold text-mn-teal">{error ? "Não foi possível abrir sua conta" : "Seu cadastro precisa ser concluído"}</h1>
          <p className="mt-3 text-sm leading-6 text-mn-graphite/75">{error || "Identificamos sua conta profissional, mas o vínculo com o cadastro ainda não está disponível."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {error ? <button onClick={() => void refresh()} className="app-button-primary">Tentar novamente</button> : <Link href="/cadastro?complete=1" className="app-button-primary">Concluir cadastro</Link>}
            <button className="app-button-secondary" onClick={() => void supabase.auth.signOut()}>Trocar de conta</button>
          </div>
        </div>
      </main>
    );
  }
  if (loading || !allowed) {
    return <div className="flex min-h-[65vh] items-center justify-center gap-3 text-sm text-mn-teal" role="status"><span className="h-5 w-5 animate-spin rounded-full border-2 border-mn-border border-t-mn-teal" />Verificando seu acesso...</div>;
  }
  return <>{children}</>;
}
