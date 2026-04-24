import Link from "next/link";

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <span className="brand-chip">Sobre a MediNexus</span>
            <h1 className="mt-6 text-4xl font-bold text-slate-900 md:text-5xl">
              Uma plataforma para organizar a jornada ambulatorial.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              A MediNexus conecta paciente, médico e clínica em uma experiência
              digital mais eficiente, com menos ruído operacional e mais
              previsibilidade no cuidado.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="app-card p-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                Para pacientes
              </h2>
              <p className="mt-3 text-slate-600">
                Busca de consultas por plano, especialidade, disponibilidade e
                localização, com acompanhamento do processo em área privada.
              </p>
            </div>

            <div className="app-card p-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                Para médicos
              </h2>
              <p className="mt-3 text-slate-600">
                Área restrita com solicitações próprias, disponibilidade semanal
                e base para evolução clínica e receituário.
              </p>
            </div>

            <div className="app-card p-6 md:col-span-2">
              <h2 className="text-2xl font-semibold text-slate-900">
                Para clínicas
              </h2>
              <p className="mt-3 text-slate-600">
                A clínica tem uma área privada para estruturar a operação com mais
                profissionalismo: cadastro institucional, convênios aceitos,
                equipe médica, especialidades e painel de solicitações.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Cadastro institucional completo
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  CNPJ e dados corporativos
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Gestão de planos e equipe
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Área privada operacional
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 app-card p-8">
            <h2 className="text-3xl font-bold text-slate-900">
              Cadastre sua clínica na MediNexus
            </h2>
            <p className="mt-4 max-w-3xl text-slate-600">
              O cadastro da clínica foi pensado para ser mais profundo e
              profissional, com dados institucionais essenciais para estruturar a
              operação desde o início.
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/clinica/cadastro"
                className="app-button-primary text-center"
              >
                Cadastrar clínica
              </Link>

              <Link href="/login" className="app-button-secondary text-center">
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}