"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type AllowedArea = "patient" | "doctor" | "clinic";

type RoleGuardProps = {
  area: AllowedArea;
  children: React.ReactNode;
};

async function getUserAccessArea(userId: string): Promise<AllowedArea> {
  // Fonte principal para médico: vínculo direto em doctors.user_id.
  // Médicos não precisam ser membros de uma clínica para acessar a área médica.
  const { data: doctorData, error: doctorError } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!doctorError && doctorData?.id) {
    return "doctor";
  }

  // Fonte principal para clínica: vínculo do usuário em clinic_members.
  // Owner/admin acessam a área administrativa da clínica.
  const { data: clinicMemberData, error: clinicMemberError } = await supabase
    .from("clinic_members")
    .select("clinic_id, member_role")
    .eq("user_id", userId)
    .in("member_role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();

  if (!clinicMemberError && clinicMemberData?.clinic_id) {
    return "clinic";
  }

  // Qualquer usuário autenticado sem vínculo médico ou administrativo de clínica
  // permanece na experiência de paciente.
  return "patient";
}

function getRedirectPath(area: AllowedArea) {
  if (area === "doctor") return "/medico/dashboard";
  if (area === "clinic") return "/clinica/dashboard";
  return "/dashboard";
}

export default function RoleGuard({ area, children }: RoleGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      setChecking(true);
      setAllowed(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      const currentArea = await getUserAccessArea(user.id);

      if (!mounted) return;

      if (currentArea !== area) {
        router.replace(getRedirectPath(currentArea));
        return;
      }

      setAllowed(true);
      setChecking(false);
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [area, router]);

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-slate-600">Verificando acesso...</p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
