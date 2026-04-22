import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.16),_transparent_30%)]" />

      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-1 text-sm font-semibold text-sky-300">
              MVP funcional já no ar
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-white md:text-6xl">
              Encontre e solicite sua consulta com menos burocracia.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A MediNexus conecta paciente, clínica e disponibilidade em uma
              experiência mais simples, rápida e inteligente.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/cadastro"
                className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-4 text-center font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:scale-[1.02]"
              >
                Criar conta
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center font-semibold text-white transition hover:bg-white/10"
              >
                Entrar
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">1</p>
                <p className="mt-1 text-sm text-slate-400">Fluxo paciente</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">1</p>
                <p className="mt-1 text-sm text-slate-400">Painel da clínica</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="mt-1 text-sm text-slate-400">No-code? Não. MVP real.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-sky-950/50 backdrop-blur-xl">
            <div className="rounded-[28px] border border-white/10 bg-slate-900 p-6">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-5">
                  <p className="text-sm font-medium text-sky-300">Etapa 1</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Cadastre seu perfil
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Informe plano de saúde e dados principais.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-5">
                  <p className="text-sm font-medium text-cyan-300">Etapa 2</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Busque do seu jeito
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Filtre por especialidade, cidade, horários e disponibilidade.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-5">
                  <p className="text-sm font-medium text-emerald-300">Etapa 3</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Acompanhe o retorno
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Solicite, acompanhe, confirme e organize tudo em um só lugar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}