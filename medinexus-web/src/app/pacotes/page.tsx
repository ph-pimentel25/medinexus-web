import Link from "next/link";

const packages = [
  { name: "Gratuito", eyebrow: "Médicos e clínicas", price: "Sem comissão", description: "Nesta fase, a MediNexus não cobra comissão sobre consultas particulares intermediadas pela plataforma.", features: ["Agenda e solicitações", "Atendimento e documentos", "Perfil na rede MediNexus"], href: "/cadastro", cta: "Cadastrar profissional", featured: false },
  { name: "Profissional", eyebrow: "Para médicos", price: "Sem comissão", description: "Organize agenda, atendimentos e documentos. As condições dos futuros planos profissionais ainda estão em definição.", features: ["Organização da rotina médica", "Gestão de consultas e documentos", "Sem cobrança automática na adesão"], href: "/cadastro", cta: "Conhecer como médico", featured: true },
  { name: "Clínica / Premium", eyebrow: "Para a equipe", price: "Sem comissão", description: "Centralize a rotina da equipe e da clínica. As condições dos futuros pacotes ainda estão em definição.", features: ["Gestão de médicos e clínica", "Agenda e solicitações da equipe", "Sem cobrança automática na adesão"], href: "/cadastro", cta: "Cadastrar clínica", featured: false },
];

export default function PacotesPage() {
  return (
    <main className="min-h-screen bg-mn-sand text-mn-graphite">
      <section className="relative overflow-hidden border-b border-mn-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(122,157,140,0.24),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(90,76,134,0.20),transparent_32%)]" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
          <div className="max-w-5xl">
            <div className="mb-7 inline-flex rounded-full border border-mn-border bg-white/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-mn-teal shadow-sm backdrop-blur-xl">
              Pacotes MediNexus
            </div>

            <h1 className="max-w-6xl text-[4rem] font-semibold leading-[0.92] tracking-[-0.075em] text-mn-graphite sm:text-[5.6rem] lg:text-[7rem]">
              Planos para profissionais. Acesso gratuito para pacientes.
            </h1>

            <p className="mt-8 max-w-3xl text-xl leading-9 text-mn-graphite/70">
              Pacientes têm acesso integral e gratuito à MediNexus, sem assinatura ou plano premium.
              O valor de uma consulta particular é informado antes do pagamento.
              Os planos abaixo são destinados exclusivamente a médicos e clínicas.
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
                  ? "border-mn-teal bg-gradient-to-br from-mn-teal via-mn-graphite to-mn-purple text-white"
                  : "border-mn-border bg-white/70 text-mn-graphite backdrop-blur"
              }`}
            >
              {item.featured && (
                <div className="absolute right-6 top-6 rounded-full bg-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur">
                  Destaque
                </div>
              )}

              <p
                className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                  item.featured ? "text-white/50" : "text-mn-sage"
                }`}
              >
                {item.eyebrow}
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em]">
                {item.name}
              </h2>

              <p
                className={`mt-3 text-2xl font-semibold tracking-[-0.04em] ${
                  item.featured ? "text-white" : "text-mn-teal"
                }`}
              >
                {item.price}
              </p>

              <p
                className={`mt-5 min-h-[96px] text-sm leading-7 ${
                  item.featured ? "text-white/68" : "text-mn-graphite/66"
                }`}
              >
                {item.description}
              </p>

              <div
                className={`my-7 h-px ${
                  item.featured ? "bg-white/12" : "bg-mn-border"
                }`}
              />

              <div className="space-y-4">
                {item.features.map((feature) => (
                  <div key={feature} className="flex gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.featured ? "bg-mn-sage" : "bg-mn-teal"
                      }`}
                    />

                    <p
                      className={`text-sm leading-6 ${
                        item.featured ? "text-white/78" : "text-mn-graphite/70"
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
                    ? "bg-white text-mn-teal hover:bg-mn-sand"
                    : "bg-mn-teal text-white hover:bg-[#123B46]"
                }`}
              >
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <p className="app-shell pb-10 text-sm leading-6 text-mn-graphite/70">A MediNexus não cobra comissão nesta fase. Consultas particulares continuam com o valor informado pelo profissional ou pela clínica. Eventuais tarifas do provedor de pagamento são separadas e serão informadas antes da ativação. O cadastro não inicia uma cobrança.</p>
      <section className="border-y border-mn-border bg-white/50">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mn-purple">
              Por que escolher
            </p>

            <h2 className="mt-5 max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.065em] text-mn-graphite">
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
              <article key={item.title} className="border-t border-mn-border pt-7">
                <h3 className="text-2xl font-semibold tracking-[-0.045em] text-mn-teal">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-mn-graphite/66">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[3rem] bg-gradient-to-br from-mn-teal via-mn-graphite to-mn-purple p-10 text-white shadow-[0_45px_130px_-75px_rgba(46,57,63,0.9)] sm:p-14">
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
                className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-mn-teal transition hover:-translate-y-0.5 hover:bg-mn-sand"
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