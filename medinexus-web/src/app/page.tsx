import Link from "next/link";

const journey = [
  {
    number: "01",
    title: "Busca inteligente",
    text: "Paciente encontra clínicas e profissionais com clareza.",
  },
  {
    number: "02",
    title: "Consulta rastreável",
    text: "Solicitação, confirmação e presença em um fluxo único.",
  },
  {
    number: "03",
    title: "Cuidado documentado",
    text: "Prontuário, documentos e notificações sempre acessíveis.",
  },
];

const modules = [
  "Clínicas",
  "Profissionais",
  "Solicitações",
  "Confirmações",
  "Prontuário",
  "Documentos",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FAF6F3] text-[#2E393F]">
      <section className="relative min-h-[calc(100vh-104px)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(122,157,140,0.28),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(90,76,134,0.24),transparent_30%),linear-gradient(135deg,#FAF6F3_0%,#F5EEE9_52%,#EEF3EF_100%)]" />

        <div className="absolute left-1/2 top-0 h-px w-[92%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#164957]/25 to-transparent" />

        <div className="relative mx-auto grid min-h-[calc(100vh-104px)] max-w-[1500px] items-center gap-14 px-6 py-14 sm:px-10 lg:grid-cols-[1.03fr_0.97fr] lg:px-14">
          <div>
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#D8CCC5] bg-white/60 px-4 py-2 shadow-[0_24px_90px_-65px_rgba(46,57,63,0.55)] backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-[#7A9D8C]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#164957]">
                MediNexus Health OS
              </span>
            </div>

            <h1 className="max-w-6xl text-[4.2rem] font-semibold leading-[0.88] tracking-[-0.085em] text-[#2E393F] sm:text-[6rem] lg:text-[7.6rem]">
              A saúde
              <br />
              finalmente
              <br />
              conectada.
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-[#2E393F]/72">
              Um sistema premium para unir pacientes, médicos e clínicas em uma
              jornada única: busca, consulta, confirmação, prontuário e
              documentos.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/cadastro"
                className="group inline-flex h-14 items-center justify-center rounded-full bg-[#164957] px-8 text-sm font-semibold text-white shadow-[0_24px_80px_-40px_rgba(22,73,87,0.85)] transition hover:-translate-y-0.5 hover:bg-[#123B46]"
              >
                Começar agora
                <span className="ml-2 transition group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                href="/clinicas"
                className="inline-flex h-14 items-center justify-center rounded-full border border-[#D8CCC5] bg-white/70 px-8 text-sm font-semibold text-[#2E393F] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
              >
                Explorar a rede
              </Link>
            </div>

            <div className="mt-16 grid max-w-2xl grid-cols-3 gap-5">
              {[
                ["Paciente", "busca e acompanha"],
                ["Médico", "atende e documenta"],
                ["Clínica", "opera e gerencia"],
              ].map(([title, text]) => (
                <div key={title} className="border-t border-[#D8CCC5] pt-5">
                  <p className="text-base font-semibold text-[#164957]">
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#2E393F]/58">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-10 h-52 w-52 rounded-full bg-[#7A9D8C]/30 blur-3xl" />
            <div className="absolute -bottom-12 -right-10 h-64 w-64 rounded-full bg-[#5A4C86]/25 blur-3xl" />

            <div className="relative rotate-[-1deg] rounded-[3.2rem] border border-white/75 bg-white/45 p-3 shadow-[0_55px_150px_-70px_rgba(46,57,63,0.85)] backdrop-blur-2xl">
              <div className="overflow-hidden rounded-[2.7rem] bg-[#2E393F]">
                <div className="relative p-7 text-white sm:p-9">
                  <div className="absolute right-[-4rem] top-[-4rem] h-72 w-72 rounded-full bg-[#5A4C86]/55 blur-3xl" />
                  <div className="absolute bottom-[-5rem] left-[-4rem] h-72 w-72 rounded-full bg-[#7A9D8C]/25 blur-3xl" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                          Console MediNexus
                        </p>

                        <h2 className="mt-4 max-w-md text-4xl font-semibold leading-[1.02] tracking-[-0.055em]">
                          O fluxo inteiro do cuidado em uma só visão.
                        </h2>
                      </div>

                      <div className="hidden rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-right backdrop-blur sm:block">
                        <p className="text-2xl font-semibold">360°</p>
                        <p className="text-xs text-white/45">cuidado</p>
                      </div>
                    </div>

                    <div className="mt-8 rounded-[2.2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-white/45">
                            Consulta em andamento
                          </p>
                          <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                            Confirmação do paciente
                          </p>
                        </div>

                        <span className="rounded-full bg-[#7A9D8C]/25 px-3 py-1 text-xs font-semibold text-[#DDF0E7]">
                          Ao vivo
                        </span>
                      </div>

                      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[76%] rounded-full bg-[#7A9D8C]" />
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        {[
                          ["Paciente", "Maria O."],
                          ["Médico", "Dr. Rafael"],
                          ["Clínica", "Nexus Care"],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-2xl border border-white/10 bg-white/[0.08] p-4"
                          >
                            <p className="text-xs text-white/40">{label}</p>
                            <p className="mt-2 text-sm font-semibold text-white/90">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {journey.map((item) => (
                        <div
                          key={item.number}
                          className="grid grid-cols-[48px_1fr_auto] items-center gap-4 rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#164957]">
                            {item.number}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-white">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-white/45">
                              {item.text}
                            </p>
                          </div>

                          <div className="h-2.5 w-2.5 rounded-full bg-[#7A9D8C]" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 border-t border-white/10 bg-white/[0.04]">
                  {["Paciente", "Médico", "Clínica"].map((item) => (
                    <div
                      key={item}
                      className="border-r border-white/10 p-5 last:border-r-0"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                        Área
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white/85">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 left-10 hidden rotate-[1deg] rounded-3xl border border-[#D8CCC5] bg-white/85 p-5 shadow-[0_28px_85px_-55px_rgba(46,57,63,0.75)] backdrop-blur-xl lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9D8C]">
                Status
              </p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#2E393F]">
                Jornada sincronizada
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-[#E7DDD7] bg-white/48">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[0.78fr_1.22fr] lg:px-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5A4C86]">
              Ecossistema
            </p>

            <h2 className="mt-5 max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.065em] text-[#2E393F]">
              Três operações. Uma experiência contínua.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Paciente",
                text: "Encontra atendimento, acompanha status e acessa documentos.",
              },
              {
                title: "Médico",
                text: "Organiza agenda, solicitações, prontuários e emissão.",
              },
              {
                title: "Clínica",
                text: "Gerencia equipe, operação, consultas e presença digital.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="group rounded-[2.2rem] border border-[#E7DDD7] bg-[#FAF6F3]/80 p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_30px_90px_-65px_rgba(46,57,63,0.55)]"
              >
                <div className="mb-8 h-1.5 w-12 rounded-full bg-[#7A9D8C] transition group-hover:w-20" />

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
        <div className="grid gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="relative">
            <div className="absolute -left-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#EEF3EF] blur-3xl" />

            <div className="relative grid gap-4">
              {modules.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-5 rounded-[2rem] border border-[#E7DDD7] bg-white/70 p-5 shadow-sm backdrop-blur"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#164957] text-sm font-semibold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <p className="text-lg font-medium tracking-[-0.025em] text-[#2E393F]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7A9D8C]">
              O diferencial
            </p>

            <h2 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.065em] text-[#2E393F]">
              Chega de atendimento espalhado em mensagens, prints e arquivos
              soltos.
            </h2>

            <p className="mt-7 max-w-2xl text-lg leading-9 text-[#2E393F]/68">
              O MediNexus transforma a jornada de saúde em um fluxo acompanhável,
              com contexto para o paciente, controle para o médico e visão para a
              clínica.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/profissionais"
                className="rounded-full bg-[#164957] px-8 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#123B46]"
              >
                Buscar profissionais
              </Link>

              <Link
                href="/pacotes"
                className="rounded-full border border-[#D8CCC5] bg-white/70 px-8 py-4 text-sm font-semibold text-[#2E393F] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Ver pacotes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#164957] via-[#2E393F] to-[#5A4C86] p-10 text-white shadow-[0_45px_130px_-75px_rgba(46,57,63,0.9)] sm:p-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                MediNexus
              </p>

              <h2 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.065em]">
                Uma plataforma feita para a saúde parecer mais simples, sem
                perder profundidade.
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
                href="/clinicas"
                className="rounded-full border border-white/20 px-8 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Explorar clínicas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}