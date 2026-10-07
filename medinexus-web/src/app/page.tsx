import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Battery,
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  FlaskConical,
  Heart,
  HelpCircle,
  House,
  Lock,
  MapPin,
  Pill,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  UserCheck,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

const metrics = [
  { value: "100%", label: "Gratuito para pacientes", sub: "Zero taxas de agendamento" },
  { value: "0%", label: "Comissão da plataforma", sub: "Honorários integrais do médico" },
  { value: "15 min", label: "Algoritmo de encaixe", sub: "Intervalos padronizados 24h" },
  { value: "LGPD", label: "Conformidade e CFM", sub: "Segurança de dados clínicos" },
];

const pillars = [
  {
    role: "Para Pacientes",
    badge: "100% Gratuito",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    title: "Cuidado de saúde na palma da sua mão.",
    description:
      "Encontre médicos por disponibilidade real, agende consultas sem burocracia, acesse receitas digitais e gerencie medicamentos e exames laboratoriais.",
    features: [
      "Busca inteligente por dia da semana e horários livres",
      "Receitas médicas com posologia e lembretes diários",
      "Agendamento direto em laboratórios parceiros com desconto",
      "Histórico clínico unificado e compartilhado com segurança",
    ],
    cta: "Buscar atendimento agora",
    href: "/descobrir",
    highlight: false,
  },
  {
    role: "Para Médicos",
    badge: "Alta Produtividade",
    badgeTone: "bg-mn-teal/10 text-mn-teal border-mn-teal/20",
    title: "Menos burocracia. Foco total no paciente.",
    description:
      "Console clínico moderno com prontuário eletrônico rápido, prescrição estruturada, validação de presença e zero comissão sobre suas consultas particulares.",
    features: [
      "Agenda inteligente com redução de no-show em até 80%",
      "Prescrições e atestados com assinatura digital ICP-Brasil",
      "Recebimento direto das consultas particulares sem retenção",
      "Perfil verificado na rede de busca geolocalizada",
    ],
    cta: "Criar cadastro médico",
    href: "/cadastro?tipo=doctor",
    highlight: true,
  },
  {
    role: "Para Clínicas & Laboratórios",
    badge: "Gestão Integrada",
    badgeTone: "bg-purple-50 text-purple-700 border-purple-200",
    title: "A operação da sua clínica conectada.",
    description:
      "Centralize o agendamento de múltiplos especialistas, confirmação ativa de presença via WhatsApp, salas de atendimento e parcerias com centros de diagnóstico.",
    features: [
      "Painel de recepção e confirmação automatizada de consultas",
      "Gestão de corpo clínico com permissões granulares",
      "Conexão com laboratórios para exames com laudo digital",
      "Visibilidade institucional e captação ética de pacientes",
    ],
    cta: "Cadastrar minha clínica",
    href: "/cadastro?tipo=clinic",
    highlight: false,
  },
];

const differentials = [
  {
    icon: TrendingDown,
    title: "Zero comissão sobre consultas",
    description:
      "Diferente dos marketplaces tradicionais que retêm de 15% a 30% dos seus honorários, a MediNexus acredita na autonomia médica sem intermediação predatória.",
  },
  {
    icon: Clock,
    title: "Algoritmo de encaixe em 15 minutos",
    description:
      "O paciente informa seus dias e horários livres; nosso algoritmo cruza a grade dos médicos e encontra a combinação ideal automaticamente.",
  },
  {
    icon: FlaskConical,
    title: "Rede integrada de exames e laboratórios",
    description:
      "Quando o médico solicita um exame na consulta, o paciente pode agendar na rede de laboratórios parceiros com poucos cliques e condições especiais.",
  },
  {
    icon: Pill,
    title: "Acompanhamento contínuo de medicação",
    description:
      "Receitas emitidas viram alarmes e controle de estoque no app do paciente, com cotação direta em farmácias parceiras para evitar abandono de tratamento.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança de dados com padrão CFM e LGPD",
    description:
      "Prontuário sob controle absoluto do paciente, com acesso por consentimento expresso e integridade garantida por logs auditáveis.",
  },
  {
    icon: Zap,
    title: "Notificações ativas no WhatsApp e App",
    description:
      "Confirmações de presença antes da consulta eliminam horários vazios na clínica e garantem que o paciente nunca perca a data marcada.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-mn-sand text-mn-graphite overflow-x-hidden">
      {/* ======================================================== */}
      {/* 1. HERO SECTION PREMIUM */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden border-b border-mn-border">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(122,157,140,0.28),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(90,76,134,0.22),transparent_32%),linear-gradient(135deg,#FAF6F3_0%,#F5EEE9_45%,#EEF3EF_100%)] pointer-events-none" />
        <div className="absolute left-1/2 top-0 h-px w-[90%] -translate-x-1/2 bg-gradient-to-r from-transparent via-mn-teal/30 to-transparent" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Coluna da Esquerda: Proposta de Valor e CTAs */}
            <div>
              {/* Badge de Destaque */}
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-mn-border bg-white/70 px-4 py-2 shadow-sm backdrop-blur-xl">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-mn-teal">
                  Healthtech de Próxima Geração
                </span>
                <span className="rounded-full bg-mn-teal/10 px-2 py-0.5 text-[10px] font-bold text-mn-teal">
                  100% Grátis para Pacientes
                </span>
              </div>

              {/* Título Principal de Alto Impacto */}
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-mn-graphite sm:text-6xl lg:text-[4.75rem]">
                A saúde conectada com inteligência, ética e zero burocracia.
              </h1>

              {/* Subtítulo Claro e Convincente */}
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mn-graphite/75 sm:text-xl">
                O ecossistema que une <strong className="font-semibold text-mn-teal">pacientes</strong>,{" "}
                <strong className="font-semibold text-mn-teal">médicos</strong>,{" "}
                <strong className="font-semibold text-mn-teal">clínicas</strong> e{" "}
                <strong className="font-semibold text-mn-teal">laboratórios</strong> em um fluxo único: da busca por
                disponibilidade ao prontuário digital e exames com desconto.
              </p>

              {/* CTAs de Alta Conversão */}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/descobrir"
                  className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-mn-teal px-8 text-sm font-bold text-white shadow-[0_20px_50px_-20px_rgba(22,73,87,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#123B46] hover:shadow-[0_25px_60px_-20px_rgba(22,73,87,0.9)]"
                >
                  <Search size={18} />
                  <span>Buscar médicos e consultas</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/cadastro"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-mn-border bg-white/80 px-7 text-sm font-bold text-mn-graphite shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white hover:border-mn-teal/30"
                >
                  <Stethoscope size={18} className="text-mn-teal" />
                  <span>Sou médico ou clínica</span>
                </Link>
              </div>

              {/* Métricas Rápidas de Confiança */}
              <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-mn-border/80 pt-8">
                {metrics.map((m) => (
                  <div key={m.label} className="space-y-1">
                    <p className="text-2xl font-black text-mn-teal sm:text-3xl">{m.value}</p>
                    <p className="text-xs font-bold text-mn-graphite">{m.label}</p>
                    <p className="text-[11px] text-mn-graphite/60">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna da Direita: Mockup Hiper-Realista iPhone 16 Pro (App Oficial MediNexus) */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Blur decorativo de iluminação ambiente */}
              <div className="absolute -left-10 -top-10 h-80 w-80 rounded-full bg-mn-sage/35 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 h-80 w-80 rounded-full bg-mn-purple/25 blur-3xl pointer-events-none" />

              {/* Tag Flutuante Superior: Identificação do Dispositivo e OS */}
              <div className="absolute -top-4 -left-4 z-30 hidden sm:flex items-center gap-2.5 rounded-2xl border border-white/90 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur-xl">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-mn-graphite/50">iPhone 16 Pro · iOS 18</p>
                  <p className="text-xs font-bold text-mn-graphite">App Oficial MediNexus</p>
                </div>
              </div>

              {/* Tag Flutuante Inferior: Certificação Clínica */}
              <div className="absolute -bottom-4 -right-4 z-30 hidden sm:flex items-center gap-2.5 rounded-2xl border border-white/90 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur-xl">
                <ShieldCheck size={18} className="text-mn-teal" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-mn-graphite/50">Padrão CFM & LGPD</p>
                  <p className="text-xs font-bold text-mn-graphite">100% Gratuito ao Paciente</p>
                </div>
              </div>

              {/* Contêiner do Aparelho com Botões Físicos Laterais do iPhone 16 */}
              <div className="relative w-full max-w-[390px]">
                {/* Botão de Ação (Action Button) - Superior Esquerdo */}
                <div className="absolute -left-[6px] top-24 h-7 w-[6px] rounded-l-md bg-gradient-to-r from-[#1E293B] to-[#475569] shadow-sm z-10" />

                {/* Botão Volume + (Esquerdo) */}
                <div className="absolute -left-[6px] top-36 h-12 w-[6px] rounded-l-md bg-gradient-to-r from-[#1E293B] to-[#475569] shadow-sm z-10" />

                {/* Botão Volume - (Esquerdo) */}
                <div className="absolute -left-[6px] top-52 h-12 w-[6px] rounded-l-md bg-gradient-to-r from-[#1E293B] to-[#475569] shadow-sm z-10" />

                {/* Botão Lateral / Power (Direito) */}
                <div className="absolute -right-[6px] top-32 h-16 w-[6px] rounded-r-md bg-gradient-to-l from-[#1E293B] to-[#475569] shadow-sm z-10" />

                {/* Botão de Controle da Câmera (Camera Control - Exclusivo do iPhone 16) */}
                <div className="absolute -right-[5px] top-64 h-14 w-[5px] rounded-r-sm bg-gradient-to-l from-[#334155] to-[#64748B] shadow-inner z-10" />

                {/* Chassi de Titânio Natural do iPhone 16 Pro */}
                <div className="relative rounded-[54px] p-[10px] bg-gradient-to-b from-[#475569] via-[#1E293B] to-[#0F172A] shadow-[0_35px_100px_-20px_rgba(15,23,42,0.65),0_15px_40px_-15px_rgba(22,73,87,0.45)] ring-1 ring-white/20">
                  {/* Borda ultrafina uniforme de display OLED */}
                  <div className="rounded-[45px] p-[3px] bg-black shadow-inner">
                    {/* Tela Display Super Retina XDR */}
                    <div className="relative overflow-hidden rounded-[42px] bg-[#FAF6F3] text-mn-graphite flex flex-col shadow-inner">
                      {/* Reflexo de Vidro Físico (Glass Sheen) */}
                      <div className="absolute -top-16 -right-16 h-72 w-72 rotate-45 bg-gradient-to-b from-white/15 via-white/5 to-transparent pointer-events-none rounded-full blur-[1px] z-20" />

                      {/* Micro saída de áudio frontal no topo */}
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-[#0F172A]/70 z-30" />

                      {/* Status Bar Nativa do iOS 18 com Dynamic Island */}
                      <div className="relative px-6 pt-3 pb-1 flex items-center justify-between text-mn-graphite z-20">
                        {/* Horário iOS */}
                        <span className="text-[13px] font-black tracking-tight text-mn-graphite">9:41</span>

                        {/* Dynamic Island com Lente de Câmera e Sensor Face ID */}
                        <div className="h-6 w-28 rounded-full bg-black flex items-center justify-between px-3 shadow-md">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#0B132B] ring-1 ring-[#1E293B] flex items-center justify-center">
                            <span className="h-1 w-1 rounded-full bg-[#3B82F6]/60" />
                          </div>
                          <div className="h-2 w-2 rounded-full bg-[#111827]" />
                        </div>

                        {/* Indicadores de Rede e Bateria */}
                        <div className="flex items-center gap-1.5 text-mn-graphite">
                          {/* 4 Barras de Sinal de Celular */}
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.5 h-1 rounded-xs bg-mn-graphite" />
                            <span className="w-0.5 h-1.5 rounded-xs bg-mn-graphite" />
                            <span className="w-0.5 h-2 rounded-xs bg-mn-graphite" />
                            <span className="w-0.5 h-2.5 rounded-xs bg-mn-graphite" />
                          </div>
                          <span className="text-[10px] font-bold text-mn-graphite">5G</span>
                          <Wifi size={13} strokeWidth={2.5} />
                          {/* Bateria com preenchimento */}
                          <div className="flex items-center">
                            <div className="w-5 h-2.5 rounded-[4px] border border-mn-graphite p-0.5 flex items-center">
                              <div className="w-3.5 h-full rounded-[2px] bg-emerald-500" />
                            </div>
                            <span className="w-0.5 h-1 rounded-r-xs bg-mn-graphite" />
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo da Dashboard Oficial (Início) */}
                      <div className="px-4.5 pt-2 pb-3 space-y-3.5 relative z-10">
                        {/* Cabeçalho do Paciente (idêntico ao app) */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-black text-mn-graphite">Olá, Mariana</p>
                            <p className="text-[11px] text-mn-graphite/60">Seu cuidado de saúde em um só lugar.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Sininho de Notificações com Bolinha */}
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-mn-border bg-white shadow-sm text-mn-teal">
                              <Bell size={15} />
                              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                            </div>
                            {/* Avatar do Paciente */}
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-mn-teal/30 bg-mn-sage/25 text-xs font-bold text-mn-teal">
                              MS
                            </div>
                          </div>
                        </div>

                        {/* Métricas Rápidas (2 Cards Oficiais do App) */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="rounded-2xl border border-mn-border bg-white p-3 shadow-sm space-y-1">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8F3EE] text-mn-teal">
                              <CalendarDays size={15} />
                            </div>
                            <p className="text-2xl font-black text-mn-teal leading-none">1</p>
                            <p className="text-[10px] font-semibold text-mn-graphite/70">Consulta confirmada</p>
                          </div>

                          <div className="rounded-2xl border border-mn-border bg-white p-3 shadow-sm space-y-1">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F4F1] text-mn-teal">
                              <Pill size={15} />
                            </div>
                            <p className="text-2xl font-black text-mn-teal leading-none">3</p>
                            <p className="text-[10px] font-semibold text-mn-graphite/70">Remédios ativos</p>
                          </div>
                        </div>

                        {/* Próximo Atendimento (Card Oficial de Consulta) */}
                        <div className="rounded-2xl border border-mn-border bg-white p-3 shadow-sm space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Check size={11} className="stroke-[3]" />
                              CONFIRMADA
                            </span>
                            <span className="text-[11px] font-bold text-mn-teal">Ter, 14:30</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mn-teal/10 text-mn-teal font-bold text-xs">
                              RA
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-mn-graphite truncate">Dr. Rafael Alcantara</p>
                              <p className="text-[11px] font-medium text-mn-teal truncate">Cardiologia Clínica</p>
                              <p className="text-[10px] text-mn-graphite/50 truncate">Centro Médico Integrado · Botafogo</p>
                            </div>
                          </div>

                          {/* Status de Presença */}
                          <div className="flex items-center justify-between rounded-xl bg-[#E8F3EE] px-2.5 py-1.5 text-[10px] font-bold text-mn-teal">
                            <span>Presença confirmada</span>
                            <span className="text-[9px] font-medium text-mn-graphite/60">Aviso WhatsApp</span>
                          </div>
                        </div>

                        {/* Atalhos Rápidos Oficiais do App (Grid 2x2) */}
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-mn-graphite">O que você precisa hoje?</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-mn-border bg-[#E8F3EE] p-2.5 text-mn-teal relative shadow-sm">
                              <CalendarDays size={18} />
                              <p className="mt-1 text-[11px] font-bold leading-tight">Agendar consulta</p>
                              <ArrowUpRight size={12} className="absolute top-2.5 right-2.5 opacity-60" />
                            </div>
                            <div className="rounded-xl border border-mn-border bg-[#E6F4F1] p-2.5 text-mn-teal relative shadow-sm">
                              <FlaskConical size={18} />
                              <p className="mt-1 text-[11px] font-bold leading-tight">Exames e lab</p>
                              <ArrowUpRight size={12} className="absolute top-2.5 right-2.5 opacity-60" />
                            </div>
                            <div className="rounded-xl border border-mn-border bg-[#E8F3EE] p-2.5 text-mn-teal relative shadow-sm">
                              <Pill size={18} />
                              <p className="mt-1 text-[11px] font-bold leading-tight">Meus remédios</p>
                              <ArrowUpRight size={12} className="absolute top-2.5 right-2.5 opacity-60" />
                            </div>
                            <div className="rounded-xl border border-mn-border bg-[#F0EDF7] p-2.5 text-mn-purple relative shadow-sm">
                              <FileText size={18} />
                              <p className="mt-1 text-[11px] font-bold leading-tight">Documentos</p>
                              <ArrowUpRight size={12} className="absolute top-2.5 right-2.5 opacity-60" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Barra de Abas Inferior (Tabs Oficiais do App) */}
                      <div className="border-t border-mn-border/80 bg-white px-2 pt-2 pb-2 flex items-center justify-around relative z-10">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex h-5 w-8 items-center justify-center rounded-full bg-[#E8F3EE] text-mn-teal">
                            <House size={13} />
                          </div>
                          <span className="text-[9px] font-bold text-mn-teal">Início</span>
                        </div>

                        <div className="flex flex-col items-center gap-0.5 text-mn-graphite/45">
                          <Search size={13} />
                          <span className="text-[9px] font-medium">Buscar</span>
                        </div>

                        <div className="flex flex-col items-center gap-0.5 text-mn-graphite/45">
                          <CalendarDays size={13} />
                          <span className="text-[9px] font-medium">Consultas</span>
                        </div>

                        <div className="flex flex-col items-center gap-0.5 text-mn-graphite/45">
                          <Pill size={13} />
                          <span className="text-[9px] font-medium">Remédios</span>
                        </div>

                        <div className="flex flex-col items-center gap-0.5 text-mn-graphite/45">
                          <FileText size={13} />
                          <span className="text-[9px] font-medium">Documentos</span>
                        </div>
                      </div>

                      {/* Home Indicator do iOS (Barra inferior física do iPhone) */}
                      <div className="bg-white pb-2 pt-1 flex justify-center relative z-10">
                        <div className="h-1 w-28 rounded-full bg-mn-graphite/35" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. OS TRÊS PILARES DO ECOSSISTEMA */}
      {/* ======================================================== */}
      <section className="relative py-20 sm:py-28 border-b border-mn-border bg-white/50">
        <div className="mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-14">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-mn-teal">Ecossistema Completo</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-mn-graphite sm:text-5xl">
              Uma experiência pensada para cada ator da saúde.
            </h2>
            <p className="mt-4 text-base text-mn-graphite/70">
              A saúde é um ciclo contínuo. Criamos interfaces e processos sob medida para quem precisa de cuidado, quem
              atende e quem administra.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {pillars.map((p) => (
              <article
                key={p.role}
                className={`relative flex flex-col rounded-[2.2rem] border p-8 transition-all hover:-translate-y-1.5 duration-300 shadow-sm ${
                  p.highlight
                    ? "border-mn-teal bg-gradient-to-br from-white via-mn-sand to-mn-sage/10 shadow-xl ring-2 ring-mn-teal/20"
                    : "border-mn-border bg-white"
                }`}
              >
                {/* Header do Card com Hierarquia Segura Anti-Overlap */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-mn-graphite/50">{p.role}</span>
                  <span className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold ${p.badgeTone}`}>
                    {p.badge}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black text-mn-graphite">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mn-graphite/75">{p.description}</p>

                <div className="my-6 h-px bg-mn-border" />

                {/* Lista de Recursos */}
                <ul className="space-y-3.5 mb-8 flex-1">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs font-medium text-mn-graphite/85">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-mn-teal" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Botão de Ação */}
                <Link
                  href={p.href}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold transition ${
                    p.highlight
                      ? "bg-mn-teal text-white hover:bg-[#123B46]"
                      : "border border-mn-border bg-mn-sand text-mn-graphite hover:bg-white hover:border-mn-teal"
                  }`}
                >
                  <span>{p.cta}</span>
                  <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. DIFERENCIAIS DA HEALTHTECH */}
      {/* ======================================================== */}
      <section className="py-20 sm:py-28 border-b border-mn-border">
        <div className="mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-14">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-mn-teal">Inovação e Transparência</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-mn-graphite sm:text-5xl">
              Por que a MediNexus é a escolha certa para você?
            </h2>
            <p className="mt-4 text-base text-mn-graphite/70">
              Construímos a plataforma sobre alicerces éticos modernos, eliminando as fricções que tornavam o acesso à
              saúde caro e cansativo.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {differentials.map((diff) => (
              <div
                key={diff.title}
                className="group rounded-2xl border border-mn-border bg-white p-7 transition hover:-translate-y-1 hover:border-mn-teal/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mn-sand text-mn-teal transition group-hover:bg-mn-teal group-hover:text-white">
                  <diff.icon size={22} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-mn-graphite">{diff.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mn-graphite/70">{diff.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. REDE DE LABORATÓRIOS E FARMÁCIAS */}
      {/* ======================================================== */}
      <section className="py-20 sm:py-24 bg-white/60 border-b border-mn-border">
        <div className="mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-14">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-mn-teal/10 px-3.5 py-1 text-xs font-bold text-mn-teal">
                Cuidado Integral 360°
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-mn-graphite sm:text-4xl">
                A consulta é apenas o primeiro passo do seu tratamento.
              </h2>
              <p className="mt-4 text-base text-mn-graphite/75 leading-relaxed">
                Na MediNexus, você não sai do consultório com um papel e fica perdido. Nossas conexões com centros de
                diagnósticos e farmácias garantem que você realize seus exames e compre seus medicamentos com facilidade e
                descontos exclusivos.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mn-teal text-white">
                    <FlaskConical size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-mn-graphite">Laboratórios de Análises & Imagem</h3>
                    <p className="text-xs text-mn-graphite/70 mt-1">
                      Agende hemogramas, ressonâncias e ultrassons em redes credenciadas com laudos digitais integrados
                      direto no seu histórico.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mn-teal text-white">
                    <Pill size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-mn-graphite">Farmácias Parceiras & Medicamentos Contínuos</h3>
                    <p className="text-xs text-mn-graphite/70 mt-1">
                      Receitas geram lembretes de posologia no celular e cotação rápida para entrega na sua residência.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <Link
                  href="/descobrir"
                  className="rounded-full bg-mn-teal px-7 py-3.5 text-xs font-bold text-white transition hover:bg-[#123B46]"
                >
                  Conhecer rede credenciada
                </Link>
                <Link
                  href="/pacotes"
                  className="rounded-full border border-mn-border bg-white px-7 py-3.5 text-xs font-bold text-mn-graphite transition hover:bg-mn-sand"
                >
                  Ver planos para clínicas
                </Link>
              </div>
            </div>

            {/* Ilustração / Quadro de Parceiros */}
            <div className="rounded-3xl border border-mn-border bg-mn-sand/60 p-8 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-mn-border bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-mn-teal">Exames de Sangue</p>
                  <p className="mt-2 text-xl font-bold text-mn-graphite">Rede Dasa & Fleury</p>
                  <p className="mt-1 text-xs text-mn-graphite/60">Até 30% de desconto para usuários MediNexus</p>
                </div>
                <div className="rounded-2xl border border-mn-border bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-mn-teal">Diagnóstico por Imagem</p>
                  <p className="mt-2 text-xl font-bold text-mn-graphite">Ressonâncias & Tomografias</p>
                  <p className="mt-1 text-xs text-mn-graphite/60">Laudo digital entregue em até 24 horas</p>
                </div>
                <div className="rounded-2xl border border-mn-border bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-mn-teal">Cardiologia Diagnóstica</p>
                  <p className="mt-2 text-xl font-bold text-mn-graphite">Holter, MAPA & ECG</p>
                  <p className="mt-1 text-xs text-mn-graphite/60">Agendamento sem filas com laudo do especialista</p>
                </div>
                <div className="rounded-2xl border border-mn-border bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-mn-teal">Farmácias Integradas</p>
                  <p className="mt-2 text-xl font-bold text-mn-graphite">Delivery de Medicamentos</p>
                  <p className="mt-1 text-xs text-mn-graphite/60">Cotação instantânea com receitas validadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. CHAMADA FINAL DE ALTO IMPACTO (CTA BANNER) */}
      {/* ======================================================== */}
      <section className="py-20 sm:py-28 px-6 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[3rem] bg-gradient-to-br from-mn-teal via-mn-graphite to-mn-purple p-10 text-white shadow-2xl sm:p-16 lg:p-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-mn-sage-light">
                Junte-se ao Futuro da Saúde
              </span>
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl leading-[1.08]">
                Pronto para transformar sua experiência com saúde?
              </h2>
              <p className="text-base text-white/80 sm:text-lg leading-relaxed">
                Cadastre-se gratuitamente como paciente ou junte-se à nossa rede de médicos e clínicas credenciadas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 lg:flex-col shrink-0">
              <Link
                href="/cadastro"
                className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-sm font-bold text-mn-teal shadow-lg transition hover:bg-mn-sand hover:-translate-y-0.5"
              >
                Criar conta gratuita
              </Link>
              <Link
                href="/pacotes"
                className="inline-flex h-14 items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 hover:-translate-y-0.5"
              >
                Conhecer planos para clínicas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}