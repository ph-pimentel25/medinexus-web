"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";
import { getCurrentClinicMember } from "../../lib/auth";

type HealthPlan = {
  id: string;
  name: string;
  operator_name: string|null;
  catalog_scope: string|null;
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

  const [operator,setOperator]=useState("");
  const [plans, setPlans] = useState<HealthPlan[]>([]);
  const [acceptedPlanIds, setAcceptedPlanIds] = useState<string[]>([]);


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

      const { data: member, error: memberError } = await getCurrentClinicMember();

      if (memberError || !member) {
        setMessage("Você não possui acesso à área da clínica.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setClinicId(member.clinic_id);
      setMemberRole(member.member_role);

      const { data: allPlans, error: allPlansError } = await supabase
        .from("health_plans")
        .select("id, name, operator_name, catalog_scope")
        .order("name", { ascending: true });

      const { data: clinicPlans, error: clinicPlansError } = await supabase
        .from("clinic_health_plans")
        .select("health_plan_id")
        .eq("clinic_id", member.clinic_id);

      if (allPlansError || clinicPlansError) {
        setMessage("Não foi possível carregar os planos.");
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
            â† Voltar para o dashboard da clínica
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Planos aceitos
          </p>
          <h1 className="mt-3 app-section-title">
            Configure os convênios da clínica
          </h1>
          <p className="app-section-subtitle">
            Selecione os planos que sua clínica aceita atender.
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <label className="mb-5 block text-sm font-semibold">Operadora<select className="app-input mt-2" value={operator} onChange={e=>setOperator(e.target.value)}><option value="">Todas as operadoras</option>{[...new Set(plans.map(p=>p.operator_name).filter(Boolean))].map(o=><option key={o} value={o!}>{o}</option>)}</select></label>
        <p className="mb-5 text-sm">Marque somente os planos/categorias que seu contrato aceita. A seleção não autoriza automaticamente procedimentos ou comprova elegibilidade do beneficiário.</p>
        <div className="grid gap-4">
          {plans.filter(plan=>!operator||plan.operator_name===operator).map((plan) => {
            const accepted = acceptedPlanIds.includes(plan.id);

            return (
              <div
                key={plan.id}
                className="app-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {plan.operator_name} · {plan.name}
                  </h2>
                  <p className="mt-1 text-xs">{plan.catalog_scope}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {accepted ? "Plano já aceito pela clínica" : "Plano ainda não aceito"}
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


