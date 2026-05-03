import Link from "next/link";

const stats = [
  { label: "Pacientes", value: "Busca" },
  { label: "Médicos", value: "Atendimento" },
  { label: "Clínicas", value: "Gestão" },
];

const flow = [
  "Buscar profissional",
  "Solicitar consulta",
  "Confirmar presença",
  "Receber documento",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] text-slate-950">
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid min-h-[680px] gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#6E56CF]" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                MediNexus
              </span>
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.065em] text-slate-950 sm:text-6xl lg:text-7xl">
              Saúde conectada, organizada e simples.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-9 text-slate-600">
              Uma plataforma para pacientes, médicos e clínicas acompanharem
              consultas, confirmações e documentos médicos em um único fluxo.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/cadastro"
                className="rounded-full bg-slate-950 px-7 py-4 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Criar conta
              </Link>

              <Link
                href="/profissionais"
                className="rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Buscar profissionais
              </Link>
            </div>

            <div className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-slate-200 pt-8">
              {stats.map((item) => (
                <div key={item.label}>
                  <p className="text-sm font-bold text-slate-950">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[48px] bg-[#E9E7FF] blur-3xl" />

            <div className="relative overflow-hidden rounded-[42px] border border-slate-200 bg-white shadow-[0_35px_100px_-55px_rgba(15,23,42,0.45)]">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Visão do cuidado
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Fluxo integrado de atendimento
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    Online
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-[32px] bg-slate-950 p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Próxima consulta
                  </p>

                  <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">
                    Atendimento confirmado
                  </h2>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/10 p-4">
                      <p className="text-xs text-white/50">Paciente</p>
                      <p className="mt-1 font-bold">Maria Oliveira</p>
                    </div>

                    <div className="rounded-3xl bg-white/10 p-4">
                      <p className="text-xs text-white/50">Profissional</p>
                      <p className="mt-1 font-bold">Dr. Rafael Costa</p>
                    </div>

                    <div className="rounded-3xl bg-white/10 p-4 sm:col-span-2">
                      <p className="text-xs text-white/50">Status</p>
                      <p className="mt-1 font-bold">
                        Presença aguardando confirmação do paciente
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {flow.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-[#FBFBF8] p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-[#283C7A] shadow-sm">
                        {index + 1}
                      </div>

                      <p className="text-sm font-bold text-slate-800">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6E56CF]">
              Plataforma
            </p>

            <h2 className="mt-4 max-w-lg text-4xl font-black tracking-[-0.055em] text-slate-950">
              Uma experiência única para quem cuida e para quem é cuidado.
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Paciente</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Busca profissionais, solicita consultas e acessa documentos
                médicos liberados.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-950">Médico</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Gerencia solicitações, disponibilidade, prontuários e emissão de
                documentos.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-950">Clínica</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Organiza equipe médica, solicitações e informações
                institucionais.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 rounded-[40px] bg-[#101322] px-8 py-10 text-white sm:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
              Comece agora
            </p>

            <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-[-0.055em]">
              Centralize sua jornada de saúde no MediNexus.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/cadastro"
              className="rounded-full bg-white px-7 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              Criar conta
            </Link>

            <Link
              href="/clinicas"
              className="rounded-full border border-white/15 px-7 py-4 text-sm font-black text-white transition hover:bg-white/10"
            >
              Ver clínicas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}