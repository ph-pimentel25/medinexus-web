import Link from "next/link";
import { ArrowDown, ArrowUpRight, Building2, CalendarDays, Check, ChevronDown, ClipboardList, FileText, HeartHandshake, MapPin, MessageCircle, Search, ShieldCheck, Stethoscope, UserRound } from "lucide-react";

const audiences = [
  { title: "Para quem busca cuidado", label: "Paciente", icon: UserRound, tone: "bg-mn-sage-light text-mn-teal", description: "Mais clareza para encontrar atendimento e acompanhar cada etapa.", items: ["Encontre profissionais por especialidade e localização.", "Solicite uma consulta e acompanhe a confirmação.", "Consulte seu histórico e os documentos liberados para você.", "Personalize seu perfil, escolha seus avisos e avalie o atendimento."], href: "/cadastro", action: "Criar meu cadastro" },
  { title: "Para quem atende", label: "Médico", icon: Stethoscope, tone: "bg-mn-purple-light text-mn-purple", description: "Uma área de trabalho que reúne agenda, atendimento e registros.", items: ["Apresente seu perfil e suas especialidades.", "Organize a disponibilidade e acompanhe solicitações.", "Acesse os atendimentos e registre a evolução da consulta.", "Prepare documentos vinculados ao paciente e ao atendimento."], href: "/medico/cadastro", action: "Cadastrar como médico" },
  { title: "Para quem organiza", label: "Clínica", icon: Building2, tone: "bg-mn-teal-light text-mn-teal", description: "Uma visão da equipe e da rotina de atendimento em um só lugar.", items: ["Gerencie os médicos vinculados à clínica.", "Acompanhe solicitações e confirmações de consultas.", "Mantenha endereço, contatos e convênios atualizados.", "Personalize a página da clínica com sua identidade."], href: "/clinica/cadastro", action: "Cadastrar minha clínica" },
];
const journey = [
  { title: "Encontre", text: "Busque a especialidade e confira as opções de atendimento na região.", icon: Search },
  { title: "Solicite", text: "Escolha uma opção disponível e envie sua solicitação de consulta.", icon: CalendarDays },
  { title: "Acompanhe", text: "Veja o retorno do atendimento. O horário fica confirmado após a aprovação.", icon: MessageCircle },
  { title: "Prepare-se", text: "Confira os dados da consulta, confirme sua presença quando solicitado e abra o trajeto.", icon: MapPin },
  { title: "Continue", text: "Acesse os registros disponíveis para você e avalie a experiência após a consulta.", icon: ClipboardList },
];
const features = [
  { icon: Search, title: "Uma busca com contexto", text: "Especialidade, localização e opções de atendimento ajudam a encontrar um profissional que faça sentido para sua necessidade." },
  { icon: CalendarDays, title: "Consultas com etapas claras", text: "Solicitação recebida, consulta confirmada e presença são etapas diferentes. Você acompanha o andamento pela sua conta." },
  { icon: FileText, title: "Informações do atendimento", text: "Consultas, histórico e documentos liberados ficam organizados na área do paciente, para facilitar a continuidade do cuidado." },
  { icon: Building2, title: "Clínicas com identidade", text: "Uma página própria reúne a apresentação da clínica, sua equipe e os dados que ajudam você a planejar o atendimento." },
  { icon: MapPin, title: "Do endereço ao trajeto", text: "Com os dados da consulta confirmada, abra a rota no seu aplicativo de mapas e planeje como chegar ao consultório." },
  { icon: HeartHandshake, title: "Experiências que ajudam", text: "Após uma consulta concluída, pacientes podem avaliar médico e clínica, com a opção de ocultar seu nome na avaliação pública." },
];
const questions = [
  { question: "O que é a MediNexus?", answer: "É uma plataforma que conecta pacientes, médicos e clínicas e organiza a jornada do atendimento: da busca por um profissional ao acompanhamento das consultas e dos documentos disponíveis. Cada perfil tem uma área própria, com as ações que fazem parte de sua rotina." },
  { question: "A consulta já está confirmada quando faço uma solicitação?", answer: "A solicitação precisa ser analisada pelo atendimento. Acompanhe o status na sua conta e considere a consulta confirmada quando essa informação aparecer. Valores, cobertura de convênio e condições do atendimento devem ser conferidos com o profissional ou a clínica." },
  { question: "Posso encontrar atendimento particular e por convênio?", answer: "A busca da plataforma web permite consultar essas modalidades conforme o cadastro dos profissionais e das clínicas. A disponibilidade varia por especialidade, agenda e plano. Confirme a cobertura e eventuais autorizações com o prestador antes da consulta." },
  { question: "Todos os médicos encontrados podem ser agendados pela plataforma?", answer: "O agendamento pela MediNexus depende de o profissional estar cadastrado e ter atendimento disponível. Quando a busca de contatos externos estiver habilitada, esses resultados serão identificados separadamente e oferecerão os contatos disponíveis, sem reserva pela plataforma." },
  { question: "Vou receber mensagens pelo WhatsApp ou por e-mail?", answer: "Você pode escolher os canais de aviso em seu perfil. O envio automático depende da ativação dos serviços de mensagem, que ainda está em preparação. Enquanto isso, acompanhe as solicitações e confirmações dentro da sua conta." },
  { question: "Os documentos já têm assinatura digital certificada?", answer: "A integração da assinatura certificada está em implantação. A imagem da assinatura do médico, por si só, não certifica um documento. Até concluir a integração e a validação, os novos documentos permanecem em preparação e não são liberados como documentos certificados." },
  { question: "Existe aplicativo para Android e iPhone?", answer: "A versão nativa para Android e iPhone está em desenvolvimento e ainda não foi publicada nas lojas. A plataforma web pode ser acessada pelo navegador do celular, com telas adaptadas para esse formato." },
];

export default function SobrePage() {
  return <main className="min-h-screen bg-mn-sand text-mn-graphite">
    <section className="border-b border-mn-border" aria-labelledby="about-title">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-20">
        <div>
          <p className="mn-eyebrow">Conheça a MediNexus</p>
          <h1 id="about-title" className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-mn-teal sm:text-5xl lg:text-6xl">Mais conexão.<br/>Mais clareza para cuidar.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-mn-graphite/80">Reunimos pacientes, médicos e clínicas para organizar o que acontece antes, durante e depois da consulta.</p>
          <p className="mt-4 max-w-2xl leading-7 text-mn-graphite/75">Encontrar atendimento, entender a confirmação de um horário e localizar um documento fazem parte do cuidado. A MediNexus aproxima essas etapas para que cada pessoa saiba onde encontrar as informações de que precisa.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/cadastro" className="mn-button">Faça parte <ArrowUpRight size={17}/></Link><a href="#como-funciona" className="mn-button-secondary">Entenda como funciona <ArrowDown size={17}/></a></div>
        </div>
        <aside className="rounded-2xl border border-mn-border bg-white p-6 shadow-sm sm:p-8" aria-label="A conexão entre os três perfis">
          <span className="inline-flex rounded-xl bg-mn-sage-light p-3 text-mn-teal"><HeartHandshake size={27} strokeWidth={1.5}/></span>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">O cuidado conecta todos nós.</h2>
          <p className="mt-3 text-sm leading-6 text-mn-graphite/75">Uma mesma jornada, com um espaço para cada papel.</p>
          <div className="mt-6 divide-y divide-mn-border">{audiences.map(({label,icon:Icon,tone},i)=><div key={label} className="flex items-center gap-4 py-4"><span className={`rounded-xl p-2.5 ${tone}`}><Icon size={21} strokeWidth={1.7}/></span><div><h3 className="font-semibold">{label}</h3><p className="mt-1 text-sm text-mn-graphite/75">{["Encontra e acompanha","Atende e registra","Organiza e acolhe"][i]}</p></div><span className="ml-auto text-xs font-medium text-mn-teal" aria-hidden="true">0{i+1}</span></div>)}</div>
        </aside>
      </div>
    </section>

    <section aria-labelledby="purpose-title" className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-20">
      <div><p className="mn-eyebrow">Nosso propósito</p><h2 id="purpose-title" className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Aproximar pessoas.<br/>Organizar o cuidado.</h2></div>
      <div className="space-y-5 leading-8 text-mn-graphite/80"><p>Na rotina de saúde, informações importantes acabam espalhadas entre agendas, conversas e arquivos. A proposta da MediNexus é reunir essas etapas em uma experiência compreensível, com acesso adequado a cada perfil.</p><p>Para o paciente, isso significa acompanhar o próprio atendimento. Para o médico, manter a rotina e os registros organizados. Para a clínica, conectar a equipe à operação e apresentar melhor seus serviços.</p><p className="border-l-2 border-mn-sage pl-5 font-medium text-mn-teal">A tecnologia apoia a organização. O cuidado e as decisões clínicas continuam nas mãos das pessoas e dos profissionais responsáveis.</p></div>
    </section>

    <section id="para-quem" aria-labelledby="audience-title" className="scroll-mt-24 border-y border-mn-border bg-white/60">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <p className="mn-eyebrow">Para quem fazemos</p><h2 id="audience-title" className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Três perfis. Uma jornada compartilhada.</h2>
        <div className="mt-9 grid gap-5 lg:grid-cols-3">{audiences.map(({label,title,icon:Icon,tone,description,items,href,action})=><article key={label} className="flex flex-col rounded-2xl border border-mn-border bg-white p-6 sm:p-7"><div className="flex items-center gap-3"><span className={`rounded-xl p-3 ${tone}`}><Icon size={23} strokeWidth={1.6}/></span><p className="text-xs font-semibold uppercase tracking-widest text-mn-teal">{label}</p></div><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-mn-graphite/75">{description}</p><ul className="my-6 space-y-4">{items.map(item=><li key={item} className="flex items-start gap-2.5 text-sm leading-6"><Check size={17} className="mt-1 shrink-0 text-mn-teal"/><span>{item}</span></li>)}</ul><Link href={href} className="mt-auto inline-flex min-h-11 items-center gap-2 border-t border-mn-border pt-4 text-sm font-semibold text-mn-teal">{action}<ArrowUpRight size={16}/></Link></article>)}</div>
      </div>
    </section>

    <section id="como-funciona" aria-labelledby="journey-title" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
      <p className="mn-eyebrow">Da busca ao acompanhamento</p><h2 id="journey-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Como acontece na prática.</h2><p className="mt-4 max-w-2xl leading-7 text-mn-graphite/75">Cada etapa tem uma informação e um próximo passo. Você acompanha o andamento pela sua conta.</p>
      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{journey.map(({title,text,icon:Icon},i)=><li key={title} className="rounded-2xl border border-mn-border bg-white p-5"><div className="flex items-center justify-between text-mn-teal"><Icon size={23} strokeWidth={1.6}/><span className="text-xs font-semibold" aria-label={`Etapa ${i+1}`}>0{i+1}</span></div><h3 className="mt-6 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-mn-graphite/75">{text}</p></li>)}</ol>
    </section>

    <section aria-labelledby="features-title" className="border-y border-mn-border bg-white/60"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20"><p className="mn-eyebrow">O que você encontra</p><h2 id="features-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Recursos que fazem parte da rotina.</h2><div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">{features.map(({icon:Icon,title,text})=><article key={title}><Icon size={23} className="text-mn-purple" strokeWidth={1.6}/><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-mn-graphite/75">{text}</p></article>)}</div></div></section>

    <section aria-labelledby="trust-title" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20"><div className="grid gap-8 rounded-2xl bg-mn-teal p-6 text-white sm:p-9 lg:grid-cols-[0.8fr_1.2fr] lg:p-12"><div><ShieldCheck size={30} strokeWidth={1.5} className="text-mn-sage-light"/><h2 id="trust-title" className="mt-5 text-3xl font-semibold leading-tight tracking-tight">Informação com contexto e responsabilidade.</h2><p className="mt-5 text-sm leading-7 text-white/85">Dados de saúde exigem cuidado. A experiência considera quem está acessando a plataforma e qual informação faz parte daquele atendimento.</p></div><div className="space-y-6"><div><h3 className="font-semibold">Cada perfil tem seu espaço</h3><p className="mt-2 text-sm leading-7 text-white/85">Paciente, médico e clínica têm áreas e permissões próprias. O paciente acessa os documentos liberados para ele.</p></div><div><h3 className="font-semibold">Você escolhe os canais de aviso</h3><p className="mt-2 text-sm leading-7 text-white/85">As preferências de e-mail e WhatsApp ficam no perfil. Os envios dependem de sua autorização e da disponibilidade dos serviços.</p></div><div><h3 className="font-semibold">Avaliações com identificação opcional</h3><p className="mt-2 text-sm leading-7 text-white/85">Nas avaliações públicas de médicos e clínicas, você pode ocultar seu nome. Evite incluir informações pessoais ou clínicas no comentário.</p></div></div></div></section>

    <section id="duvidas" aria-labelledby="faq-title" className="mx-auto grid max-w-7xl scroll-mt-24 gap-8 px-5 pb-14 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:px-10 lg:pb-20"><div><p className="mn-eyebrow">Antes de começar</p><h2 id="faq-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Dúvidas frequentes.</h2><p className="mt-5 leading-7 text-mn-graphite/75">Entenda como usar a plataforma e o que está em preparação.</p></div><div className="space-y-3">{questions.map(({question,answer})=><details key={question} className="group rounded-2xl border border-mn-border bg-white"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 font-semibold marker:content-none [&::-webkit-details-marker]:hidden"><span>{question}</span><ChevronDown size={18} className="shrink-0 text-mn-teal transition-transform group-open:rotate-180"/></summary><p className="px-5 pb-5 text-sm leading-7 text-mn-graphite/80">{answer}</p></details>)}</div></section>

    <section aria-labelledby="start-title" className="border-t border-mn-border bg-mn-sage-light/50"><div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10"><div><h2 id="start-title" className="text-2xl font-semibold tracking-tight text-mn-teal sm:text-3xl">Seu próximo passo começa aqui.</h2><p className="mt-3 leading-7 text-mn-graphite/80">Conheça as clínicas e profissionais ou escolha seu perfil para participar.</p></div><div className="flex flex-wrap gap-3"><Link href="/cadastro" className="mn-button">Criar minha conta <ArrowUpRight size={16}/></Link><Link href="/clinicas" className="mn-button-secondary">Conhecer as clínicas</Link></div></div></section>
  </main>;
}
