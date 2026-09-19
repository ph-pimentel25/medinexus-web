"use client";

import Link from "next/link";
import DoctorNetworkDetails from "../components/doctor-network-details";
import DoctorAvatar from "../components/doctor-avatar";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type DoctorRow = {
  photo_path: string | null;
  id: string;
  name: string | null;
  crm: string | null;
  crm_state: string | null;
  bio: string | null;
  is_active: boolean | null;
  clinic_id: string | null;
  created_at: string | null;

  clinics:
    | {
        trade_name: string | null;
        legal_name: string | null;
        city: string | null;
        state: string | null;
        address_city: string | null;
        address_state: string | null;
        address_neighborhood: string | null;
      }
    | {
        trade_name: string | null;
        legal_name: string | null;
        city: string | null;
        state: string | null;
        address_city: string | null;
        address_state: string | null;
        address_neighborhood: string | null;
      }[]
    | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getDoctorName(item: DoctorRow) {
  return item.name || "Profissional não informado";
}

function getDoctorCrm(item: DoctorRow) {
  if (!item.crm) return "CRM não informado";
  return `CRM ${item.crm}${item.crm_state ? ` / ${item.crm_state}` : ""}`;
}

function getClinicName(item: DoctorRow) {
  const clinic = pickOne(item.clinics);
  return clinic?.trade_name || clinic?.legal_name || "Clínica não informada";
}

function getClinicLocation(item: DoctorRow) {
  const clinic = pickOne(item.clinics);

  const parts = [
    clinic?.address_neighborhood,
    clinic?.address_city || clinic?.city,
    clinic?.address_state || clinic?.state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Localização não informada";
}

function getDoctorBio(item: DoctorRow) {
  return (
    item.bio ||
    "Profissional cadastrado na plataforma MediNexus para atendimento, acompanhamento e cuidado conectado."
  );
}

export default function ProfissionaisPage() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [message, setMessage] = useState("");


  async function loadDoctors() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("doctors")
      .select(
        `
        id,
        name,
        crm,
        crm_state,
        bio,
        photo_path,
        is_active,
        clinic_id,
        created_at,
        clinics (
          trade_name,
          legal_name,
          city,
          state,
          address_city,
          address_state,
          address_neighborhood
        )
      `
      )
      .order("name", { ascending: true });

    if (error) {
      setMessage(`Erro ao carregar profissionais: ${error.message}`);
      setDoctors([]);
      setLoading(false);
      return;
    }

    const safeDoctors = ((data || []) as DoctorRow[]).filter(
      (item) => item.is_active !== false
    );

    setDoctors(safeDoctors);
    setLoading(false);
  }


  useEffect(() => {
    const initialLoad = setTimeout(() => void loadDoctors(), 0);
    return () => clearTimeout(initialLoad);
  }, []);

  const cities = useMemo(() => {
    const unique = new Set(
      doctors
        .map((item) => {
          const clinic = pickOne(item.clinics);
          return clinic?.address_city || clinic?.city;
        })
        .filter(Boolean)
        .map((item) => String(item))
    );

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const normalizedQuery = normalize(query);

    return doctors.filter((item) => {
      const clinic = pickOne(item.clinics);
      const city = clinic?.address_city || clinic?.city || "";

      const searchable = normalize(
        [
          getDoctorName(item),
          getDoctorCrm(item),
          getDoctorBio(item),
          getClinicName(item),
          getClinicLocation(item),
        ].join(" ")
      );

      const matchesQuery =
        !normalizedQuery || searchable.includes(normalizedQuery);

      const matchesCity = cityFilter === "all" || city === cityFilter;

      return matchesQuery && matchesCity;
    });
  }, [doctors, query, cityFilter]);

  return (
    <main className="min-h-screen bg-mn-sand text-mn-graphite">
      <section className="relative overflow-hidden border-b border-mn-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(122,157,140,0.25),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(90,76,134,0.20),transparent_32%)]" />

        <div className="relative mx-auto max-w-[1500px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
          <div className="max-w-5xl">
            <div className="mb-7 inline-flex rounded-full border border-mn-border bg-white/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-mn-teal shadow-sm backdrop-blur-xl">
              Rede médica
            </div>

            <h1 className="max-w-6xl text-[4rem] font-semibold leading-[0.92] tracking-[-0.075em] text-mn-graphite sm:text-[5.6rem] lg:text-[7rem]">
              Encontre profissionais para sua jornada de cuidado.
            </h1>

            <p className="mt-8 max-w-3xl text-xl leading-9 text-mn-graphite/70">
              Busque médicos vinculados à rede MediNexus e encontre o melhor
              ponto de atendimento para iniciar ou continuar seu cuidado.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/busca"
                className="rounded-full bg-mn-teal px-8 py-4 text-sm font-semibold text-white shadow-[0_24px_80px_-42px_rgba(22,73,87,0.85)] transition hover:-translate-y-0.5 hover:bg-[#123B46]"
              >
                Buscar pela minha disponibilidade
              </Link>

              <Link
                href="/clinicas"
                className="rounded-full border border-mn-border bg-white/70 px-8 py-4 text-sm font-semibold text-mn-graphite shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
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

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-mn-border bg-white/70 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mn-sage">
              Profissionais
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-mn-graphite">
              {doctors.length}
            </p>
          </div>

          <div className="rounded-2xl border border-mn-border bg-white/70 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mn-sage">
              Cidades
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-mn-teal">
              {cities.length}
            </p>
          </div>

          <div className="rounded-2xl border border-mn-border bg-white/70 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mn-sage">
              Resultado
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-mn-purple">
              {filteredDoctors.length}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-mn-border bg-white/70 p-5 shadow-sm backdrop-blur">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                Buscar profissional
              </label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busque por nome, CRM, clínica, cidade ou descrição"
                className="w-full rounded-2xl border border-mn-border bg-mn-sand px-4 py-3 text-sm text-mn-graphite outline-none transition placeholder:text-mn-graphite/40 focus:border-mn-teal focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-mn-graphite">
                Cidade
              </label>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="w-full rounded-2xl border border-mn-border bg-mn-sand px-4 py-3 text-sm text-mn-graphite outline-none transition focus:border-mn-teal focus:bg-white"
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
            <div className="rounded-2xl border border-mn-border bg-white/70 p-8 text-sm text-mn-graphite/60 shadow-sm backdrop-blur">
              Carregando profissionais...
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="rounded-2xl border border-mn-border bg-white/70 p-12 text-center shadow-sm backdrop-blur">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-mn-graphite">
                Nenhum profissional encontrado
              </h2>
              <p className="mt-3 text-sm text-mn-graphite/60">
                Tente ajustar sua busca ou selecionar outra cidade.
              </p>
            </div>
          ) : (
            filteredDoctors.map((item) => (
              <article
                key={item.id}
                id={item.id}
                className="group overflow-hidden rounded-2xl border border-mn-border bg-white/72 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_30px_90px_-65px_rgba(46,57,63,0.65)]"
              >
                <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
                  <div className="p-7">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-mn-sage-light px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-mn-teal">
                        Profissional
                      </span>

                      <span className="rounded-full bg-mn-purple-light px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-mn-purple">
                        Ativo
                      </span>
                    </div>

                    <DoctorAvatar path={item.photo_path} name={getDoctorName(item)}/>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-mn-graphite">
                      {getDoctorName(item)}
                    </h2>

                    <p className="mt-2 text-sm font-medium text-mn-teal">
                      {getDoctorCrm(item)}
                    </p>

                    <p className="mt-4 max-w-3xl text-sm leading-7 text-mn-graphite/66">
                      {getDoctorBio(item)}
                    </p>

                    <DoctorNetworkDetails doctorId={item.id} clinicId={item.clinic_id}/>
                    <div className="mt-5 border-t border-mn-border pt-5">
                      <p className="text-sm font-semibold text-mn-graphite">
                        {getClinicName(item)}
                      </p>

                      <p className="mt-1 text-sm text-mn-graphite/55">
                        {getClinicLocation(item)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between border-t border-mn-border bg-mn-sand/75 p-7 lg:border-l lg:border-t-0">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mn-sage">
                        MediNexus
                      </p>

                      <p className="mt-3 text-lg font-semibold leading-7 tracking-[-0.035em] text-mn-graphite">
                        Solicite uma consulta pela plataforma.
                      </p>
                    </div>

                    <div className="mt-8 grid gap-3">
                      <Link
                        href={`/busca${item.clinic_id?`?clinicId=${item.clinic_id}`:""}`}
                        className="rounded-full bg-mn-teal px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#123B46]"
                      >
                        Encontrar um encaixe
                      </Link>

                      <Link
                        href={item.clinic_id?`/clinicas/${item.clinic_id}`:"/clinicas"}
                        className="rounded-full border border-mn-border bg-white/70 px-5 py-3 text-center text-sm font-semibold text-mn-graphite transition hover:bg-white"
                      >
                        Ver clínicas
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