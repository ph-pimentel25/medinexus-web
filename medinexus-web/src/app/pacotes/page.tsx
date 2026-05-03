import Link from "next/link";

const packages = [
  {
    name: "Paciente",
    eyebrow: "Uso pessoal",
    price: "Gratuito",
    description:
      "Para quem quer buscar atendimento, acompanhar solicitações e acessar documentos médicos.",
    features: [
      "Busca de clínicas e profissionais",
      "Solicitações de consulta",
      "Confirmação de presença",
      "Documentos médicos liberados",
      "Notificações centralizadas",
    ],
    href: "/cadastro",
    cta: "Criar conta",
    featured: false,
  },
  {
    name: "Profissional",
    eyebrow: "Para médicos",
    price: "Sob consulta",
    description:
      "Para profissionais que querem organizar agenda, prontuários e documentos em uma rotina mais fluida.",
    features: [
      "Gestão de solicitações",
      "Disponibilidade médica",
      "Prontuário de consulta",
      "Emissão de receitas e atestados",
      "Histórico do paciente",
    ],
    href: "/cadastro",
    cta: "Começar como médico",
    featured: true,
  },
  {
    name: "Clínica",
    eyebrow: "Operação completa",
    price: "Sob consulta",
    description:
      "Para clínicas que desejam coordenar equipe, solicitações e dados institucionais em uma plataforma única.",
    features: [
      "Gestão de médicos",
      "Solicitações da clínica",
      "Configurações institucionais",
      "Visão operacional",
      "Notificações e acompanhamento",
    ],
    href: "/cadastro",
    cta: "Cadastrar clínica",
    featured: false,
  },
];

export default function PacotesPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F]">
      <section className="relative overflow-hidden border-b border-[#E7DDD7]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(122,157,140,0.24),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(90,76,134,0.20),transparent_32%)]" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
          <div className="max-w-5xl">
            <div className="mb-7 inline-flex rounded-full border border-[#D8CCC5] bg-white/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#164957] shadow-sm backdrop-blur-xl">
              Pacotes MediNexus
            </div>

            <h1 className="max-w-6xl text-[4rem] font-semibold leading-[0.92] tracking-[-0.075em] text-[#2E393F] sm:text-[5.6rem] lg:text-[7rem]">
              Planos para cada ponto da jornada de saúde.
            </h1>

            <p className="mt-8 max-w-3xl text-xl leading-9 text-[#2E393F]/70">
              Do paciente que busca atendimento à clínica que coordena uma
              operação completa, a MediNexus foi pensada para escalar com
              diferentes necessidades.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-20 sm:px-10 lg:px-14">
        <div className="grid gap-6 lg:grid-cols-3">
          {packages.map((item) => (
            <article
              key={item.name}
              className={`relative overflow-hidden rounded-[2.6rem] border p-8 shadow-[0_35px_100px_-80px_rgba(46,57,63,0.75)] transition hover:-translate-y-1 ${
                item.featured
                  ? "border-[#164957] bg-gradient-to-br from-[#164957] via-[#2E393F] to-[#5A4C86] text-white"
                  : "border-[#E7DDD7] bg-white/70 text-[#2E393F] backdrop-blur"
              }`}
            >
              {item.featured && (
                <div className="absolute right-6 top-6 rounded-full bg-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur">
                  Destaque
                </div>
              )}

              <p
                className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                  item.featured ? "text-white/50" : "text-[#7A9D8C]"
                }`}
              >
                {item.eyebrow}
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em]">
                {item.name}
              </h2>

              <p
                className={`mt-3 text-2xl font-semibold tracking-[-0.04em] ${
                  item.featured ? "text-white" : "text-[#164957]"
                }`}
              >
                {item.price}
              </p>

              <p
                className={`mt-5 min-h-[96px] text-sm leading-7 ${
                  item.featured ? "text-white/68" : "text-[#2E393F]/66"
                }`}
              >
                {item.description}
              </p>

              <div
                className={`my-7 h-px ${
                  item.featured ? "bg-white/12" : "bg-[#E7DDD7]"
                }`}
              />

              <div className="space-y-4">
                {item.features.map((feature) => (
                  <div key={feature} className="flex gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.featured ? "bg-[#7A9D8C]" : "bg-[#164957]"
                      }`}
                    />

                    <p
                      className={`text-sm leading-6 ${
                        item.featured ? "text-white/78" : "text-[#2E393F]/70"
                      }`}
                    >
                      {feature}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href={item.href}
                className={`mt-8 inline-flex h-13 items-center justify-center rounded-full px-7 py-4 text-sm font-semibold transition hover:-translate-y-0.5 ${
                  item.featured
                    ? "bg-white text-[#164957] hover:bg-[#FAF6F3]"
                    : "bg-[#164957] text-white hover:bg-[#123B46]"
                }`}
              >
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#E7DDD7] bg-white/50">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5A4C86]">
              Por que escolher
            </p>

            <h2 className="mt-5 max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.065em] text-[#2E393F]">
              Uma estrutura para a saúde funcionar melhor.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Fluxo único",
                text: "Consulta, confirmação, atendimento e documento dentro da mesma jornada.",
              },
              {
                title: "Experiência clara",
                text: "Cada usuário entende o que precisa fazer e o que já aconteceu.",
              },
              {
                title: "Operação escalável",
                text: "A plataforma cresce junto com médicos, clínicas e pacientes.",
              },
            ].map((item) => (
              <article key={item.title} className="border-t border-[#D8CCC5] pt-7">
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

      <section className="px-6 py-20 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#164957] via-[#2E393F] to-[#5A4C86] p-10 text-white shadow-[0_45px_130px_-75px_rgba(46,57,63,0.9)] sm:p-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                Comece agora
              </p>

              <h2 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.065em]">
                Escolha seu ponto de entrada na plataforma MediNexus.
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
                href="/sobre"
                className="rounded-full border border-white/20 px-8 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Conhecer a MediNexus
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}