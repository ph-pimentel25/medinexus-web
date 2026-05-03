import Link from "next/link";

const principles = [
  {
    title: "Clareza",
    text: "A jornada de saúde precisa ser compreensível para pacientes, médicos e clínicas.",
  },
  {
    title: "Continuidade",
    text: "Busca, consulta, confirmação, prontuário e documentos devem fazer parte do mesmo fluxo.",
  },
  {
    title: "Confiança",
    text: "Uma plataforma de saúde precisa transmitir segurança desde o primeiro contato.",
  },
];

const ecosystem = [
  {
    title: "Paciente",
    text: "Busca atendimento, acompanha solicitações, confirma presença e acessa documentos médicos.",
  },
  {
    title: "Médico",
    text: "Gerencia disponibilidade, consultas, prontuários e emissão de documentos.",
  },
  {
    title: "Clínica",
    text: "Organiza equipe, operação, solicitações e dados institucionais.",
  },
];

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F]">
      <section className="relative overflow-hidden border-b border-[#E7DDD7]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(122,157,140,0.24),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(90,76,134,0.20),transparent_32%)]" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
          <div className="max-w-5xl">
            <div className="mb-7 inline-flex rounded-full border border-[#D8CCC5] bg-white/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#164957] shadow-sm backdrop-blur-xl">
              Sobre a MediNexus
            </div>

            <h1 className="max-w-6xl text-[4rem] font-semibold leading-[0.92] tracking-[-0.075em] text-[#2E393F] sm:text-[5.6rem] lg:text-[7rem]">
              Tecnologia para aproximar quem cuida de quem precisa de cuidado.
            </h1>

            <p className="mt-8 max-w-3xl text-xl leading-9 text-[#2E393F]/70">
              A MediNexus nasce para reduzir a fragmentação da jornada de saúde.
              Em vez de consultas espalhadas em mensagens, documentos perdidos e
              confirmações manuais, a plataforma organiza tudo em um fluxo único,
              claro e confiável.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/cadastro"
                className="rounded-full bg-[#164957] px-8 py-4 text-sm font-semibold text-white shadow-[0_24px_80px_-42px_rgba(22,73,87,0.85)] transition hover:-translate-y-0.5 hover:bg-[#123B46]"
              >
                Criar conta
              </Link>

              <Link
                href="/clinicas"
                className="rounded-full border border-[#D8CCC5] bg-white/70 px-8 py-4 text-sm font-semibold text-[#2E393F] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
              >
                Explorar clínicas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-14 px-6 py-20 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7A9D8C]">
            Nossa visão
          </p>

          <h2 className="mt-5 max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.065em] text-[#2E393F]">
            Saúde digital não precisa parecer fria.
          </h2>
        </div>

        <div className="space-y-8 text-lg leading-9 text-[#2E393F]/68">
          <p>
            A experiência de saúde envolve confiança, tempo, informação e
            continuidade. Por isso, a MediNexus foi pensada para ser mais do que
            uma agenda: ela conecta a busca por atendimento ao acompanhamento
            depois da consulta.
          </p>

          <p>
            Pacientes entendem melhor o que está acontecendo. Médicos ganham
            mais organização. Clínicas passam a operar com mais clareza e menos
            ruído.
          </p>
        </div>
      </section>

      <section className="border-y border-[#E7DDD7] bg-white/50">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[0.75fr_1.25fr] lg:px-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5A4C86]">
              Princípios
            </p>

            <h2 className="mt-5 max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.065em]">
              O que guia o produto.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {principles.map((item) => (
              <article
                key={item.title}
                className="rounded-[2.2rem] border border-[#E7DDD7] bg-[#FAF6F3]/80 p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_30px_90px_-65px_rgba(46,57,63,0.55)]"
              >
                <div className="mb-8 h-1.5 w-12 rounded-full bg-[#7A9D8C]" />

                <h3 className="text-2xl font-semibold tracking-[-0.045em] text-[#164957]">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-[#2E393F]/66">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-20 sm:px-10 lg:px-14">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7A9D8C]">
              Ecossistema
            </p>

            <h2 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.065em] text-[#2E393F]">
              Uma plataforma com três perspectivas conectadas.
            </h2>

            <p className="mt-7 max-w-2xl text-lg leading-9 text-[#2E393F]/68">
              O mesmo atendimento pode ser visto por ângulos diferentes:
              paciente, médico e clínica. A MediNexus organiza essas três
              visões sem quebrar a continuidade do cuidado.
            </p>
          </div>

          <div className="space-y-4">
            {ecosystem.map((item, index) => (
              <article
                key={item.title}
                className="flex gap-5 rounded-[2rem] border border-[#E7DDD7] bg-white/70 p-5 shadow-sm backdrop-blur"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#164957] text-sm font-semibold text-white">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.035em] text-[#2E393F]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-[#2E393F]/66">
                    {item.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#164957] via-[#2E393F] to-[#5A4C86] p-10 text-white shadow-[0_45px_130px_-75px_rgba(46,57,63,0.9)] sm:p-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                Próximo passo
              </p>

              <h2 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.065em]">
                Comece a organizar sua jornada de saúde com mais clareza.
              </h2>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/cadastro"
                className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[#164957] transition hover:-translate-y-0.5 hover:bg-[#FAF6F3]"
              >
                Criar conta
              </Link>

              <Link
                href="/profissionais"
                className="rounded-full border border-white/20 px-8 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Buscar profissionais
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}