"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  FlaskConical,
  Heart,
  HelpCircle,
  Search,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type SpecialtyRow = {
  id: string;
  name: string | null;
};

type SpecialtyDetail = {
  category: string;
  description: string;
  symptoms: string[];
  exams: string[];
  iconName?: string;
};

const SPECIALTY_DATA: Record<string, SpecialtyDetail> = {
  Cardiologia: {
    category: "Cardiovascular",
    description: "Diagnóstico e tratamento de doenças do coração, pressão arterial e sistema circulatório.",
    symptoms: ["Dor ou aperto no peito", "Palpitações e arritmias", "Falta de ar ao esforço", "Pressão alta"],
    exams: ["Eletrocardiograma (ECG)", "Ecocardiograma", "Holter 24h", "MAPA", "Teste Ergométrico"],
  },
  Dermatologia: {
    category: "Pele & Estética",
    description: "Cuidados clínicos e cirúrgicos com a pele, cabelos, unhas e prevenção de lesões dermatológicas.",
    symptoms: ["Manchas ou pintas suspeitas", "Acne e oleosidade excessiva", "Coceiras e alergias", "Queda de cabelo"],
    exams: ["Dermatoscopia", "Biópsia de pele", "Mapeamento corporal de nevos"],
  },
  Ortopedia: {
    category: "Músculo-Esquelético",
    description: "Tratamento de fraturas, dores articulares, lesões musculares e postura da coluna.",
    symptoms: ["Dor nas costas ou coluna", "Dores nos joelhos e ombros", "Lesões pós-esporte", "Dificuldade de locomoção"],
    exams: ["Raio-X digital", "Ressonância Magnética", "Tomografia Computadorizada", "Densitometria Óssea"],
  },
  "Ortopedia e Traumatologia": {
    category: "Músculo-Esquelético",
    description: "Tratamento de traumas agudos, fraturas ósseas, ligamentos e deformidades articulares.",
    symptoms: ["Traumas e entorses", "Dor articular persistente", "Desvios na coluna", "Limitação de movimento"],
    exams: ["Raio-X", "Ressonância Magnética", "Tomografia"],
  },
  Pediatria: {
    category: "Cuidado Geral",
    description: "Acompanhamento do desenvolvimento infantil, puericultura, vacinas e doenças da infância.",
    symptoms: ["Febre persistente", "Dificuldade alimentar", "Tosse e chiado no peito", "Acompanhamento de crescimento"],
    exams: ["Hemograma pediátrico", "Exame de urina", "Avaliação de desenvolvimento"],
  },
  Ginecologia: {
    category: "Saúde da Mulher",
    description: "Saúde preventiva da mulher, ciclo menstrual, anticoncepção, menopausa e rastreamento.",
    symptoms: ["Cólicas intensas", "Alterações menstruais", "Prevenção anual", "Dores pélvicas"],
    exams: ["Papanicolau (preventivo)", "Ultrassom transvaginal", "Mamografia", "Ultrassom de mamas"],
  },
  "Ginecologia e Obstetrícia": {
    category: "Saúde da Mulher",
    description: "Acompanhamento pré-natal completo, parto, puerpério e saúde integral do aparelho reprodutor feminino.",
    symptoms: ["Planejamento gestacional", "Pré-natal e ultrassons", "Sintomas da menopausa"],
    exams: ["Ultrassonografia obstétrica e morfológica", "Curva glicêmica", "Perfil sorológico"],
  },
  Neurologia: {
    category: "Sistema Nervoso",
    description: "Diagnóstico e tratamento de doenças do cérebro, medula, nervos e dores de cabeça.",
    symptoms: ["Enxaquecas e cefaleias", "Tonturas e vertigens", "Perda de memória", "Formigamentos ou convulsões"],
    exams: ["Ressonância de Crânio", "Eletroencefalograma (EEG)", "Tomografia de Crânio"],
  },
  Psiquiatria: {
    category: "Saúde Mental",
    description: "Tratamento de transtornos do humor, ansiedade, depressão, sono e saúde mental integrada.",
    symptoms: ["Ansiedade e pânico", "Insônia frequente", "Tristeza profunda ou apatia", "Oscilações de humor"],
    exams: ["Avaliação clínica psiquiátrica", "Exames hormonais e tireoidianos"],
  },
  Endocrinologia: {
    category: "Metabólico",
    description: "Cuidados com hormônios, tireoide, diabetes, metabolismo e peso corporal.",
    symptoms: ["Cansaço crônico", "Glicose alta ou diabetes", "Alterações de tireoide", "Dificuldade na perda de peso"],
    exams: ["Glicemia e Hemoglobina Glicada", "TSH e T4 Livre", "Perfil Lipídico", "Cortisol"],
  },
  Oftalmologia: {
    category: "Sentidos",
    description: "Saúde da visão, refração (grau de óculos), catarata, glaucoma e cirurgias oculares.",
    symptoms: ["Visão embaçada ou cansada", "Dores de cabeça ao ler", "Olhos secos ou irritados"],
    exams: ["Mapeamento de Retina", "Tonometria (pressão intraocular)", "Refração completa"],
  },
  Otorrinolaringologia: {
    category: "Sentidos",
    description: "Doenças do ouvido, nariz, seios da face, garganta, equilíbrio e voz.",
    symptoms: ["Zumbido no ouvido", "Rinite e sinusite crônicas", "Rouquidão prolongada", "Ronco e apneia"],
    exams: ["Videonasolaringoscopia", "Audiometria tonal e vocal", "Impedanciometria"],
  },
  Gastroenterologia: {
    category: "Aparelho Digestivo",
    description: "Tratamento de problemas digestivos, estômago, fígado, intestino e vesícula biliar.",
    symptoms: ["Azia e refluxo ácido", "Dor ou queimação abdominal", "Alterações no hábito intestinal", "Inchaço"],
    exams: ["Endoscopia Digestiva Alta", "Colonoscopia", "Ultrassom de Abdome Total"],
  },
  Urologia: {
    category: "Saúde do Homem & Urinário",
    description: "Saúde do trato urinário feminino e masculino, cálculo renal e saúde da próstata.",
    symptoms: ["Dor ao urinar", "Dificuldade no fluxo urinário", "Cálculos renais (pedra nos rins)", "Check-up da próstata"],
    exams: ["PSA total e livre", "Ultrassom de Vias Urinárias e Próstata", "Urofluxometria"],
  },
  "Clínica Geral": {
    category: "Cuidado Geral",
    description: "Visão abrangente e integrada da saúde do adulto, check-ups anuais e encaminhamento preciso.",
    symptoms: ["Check-up preventivo anual", "Mal-estar indefinido", "Fadiga ou perda de peso", "Avaliação de exames"],
    exams: ["Check-up laboratorial completo", "Eletrocardiograma", "Ultrassonografia preventiva"],
  },
  Reumatologia: {
    category: "Músculo-Esquelético",
    description: "Doenças autoimunes, inflamações crônicas articulares, fibromialgia e osteoporose.",
    symptoms: ["Dores articulares com rigidez matinal", "Inchaço nas mãos ou pés", "Dores generalizadas no corpo"],
    exams: ["Fator Reumatoide", "FAN (Fator Antinúcleo)", "VHS e PCR", "Densitometria Óssea"],
  },
  Pneumologia: {
    category: "Cardiovascular & Pulmonar",
    description: "Tratamento de doenças respiratórias, asma, bronquite crônica, tosse persistente e enfisema.",
    symptoms: ["Falta de ar", "Tosse crônica persistente", "Chiado no peito", "Cansaço aos mínimos esforços"],
    exams: ["Espirometria (Prova de Função Pulmonar)", "Raio-X de Tórax", "Tomografia de Tórax"],
  },
};

const CATEGORIES = [
  "Todas",
  "Cuidado Geral",
  "Cardiovascular",
  "Músculo-Esquelético",
  "Saúde da Mulher",
  "Saúde Mental",
  "Sistema Nervoso",
  "Pele & Estética",
  "Sentidos",
  "Aparelho Digestivo",
];

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function EspecialidadesPage() {
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<SpecialtyRow[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [message, setMessage] = useState("");

  async function loadSpecialties() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("specialties")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      setMessage(`Erro ao carregar especialidades: ${error.message}`);
      setSpecialties([]);
      setLoading(false);
      return;
    }

    setSpecialties((data || []) as SpecialtyRow[]);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(() => void loadSpecialties(), 0);
    return () => clearTimeout(t);
  }, []);

  const filteredSpecialties = useMemo(() => {
    const nq = normalize(query);

    return specialties.filter((s) => {
      const name = s.name || "";
      const details = SPECIALTY_DATA[name];

      // Filtro de Categoria
      if (selectedCategory !== "Todas" && details?.category !== selectedCategory) {
        return false;
      }

      if (!nq) return true;

      const matchName = normalize(name).includes(nq);
      const matchDesc = details ? normalize(details.description).includes(nq) : false;
      const matchSymptoms = details
        ? details.symptoms.some((sym) => normalize(sym).includes(nq))
        : false;

      return matchName || matchDesc || matchSymptoms;
    });
  }, [specialties, query, selectedCategory]);

  return (
    <main className="min-h-screen bg-mn-sand text-mn-graphite">
      {/* Hero da Página de Especialidades */}
      <section className="relative overflow-hidden border-b border-mn-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(122,157,140,0.25),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(90,76,134,0.20),transparent_32%)] pointer-events-none" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mn-border bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-mn-teal shadow-sm backdrop-blur-xl">
              <Stethoscope size={14} className="text-mn-teal" />
              <span>Guia Médico & Especialidades</span>
            </div>

            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-mn-graphite sm:text-6xl lg:text-[4.75rem]">
              Encontre o especialista ideal para seus sintomas e necessidades.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-mn-graphite/75 sm:text-xl">
              Explore o guia clínico da MediNexus. Entenda o que cada especialista trata, quais sintomas indicam a
              necessidade de consulta e agende diretamente na rede credenciada.
            </p>

            {/* Barra de Busca por Sintoma ou Especialidade */}
            <div className="mt-10 max-w-2xl">
              <div className="relative flex items-center rounded-2xl border border-mn-border bg-white shadow-md focus-within:border-mn-teal focus-within:ring-2 focus-within:ring-mn-teal/20">
                <Search size={22} className="ml-5 text-mn-teal shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busque por sintoma (ex: dor nas costas, enxaqueca) ou especialidade..."
                  className="w-full rounded-2xl bg-transparent px-4 py-4 text-sm text-mn-graphite placeholder:text-mn-graphite/45 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mr-4 rounded-lg px-2 py-1 text-xs font-semibold text-mn-graphite/60 hover:text-mn-graphite"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-mn-graphite/60 pl-2">
                Dica: Digite o sintoma que você está sentindo para encontrar a especialidade recomendada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros em Pílula por Categoria */}
      <section className="border-b border-mn-border bg-white/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="mx-auto max-w-[1500px] px-6 py-4 sm:px-10 lg:px-14">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition shrink-0 ${
                    active
                      ? "bg-mn-teal text-white shadow-sm"
                      : "border border-mn-border bg-white text-mn-graphite hover:border-mn-teal/40"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid de Especialidades com Fichas Clínicas Detalhadas */}
      <section className="mx-auto max-w-[1500px] px-6 py-16 sm:px-10 lg:px-14">
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-sm font-semibold text-mn-graphite/60">Carregando catálogo de especialidades...</p>
          </div>
        ) : filteredSpecialties.length === 0 ? (
          <div className="rounded-3xl border border-mn-border bg-white p-12 text-center max-w-xl mx-auto shadow-sm">
            <Stethoscope size={36} className="mx-auto text-mn-teal/50 mb-3" />
            <h2 className="text-lg font-bold text-mn-graphite">Nenhuma especialidade encontrada</h2>
            <p className="text-xs text-mn-graphite/70 mt-1 mb-6">
              Não encontramos resultados para &ldquo;{query}&rdquo;. Experimente buscar por termos mais gerais ou use o
              Assistente Virtual IA.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedCategory("Todas");
              }}
              className="rounded-full bg-mn-teal px-6 py-2.5 text-xs font-bold text-white"
            >
              Ver todas as especialidades
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpecialties.map((item) => {
              const name = item.name || "Especialidade";
              const detail = SPECIALTY_DATA[name] || {
                category: "Medicina Geral",
                description: "Avaliação clínica especializada e acompanhamento dedicado na rede MediNexus.",
                symptoms: ["Avaliação diagnóstica", "Acompanhamento preventivo"],
                exams: ["Exames laboratoriais e diagnósticos"],
              };

              return (
                <article
                  key={item.id}
                  className="flex flex-col rounded-3xl border border-mn-border bg-white p-7 transition hover:-translate-y-1 hover:border-mn-teal/40 hover:shadow-lg shadow-sm"
                >
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex rounded-full bg-mn-sand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-mn-teal border border-mn-border">
                        {detail.category}
                      </span>
                      <h2 className="mt-3 text-2xl font-black text-mn-graphite tracking-tight">{name}</h2>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mn-sand text-mn-teal">
                      <Stethoscope size={22} />
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-mn-graphite/75 min-h-[40px]">{detail.description}</p>

                  <div className="my-5 h-px bg-mn-border/80" />

                  {/* Sintomas Comuns */}
                  <div className="space-y-2 mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-mn-teal">
                      Quando procurar consulta:
                    </p>
                    <ul className="space-y-1.5">
                      {detail.symptoms.slice(0, 3).map((sym) => (
                        <li key={sym} className="flex items-center gap-2 text-xs text-mn-graphite/80">
                          <CheckCircle2 size={13} className="text-mn-teal shrink-0" />
                          <span className="line-clamp-1">{sym}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Exames Comuns */}
                  <div className="space-y-2 mb-6 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-mn-graphite/50">
                      Exames frequentemente solicitados:
                    </p>
                    <p className="text-xs text-mn-graphite/70 leading-relaxed">
                      {detail.exams.join(" · ")}
                    </p>
                  </div>

                  {/* Botão de Agendar / Buscar esta Especialidade */}
                  <Link
                    href={`/descobrir?query=${encodeURIComponent(name)}`}
                    className="inline-flex h-12 items-center justify-between rounded-2xl bg-mn-sand px-5 text-xs font-bold text-mn-teal transition hover:bg-mn-teal hover:text-white group"
                  >
                    <span>Encontrar médicos de {name}</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Banner de Ajuda com IA */}
      <section className="border-t border-mn-border bg-white/60 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center sm:px-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mn-teal text-white mb-4 shadow-md">
            <Sparkles size={22} className="text-mn-sage-light" />
          </div>
          <h2 className="text-2xl font-black text-mn-graphite sm:text-3xl">
            Ainda em dúvida sobre qual especialista procurar?
          </h2>
          <p className="mt-3 text-sm text-mn-graphite/75 max-w-xl mx-auto leading-relaxed">
            Nossa Assistente Virtual IA está disponível no canto inferior da tela para orientar você com base nos
            seus sintomas e conectar você ao médico certo.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/descobrir"
              className="rounded-full bg-mn-teal px-8 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#123B46]"
            >
              Ir para busca geral de profissionais
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}