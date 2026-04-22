import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
              Plataforma de agendamento inteligente
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
              Encontre e solicite sua consulta com menos burocracia.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A MediNexus conecta paciente, clínica e disponibilidade em uma
              experiência mais simples, rápida e confiável.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/cadastro"
                className="rounded-2xl bg-sky-600 px-6 py-4 text-center font-semibold text-white transition hover:bg-sky-700"
              >
                Criar conta
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Entrar
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">1</p>
                <p className="mt-1 text-sm text-slate-500">Fluxo do paciente</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">1</p>
                <p className="mt-1 text-sm text-slate-500">Painel da clínica</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">MVP</p>
                <p className="mt-1 text-sm text-slate-500">Funcional online</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <div className="grid gap-5">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-sky-700">Etapa 1</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Cadastre seu perfil
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Informe plano de saúde e dados principais.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-sky-700">Etapa 2</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Busque do seu jeito
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Filtre por especialidade, cidade, horários e disponibilidade.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-sky-700">Etapa 3</p>
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