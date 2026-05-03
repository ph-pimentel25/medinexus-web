"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type ClinicRow = {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  city: string | null;
  state: string | null;
  address_city: string | null;
  address_state: string | null;
  address_neighborhood: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getClinicName(item: ClinicRow) {
  return item.trade_name || item.legal_name || "Clínica";
}

function getClinicLocation(item: ClinicRow) {
  const parts = [
    item.address_neighborhood,
    item.address_city || item.city,
    item.address_state || item.state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Localização não informada";
}

function getFullAddress(item: ClinicRow) {
  const streetLine = [item.address_street, item.address_number]
    .filter(Boolean)
    .join(", ");

  const parts = [
    streetLine,
    item.address_complement,
    item.address_neighborhood,
    item.address_city || item.city,
    item.address_state || item.state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Endereço não informado";
}

function getClinicDescription(item: ClinicRow) {
  return (
    item.description ||
    "Clínica cadastrada na plataforma MediNexus para conectar pacientes, profissionais e atendimentos em uma jornada mais organizada."
  );
}

export default function ClinicasPage() {
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadClinics();
  }, []);

  async function loadClinics() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("clinics")
      .select(
        "id, trade_name, legal_name, description, phone, email, city, state, address_city, address_state, address_neighborhood, address_street, address_number, address_complement, is_active, created_at"
      )
      .order("trade_name", { ascending: true });

    if (error) {
      setMessage(`Erro ao carregar clínicas: ${error.message}`);
      setClinics([]);
      setLoading(false);
      return;
    }

    const safeClinics = ((data || []) as ClinicRow[]).filter(
      (item) => item.is_active !== false
    );

    setClinics(safeClinics);
    setLoading(false);
  }

  const cities = useMemo(() => {
    const unique = new Set(
      clinics
        .map((item) => item.address_city || item.city)
        .filter(Boolean)
        .map((item) => String(item))
    );

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [clinics]);

  const filteredClinics = useMemo(() => {
    const normalizedQuery = normalize(query);

    return clinics.filter((item) => {
      const city = item.address_city || item.city || "";

      const searchable = normalize(
        [
          getClinicName(item),
          getClinicLocation(item),
          getFullAddress(item),
          getClinicDescription(item),
          item.email,
          item.phone,
        ].join(" ")
      );

      const matchesQuery =
        !normalizedQuery || searchable.includes(normalizedQuery);

      const matchesCity = cityFilter === "all" || city === cityFilter;

      return matchesQuery && matchesCity;
    });
  }, [clinics, query, cityFilter]);

  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F]">
      <section className="relative overflow-hidden border-b border-[#E7DDD7]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(122,157,140,0.25),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(90,76,134,0.20),transparent_32%)]" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
          <div className="max-w-5xl">
            <div className="mb-7 inline-flex rounded-full border border-[#D8CCC5] bg-white/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#164957] shadow-sm backdrop-blur-xl">
              Rede MediNexus
            </div>

            <h1 className="max-w-6xl text-[4rem] font-semibold leading-[0.92] tracking-[-0.075em] text-[#2E393F] sm:text-[5.6rem] lg:text-[7rem]">
              Clínicas para uma jornada de saúde mais conectada.
            </h1>

            <p className="mt-8 max-w-3xl text-xl leading-9 text-[#2E393F]/70">
              Encontre clínicas cadastradas na MediNexus e escolha onde iniciar
              seu atendimento com mais clareza, organização e confiança.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/profissionais"
                className="rounded-full bg-[#164957] px-8 py-4 text-sm font-semibold text-white shadow-[0_24px_80px_-42px_rgba(22,73,87,0.85)] transition hover:-translate-y-0.5 hover:bg-[#123B46]"
              >
                Ver profissionais
              </Link>

              <Link
                href="/cadastro"
                className="rounded-full border border-[#D8CCC5] bg-white/70 px-8 py-4 text-sm font-semibold text-[#2E393F] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
              >
                Criar conta
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

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] border border-[#E7DDD7] bg-white/70 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
              Clínicas
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#2E393F]">
              {clinics.length}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#E7DDD7] bg-white/70 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
              Cidades
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#164957]">
              {cities.length}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#E7DDD7] bg-white/70 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
              Resultado
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#5A4C86]">
              {filteredClinics.length}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[2.4rem] border border-[#E7DDD7] bg-white/70 p-5 shadow-sm backdrop-blur">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                Buscar clínica
              </label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busque por nome, bairro, cidade, telefone ou descrição"
                className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-[#2E393F] outline-none transition placeholder:text-[#2E393F]/40 focus:border-[#164957] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2E393F]">
                Cidade
              </label>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-[#2E393F] outline-none transition focus:border-[#164957] focus:bg-white"
              >
                <option value="all">Todas as cidades</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          {loading ? (
            <div className="rounded-[2.4rem] border border-[#E7DDD7] bg-white/70 p-8 text-sm text-[#2E393F]/60 shadow-sm backdrop-blur">
              Carregando clínicas...
            </div>
          ) : filteredClinics.length === 0 ? (
            <div className="rounded-[2.4rem] border border-[#E7DDD7] bg-white/70 p-12 text-center shadow-sm backdrop-blur">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#2E393F]">
                Nenhuma clínica encontrada
              </h2>
              <p className="mt-3 text-sm text-[#2E393F]/60">
                Tente ajustar sua busca ou selecionar outra cidade.
              </p>
            </div>
          ) : (
            filteredClinics.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[2.4rem] border border-[#E7DDD7] bg-white/72 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_30px_90px_-65px_rgba(46,57,63,0.65)]"
              >
                <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
                  <div className="p-7">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EEF3EF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#164957]">
                        Clínica
                      </span>

                      <span className="rounded-full bg-[#F0EDF7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5A4C86]">
                        Ativa
                      </span>
                    </div>

                    <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[#2E393F]">
                      {getClinicName(item)}
                    </h2>

                    <p className="mt-2 text-sm font-medium text-[#164957]">
                      {getClinicLocation(item)}
                    </p>

                    <p className="mt-4 max-w-3xl text-sm leading-7 text-[#2E393F]/66">
                      {getClinicDescription(item)}
                    </p>

                    <div className="mt-5 border-t border-[#E7DDD7] pt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A9D8C]">
                        Endereço
                      </p>

                      <p className="mt-2 text-sm leading-7 text-[#2E393F]/62">
                        {getFullAddress(item)}
                      </p>
                    </div>

                    {(item.phone || item.email) && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {item.phone && (
                          <span className="rounded-full border border-[#E7DDD7] bg-[#FAF6F3] px-4 py-2 text-sm font-medium text-[#2E393F]/70">
                            {item.phone}
                          </span>
                        )}

                        {item.email && (
                          <span className="rounded-full border border-[#E7DDD7] bg-[#FAF6F3] px-4 py-2 text-sm font-medium text-[#2E393F]/70">
                            {item.email}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between border-t border-[#E7DDD7] bg-[#FAF6F3]/75 p-7 lg:border-l lg:border-t-0">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
                        MediNexus
                      </p>

                      <p className="mt-3 text-lg font-semibold leading-7 tracking-[-0.035em] text-[#2E393F]">
                        Veja profissionais vinculados e inicie sua jornada pela
                        plataforma.
                      </p>
                    </div>

                    <div className="mt-8 grid gap-3">
                      <Link
                        href={`/clinicas/${item.id}`}
                        className="rounded-full bg-[#164957] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#123B46]"
                      >
                        Ver clínica
                      </Link>

                      <Link
                        href="/profissionais"
                        className="rounded-full border border-[#D8CCC5] bg-white/70 px-5 py-3 text-center text-sm font-semibold text-[#2E393F] transition hover:bg-white"
                      >
                        Ver profissionais
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}