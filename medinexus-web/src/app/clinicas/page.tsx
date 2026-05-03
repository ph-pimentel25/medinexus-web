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
  return item.trade_name || item.legal_name || "ClÃ­nica";
}

function getClinicLocation(item: ClinicRow) {
  const parts = [
    item.address_neighborhood,
    item.address_city || item.city,
    item.address_state || item.state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" â€¢ ") : "LocalizaÃ§Ã£o nÃ£o informada";
}

function getClinicDescription(item: ClinicRow) {
  return (
    item.description ||
    "ClÃ­nica cadastrada na plataforma MediNexus para conexÃ£o entre pacientes, mÃ©dicos e atendimentos."
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
        "id, trade_name, legal_name, description, phone, email, city, state, address_city, address_state, address_neighborhood, is_active, created_at"
      )
      .order("trade_name", { ascending: true });

    if (error) {
      setMessage(`Erro ao carregar clÃ­nicas: ${error.message}`);
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
    <main className="min-h-screen bg-[#FAF6F3]">
      <section className="border-b border-[#E7DDD7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-[#D8CCC5] bg-[#FAF6F3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#164957]">
              Rede MediNexus
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              ClÃ­nicas cadastradas
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Encontre clÃ­nicas conectadas Ã  plataforma e escolha o melhor ponto
              de atendimento para sua jornada de cuidado.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/profissionais"
              className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
            >
              Ver profissionais
            </Link>

            <Link
              href="/cadastro"
              className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-[#E7DDD7] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              ClÃ­nicas
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              {clinics.length}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E7DDD7] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Cidades
            </p>
            <p className="mt-3 text-3xl font-bold text-[#164957]">
              {cities.length}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E7DDD7] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Resultado atual
            </p>
            <p className="mt-3 text-3xl font-bold text-[#5A4C86]">
              {filteredClinics.length}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-[#E7DDD7] bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar clÃ­nica
              </label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busque por nome, bairro, cidade, telefone ou descriÃ§Ã£o"
                className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Cidade
              </label>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#A7B5E5] focus:bg-white"
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

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 text-sm text-slate-500 shadow-sm">
              Carregando clÃ­nicas...
            </div>
          ) : filteredClinics.length === 0 ? (
            <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Nenhuma clÃ­nica encontrada
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Tente ajustar sua busca ou selecionar outra cidade.
              </p>
            </div>
          ) : (
            filteredClinics.map((item) => (
              <article
                key={item.id}
                className="rounded-[28px] border border-[#E7DDD7] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EEF3EF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#164957]">
                        ClÃ­nica
                      </span>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                        Ativa
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-950">
                      {getClinicName(item)}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {getClinicLocation(item)}
                    </p>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                      {getClinicDescription(item)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
                      {item.phone && (
                        <span className="rounded-full bg-[#F7F9FD] px-3 py-1">
                          {item.phone}
                        </span>
                      )}

                      {item.email && (
                        <span className="rounded-full bg-[#F7F9FD] px-3 py-1">
                          {item.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[220px]">
                    <Link
                      href={`/clinicas/${item.id}`}
                      className="w-full rounded-2xl bg-[#164957] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#123B46]"
                    >
                      Ver clÃ­nica
                    </Link>

                    <Link
                      href="/profissionais"
                      className="w-full rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-center text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
                    >
                      Ver profissionais
                    </Link>
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


