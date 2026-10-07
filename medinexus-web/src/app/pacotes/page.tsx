import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Clock,
  FileCheck,
  FlaskConical,
  HelpCircle,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  User,
  Zap,
} from "lucide-react";

const plans = [
  {
    name: "Paciente",
    badge: "100% Gratuito Para Sempre",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    price: "R$ 0",
    priceSub: "sem mensalidades ou taxas de uso",
    description: "Acesso integral e vitalício a todas as ferramentas de saúde para você e sua família.",
    features: [
      "Busca inteligente por disponibilidade e especialidade",
      "Agendamento de consultas sem taxas de intermediação",
      "Controle e lembretes diários de medicamentos no app",
      "Prontuário unificado com receitas e atestados digitais",
      "Descontos exclusivos em exames na rede de laboratórios parceiros",
      "Cotação rápida de medicamentos em farmácias credenciadas",
      "Suporte via WhatsApp e Assistente IA 24/7",
    ],
    cta: "Criar Conta Gratuita",
    href: "/cadastro?tipo=patient",
    featured: false,
  },
  {
    name: "Médico Starter",
    badge: "Piloto Gratuito · 0% Comissão",
    badgeTone: "bg-mn-teal/10 text-mn-teal border-mn-teal/20",
    price: "R$ 0",
    priceSub: "zero comissão sobre suas consultas",
    description: "Ideal para médicos autônomos que desejam organizar agenda e prontuário sem custos predatórios.",
    features: [
      "Algoritmo de encaixe de agenda em blocos de 15 minutos",
      "Prontuário eletrônico ágil e evolução clínica",
      "Emissão de receitas digitais e atestados estruturados",
      "100% dos seus honorários são seus (0% de comissão retida)",
      "Confirmação ativa de presença de pacientes para reduzir faltas",
      "Perfil público na rede de busca geolocalizada",
    ],
    cta: "Cadastrar como Médico",
    href: "/cadastro?tipo=doctor",
    featured: false,
  },
  {
    name: "Médico Pro",
    badge: "Mais Popular · Especialistas",
    badgeTone: "bg-amber-50 text-amber-800 border-amber-200",
    price: "R$ 149",
    priceSub: "/ mês (30 dias grátis para testar)",
    description: "Para médicos com alto volume de atendimentos que buscam máxima produtividade e certificação.",
    features: [
      "Todos os recursos do plano Médico Starter",
      "Assinatura digital ICP-Brasil com carimbo de tempo",
      "Disparo automático de lembretes e confirmações no WhatsApp",
      "Histórico clínico compartilhado entre especialidades (com consentimento)",
      "Relatórios de produtividade, faturamento e retenção de pacientes",
      "Destaque de perfil verificado nas buscas",
      "Suporte prioritário via WhatsApp com gerente de conta",
    ],
    cta: "Experimentar 30 dias grátis",
    href: "/cadastro?tipo=doctor",
    featured: true,
  },
  {
    name: "Clínicas & Laboratórios",
    badge: "Equipes & Centros de Saúde",
    badgeTone: "bg-purple-50 text-purple-700 border-purple-200",
    price: "R$ 349",
    priceSub: "/ mês (para até 5 profissionais)",
    description: "Centralize a operação da clínica, secretárias, múltiplos médicos e parcerias com laboratórios de diagnóstico.",
    features: [
      "Painel de recepção multi-atendente em tempo real",
      "Gestão de múltiplos consultórios, salas e especialidades",
      "Roteamento inteligente de agenda para toda a equipe",
      "Módulo de conexão com laboratórios para exames com laudo digital",
      "Gestão detalhada de convênios aceitos por profissional",
      "Relatórios gerenciais de ocupação e taxa de no-show da clínica",
      "Treinamento e onboarding guiado para a equipe de recepção",
    ],
    cta: "Falar com consultor de clínicas",
    href: "https://wa.me/5521979828341?text=Ol%C3%A1%2C%20gostaria%20de%20conhecer%20o%20plano%20para%20Cl%C3%ADnicas%20do%20MediNexus.",
    featured: false,
  },
];

const faqs = [
  {
    q: "O paciente realmente não paga nada pelo uso da plataforma?",
    a: "Sim, exatamente! A MediNexus é 100% gratuita para pacientes. Não cobramos mensalidade, taxa de conveniência nem percentual sobre consultas ou exames. Nas consultas particulares, o paciente paga apenas o valor do atendimento diretamente ao profissional ou clínica.",
  },
  {
    q: "A MediNexus cobra comissão sobre as consultas dos médicos?",
    a: "Não cobramos comissão! Enquanto outras plataformas retêm entre 15% e 30% de cada consulta médica, na MediNexus o médico fica com 100% dos seus honorários. Nosso modelo de sustentabilidade é baseado em planos mensais de software e infraestrutura para consultórios e clínicas.",
  },
  {
    q: "Existe taxa de adesão ou fidelidade obrigatória nos planos?",
    a: "Não há fidelidade nem taxas de cancelamento. Você pode cancelar sua assinatura médica ou de clínica a qualquer momento com apenas um clique e exportar todos os seus dados e prontuários com total segurança jurídica.",
  },
  {
    q: "Como funciona a parceria com laboratórios de exames?",
    a: "A MediNexus credencia centros diagnósticos e laboratórios de análises clínicas. Quando o médico prescreve um exame, o paciente pode agendá-lo diretamente na rede credenciada com condições especiais e descontos de até 30%, recebendo o laudo digital integrado ao seu prontuário.",
  },
];

export default function PacotesPage() {
  return (
    <main className="min-h-screen bg-mn-sand text-mn-graphite">
      {/* Header / Hero de Planos */}
      <section className="relative overflow-hidden border-b border-mn-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(122,157,140,0.25),transparent_32%),radial-gradient(circle_at_86%_18%,rgba(90,76,134,0.22),transparent_32%)] pointer-events-none" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mn-border bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-mn-teal shadow-sm backdrop-blur-xl">
              <Sparkles size={14} className="text-mn-teal" />
              <span>Transparência e Equidade em Saúde</span>
            </div>

            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-mn-graphite sm:text-6xl lg:text-[4.75rem]">
              100% Gratuito para pacientes. Ferramentas de alta performance para médicos e clínicas.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-mn-graphite/75 sm:text-xl">
              Acreditamos que o acesso à saúde não deve ser intermediado por taxas predatórias. Pacientes nunca pagam
              para usar a MediNexus, e profissionais contam com tecnologia de ponta com <strong className="text-mn-teal">zero comissão</strong> sobre honorários.
            </p>
          </div>
        </div>
      </section>

      {/* Grid de Pacientes e Planos Profissionais */}
      <section className="mx-auto max-w-[1500px] px-6 py-16 sm:px-10 lg:px-14">
        {/* Banner de Garantia ao Paciente */}
        <div className="mb-12 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-mn-sand p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <ShieldCheck size={26} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Compromisso MediNexus com Pacientes
              </span>
              <h2 className="text-xl font-black text-mn-graphite mt-1">
                Acesso gratuito para agendar consultas, gerenciar remédios e exames
              </h2>
              <p className="text-sm text-mn-graphite/70 mt-1">
                Você nunca será cobrado para criar sua conta, pesquisar médicos ou receber suas receitas digitais.
              </p>
            </div>
          </div>
          <Link
            href="/cadastro?tipo=patient"
            className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-700 px-7 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 shrink-0"
          >
            Cadastrar como Paciente
          </Link>
        </div>

        {/* Grid com os 4 Planos */}
        <div className="grid gap-8 lg:grid-cols-4">
          {plans.map((item) => (
            <article
              key={item.name}
              className={`relative flex flex-col rounded-[2.5rem] border p-8 transition-all hover:-translate-y-1.5 duration-300 shadow-sm ${
                item.featured
                  ? "border-mn-teal bg-gradient-to-br from-white via-mn-sand to-mn-teal/5 shadow-xl ring-2 ring-mn-teal/20"
                  : "border-mn-border bg-white"
              }`}
            >
              {/* Badge de Destaque */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold ${item.badgeTone}`}>
                  {item.badge}
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-black tracking-tight text-mn-graphite">{item.name}</h3>

              {/* Preço */}
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-mn-teal sm:text-4xl">{item.price}</span>
                <span className="text-xs font-medium text-mn-graphite/60">{item.priceSub}</span>
              </div>

              <p className="mt-4 min-h-[48px] text-xs leading-relaxed text-mn-graphite/70">{item.description}</p>

              <div className="my-6 h-px bg-mn-border" />

              {/* Features do Plano */}
              <ul className="space-y-3.5 mb-8 flex-1">
                {item.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-xs text-mn-graphite/85">
                    <Check size={16} className="mt-0.5 shrink-0 text-mn-teal" />
                    <span className="leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Botão de Ação */}
              <Link
                href={item.href}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold transition ${
                  item.featured
                    ? "bg-mn-teal text-white shadow-md hover:bg-[#123B46]"
                    : "border border-mn-border bg-mn-sand text-mn-graphite hover:bg-white hover:border-mn-teal"
                }`}
              >
                <span>{item.cta}</span>
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Dúvidas Frequentes sobre Planos e Preços */}
      <section className="border-t border-mn-border bg-white/60 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 sm:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-wider text-mn-teal">Tire suas dúvidas</p>
            <h2 className="mt-2 text-3xl font-black text-mn-graphite sm:text-4xl">Perguntas sobre planos e condições</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-mn-border bg-white p-5 transition shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-mn-graphite">
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="text-mn-teal transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-mn-graphite/75 border-t border-mn-border/50 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-mn-graphite/70">
              Precisa de uma proposta personalizada para uma rede de clínicas ou hospitais?
            </p>
            <a
              href="https://wa.me/5521979828341?text=Ol%C3%A1%2C%20gostaria%20de%20uma%20proposta%20personalizada%20para%20minha%20cl%C3%ADnica."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 font-bold text-sm text-mn-teal hover:underline"
            >
              Falar com nosso time comercial no WhatsApp →
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}