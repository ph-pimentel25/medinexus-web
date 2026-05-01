"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type PackageRow = {
  id: string;
  target_type: "doctor" | "clinic";
  name: string;
  subtitle: string | null;
  monthly_price_cents: number;
  yearly_price_cents: number | null;
  max_doctors: number | null;
  max_appointments_per_month: number | null;
  has_public_page: boolean | null;
  has_documents: boolean | null;
  has_ai_features: boolean | null;
  has_priority_support: boolean | null;
  display_order: number | null;
};

type BillingCycle = "monthly" | "yearly";
type AudienceFilter = "all" | "doctor" | "clinic";

const highlights = [
  {
    title: "Agenda inteligente",
    description:
      "Solicitações chegam com horário sugerido, considerando disponibilidade e duração média da consulta.",
  },
  {
    title: "Presença digital",
    description:
      "Clínicas e médicos ganham uma vitrine mais profissional dentro da jornada MediNexus.",
  },
  {
    title: "Documentos médicos",
    description:
      "Base para prontuário, anamnese, receituário, solicitações e histórico clínico do paciente.",
  },
];

const comparisonRows = [
  {
    feature: "Solicitações de pacientes",
    doctor: "Incluído",
    clinic: "Incluído",
  },
  {
    feature: "Confirmação de consulta",
    doctor: "1 clique",
    clinic: "Gestão da equipe",
  },
  {
    feature: "Página pública",
    doctor: "Perfil profissional",
    clinic: "Página institucional",
  },
  {
    feature: "Prontuário e documentos",
    doctor: "Incluído",
    clinic: "Incluído para equipe",
  },
  {
    feature: "Gestão de médicos",
    doctor: "Individual",
    clinic: "Múltiplos médicos",
  },
  {
    feature: "Suporte e crescimento",
    doctor: "Plano profissional",
    clinic: "Plano premium",
  },
];

function formatMoney(cents: number | null) {
  if (!cents) return "Sob consulta";

  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getYearlyEquivalentMonthly(yearlyCents: number | null) {
  if (!yearlyCents) return null;
  return Math.round(yearlyCents / 12);
}

function getPackageCta(item: PackageRow) {
  if (item.target_type === "clinic") {
    return {
      href: "/clinica/cadastro",
      label: "Cadastrar clínica",
    };
  }

  return {
    href: "/medico/cadastro",
    label: "Começar como médico",
  };
}

function getPackageTag(item: PackageRow) {
  const name = item.name.toLowerCase();

  if (name.includes("profissional") || name.includes("premium")) {
    return "Mais recomendado";
  }

  if (name.includes("start") || name.includes("essencial")) {
    return "Para começar";
  }

  return item.target_type === "clinic" ? "Para clínicas" : "Para médicos";
}

function getPackageDescription(item: PackageRow) {
  if (item.subtitle) return item.subtitle;

  if (item.target_type === "clinic") {
    return "Para clínicas que querem organizar solicitações, médicos, página pública e jornada digital.";
  }

  return "Para médicos que querem receber solicitações, confirmar consultas e atender com mais organização.";
}

function PackageFeature({
  label,
  active = true,
}: {
  label: string;
  active?: boolean | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-white/80">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${
          active
            ? "bg-[#283C7A] text-white"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        {active ? "✓" : "–"}
      </span>
      <span>{label}</span>
    </div>
  );
}

export default function PacotesPage() {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("all");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("medinexus_packages")
      .select(
        `
        id,
        target_type,
        name,
        subtitle,
        monthly_price_cents,
        yearly_price_cents,
        max_doctors,
        max_appointments_per_month,
        has_public_page,
        has_documents,
        has_ai_features,
        has_priority_support,
        display_order
      `
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      setMessage(`Erro ao carregar pacotes: ${error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setPackages((data || []) as PackageRow[]);
    setLoading(false);
  }

  const filteredPackages = useMemo(() => {
    if (audienceFilter === "all") return packages;
    return packages.filter((item) => item.target_type === audienceFilter);
  }, [packages, audienceFilter]);

  const doctorPackages = useMemo(
    () => packages.filter((item) => item.target_type === "doctor"),
    [packages]
  );

  const clinicPackages = useMemo(
    () => packages.filter((item) => item.target_type === "clinic"),
    [packages]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-slate-600">Carregando pacotes...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />
        <div className="absolute left-1/2 top-8 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#6E56CF]/10 blur-3xl" />

        <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pb-16 lg:pt-24">
          <div className="mx-auto max-w-5xl text-center">
            <p className="inline-flex rounded-full border border-[#283C7A]/15 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#283C7A] shadow-sm">
              Pacotes MediNexus
            </p>

            <h1 className="mt-7 text-5xl font-black leading-[0.92] tracking-[-0.075em] text-slate-950 sm:text-6xl lg:text-7xl">
              Planos para médicos e clínicas entrarem na nova jornada digital da saúde.
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-600">
              Escolha o pacote ideal para receber solicitações qualificadas,
              organizar agenda, confirmar consultas, usar prontuário e construir
              presença digital dentro da MediNexus.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/clinica/cadastro"
                className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-8 py-4 text-sm font-black text-white shadow-[0_22px_60px_-30px_rgba(40,60,122,0.9)] transition hover:-translate-y-0.5 hover:bg-[#213366]"
              >
                Cadastrar clínica
              </Link>

              <Link
                href="/sobre"
                className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white/90 px-8 py-4 text-sm font-black text-[#5E4B9A] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6F3FF]"
              >
                Entender a plataforma
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-[34px] border border-[#E0E7FF] bg-white/85 p-7 shadow-[0_24px_80px_-66px_rgba(40,60,122,0.4)] backdrop-blur"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F5FF] text-[#283C7A]">
                  ✓
                </div>
                <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-3 leading-7 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 rounded-[34px] border border-[#D9D6F4] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "Todos" },
              { value: "doctor", label: "Médicos" },
              { value: "clinic", label: "Clínicas" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setAudienceFilter(item.value as AudienceFilter)}
                className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
                  audienceFilter === item.value
                    ? "bg-[#283C7A] text-white"
                    : "bg-[#F1F5FF] text-[#283C7A] hover:bg-[#E5ECFF]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-2xl bg-[#F6F3FF] p-1">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-xl px-5 py-2 text-sm font-black transition ${
                billingCycle === "monthly"
                  ? "bg-white text-[#283C7A] shadow-sm"
                  : "text-[#6E56CF]"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-xl px-5 py-2 text-sm font-black transition ${
                billingCycle === "yearly"
                  ? "bg-white text-[#283C7A] shadow-sm"
                  : "text-[#6E56CF]"
              }`}
            >
              Anual
            </button>
          </div>
        </div>

        {filteredPackages.length === 0 ? (
          <div className="rounded-[34px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              Nenhum pacote encontrado
            </h2>
            <p className="mt-2 text-slate-600">
              Ainda não há pacotes ativos para esse filtro.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredPackages.map((item) => {
              const cta = getPackageCta(item);
              const tag = getPackageTag(item);
              const isRecommended =
                tag === "Mais recomendado" ||
                item.name.toLowerCase().includes("premium");

              const yearlyMonthly = getYearlyEquivalentMonthly(
                item.yearly_price_cents
              );

              const displayPrice =
                billingCycle === "yearly" && yearlyMonthly
                  ? yearlyMonthly
                  : item.monthly_price_cents;

              return (
                <article
                  key={item.id}
                  className={`relative overflow-hidden rounded-[42px] border p-8 shadow-[0_30px_100px_-70px_rgba(40,60,122,0.55)] ${
                    isRecommended
                      ? "border-[#6E56CF]/30 bg-gradient-to-br from-[#F6F3FF] to-[#F1F5FF]"
                      : "border-[#E0E7FF] bg-white"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute right-6 top-6 rounded-full bg-[#6E56CF] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-sm">
                      Recomendado
                    </div>
                  )}

                  <div className="pr-0 sm:pr-32">
                    <p className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#5E4B9A] ring-1 ring-[#D9D6F4]">
                      {item.target_type === "doctor" ? "Médico" : "Clínica"} •{" "}
                      {tag}
                    </p>

                    <h2 className="mt-5 text-4xl font-black tracking-[-0.06em] text-slate-950">
                      {item.name}
                    </h2>

                    <p className="mt-4 min-h-[64px] leading-7 text-slate-600">
                      {getPackageDescription(item)}
                    </p>
                  </div>

                  <div className="mt-7 rounded-[30px] border border-white/80 bg-white/80 p-6 shadow-sm">
                    <p className="text-sm font-bold text-slate-500">
                      Investimento
                    </p>

                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <p className="text-5xl font-black tracking-[-0.06em] text-[#283C7A]">
                        {formatMoney(displayPrice)}
                      </p>
                      <p className="pb-2 text-sm font-bold text-slate-500">
                        /mês
                      </p>
                    </div>

                    {billingCycle === "yearly" && item.yearly_price_cents && (
                      <p className="mt-2 text-sm font-semibold text-[#6E56CF]">
                        Cobrança anual de {formatMoney(item.yearly_price_cents)}
                      </p>
                    )}

                    {billingCycle === "monthly" && item.yearly_price_cents && (
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        Plano anual disponível com valor otimizado.
                      </p>
                    )}
                  </div>

                  <div className="mt-6 grid gap-3">
                    <PackageFeature
                      label={`Até ${
                        item.max_doctors || "múltiplos"
                      } médico(s)`}
                    />
                    <PackageFeature
                      label={`Até ${
                        item.max_appointments_per_month || "várias"
                      } consultas/mês`}
                    />
                    <PackageFeature
                      label="Página pública na MediNexus"
                      active={item.has_public_page}
                    />
                    <PackageFeature
                      label="Prontuário e documentos médicos"
                      active={item.has_documents}
                    />
                    <PackageFeature
                      label="Recursos inteligentes e IA futura"
                      active={item.has_ai_features}
                    />
                    <PackageFeature
                      label="Suporte prioritário"
                      active={item.has_priority_support}
                    />
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Link
                      href={cta.href}
                      className={`inline-flex justify-center rounded-2xl px-6 py-4 text-sm font-black transition ${
                        isRecommended
                          ? "bg-[#6E56CF] text-white hover:bg-[#5E4B9A]"
                          : "bg-[#283C7A] text-white hover:bg-[#213366]"
                      }`}
                    >
                      {cta.label}
                    </Link>

                    <Link
                      href="/sobre"
                      className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-6 py-4 text-sm font-black text-[#5E4B9A] transition hover:bg-[#F6F3FF]"
                    >
                      Saber mais
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[46px] bg-slate-950 shadow-[0_35px_120px_-70px_rgba(15,23,42,0.95)]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-gradient-to-br from-[#283C7A] to-[#6E56CF] p-8 text-white lg:p-12">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/60">
                Comparativo
              </p>
              <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.06em]">
                Médico individual ou clínica completa: a MediNexus acompanha os dois cenários.
              </h2>
              <p className="mt-5 leading-8 text-white/75">
                Comece com o que faz sentido hoje e evolua conforme sua operação
                cresce.
              </p>
            </div>

            <div className="p-6 lg:p-8">
              <div className="grid gap-3">
                {comparisonRows.map((row) => (
                  <div
                    key={row.feature}
                    className="grid gap-3 rounded-[26px] border border-white/10 bg-white/[0.06] p-5 text-white md:grid-cols-[1.1fr_0.95fr_0.95fr]"
                  >
                    <p className="font-black">{row.feature}</p>
                    <p className="text-sm font-semibold text-white/75">
                      Médico: {row.doctor}
                    </p>
                    <p className="text-sm font-semibold text-white/75">
                      Clínica: {row.clinic}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-[42px] border border-[#E0E7FF] bg-white p-8 shadow-[0_24px_80px_-66px_rgba(40,60,122,0.45)]">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#283C7A]">
            Para médicos
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950">
            Receba solicitações melhores e confirme consultas com menos atrito.
          </h2>
          <p className="mt-5 leading-8 text-slate-600">
            Ideal para profissionais que querem organizar solicitações, reduzir
            mensagens dispersas e atender com prontuário integrado.
          </p>

          <div className="mt-7">
            <Link
              href="/medico/cadastro"
              className="inline-flex rounded-2xl bg-[#283C7A] px-7 py-4 text-sm font-black text-white transition hover:bg-[#213366]"
            >
              Começar como médico
            </Link>
          </div>
        </div>

        <div className="rounded-[42px] border border-[#D9D6F4] bg-gradient-to-br from-[#F6F3FF] to-[#F1F5FF] p-8 shadow-[0_24px_80px_-66px_rgba(94,75,154,0.45)]">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6E56CF]">
            Para clínicas
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950">
            Estruture sua operação digital com médicos, planos e página pública.
          </h2>
          <p className="mt-5 leading-8 text-slate-600">
            Ideal para clínicas que querem receber pacientes com mais contexto,
            organizar agenda e criar presença digital dentro da MediNexus.
          </p>

          <div className="mt-7">
            <Link
              href="/clinica/cadastro"
              className="inline-flex rounded-2xl bg-[#6E56CF] px-7 py-4 text-sm font-black text-white transition hover:bg-[#5E4B9A]"
            >
              Cadastrar clínica
            </Link>
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
                Próxima etapa
              </p>
              <h2 className="mt-4 max-w-4xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                Em breve, esses pacotes poderão liberar acesso automaticamente após pagamento.
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-white/75">
                A base comercial já está pronta para evoluir para assinatura,
                checkout, liberação de recursos e gestão financeira.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                href="/clinica/cadastro"
                className="inline-flex justify-center rounded-2xl bg-white px-7 py-4 text-sm font-black text-[#283C7A] transition hover:bg-slate-100"
              >
                Cadastrar clínica
              </Link>

              <Link
                href="/sobre"
                className="inline-flex justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                Ver visão do produto
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}