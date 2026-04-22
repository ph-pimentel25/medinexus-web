"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";;

type HealthPlan = {
  id: string;
  name: string;
};

export default function CadastroPage() {
  const router = useRouter();

  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    birthDate: "",
    healthPlanId: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    async function loadHealthPlans() {
      const { data, error } = await supabase
        .from("health_plans")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        setMessage("Erro ao carregar os planos de saúde.");
      } else {
        setHealthPlans(data || []);
      }

      setLoadingPlans(false);
    }

    loadHealthPlans();
  }, []);

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
    setSubmitting(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          role: "patient",
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setMessage(
        "Conta criada, mas não foi possível finalizar o cadastro do paciente."
      );
      setSubmitting(false);
      return;
    }

    const { error: patientError } = await supabase.from("patients").insert({
      id: userId,
      birth_date: formData.birthDate || null,
      default_health_plan_id: formData.healthPlanId || null,
      city: formData.city || null,
      state: formData.state || null,
    });

    if (patientError) {
      setMessage("Conta criada, mas houve erro ao salvar os dados do paciente.");
      setSubmitting(false);
      return;
    }

    if (!data.session) {
  setMessage(
    "Conta criada. Agora confirme seu e-mail antes de fazer login."
  );
  setSubmitting(false);
  return;
}

setMessage("Cadastro realizado com sucesso! Você será redirecionado.");

setTimeout(() => {
  router.push("/dashboard");
}, 1500);

    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link href="/" className="text-sm font-medium text-sky-700 hover:underline">
            ← Voltar para a página inicial
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Criar conta</h1>
          <p className="mb-8 text-slate-600">
            Cadastre seu perfil para começar a buscar consultas na MediNexus.
          </p>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nome completo
              </label>
              <input
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Digite seu nome"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Digite seu e-mail"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Senha
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Crie uma senha"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Telefone
              </label>
              <input
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(21) 99999-9999"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Data de nascimento
              </label>
              <input
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Plano de saúde
              </label>
              <select
                name="healthPlanId"
                value={formData.healthPlanId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                required
                disabled={loadingPlans}
              >
                <option value="">
                  {loadingPlans ? "Carregando planos..." : "Selecione seu plano"}
                </option>
                {healthPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cidade
              </label>
              <input
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                placeholder="Digite sua cidade"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Estado
              </label>
              <input
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
                placeholder="Digite seu estado"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            {message && (
              <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-sky-700 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}