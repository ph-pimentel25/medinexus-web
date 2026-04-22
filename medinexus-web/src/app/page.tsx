import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16">
        <div className="max-w-3xl text-center">
          <span className="mb-4 inline-block rounded-full bg-sky-100 px-4 py-1 text-sm font-medium text-sky-700">
            MediNexus
          </span>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
            Encontre e solicite sua consulta com menos burocracia.
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 md:text-xl">
            Busque por especialidade, plano de saúde, localização e horários
            disponíveis em um só lugar.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/cadastro"
              className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              Criar conta
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Entrar
            </Link>
          </div>
        </div>

        <div className="mt-16 grid w-full max-w-5xl gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">1. Cadastre seu perfil</h2>
            <p className="text-slate-600">
              Informe seu plano de saúde e seus dados básicos para agilizar a
              busca.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">2. Busque do seu jeito</h2>
            <p className="text-slate-600">
              Escolha especialidade, raio e os dias e horários em que você pode
              ir.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">3. Solicite a consulta</h2>
            <p className="text-slate-600">
              Veja opções compatíveis e envie sua solicitação para confirmação
              da clínica.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}