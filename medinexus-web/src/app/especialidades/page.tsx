"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type SpecialtyRow = {
  id: string;
  name: string | null;
};

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getSpecialtyName(item: SpecialtyRow) {
  return item.name || "Especialidade";
}

export default function EspecialidadesPage() {
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<SpecialtyRow[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSpecialties();
  }, []);

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

  const filteredSpecialties = useMemo(() => {
    const normalizedQuery = normalize(query);

    return specialties.filter((item) => {
      const searchable = normalize(getSpecialtyName(item));
      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [specialties, query]);

  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F]">
      <section className="relative overflow-hidden border-b border-[#E7DDD7]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(122,157,140,0.25),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(90,76,134,0.20),transparent_32%)]" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
          <div className="max-w-5xl">
            <div className="mb-7 inline-flex rounded-full border border-[#D8CCC5] bg-white/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#164957] shadow-sm backdrop-blur-xl">
              Especialidades
            </div>

            <h1 className="max-w-6xl text-[4rem] font-semibold leading-[0.92] tracking-[-0.075em] text-[#2E393F] sm:text-[5.6rem] lg:text-[7rem]">
              Encontre o cuidado certo para cada necessidade.
            </h1>

            <p className="mt-8 max-w-3xl text-xl leading-9 text-[#2E393F]/70">
              Navegue pelas especialidades disponíveis e encontre profissionais
              ou clínicas que fazem parte da rede MediNexus.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/profissionais"
                className="rounded-full bg-[#164957] px-8 py-4 text-sm font-semibold text-white shadow-[0_24px_80px_-42px_rgba(22,73,87,0.85)] transition hover:-translate-y-0.5 hover:bg-[#123B46]"
              >
                Ver profissionais
              </Link>

              <Link
                href="/clinicas"
                className="rounded-full border border-[#D8CCC5] bg-white/70 px-8 py-4 text-sm font-semibold text-[#2E393F] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
              >
                Ver clínicas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-12 sm:px-10 lg:px-14">
        {message && (
          <div className="mb-6 rounded-[1.4rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-[#E7DDD7] bg-white/70 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
              Especialidades
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#2E393F]">
              {specialties.length}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#E7DDD7] bg-white/70 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
              Resultado atual
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#5A4C86]">
              {filteredSpecialties.length}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[2.4rem] border border-[#E7DDD7] bg-white/70 p-5 shadow-sm backdrop-blur">
          <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
            Buscar especialidade
          </label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busque por cardiologia, dermatologia, ortopedia..."
            className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/40 focus:border-[#164957] focus:bg-white"
          />
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="rounded-[2.4rem] border border-[#E7DDD7] bg-white/70 p-8 text-sm text-[#2E393F]/60 shadow-sm backdrop-blur">
              Carregando especialidades...
            </div>
          ) : filteredSpecialties.length === 0 ? (
            <div className="rounded-[2.4rem] border border-[#E7DDD7] bg-white/70 p-12 text-center shadow-sm backdrop-blur">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#2E393F]">
                Nenhuma especialidade encontrada
              </h2>
              <p className="mt-3 text-sm text-[#2E393F]/60">
                Tente ajustar o termo pesquisado.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredSpecialties.map((item, index) => (
                <article
                  key={item.id}
                  className="group rounded-[2.2rem] border border-[#E7DDD7] bg-white/72 p-7 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_30px_90px_-65px_rgba(46,57,63,0.65)]"
                >
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#164957] text-sm font-semibold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <span className="rounded-full bg-[#EEF3EF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#164957]">
                      Área médica
                    </span>
                  </div>

                  <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[#2E393F]">
                    {getSpecialtyName(item)}
                  </h2>

                  <p className="mt-4 text-sm leading-7 text-[#2E393F]/66">
                    Encontre profissionais e clínicas relacionados a essa área
                    dentro da rede MediNexus.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href="/profissionais"
                      className="rounded-full bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
                    >
                      Ver profissionais
                    </Link>

                    <Link
                      href="/clinicas"
                      className="rounded-full border border-[#D8CCC5] bg-white/70 px-5 py-3 text-sm font-semibold text-[#2E393F] transition hover:bg-white"
                    >
                      Ver clínicas
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}