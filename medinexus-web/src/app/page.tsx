import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-16 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="brand-chip">
              Plataforma de agendamento inteligente
            </span>

            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
              Encontre e solicite sua consulta com menos burocracia.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A MediNexus conecta paciente, clínica e disponibilidade em uma
              experiência mais simples, rápida e confiável.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/cadastro" className="app-button-primary text-center">
                Criar conta
              </Link>

              <Link
                href="/login"
                className="app-button-secondary text-center"
              >
                Entrar
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="app-card p-5">
                <p className="text-2xl font-bold text-slate-900">1</p>
                <p className="mt-1 text-sm text-slate-500">Fluxo do paciente</p>
              </div>

              <div className="app-card p-5">
                <p className="text-2xl font-bold text-slate-900">1</p>
                <p className="mt-1 text-sm text-slate-500">Painel da clínica</p>
              </div>

              <div className="app-card p-5">
                <p className="text-2xl font-bold text-slate-900">MVP</p>
                <p className="mt-1 text-sm text-slate-500">Funcional online</p>
              </div>
            </div>
          </div>

          <div className="hero-surface rounded-[32px] border border-slate-200 p-8 shadow-xl shadow-slate-200/60">
            <div className="grid gap-5">
              <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-slate-100">
                <p className="text-sm font-medium" style={{ color: "var(--brand-petrol)" }}>
                  Etapa 1
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Cadastre seu perfil
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Informe plano de saúde e dados principais.
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-slate-100">
                <p className="text-sm font-medium" style={{ color: "var(--brand-plum)" }}>
                  Etapa 2
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Busque do seu jeito
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Filtre por especialidade, cidade, horários e disponibilidade.
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-slate-100">
                <p className="text-sm font-medium" style={{ color: "var(--brand-sage)" }}>
                  Etapa 3
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Acompanhe o retorno
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Solicite, acompanhe e organize tudo em um só lugar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}