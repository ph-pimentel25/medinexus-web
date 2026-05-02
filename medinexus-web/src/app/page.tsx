import Link from "next/link";

const conversionCards = [
  {
    title: "Sou paciente",
    subtitle: "Quero encontrar atendimento",
    description:
      "Busque médicos e clínicas por especialidade, localização, plano de saúde ou consulta particular.",
    href: "/login",
    cta: "Entrar como paciente",
    gradient: "from-[#EAF1FF] to-[#F4F1FB]",
    badge: "Paciente",
  },
  {
    title: "Sou médico",
    subtitle: "Quero organizar meus atendimentos",
    description:
      "Receba solicitações com horário sugerido, confirme com um clique e atenda com prontuário integrado.",
    href: "/profissionais",
    cta: "Ver solução médica",
    gradient: "from-[#EEF2FF] to-[#F6F3FF]",
    badge: "Médico",
  },
  {
    title: "Sou clínica",
    subtitle: "Quero cadastrar minha operação",
    description:
      "Cadastre médicos, planos aceitos, página pública, disponibilidade e receba solicitações qualificadas.",
    href: "/clinica/cadastro",
    cta: "Cadastrar clínica",
    gradient: "from-[#F4F1FB] to-[#EAF1FF]",
    badge: "Clínica",
  },
];

const patientPainPoints = [
  "Não sabe qual clínica aceita seu plano.",
  "Perde tempo ligando ou mandando mensagem.",
  "Não consegue saber o melhor horário disponível.",
  "Fica sem histórico organizado depois da consulta.",
];

const productBenefits = [
  {
    title: "Busca por raio real",
    description:
      "O paciente usa localização precisa para encontrar clínicas próximas de verdade.",
  },
  {
    title: "Plano ou particular",
    description:
      "A busca considera convênio, modelo do plano ou atendimento particular.",
  },
  {
    title: "Horário sugerido",
    description:
      "O sistema sugere o melhor encaixe com base na agenda e duração média da consulta.",
  },
  {
    title: "Confirmação simples",
    description:
      "O médico não precisa escolher horário manualmente. Ele só confirma ou recusa.",
  },
  {
    title: "Prontuário conectado",
    description:
      "A consulta vira histórico clínico, anamnese, notas e documentos médicos.",
  },
  {
    title: "Base para crescimento",
    description:
      "A plataforma já nasce preparada para pacotes, pagamentos, avaliações e notificações.",
  },
];

const flow = [
  "Paciente completa perfil, plano ou particular e localização.",
  "Paciente busca especialidade e define raio e faixa de horário.",
  "MediNexus encontra médicos e clínicas compatíveis.",
  "O sistema sugere o melhor horário disponível.",
  "Médico confirma com um clique.",
  "Consulta gera histórico, prontuário e documentos.",
];

const trustItems = [
  "Rotas protegidas por perfil",
  "Dados cadastrais completos",
  "Clínicas com página pública",
  "Médicos vinculados à clínica",
  "Solicitações rastreáveis",
  "Histórico clínico centralizado",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />
        <div className="absolute left-1/2 top-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#5E4B9A]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#283C7A]/15 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#283C7A] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#6E56CF]" />
              MediNexus Health Platform
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.92] tracking-[-0.075em] text-slate-950 sm:text-6xl lg:text-7xl">
              Agendar, atender e acompanhar consultas em uma única plataforma.
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-600">
              A MediNexus conecta pacientes, médicos e clínicas em uma jornada
              mais inteligente: busca por localização, plano ou particular,
              horário sugerido, confirmação médica, prontuário e documentos.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-[#283C7A] px-8 py-4 text-sm font-black text-white shadow-[0_22px_60px_-30px_rgba(40,60,122,0.9)] transition hover:-translate-y-0.5 hover:bg-[#213366]"
              >
                Começar agora
              </Link>

              <Link
                href="/sobre"
                className="inline-flex items-center justify-center rounded-2xl border border-[#D9D6F4] bg-white/90 px-8 py-4 text-sm font-black text-[#5E4B9A] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6F3FF]"
              >
                Entender a MediNexus
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {conversionCards.map((card) => (
              <article
                key={card.title}
                className={`group rounded-[38px] border border-white/80 bg-gradient-to-br ${card.gradient} p-7 shadow-[0_26px_90px_-64px_rgba(40,60,122,0.65)] transition hover:-translate-y-1`}
              >
                <div className="mb-6 inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#5E4B9A] ring-1 ring-white/90">
                  {card.badge}
                </div>

                <h2 className="text-3xl font-black tracking-[-0.05em] text-slate-950">
                  {card.title}
                </h2>

                <p className="mt-2 text-lg font-bold text-[#283C7A]">
                  {card.subtitle}
                </p>

                <p className="mt-4 min-h-[96px] leading-7 text-slate-600">
                  {card.description}
                </p>

                <Link
                  href={card.href}
                  className="mt-7 inline-flex w-full justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#283C7A] shadow-sm transition group-hover:bg-[#283C7A] group-hover:text-white"
                >
                  {card.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="rounded-[42px] bg-[#283C7A] p-8 text-white shadow-[0_35px_120px_-70px_rgba(40,60,122,0.95)] lg:p-10">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white/55">
              O problema
            </p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.06em]">
              Marcar consulta ainda é mais difícil do que deveria.
            </h2>

            <div className="mt-7 grid gap-3">
              {patientPainPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-white/15 bg-white/10 p-4 text-sm font-semibold leading-6 text-white/80"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[42px] border border-[#D9D6F4] bg-white p-8 shadow-[0_30px_100px_-70px_rgba(40,60,122,0.45)] lg:p-10">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6E56CF]">
              A solução
            </p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.06em] text-slate-950">
              Uma plataforma que entende a busca, sugere o horário e conecta o atendimento.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              A MediNexus cruza especialidade, localização, plano ou particular,
              janelas de horário, duração média da consulta e disponibilidade
              médica para reduzir atrito na jornada.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-[#F1F5FF] p-5">
                <p className="text-3xl font-black text-[#283C7A]">1 clique</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Médico confirma consulta sem escolher horário manualmente.
                </p>
              </div>

              <div className="rounded-3xl bg-[#F6F3FF] p-5">
                <p className="text-3xl font-black text-[#6E56CF]">Raio real</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Distância calculada a partir da localização precisa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6E56CF]">
            Por que usar
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl">
            A MediNexus organiza o que normalmente fica espalhado.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {productBenefits.map((benefit) => (
            <article
              key={benefit.title}
              className="rounded-[34px] border border-[#E0E7FF] bg-white p-7 shadow-[0_24px_80px_-66px_rgba(40,60,122,0.5)]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F5FF] text-[#283C7A]">
                ✓
              </div>
              <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                {benefit.title}
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[46px] bg-slate-950 shadow-[0_35px_120px_-70px_rgba(15,23,42,0.95)]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-gradient-to-br from-[#283C7A] to-[#6E56CF] p-8 text-white lg:p-12">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/60">
                Como funciona
              </p>
              <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.06em]">
                Um fluxo simples para uma operação complexa.
              </h2>
              <p className="mt-5 leading-8 text-white/75">
                A plataforma transforma busca, disponibilidade e atendimento em
                etapas conectadas.
              </p>
            </div>

            <div className="p-6 lg:p-8">
              <div className="grid gap-3">
                {flow.map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-4 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 text-white"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-[#283C7A]">
                      {index + 1}
                    </div>
                    <p className="pt-2 text-sm font-semibold leading-6 text-white/80">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[46px] border border-[#D9D6F4] bg-gradient-to-br from-[#F6F3FF] to-[#F1F5FF] p-8 shadow-[0_30px_100px_-70px_rgba(94,75,154,0.45)] lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6E56CF]">
                Confiança operacional
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950">
                Cada perfil vê o que precisa. Cada ação fica no lugar certo.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                Paciente, médico e clínica têm áreas separadas, com dados e
                permissões próprias. Isso dá base para escalar o produto com
                segurança.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="rounded-[26px] border border-white/80 bg-white/80 p-5 font-bold leading-6 text-slate-700 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[46px] bg-gradient-to-br from-[#283C7A] via-[#4B4EA3] to-[#6E56CF] p-8 text-white shadow-[0_35px_120px_-70px_rgba(40,60,122,0.95)] lg:p-12">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-20 h-80 w-80 rounded-full bg-[#B7A7FF]/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/60">
                Comece agora
              </p>
              <h2 className="mt-4 max-w-4xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                Entre na MediNexus pelo caminho certo para você.
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-white/75">
                Paciente encontra atendimento. Médico organiza consultas.
                Clínica estrutura sua operação digital.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Link
                href="/login"
                className="inline-flex justify-center rounded-2xl bg-white px-7 py-4 text-sm font-black text-[#283C7A] transition hover:bg-slate-100"
              >
                Sou paciente
              </Link>

              <Link
                href="/pacotes"
                className="inline-flex justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                Sou médico
              </Link>

              <Link
                href="/clinica/cadastro"
                className="inline-flex justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                Sou clínica
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}