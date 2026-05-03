import Link from "next/link";

const whatIs = [
  {
    title: "Marketplace de acesso",
    description:
      "Ajuda pacientes a encontrarem mÃ©dicos e clÃ­nicas compatÃ­veis com localizaÃ§Ã£o, especialidade, plano ou particular.",
  },
  {
    title: "Sistema operacional clÃ­nico",
    description:
      "Ajuda mÃ©dicos e clÃ­nicas a organizarem solicitaÃ§Ãµes, disponibilidade, confirmaÃ§Ã£o e prontuÃ¡rio.",
  },
  {
    title: "Base de continuidade",
    description:
      "Transforma cada consulta em histÃ³rico, documentos e informaÃ§Ãµes Ãºteis para prÃ³ximos atendimentos.",
  },
];

const audiences = [
  {
    title: "Paciente",
    description:
      "Quer encontrar atendimento com menos incerteza, saber se pode usar plano ou particular e manter documentos organizados.",
    items: [
      "Busca por especialidade",
      "Busca por distÃ¢ncia",
      "Plano ou particular",
      "SolicitaÃ§Ãµes acompanhÃ¡veis",
      "HistÃ³rico clÃ­nico",
    ],
  },
  {
    title: "MÃ©dico",
    description:
      "Precisa receber solicitaÃ§Ãµes estruturadas, confirmar horÃ¡rios rapidamente e atender com mais contexto.",
    items: [
      "SolicitaÃ§Ãµes qualificadas",
      "HorÃ¡rio sugerido",
      "ProntuÃ¡rio integrado",
      "Anamnese base",
      "Documentos mÃ©dicos",
    ],
  },
  {
    title: "ClÃ­nica",
    description:
      "Precisa organizar presenÃ§a digital, mÃ©dicos, planos aceitos, agenda e relacionamento com pacientes.",
    items: [
      "PÃ¡gina pÃºblica",
      "GestÃ£o de mÃ©dicos",
      "Planos aceitos",
      "ConfiguraÃ§Ã£o institucional",
      "Fluxo de solicitaÃ§Ãµes",
    ],
  },
];

const principles = [
  "Acesso deve ser claro.",
  "Atendimento precisa gerar continuidade.",
  "Paciente, mÃ©dico e clÃ­nica nÃ£o podem operar em silos.",
  "Plano de saÃºde e particular devem conviver no mesmo fluxo.",
  "Dados precisam virar contexto, nÃ£o burocracia.",
  "Tecnologia deve reduzir atrito, nÃ£o criar mais uma barreira.",
];

const roadmap = [
  {
    phase: "Fase atual",
    title: "Fluxo essencial",
    description:
      "Base funcional para busca, cadastro, raio, plano/particular e confirmaÃ§Ã£o mÃ©dica.",
    items: [
      "Cadastro premium",
      "Busca por raio",
      "HorÃ¡rio sugerido",
      "ConfirmaÃ§Ã£o mÃ©dica",
      "ProntuÃ¡rio base",
    ],
  },
  {
    phase: "PrÃ³ximo round",
    title: "Documentos mÃ©dicos",
    description:
      "Transformar atendimento em documentos clÃ­nicos bonitos, imprimÃ­veis e Ãºteis.",
    items: [
      "Receita premium",
      "SolicitaÃ§Ã£o de exame",
      "Atestado mÃ©dico",
      "DeclaraÃ§Ã£o",
      "PDF profissional",
    ],
  },
  {
    phase: "OperaÃ§Ã£o avanÃ§ada",
    title: "Agenda e relacionamento",
    description:
      "Criar uma rotina de confirmaÃ§Ã£o, lembretes, encaixe e comunicaÃ§Ã£o com paciente.",
    items: [
      "ConfirmaÃ§Ã£o 24h",
      "Cancelamento automÃ¡tico",
      "Consulta de encaixe",
      "E-mail/WhatsApp/SMS",
      "Tokens seguros",
    ],
  },
  {
    phase: "MonetizaÃ§Ã£o",
    title: "Pagamentos e reputaÃ§Ã£o",
    description:
      "Validar pacotes, assinatura da plataforma, pagamento de consulta e avaliaÃ§Ãµes.",
    items: [
      "Assinaturas",
      "Checkout",
      "Pagamento de consulta",
      "Split/taxa MediNexus",
      "AvaliaÃ§Ãµes",
    ],
  },
];

const comparison = [
  {
    before: "Paciente liga ou manda mensagem sem saber se tem horÃ¡rio.",
    after: "Paciente busca por especialidade, distÃ¢ncia e janela desejada.",
  },
  {
    before: "ClÃ­nica responde manualmente e perde contexto.",
    after: "ClÃ­nica recebe solicitaÃ§Ãµes estruturadas e rastreÃ¡veis.",
  },
  {
    before: "MÃ©dico precisa decidir horÃ¡rio caso a caso.",
    after: "MÃ©dico recebe horÃ¡rio sugerido e confirma com um clique.",
  },
  {
    before: "Documentos ficam espalhados em papel, foto ou conversa.",
    after: "Documentos e histÃ³rico ficam conectados Ã  consulta.",
  },
];

export default function SobrePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-[#164957]/15 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#164957] shadow-sm">
                Sobre a MediNexus
              </p>

              <h1 className="mt-7 text-5xl font-black leading-[0.92] tracking-[-0.075em] text-slate-950 sm:text-6xl lg:text-7xl">
                Uma plataforma para reorganizar a jornada da consulta.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
                A MediNexus nasceu para resolver um problema simples de falar e
                difÃ­cil de operar: conectar pacientes, mÃ©dicos e clÃ­nicas em um
                fluxo Ãºnico, seguro e inteligente.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex justify-center rounded-2xl bg-[#164957] px-7 py-4 text-sm font-black text-white shadow-[0_22px_60px_-30px_rgba(40,60,122,0.9)] transition hover:-translate-y-0.5 hover:bg-[#123B46]"
                >
                  Entrar na plataforma
                </Link>

                <Link
                  href="/clinica/cadastro"
                  className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-7 py-4 text-sm font-black text-[#5A4C86] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6F3FF]"
                >
                  Cadastrar clÃ­nica
                </Link>
              </div>
            </div>

            <div className="rounded-[46px] border border-white/80 bg-white/80 p-5 shadow-[0_35px_120px_-65px_rgba(40,60,122,0.6)] backdrop-blur">
              <div className="rounded-[38px] bg-gradient-to-br from-[#164957] via-[#5A4C86] to-[#5A4C86] p-8 text-white">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/55">
                  Nossa visÃ£o
                </p>
                <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.06em]">
                  SaÃºde digital nÃ£o deve ser sÃ³ uma agenda online.
                </h2>
                <p className="mt-5 leading-8 text-white/75">
                  A consulta comeÃ§a na busca, passa pela confirmaÃ§Ã£o, ganha
                  valor no atendimento e continua no histÃ³rico do paciente.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-2xl font-black">01</p>
                    <p className="mt-1 text-xs text-white/60">Encontrar</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-2xl font-black">02</p>
                    <p className="mt-1 text-xs text-white/60">Atender</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-2xl font-black">03</p>
                    <p className="mt-1 text-xs text-white/60">Acompanhar</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[34px] border border-[#D9D6F4] bg-[#F6F3FF] p-6">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#5A4C86]">
                  Tese do produto
                </p>
                <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  Quando a jornada fica conectada, a experiÃªncia melhora para
                  todos os lados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#5A4C86]">
              O que Ã© a MediNexus
            </p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.06em] text-slate-950 sm:text-5xl">
              NÃ£o Ã© sÃ³ busca. NÃ£o Ã© sÃ³ agenda. NÃ£o Ã© sÃ³ prontuÃ¡rio.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              A MediNexus funciona como uma camada de conexÃ£o entre demanda do
              paciente, capacidade de atendimento da clÃ­nica e atuaÃ§Ã£o do
              mÃ©dico.
            </p>
          </div>

          <div className="grid gap-4">
            {whatIs.map((item) => (
              <article
                key={item.title}
                className="rounded-[34px] border border-[#E0E7FF] bg-white p-7 shadow-[0_24px_80px_-66px_rgba(40,60,122,0.45)]"
              >
                <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[46px] bg-slate-950 shadow-[0_35px_120px_-70px_rgba(15,23,42,0.95)]">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-gradient-to-br from-[#164957] to-[#5A4C86] p-8 text-white lg:p-12">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/60">
                Antes e depois
              </p>
              <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.06em]">
                O objetivo Ã© reduzir atrito em cada etapa.
              </h2>
              <p className="mt-5 leading-8 text-white/75">
                A plataforma nÃ£o substitui o cuidado. Ela organiza o caminho
                atÃ© ele e a continuidade depois dele.
              </p>
            </div>

            <div className="p-6 lg:p-8">
              <div className="grid gap-3">
                {comparison.map((item, index) => (
                  <div
                    key={item.before}
                    className="grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 text-white lg:grid-cols-2"
                  >
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-red-200">
                        Antes
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {item.before}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-200">
                        Com MediNexus
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-white">
                        {item.after}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#164957]">
            Para quem foi criada
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl">
            TrÃªs pÃºblicos. Uma jornada conectada.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {audiences.map((item) => (
            <article
              key={item.title}
              className="rounded-[38px] border border-[#D9D6F4] bg-white p-8 shadow-[0_24px_80px_-66px_rgba(94,75,154,0.4)]"
            >
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#5A4C86]">
                {item.title}
              </p>

              <p className="mt-4 min-h-[112px] leading-7 text-slate-600">
                {item.description}
              </p>

              <div className="mt-6 grid gap-2">
                {item.items.map((benefit) => (
                  <div
                    key={benefit}
                    className="rounded-2xl bg-[#F6F3FF] px-4 py-3 text-sm font-bold text-[#5A4C86]"
                  >
                    {benefit}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[46px] border border-[#D9D6F4] bg-gradient-to-br from-[#F6F3FF] to-[#F1F5FF] p-8 shadow-[0_30px_100px_-70px_rgba(94,75,154,0.45)] lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#5A4C86]">
                PrincÃ­pios
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950">
                O produto cresce, mas a lÃ³gica precisa continuar simples.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                A MediNexus estÃ¡ sendo construÃ­da em camadas para evitar
                improvisos: primeiro o fluxo, depois documentos, agenda
                avanÃ§ada, pagamentos, avaliaÃ§Ãµes e IA.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {principles.map((item) => (
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

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#164957]">
            Roadmap
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Uma construÃ§Ã£o em fases claras.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Cada fase adiciona valor sem perder a base principal: conectar
            paciente, mÃ©dico e clÃ­nica.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {roadmap.map((phase) => (
            <article
              key={phase.title}
              className="rounded-[36px] border border-[#E0E7FF] bg-white p-6 shadow-[0_24px_80px_-68px_rgba(40,60,122,0.45)]"
            >
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5A4C86]">
                {phase.phase}
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">
                {phase.title}
              </h3>
              <p className="mt-3 min-h-[96px] text-sm leading-6 text-slate-600">
                {phase.description}
              </p>

              <div className="mt-5 grid gap-2">
                {phase.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-[#F1F5FF] px-4 py-3 text-sm font-semibold text-[#164957]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[46px] bg-gradient-to-br from-[#164957] via-[#5A4C86] to-[#5A4C86] p-8 text-white shadow-[0_35px_120px_-70px_rgba(40,60,122,0.95)] lg:p-12">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-20 h-80 w-80 rounded-full bg-[#B7A7FF]/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/60">
                PrÃ³ximo passo
              </p>
              <h2 className="mt-4 max-w-4xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                FaÃ§a parte de uma plataforma desenhada para conectar a saÃºde.
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-white/75">
                Entre como paciente, conheÃ§a os pacotes para mÃ©dicos ou cadastre
                sua clÃ­nica na MediNexus.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Link
                href="/login"
                className="inline-flex justify-center rounded-2xl bg-white px-7 py-4 text-sm font-black text-[#164957] transition hover:bg-slate-100"
              >
                Sou paciente
              </Link>

              <Link
                href="/pacotes"
                className="inline-flex justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                Sou mÃ©dico
              </Link>

              <Link
                href="/clinica/cadastro"
                className="inline-flex justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                Sou clÃ­nica
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


