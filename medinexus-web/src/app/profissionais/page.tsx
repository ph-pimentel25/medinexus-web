import Link from "next/link";

const doctorBenefits = [
  "Receba solicitações com horário sugerido automaticamente.",
  "Confirme consultas com apenas um clique.",
  "Acesse prontuário, anamnese e histórico do paciente.",
  "Emita documentos médicos dentro da jornada da consulta.",
];

const clinicBenefits = [
  "Cadastre médicos, planos aceitos e dados institucionais.",
  "Tenha uma página pública para sua clínica dentro da MediNexus.",
  "Receba solicitações qualificadas de pacientes próximos.",
  "Organize agenda, confirmações, prontuário e documentos em um fluxo único.",
];

const steps = [
  {
    title: "Escolha o melhor modelo",
    description:
      "Médico individual ou clínica com múltiplos profissionais e estrutura própria.",
  },
  {
    title: "Configure seu cadastro",
    description:
      "Informe dados profissionais, endereço, planos aceitos e disponibilidade.",
  },
  {
    title: "Receba solicitações",
    description:
      "Pacientes encontram sua clínica ou perfil por especialidade, raio, plano ou particular.",
  },
  {
    title: "Confirme e atenda",
    description:
      "O sistema sugere o horário e você confirma o atendimento com mais organização.",
  },
];

export default function ProfissionaisPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <p className="inline-flex rounded-full border border-[#283C7A]/15 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#283C7A] shadow-sm">
              Profissionais e clínicas
            </p>

            <h1 className="mt-7 text-5xl font-black leading-[0.92] tracking-[-0.075em] text-slate-950 sm:text-6xl lg:text-7xl">
              Leve sua operação médica para uma jornada mais conectada.
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-600">
              A MediNexus ajuda médicos e clínicas a receberem solicitações mais
              qualificadas, confirmarem consultas com menos atrito e organizarem
              prontuário, documentos e histórico do paciente.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/pacotes"
                className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-8 py-4 text-sm font-black text-white shadow-[0_22px_60px_-30px_rgba(40,60,122,0.9)] transition hover:-translate-y-0.5 hover:bg-[#213366]"
              >
                Ver pacotes
              </Link>

              <Link
                href="/clinica/cadastro"
                className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white/90 px-8 py-4 text-sm font-black text-[#5E4B9A] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6F3FF]"
              >
                Cadastrar clínica
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <article className="rounded-[42px] border border-[#E0E7FF] bg-white p-8 shadow-[0_30px_100px_-70px_rgba(40,60,122,0.45)]">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#283C7A]">
                Para médicos
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950">
                Menos mensagens soltas. Mais consulta organizada.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                Ideal para médicos que querem receber solicitações com mais
                contexto, confirmar horários com rapidez e atender com histórico
                estruturado.
              </p>

              <div className="mt-7 grid gap-3">
                {doctorBenefits.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-[#F1F5FF] px-4 py-3 text-sm font-bold text-[#283C7A]"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/login"
                  className="inline-flex rounded-2xl bg-[#283C7A] px-7 py-4 text-sm font-black text-white transition hover:bg-[#213366]"
                >
                  Entrar como médico
                </Link>
              </div>
            </article>

            <article className="rounded-[42px] border border-[#D9D6F4] bg-gradient-to-br from-[#F6F3FF] to-[#F1F5FF] p-8 shadow-[0_30px_100px_-70px_rgba(94,75,154,0.45)]">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6E56CF]">
                Para clínicas
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950">
                Sua clínica com presença digital, agenda e fluxo de atendimento.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                Ideal para clínicas que querem cadastrar médicos, configurar
                planos, receber pacientes e organizar solicitações em um fluxo
                mais profissional.
              </p>

              <div className="mt-7 grid gap-3">
                {clinicBenefits.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#5E4B9A]"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/clinica/cadastro"
                  className="inline-flex rounded-2xl bg-[#6E56CF] px-7 py-4 text-sm font-black text-white transition hover:bg-[#5E4B9A]"
                >
                  Cadastrar clínica
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[46px] bg-slate-950 shadow-[0_35px_120px_-70px_rgba(15,23,42,0.95)]">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-gradient-to-br from-[#283C7A] to-[#6E56CF] p-8 text-white lg:p-12">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/60">
                Como entrar
              </p>
              <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.06em]">
                Um fluxo simples para começar com estrutura.
              </h2>
              <p className="mt-5 leading-8 text-white/75">
                A MediNexus foi pensada para crescer em camadas: primeiro o
                cadastro e a agenda, depois documentos, pagamentos e reputação.
              </p>
            </div>

            <div className="p-6 lg:p-8">
              <div className="grid gap-3">
                {steps.map((item, index) => (
                  <div
                    key={item.title}
                    className="flex gap-4 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 text-white"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-[#283C7A]">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/70">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[46px] bg-gradient-to-br from-[#283C7A] via-[#4B4EA3] to-[#6E56CF] p-8 text-white shadow-[0_35px_120px_-70px_rgba(40,60,122,0.95)] lg:p-12">
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/60">
                MediNexus para profissionais
              </p>
              <h2 className="mt-4 max-w-4xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                Escolha um pacote e prepare sua operação para uma nova forma de
                receber pacientes.
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-white/75">
                Os pacotes foram pensados para médicos individuais e clínicas
                que querem estruturar presença digital e atendimento.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                href="/pacotes"
                className="inline-flex justify-center rounded-2xl bg-white px-7 py-4 text-sm font-black text-[#283C7A] transition hover:bg-slate-100"
              >
                Ver pacotes
              </Link>

              <Link
                href="/clinica/cadastro"
                className="inline-flex justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                Cadastrar clínica
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}