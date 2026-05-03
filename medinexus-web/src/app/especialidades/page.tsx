"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type SpecialtyRow = {
  id?: string;
  name: string;
  group_name: string | null;
};

const featuredGroups = [
  {
    group: "ClÃ­nicas gerais",
    title: "Cuidados essenciais",
    description:
      "Especialidades para acompanhamento inicial, rotina, prevenÃ§Ã£o e cuidado contÃ­nuo.",
  },
  {
    group: "Especialidades clÃ­nicas",
    title: "DiagnÃ³stico e acompanhamento",
    description:
      "Atendimento focado em condiÃ§Ãµes especÃ­ficas, acompanhamento clÃ­nico e investigaÃ§Ã£o mÃ©dica.",
  },
  {
    group: "Especialidades cirÃºrgicas",
    title: "AvaliaÃ§Ã£o especializada",
    description:
      "Especialidades voltadas para avaliaÃ§Ã£o, indicaÃ§Ã£o de procedimentos e acompanhamento prÃ© ou pÃ³s-operatÃ³rio.",
  },
  {
    group: "DiagnÃ³stico",
    title: "Apoio diagnÃ³stico",
    description:
      "Especialidades e Ã¡reas ligadas Ã  investigaÃ§Ã£o, exames e suporte Ã  decisÃ£o clÃ­nica.",
  },
  {
    group: "ReabilitaÃ§Ã£o",
    title: "RecuperaÃ§Ã£o e funcionalidade",
    description:
      "Cuidados para restaurar mobilidade, funÃ§Ã£o, autonomia e qualidade de vida.",
  },
];

const popularSpecialties = [
  "ClÃ­nica MÃ©dica",
  "Cardiologia",
  "Dermatologia",
  "Ginecologia e ObstetrÃ­cia",
  "Pediatria",
  "Ortopedia e Traumatologia",
  "Neurologia",
  "Psiquiatria",
  "Endocrinologia",
];

function normalizeGroup(groupName: string | null) {
  return groupName?.trim() || "Outras especialidades";
}

export default function EspecialidadesPage() {
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<SpecialtyRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Todas");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    loadSpecialties();
  }, []);

  async function loadSpecialties() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("medical_specialty_catalog")
      .select("name, group_name")
      .eq("is_active", true)
      .order("group_name", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      setMessage(`Erro ao carregar especialidades: ${error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setSpecialties((data || []) as SpecialtyRow[]);
    setLoading(false);
  }

  const groups = useMemo(() => {
    const unique = Array.from(
      new Set(specialties.map((item) => normalizeGroup(item.group_name)))
    );

    return ["Todas", ...unique.sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [specialties]);

  const filteredSpecialties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return specialties.filter((item) => {
      const group = normalizeGroup(item.group_name);

      const matchesGroup =
        selectedGroup === "Todas" || group === selectedGroup;

      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        group.toLowerCase().includes(query);

      return matchesGroup && matchesSearch;
    });
  }, [specialties, search, selectedGroup]);

  const groupedSpecialties = useMemo(() => {
    const map = new Map<string, SpecialtyRow[]>();

    for (const specialty of filteredSpecialties) {
      const group = normalizeGroup(specialty.group_name);
      const current = map.get(group) || [];
      current.push(specialty);
      map.set(group, current);
    }

    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [filteredSpecialties]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-slate-600">Carregando especialidades...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />
        <div className="absolute left-1/2 top-8 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#5A4C86]/10 blur-3xl" />

        <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pb-16 lg:pt-24">
          <div className="mx-auto max-w-5xl text-center">
            <p className="inline-flex rounded-full border border-[#164957]/15 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#164957] shadow-sm">
              Especialidades MediNexus
            </p>

            <h1 className="mt-7 text-5xl font-black leading-[0.92] tracking-[-0.075em] text-slate-950 sm:text-6xl lg:text-7xl">
              Encontre o tipo de atendimento certo para sua necessidade.
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-600">
              A MediNexus organiza especialidades mÃ©dicas para ajudar o paciente
              a buscar atendimento com mais clareza, seja por plano de saÃºde ou
              consulta particular.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/busca"
                className="inline-flex justify-center rounded-2xl bg-[#164957] px-8 py-4 text-sm font-black text-white shadow-[0_22px_60px_-30px_rgba(40,60,122,0.9)] transition hover:-translate-y-0.5 hover:bg-[#123B46]"
              >
                Buscar consulta
              </Link>

              <Link
                href="/clinicas"
                className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white/90 px-8 py-4 text-sm font-black text-[#5A4C86] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6F3FF]"
              >
                Ver clÃ­nicas
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-5">
            {featuredGroups.map((item) => (
              <article
                key={item.group}
                className="rounded-[32px] border border-[#E0E7FF] bg-white/85 p-6 shadow-[0_24px_80px_-66px_rgba(40,60,122,0.4)] backdrop-blur"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5A4C86]">
                  {item.group}
                </p>
                <h2 className="mt-4 text-2xl font-black tracking-[-0.05em] text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
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

        <div className="rounded-[38px] border border-[#D9D6F4] bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <label className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-[#164957]">
                Pesquisar especialidade
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#5A4C86] focus:bg-white"
                placeholder="Ex: cardiologia, pediatria, dermatologia..."
              />
            </div>

            <div className="lg:min-w-[280px]">
              <label className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-[#164957]">
                Grupo
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#5A4C86] focus:bg-white"
              >
                {groups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {popularSpecialties.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSearch(item)}
                className="rounded-full bg-[#F1F5FF] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#164957] transition hover:bg-[#E5ECFF]"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {groupedSpecialties.length === 0 ? (
          <div className="rounded-[34px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              Nenhuma especialidade encontrada
            </h2>
            <p className="mt-2 text-slate-600">
              Tente buscar por outro termo ou remover o filtro de grupo.
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {groupedSpecialties.map(([group, items]) => (
              <section key={group}>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-[#5A4C86]">
                      {group}
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">
                      {items.length} especialidade
                      {items.length === 1 ? "" : "s"}
                    </h2>
                  </div>

                  <Link
                    href="/busca"
                    className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-5 py-3 text-sm font-black text-[#5A4C86] transition hover:bg-[#F6F3FF]"
                  >
                    Buscar consulta
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((specialty) => (
                    <article
                      key={`${group}-${specialty.name}`}
                      className="group rounded-[30px] border border-[#E0E7FF] bg-white p-6 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)] transition hover:-translate-y-1 hover:border-[#5A4C86]/35"
                    >
                      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1F5FF] text-[#164957]">
                        +
                      </div>
                      <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                        {specialty.name}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Encontre mÃ©dicos e clÃ­nicas que atendem essa
                        especialidade dentro da MediNexus.
                      </p>

                      <Link
                        href="/busca"
                        className="mt-5 inline-flex rounded-2xl bg-[#F6F3FF] px-5 py-3 text-sm font-black text-[#5A4C86] transition group-hover:bg-[#5A4C86] group-hover:text-white"
                      >
                        Buscar agora
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
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
                JÃ¡ sabe qual especialidade procurar?
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-white/75">
                Complete sua busca com localizaÃ§Ã£o, plano ou particular e faixa
                de horÃ¡rio desejada.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                href="/busca"
                className="inline-flex justify-center rounded-2xl bg-white px-7 py-4 text-sm font-black text-[#164957] transition hover:bg-slate-100"
              >
                Buscar consulta
              </Link>

              <Link
                href="/clinicas"
                className="inline-flex justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                Ver clÃ­nicas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


