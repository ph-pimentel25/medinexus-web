"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type ProfileRole = "patient" | "clinic_admin" | "doctor";

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("SessÃ£o nÃ£o encontrada apÃ³s o login.");
      setSubmitting(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: ProfileRole }>();

    if (profileError || !profile) {
      setMessage("NÃ£o foi possÃ­vel identificar o perfil do usuÃ¡rio.");
      setSubmitting(false);
      return;
    }

    if (profile.role === "clinic_admin") {
      router.push("/clinica/dashboard");
    } else if (profile.role === "doctor") {
      router.push("/medico/dashboard");
    } else {
      router.push("/dashboard");
    }

    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="brand-chip">Acesse sua conta</span>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Entre na MediNexus e continue sua jornada.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Pacientes, mÃ©dicos e clÃ­nicas acessam Ã¡reas diferentes conforme o
              perfil da conta.
            </p>

            <div className="mt-8 app-card p-6">
              <p className="text-sm font-medium text-slate-500">
                Acessos disponÃ­veis
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Paciente: busca e acompanhamento de consultas
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  MÃ©dico: solicitaÃ§Ãµes e disponibilidade
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  ClÃ­nica: planos, mÃ©dicos e painel operacional
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
                â† Voltar para a pÃ¡gina inicial
              </Link>
            </div>

            <h2 className="text-3xl font-bold text-slate-900">Entrar</h2>
            <p className="mt-2 text-slate-600">
              Use seu e-mail e senha para acessar sua Ã¡rea.
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

            <div className="mt-6 grid gap-3 text-sm">
              <Link href="/cadastro" className="text-sky-700 hover:underline">
                Criar conta de paciente
              </Link>
              <Link
                href="/profissionais"
                className="text-sky-700 hover:underline"
              >
                Criar conta de mÃ©dico
              </Link>
              <Link href="/sobre" className="text-sky-700 hover:underline">
                ConheÃ§a a MediNexus
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


