"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type HealthPlan = {
  id: string;
  name: string;
};

export default function PerfilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    healthPlanId: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .single();

      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("birth_date, default_health_plan_id, city, state")
        .eq("id", user.id)
        .single();

      const { data: plans, error: plansError } = await supabase
        .from("health_plans")
        .select("id, name")
        .order("name", { ascending: true });

      if (profileError || patientError || plansError) {
        setMessage("Não foi possível carregar os dados do perfil.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setHealthPlans(plans || []);

      setFormData({
        fullName: profile?.full_name || "",
        email: profile?.email || user.email || "",
        phone: profile?.phone || "",
        birthDate: patient?.birth_date || "",
        healthPlanId: patient?.default_health_plan_id || "",
        city: patient?.city || "",
        state: patient?.state || "",
      });

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Sessão não encontrada.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: formData.fullName || null,
        phone: formData.phone || null,
      })
      .eq("id", user.id);

    if (profileError) {
      setMessage("Erro ao atualizar os dados do perfil.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    const { error: patientError } = await supabase
      .from("patients")
      .update({
        birth_date: formData.birthDate || null,
        default_health_plan_id: formData.healthPlanId || null,
        city: formData.city || null,
        state: formData.state || null,
      })
      .eq("id", user.id);

    if (patientError) {
      setMessage("Erro ao atualizar os dados do paciente.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("Perfil atualizado com sucesso.");
    setMessageType("success");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando perfil...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Voltar para o dashboard
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
            Perfil do paciente
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Gerencie seus dados
          </h1>
          <p className="mt-2 text-slate-600">
            Atualize suas informações pessoais e o plano principal usado nas buscas.
          </p>
        </div>

        <div className="app-card p-8">
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nome completo
                </label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Digite seu nome"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  name="email"
                  value={formData.email}
                  className="app-input"
                  disabled
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Telefone
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="(21) 99999-9999"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="app-input"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Plano de saúde principal
              </label>
              <select
                name="healthPlanId"
                value={formData.healthPlanId}
                onChange={handleChange}
                className="app-input"
              >
                <option value="">Selecione seu plano</option>
                {healthPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cidade
                </label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Digite sua cidade"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Estado
                </label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="app-input"
                  placeholder="Digite seu estado"
                />
              </div>
            </div>

            {message && <Alert variant={messageType}>{message}</Alert>}

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="app-button-primary"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>

              <Link href="/dashboard" className="app-button-secondary text-center">
                Voltar ao dashboard
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}