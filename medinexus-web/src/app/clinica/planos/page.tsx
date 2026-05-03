"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

type HealthPlan = {
  id: string;
  name: string;
};

export default function ClinicaPlanosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [clinicId, setClinicId] = useState<string>("");
  const [memberRole, setMemberRole] = useState<string>("");

  const [plans, setPlans] = useState<HealthPlan[]>([]);
  const [acceptedPlanIds, setAcceptedPlanIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadPlansPage() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from("clinic_members")
        .select("clinic_id, member_role")
        .eq("user_id", user.id)
        .single();

      if (memberError || !member) {
        setMessage("VocÃª nÃ£o possui acesso Ã  Ã¡rea da clÃ­nica.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setClinicId(member.clinic_id);
      setMemberRole(member.member_role);

      const { data: allPlans, error: allPlansError } = await supabase
        .from("health_plans")
        .select("id, name")
        .order("name", { ascending: true });

      const { data: clinicPlans, error: clinicPlansError } = await supabase
        .from("clinic_health_plans")
        .select("health_plan_id")
        .eq("clinic_id", member.clinic_id);

      if (allPlansError || clinicPlansError) {
        setMessage("NÃ£o foi possÃ­vel carregar os planos.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setPlans(allPlans || []);
      setAcceptedPlanIds((clinicPlans || []).map((item) => item.health_plan_id));
      setLoading(false);
    }

    loadPlansPage();
  }, [router]);

  async function handleTogglePlan(planId: string, isCurrentlyAccepted: boolean) {
    if (!clinicId) return;

    if (!["owner", "admin"].includes(memberRole)) {
      setMessage("Apenas owner/admin pode alterar os planos aceitos.");
      setMessageType("error");
      return;
    }

    setSavingId(planId);
    setMessage("");

    if (isCurrentlyAccepted) {
      const { error } = await supabase
        .from("clinic_health_plans")
        .delete()
        .eq("clinic_id", clinicId)
        .eq("health_plan_id", planId);

      if (error) {
        setMessage("Erro ao remover o plano.");
        setMessageType("error");
        setSavingId(null);
        return;
      }

      setAcceptedPlanIds((prev) => prev.filter((id) => id !== planId));
      setMessage("Plano removido com sucesso.");
      setMessageType("success");
      setSavingId(null);
      return;
    }

    const { error } = await supabase.from("clinic_health_plans").insert({
      clinic_id: clinicId,
      health_plan_id: planId,
    });

    if (error) {
      setMessage("Erro ao adicionar o plano.");
      setMessageType("error");
      setSavingId(null);
      return;
    }

    setAcceptedPlanIds((prev) => [...prev, planId]);
    setMessage("Plano adicionado com sucesso.");
    setMessageType("success");
    setSavingId(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando planos...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/clinica/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            â† Voltar para o dashboard da clÃ­nica
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Planos aceitos
          </p>
          <h1 className="mt-3 app-section-title">
            Configure os convÃªnios da clÃ­nica
          </h1>
          <p className="app-section-subtitle">
            Selecione os planos que sua clÃ­nica aceita atender.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="grid gap-4">
          {plans.map((plan) => {
            const accepted = acceptedPlanIds.includes(plan.id);

            return (
              <div
                key={plan.id}
                className="app-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {plan.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {accepted ? "Plano jÃ¡ aceito pela clÃ­nica" : "Plano ainda nÃ£o aceito"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleTogglePlan(plan.id, accepted)}
                  disabled={savingId === plan.id}
                  className={accepted ? "app-button-secondary" : "app-button-primary"}
                >
                  {savingId === plan.id
                    ? "Salvando..."
                    : accepted
                    ? "Remover plano"
                    : "Aceitar plano"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}


