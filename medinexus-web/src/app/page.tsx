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
              Conectando pacientes, médicos e clínicas com menos burocracia.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A MediNexus organiza a jornada do cuidado, desde a busca por consulta
              até o acompanhamento clínico.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/cadastro" className="app-button-primary text-center">
                Sou paciente
              </Link>

              <Link
                href="/medico/cadastro"
                className="app-button-secondary text-center"
              >
                Sou médico
              </Link>

              <Link href="/sobre" className="app-button-secondary text-center">
                Conheça a MediNexus
              </Link>
            </div>

            <div className="mt-10 text-sm text-slate-500">
              Para clínicas, cadastro e apresentação institucional estão na área{" "}
              <Link href="/sobre" className="font-medium text-sky-700 hover:underline">
                Sobre
              </Link>
              .
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="app-card p-5">
                <p className="text-2xl font-bold text-slate-900">Paciente</p>
                <p className="mt-1 text-sm text-slate-500">
                  Busca, agenda e acompanha
                </p>
              </div>

              <div className="app-card p-5">
                <p className="text-2xl font-bold text-slate-900">Médico</p>
                <p className="mt-1 text-sm text-slate-500">
                  Gerencia agenda e solicitações
                </p>
              </div>

              <div className="app-card p-5">
                <p className="text-2xl font-bold text-slate-900">Clínica</p>
                <p className="mt-1 text-sm text-slate-500">
                  Estrutura operação e equipe
                </p>
              </div>
            </div>
          </div>

          <div className="hero-surface rounded-[32px] border border-slate-200 p-8 shadow-xl shadow-slate-200/60">
            <div className="grid gap-5">
              <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-slate-100">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--brand-petrol)" }}
                >
                  Paciente
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Busca inteligente
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Plano, localização, disponibilidade e jornada organizados em um só fluxo.
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-slate-100">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--brand-plum)" }}
                >
                  Médico
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Agenda e confirmação
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Disponibilidade semanal, validação de horário e gestão das próprias consultas.
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-slate-100">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--brand-sage)" }}
                >
                  Clínica
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Operação profissional
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Convênios, médicos, especialidades e área privada de gestão.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}