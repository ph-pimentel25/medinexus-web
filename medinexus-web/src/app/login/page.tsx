"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type UserRole = "patient" | "doctor" | "clinic";

async function detectUserRole(userId: string): Promise<UserRole> {
  const { data: doctorData } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (doctorData?.id) return "doctor";

  const { data: clinicMemberData } = await supabase
    .from("clinic_members")
    .select("clinic_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (clinicMemberData?.clinic_id) return "clinic";

  return "patient";
}

function getDashboardByRole(role: UserRole) {
  if (role === "doctor") return "/medico/dashboard";
  if (role === "clinic") return "/clinica/dashboard";
  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Informe seu e-mail.");
      setMessageType("error");
      return;
    }

    if (!password) {
      setMessage("Informe sua senha.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(`Erro ao entrar: ${error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setMessage("Não foi possível identificar sua conta.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const role = await detectUserRole(userId);
    const destination = getDashboardByRole(role);

    router.push(destination);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F]">
      <section className="relative min-h-[calc(100vh-104px)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(122,157,140,0.26),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(90,76,134,0.22),transparent_32%),linear-gradient(135deg,#FAF6F3_0%,#F5EEE9_55%,#EEF3EF_100%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-104px)] max-w-[1500px] items-center gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-14">
          <div className="hidden lg:block">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#D8CCC5] bg-white/65 px-4 py-2 shadow-[0_24px_90px_-65px_rgba(46,57,63,0.55)] backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-[#7A9D8C]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#164957]">
                MediNexus
              </span>
            </div>

            <h1 className="max-w-5xl text-[4.4rem] font-semibold leading-[0.92] tracking-[-0.08em] text-[#2E393F]">
              Entre na sua central de cuidado.
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-[#2E393F]/70">
              Acesse consultas, solicitações, documentos médicos, notificações e
              sua área personalizada dentro da plataforma.
            </p>

            <div className="mt-14 grid max-w-2xl grid-cols-3 gap-5">
              {[
                ["Paciente", "acompanha"],
                ["Médico", "atende"],
                ["Clínica", "gerencia"],
              ].map(([title, text]) => (
                <div key={title} className="border-t border-[#D8CCC5] pt-5">
                  <p className="text-base font-semibold text-[#164957]">
                    {title}
                  </p>
                  <p className="mt-1 text-sm text-[#2E393F]/58">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[540px]">
            <div className="rounded-[2.8rem] border border-[#E7DDD7] bg-white/72 p-4 shadow-[0_50px_140px_-80px_rgba(46,57,63,0.75)] backdrop-blur-2xl">
              <div className="rounded-[2.25rem] border border-[#E7DDD7] bg-[#FAF6F3]/80 p-7 sm:p-9">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7A9D8C]">
                    Login
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-[#2E393F]">
                    Acesse sua conta
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-[#2E393F]/64">
                    Entre com seu e-mail e senha para continuar sua jornada na
                    MediNexus.
                  </p>
                </div>

                {message && (
                  <div className="mt-6">
                    <Alert variant={messageType}>{message}</Alert>
                  </div>
                )}

                <form onSubmit={handleLogin} className="mt-7 grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="voce@email.com"
                      className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Sua senha"
                      className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-4 py-4 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/35 focus:border-[#164957] focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 rounded-full bg-[#164957] px-8 py-4 text-sm font-semibold text-white shadow-[0_24px_80px_-42px_rgba(22,73,87,0.85)] transition hover:-translate-y-0.5 hover:bg-[#123B46] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </form>

                <div className="mt-7 border-t border-[#E7DDD7] pt-6">
                  <p className="text-sm text-[#2E393F]/64">
                    Ainda não tem conta?{" "}
                    <Link
                      href="/cadastro"
                      className="font-semibold text-[#164957] hover:underline"
                    >
                      Criar cadastro
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 text-center text-xs leading-6 text-[#2E393F]/45">
              Plataforma MediNexus para pacientes, médicos e clínicas.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}