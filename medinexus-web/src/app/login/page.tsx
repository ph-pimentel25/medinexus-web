"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="brand-chip">Acesse sua conta</span>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Entre na MediNexus e acompanhe sua jornada de atendimento.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Consulte seus pedidos, acompanhe respostas das clínicas e faça
              novas buscas de forma centralizada.
            </p>

            <div className="mt-8 app-card p-6">
              <p className="text-sm font-medium text-slate-500">
                O que você pode fazer ao entrar
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Buscar consultas por especialidade e disponibilidade
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Acompanhar solicitações pendentes, confirmadas ou recusadas
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Acessar rapidamente o painel da clínica para testes do MVP
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

            <h2 className="text-3xl font-bold text-slate-900">Entrar</h2>
            <p className="mt-2 text-slate-600">
              Use seu e-mail e senha para acessar sua conta.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="app-input"
                  required
                />
              </div>

              {message && <Alert variant="error">{message}</Alert>}

              <button
                type="submit"
                disabled={submitting}
                className="app-button-primary"
              >
                {submitting ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link href="/cadastro" className="text-sky-700 hover:underline">
                Criar conta
              </Link>

              <button type="button" className="text-slate-500 hover:text-slate-700">
                Esqueci minha senha
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}