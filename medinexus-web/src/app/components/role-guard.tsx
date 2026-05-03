"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type AllowedArea = "patient" | "doctor" | "clinic";

type RoleGuardProps = {
  area: AllowedArea;
  children: React.ReactNode;
};

async function getUserAccessArea(userId: string) {
  const { data: doctorMember } = await supabase
    .from("clinic_members")
    .select("id, member_role, doctor_id")
    .eq("user_id", userId)
    .eq("member_role", "doctor")
    .maybeSingle();

  if (doctorMember?.doctor_id) {
    return "doctor";
  }

  const { data: clinicMember } = await supabase
    .from("clinic_members")
    .select("id, member_role")
    .eq("user_id", userId)
    .in("member_role", ["owner", "admin"])
    .maybeSingle();

  if (clinicMember) {
    return "clinic";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.user_role === "clinic") {
    return "clinic";
  }

  return "patient";
}

function getRedirectPath(area: string | null) {
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


