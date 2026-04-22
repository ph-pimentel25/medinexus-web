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

export default function CadastroPage() {
  const router = useRouter();

  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

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
        setMessageType("error");
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
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setMessage("Conta criada, mas não foi possível finalizar o cadastro.");
      setMessageType("error");
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
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (!data.session) {
      setMessage("Conta criada. Agora confirme seu e-mail antes de fazer login.");
      setMessageType("info");
      setSubmitting(false);
      return;
    }

    setMessage("Cadastro realizado com sucesso! Você será redirecionado.");
    setMessageType("success");

    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);

    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2">
          <div>
            <span className="brand-chip">Crie sua conta</span>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Comece sua jornada na MediNexus em poucos minutos.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Cadastre seu perfil, escolha seu plano de saúde e deixe tudo pronto
              para buscar consultas compatíveis com sua rotina.
            </p>

            <div className="mt-8 app-card p-6">
              <p className="text-sm font-medium text-slate-500">
                O cadastro já salva
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Seu plano de saúde principal
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Cidade e estado base para suas buscas
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Dados para acompanhar todo o fluxo do paciente
                </div>
              </div>
            </div>
          </div>

          <div className="app-card p-8 shadow-xl shadow-slate-200/60">
            <div className="mb-8">
              <Link
                href="/"
                className="text-sm font-medium text-sky-700 hover:underline"
              >
                ← Voltar para a página inicial
              </Link>
            </div>

            <h2 className="text-3xl font-bold text-slate-900">Criar conta</h2>
            <p className="mt-2 text-slate-600">
              Preencha seus dados para começar a usar a plataforma.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
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
                  className="app-input"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
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
                    className="app-input"
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
                    className="app-input"
                    required
                    minLength={6}
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
                    type="text"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(21) 99999-9999"
                    className="app-input"
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
                    className="app-input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Plano de saúde
                </label>
                <select
                  name="healthPlanId"
                  value={formData.healthPlanId}
                  onChange={handleChange}
                  className="app-input"
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

              <div className="grid gap-5 md:grid-cols-2">
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
                    className="app-input"
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
                    className="app-input"
                  />
                </div>
              </div>

              {message && <Alert variant={messageType}>{message}</Alert>}

              <button
                type="submit"
                disabled={submitting}
                className="app-button-primary"
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
      </section>
    </main>
  );
}