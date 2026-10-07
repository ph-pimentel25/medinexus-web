import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck,
  FlaskConical,
  Heart,
  HeartHandshake,
  Lock,
  MapPin,
  Pill,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  UserRound,
  Users,
  Zap,
} from "lucide-react";

const principles = [
  {
    icon: UserRound,
    title: "1. O Paciente no Centro de Tudo",
    desc: "Acesso integralmente gratuito, transparência sobre preços e posse definitiva dos seus registros e exames.",
  },
  {
    icon: Stethoscope,
    title: "2. Respeito à Autonomia Médica",
    desc: "Zero comissão sobre consultas particulares. A remuneração do profissional pertence integralmente a ele.",
  },
  {
    icon: FlaskConical,
    title: "3. Continuidade Real do Cuidado",
    desc: "A consulta conecta-se aos exames laboratoriais e aos remédios, sem pontas soltas na jornada de cura.",
  },
  {
    icon: ShieldCheck,
    title: "4. Ética, LGPD e Padrão CFM",
    desc: "Segurança de dados clínicos rigorosa, criptografia de ponta a ponta e total conformidade regulatória.",
  },
];

const nodes = [
  {
    title: "O Paciente",
    badge: "100% Gratuito",
    icon: UserRound,
    desc: "Encontra médicos por dias e horários livres reais, confirma presença no WhatsApp, recebe receitas digitais no app e agenda exames com desconto em laboratórios credenciados.",
  },
  {
    title: "O Médico",
    badge: "0% de Comissão",
    icon: Stethoscope,
    desc: "Dispõe de prontuário eletrônico unificado, emissão de receitas com QR Code e assinatura digital, agenda anti-no-show e recebimento direto dos seus honorários.",
  },
  {
    title: "A Clínica",
    badge: "Gestão Integrada",
    icon: Building2,
    desc: "Orquestra equipe multidisciplinar, controle de salas, múltiplos convênios aceitos, confirmação de pacientes em tempo real e relatórios operacionais completos.",
  },
  {
    title: "Rede de Exames & Farmácia",
    badge: "Cuidado 360°",
    icon: FlaskConical,
    desc: "Conecta solicitações de exames diretamente a laboratórios parceiros com laudo digital e integra prescrições com farmácias para continuidade do tratamento.",
  },
];

const compliance = [
  {
    title: "LGPD (Lei 13.709/2018)",
    desc: "Tratamento de dados sensíveis de saúde baseado em consentimento expresso, anonimização e direito à exclusão integral da conta.",
  },
  {
    title: "Conselho Federal de Medicina (CFM)",
    desc: "Aderência estrita às resoluções CFM 1.821/2007 (prontuário digital) e 2.299/2021 (emissão segura de receitas e atestados eletrônicos).",
  },
  {
    title: "Padrão ICP-Brasil",
    desc: "Infraestrutura compatível com certificados digitais padrão ICP-Brasil (A1/A3 e nuvem) com carimbo de tempo para validade jurídica nacional.",
  },
  {
    title: "Criptografia & Auditoria",
    desc: "Banco de dados em nuvem isolada com criptografia AES-256 em repouso e TLS 1.3 em trânsito, com trilha de auditoria para cada acesso clínico.",
  },
];

const questions = [
  {
    question: "O que é a MediNexus?",
    answer:
      "A MediNexus é uma healthtech brasileira criada para conectar todos os elos do cuidado de saúde: pacientes, médicos autônomos, clínicas médicas e centros diagnósticos laboratoriais. Somos um sistema operacional de saúde que une busca inteligente, agendamento sem no-show, prontuário digital unificado e gestão de medicamentos.",
  },
  {
    question: "Por que a plataforma é 100% gratuita para pacientes?",
    answer:
      "Acreditamos que cobrar taxas de conveniência ou comissões dos pacientes cria barreiras desnecessárias ao cuidado preventivo. Toda a experiência para o paciente (agendamento, prontuário, lembretes de remédios, cotação de farmácia e descontos em exames) é e sempre será 100% gratuita.",
  },
  {
    question: "Como a MediNexus se sustenta sem cobrar comissões dos médicos?",
    answer:
      "Enquanto outras plataformas cobram até 30% de comissão sobre cada consulta, a MediNexus adota o modelo de Software como Serviço (SaaS). Oferecemos planos de ferramentas de alta produtividade (como assinatura ICP-Brasil, automações de recepção e relatórios corporativos) para consultórios e clínicas que desejam profissionalizar sua gestão.",
  },
  {
    question: "Como funciona a rede de laboratórios e exames parceiros?",
    answer:
      "A MediNexus possui convênio com redes diagnósticas reconhecidas (como Dasa, Fleury e centros parceiros). Quando um médico solicita exames de sangue ou imagem na plataforma, o paciente pode agendar na unidade credenciada com condições especiais e receber o laudo digital integrado ao seu prontuário.",
  },
  {
    question: "Como funciona a confirmação de presença e redução de faltas?",
    answer:
      "Quando uma consulta é solicitada e confirmada pela clínica, o paciente recebe um lembrete com opção de confirmar sua presença com um toque. Isso permite que a clínica reduza o no-show e remaneje horários vagos para outros pacientes que necessitam de atendimento.",
  },
  {
    question: "Existe aplicativo móvel para celular?",
    answer:
      "Sim! O aplicativo móvel MediNexus está desenvolvido com suporte para iOS e Android, permitindo acesso nativo à carteira de remédios, alarmes diários, calendário de consultas e rotas GPS para os consultórios.",
  },
];

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-mn-sand text-mn-graphite overflow-x-hidden">
      {/* Header / Hero Manifesto */}
      <section className="relative overflow-hidden border-b border-mn-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(122,157,140,0.28),transparent_35%),radial-gradient(circle_at_86%_16%,rgba(90,76,134,0.24),transparent_32%)] pointer-events-none" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mn-border bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-mn-teal shadow-sm backdrop-blur-xl">
              <HeartHandshake size={14} className="text-mn-teal" />
              <span>Manifesto MediNexus</span>
            </div>

            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-mn-graphite sm:text-6xl lg:text-[4.75rem]">
              A tecnologia a favor da vida. A saúde conectada sem atrito.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-mn-graphite/75 sm:text-xl">
              No Brasil, informações de saúde frequentemente se perdem entre papéis amassados, conversas de WhatsApp e
              exames esquecidos na gaveta. Nascemos para integrar essa jornada com clareza, ética e tecnologia de
              ponta.
            </p>
          </div>
        </div>
      </section>

      {/* Propósito e Pilares Inegociáveis */}
      <section className="py-20 sm:py-28 border-b border-mn-border bg-white/50">
        <div className="mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-14">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-mn-teal">Nossos Pilares</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-mn-graphite sm:text-5xl">
              Princípios que guiam cada linha de código que escrevemos.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => (
              <div
                key={p.title}
                className="rounded-3xl border border-mn-border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-mn-teal/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mn-sand text-mn-teal mb-6">
                  <p.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-mn-graphite">{p.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-mn-graphite/70">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Os 4 Nós da Arquitetura MediNexus */}
      <section className="py-20 sm:py-28 border-b border-mn-border">
        <div className="mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-14">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-mn-teal">Arquitetura Integrada</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-mn-graphite sm:text-5xl">
              Como os 4 nós do ecossistema se conectam.
            </h2>
            <p className="mt-4 text-base text-mn-graphite/70">
              Não somos um simples diretório de médicos. Somos a infraestrutura que acompanha o paciente desde a dor até a
              cura completa.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {nodes.map((node) => (
              <div
                key={node.title}
                className="flex flex-col rounded-3xl border border-mn-border bg-white p-8 shadow-sm relative overflow-hidden"
              >
                <span className="inline-flex self-start rounded-full bg-mn-sand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-mn-teal border border-mn-border mb-4">
                  {node.badge}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mn-teal text-white mb-4">
                  <node.icon size={22} />
                </div>
                <h3 className="text-xl font-black text-mn-graphite">{node.title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-mn-graphite/75 flex-1">{node.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Segurança, LGPD & CFM */}
      <section className="py-20 sm:py-24 bg-white/70 border-b border-mn-border">
        <div className="mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-14">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-800">
                Segurança Jurídica & Sanitária
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-mn-graphite sm:text-4xl">
                Seus dados clínicos protegidos com rigor inegociável.
              </h2>
              <p className="mt-4 text-base text-mn-graphite/75 leading-relaxed">
                Saúde exige respeito absoluto ao sigilo médico. A MediNexus foi projetada desde o dia zero para atender às
                mais estritas normas regulatórias de proteção de dados e conselhos profissionais do país.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {compliance.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-mn-border bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-mn-teal">{item.title}</h3>
                    <p className="mt-1.5 text-xs text-mn-graphite/70 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quadro Ilustrativo de Compromisso */}
            <div className="rounded-3xl bg-gradient-to-br from-mn-teal via-mn-graphite to-mn-purple p-8 text-white shadow-xl">
              <ShieldCheck size={36} className="text-mn-sage-light mb-4" />
              <h3 className="text-2xl font-bold tracking-tight">O paciente é o único dono do seu histórico.</h3>
              <p className="mt-3 text-sm text-white/80 leading-relaxed">
                Médicos e clínicas apenas registram as evoluções clínicas do atendimento. O paciente tem autonomia total
                para visualizar, compartilhar com outros especialistas ou solicitar a revogação de acessos a qualquer
                momento.
              </p>
              <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/60">
                <span>Certificado SSL/TLS 1.3</span>
                <span>Armazenamento Criptografado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dúvidas Frequentes Institucionais */}
      <section className="py-20 sm:py-24 border-b border-mn-border">
        <div className="mx-auto max-w-4xl px-6 sm:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-mn-teal">Transparência Total</p>
            <h2 className="mt-2 text-3xl font-black text-mn-graphite sm:text-4xl">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-4">
            {questions.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-mn-border bg-white p-5 transition shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-mn-graphite">
                  <span>{faq.question}</span>
                  <ChevronDown size={18} className="text-mn-teal transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-mn-graphite/75 border-t border-mn-border/50 pt-3">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[1500px] rounded-3xl bg-mn-sand border border-mn-border p-10 sm:p-14 text-center">
          <h2 className="text-2xl font-black text-mn-graphite sm:text-4xl">
            Pronto para fazer parte da evolução da saúde?
          </h2>
          <p className="mt-3 text-sm text-mn-graphite/70 max-w-xl mx-auto">
            Crie sua conta gratuita em menos de 2 minutos ou cadastre sua clínica para organizar seus atendimentos.
          </p>
          <div className="mt-8 flex justify-center flex-wrap gap-4">
            <Link
              href="/cadastro"
              className="rounded-full bg-mn-teal px-8 py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#123B46]"
            >
              Criar minha conta
            </Link>
            <Link
              href="/descobrir"
              className="rounded-full border border-mn-border bg-white px-8 py-3.5 text-xs font-bold text-mn-graphite hover:bg-mn-sand"
            >
              Buscar profissionais na rede
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
