"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

type UserRole = "patient" | "doctor" | "clinic";

async function detectUserRole(userId: string): Promise<UserRole> {
  // 1. Verifica se é médico
  const { data: doctorData } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (doctorData?.id) return "doctor";

  // 2. Verifica se é proprietário de clínica (tabela clinics)
  const { data: clinicOwnerData } = await supabase
    .from("clinics")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (clinicOwnerData?.id) return "clinic";

  // 3. Verifica se é membro/equipe de clínica (tabela clinic_members)
  const { data: clinicMemberData } = await supabase
    .from("clinic_members")
    .select("clinic_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (clinicMemberData?.clinic_id) return "clinic";

  // 4. Padrão: paciente
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

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Informe seu e-mail.");
      return;
    }

    if (!password) {
      setMessage("Informe sua senha.");
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
      setLoading(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setMessage("Não foi possível identificar sua conta.");
      setLoading(false);
      return;
    }

    const role = await detectUserRole(userId);
    const destination = getDashboardByRole(role);

    router.replace(destination);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F] font-sans">
      <section className="relative min-h-[calc(100vh-104px)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(122,157,140,0.22),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(90,76,134,0.18),transparent_35%),linear-gradient(135deg,#FAF6F3_0%,#F5EEE9_55%,#EEF3EF_100%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-104px)] max-w-7xl items-center gap-12 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
          {/* Lado Esquerdo: Mensagem Institucional */}
          <div className="hidden lg:block space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7E2DD] bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#7A9D8C]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#164957]">
                Ecossistema MediNexus
              </span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-[#164957] leading-tight">
              Entre na sua central <br />de cuidado integrado.
            </h1>

            <p className="max-w-lg text-base text-[#2E393F]/70 leading-relaxed">
              Acesse prontuários, confirme atendimentos, consulte documentos com validação por QR Code e mantenha seus dados sincronizados.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E7E2DD]/70 max-w-md">
              <div className="rounded-xl border border-[#E7E2DD] bg-white/60 p-3.5 backdrop-blur">
                <p className="text-xs font-bold text-[#164957]">Paciente</p>
                <p className="text-[11px] text-[#2E393F]/60 mt-0.5">Acompanha</p>
              </div>
              <div className="rounded-xl border border-[#E7E2DD] bg-white/60 p-3.5 backdrop-blur">
                <p className="text-xs font-bold text-[#164957]">Médico</p>
                <p className="text-[11px] text-[#2E393F]/60 mt-0.5">Atende</p>
              </div>
              <div className="rounded-xl border border-[#E7E2DD] bg-white/60 p-3.5 backdrop-blur">
                <p className="text-xs font-bold text-[#164957]">Clínica</p>
                <p className="text-[11px] text-[#2E393F]/60 mt-0.5">Gerencia</p>
              </div>
            </div>
          </div>

          {/* Lado Direito: Formulário de Acesso */}
          <div className="mx-auto w-full max-w-[440px]">
            <div className="rounded-3xl border border-[#E7E2DD] bg-white p-6 sm:p-8 shadow-sm backdrop-blur">
              <div className="mb-6">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7A9D8C]">
                  Autenticação
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-[#164957] mt-1">
                  Acesse sua conta
                </h2>
                <p className="text-xs text-[#2E393F]/70 mt-1">
                  Identificação automática de perfil: paciente, médico ou clínica.
                </p>
              </div>

              {message && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2E393F]/80 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] px-3.5 py-2.5 text-xs text-[#2E393F] outline-none transition focus:border-[#164957] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2E393F]/80 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] px-3.5 py-2.5 text-xs text-[#2E393F] outline-none transition focus:border-[#164957] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#164957] hover:bg-[#164957]/90 text-white font-semibold text-xs py-3 px-4 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? "Entrando..." : "Entrar na plataforma"}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-[#E7E2DD] text-center">
                <p className="text-xs text-[#2E393F]/70">
                  Ainda não tem conta?{" "}
                  <Link href="/cadastro" className="font-bold text-[#164957] hover:underline">
                    Criar cadastro
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}