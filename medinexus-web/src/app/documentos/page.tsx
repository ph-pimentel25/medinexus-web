"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type MedicalDocumentRow = {
  id: string;
  patient_id?: string | null;
  doctor_id?: string | null;
  clinic_id?: string | null;
  appointment_id?: string | null;
  document_type?: string | null;
  type?: string | null;
  title?: string | null;
  content?: string | null;
  description?: string | null;
  is_released_to_patient?: boolean | null;
  released_to_patient?: boolean | null;
  created_at?: string | null;
  issued_at?: string | null;
  [key: string]: unknown;
};

type FilterType = "all" | "receita" | "exame" | "atestado" | "declaracao";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatDate(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getDocumentType(item: MedicalDocumentRow) {
  return String(item.document_type || item.type || "documento");
}

function getDocumentTypeLabel(item: MedicalDocumentRow) {
  const type = normalize(getDocumentType(item));

  if (type.includes("receita")) return "Receita";
  if (type.includes("prescription")) return "Receita";
  if (type.includes("exame")) return "Solicitação de exame";
  if (type.includes("exam")) return "Solicitação de exame";
  if (type.includes("atestado")) return "Atestado";
  if (type.includes("declaracao")) return "Declaração";
  if (type.includes("declaração")) return "Declaração";

  return "Documento médico";
}

function matchesType(item: MedicalDocumentRow, filter: FilterType) {
  if (filter === "all") return true;

  const type = normalize(getDocumentType(item));

  if (filter === "receita") {
    return type.includes("receita") || type.includes("prescription");
  }

  if (filter === "exame") {
    return type.includes("exame") || type.includes("exam");
  }

  if (filter === "atestado") {
    return type.includes("atestado");
  }

  if (filter === "declaracao") {
    return type.includes("declaracao") || type.includes("declaração");
  }

  return true;
}

function getDocumentTitle(item: MedicalDocumentRow) {
  return item.title || getDocumentTypeLabel(item);
}

function getDocumentDescription(item: MedicalDocumentRow) {
  return (
    item.description ||
    (typeof item.content === "string" ? item.content.slice(0, 140) : "") ||
    "Documento médico liberado para visualização."
  );
}

export default function DocumentosPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [documents, setDocuments] = useState<MedicalDocumentRow[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para visualizar documentos.");
      setDocuments([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("medical_documents")
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Erro ao carregar documentos: ${error.message}`);
      setDocuments([]);
      setLoading(false);
      return;
    }

    const safeDocs = ((data as MedicalDocumentRow[]) || []).filter((item) => {
      const released =
        item.is_released_to_patient ?? item.released_to_patient ?? true;
      return released !== false;
    });

    setDocuments(safeDocs);
    setLoading(false);
  }

  const summary = useMemo(() => {
    return {
      total: documents.length,
      receitas: documents.filter((item) => matchesType(item, "receita")).length,
      exames: documents.filter((item) => matchesType(item, "exame")).length,
      atestados: documents.filter((item) => matchesType(item, "atestado")).length,
      declaracoes: documents.filter((item) => matchesType(item, "declaracao")).length,
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = normalize(query);

    return documents.filter((item) => {
      const searchable = normalize(
        [
          getDocumentTitle(item),
          getDocumentDescription(item),
          getDocumentTypeLabel(item),
        ].join(" ")
      );

      const matchesSearch =
        !normalizedQuery || searchable.includes(normalizedQuery);

      return matchesSearch && matchesType(item, filter);
    });
  }, [documents, filter, query]);

  return (
    <main className="min-h-screen bg-[#FAF6F3]">
      <section className="border-b border-[#E7DDD7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-[#D8CCC5] bg-[#FAF6F3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#164957]">
              Documentos médicos
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Meus documentos
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Consulte receitas, solicitações de exame, atestados e declarações
              emitidas pelos profissionais.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
            >
              Dashboard
            </Link>

            <Link
              href="/solicitacoes"
              className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
            >
              Minhas consultas
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Total", value: summary.total, tone: "text-slate-950" },
            { label: "Receitas", value: summary.receitas, tone: "text-[#164957]" },
            { label: "Exames", value: summary.exames, tone: "text-[#7A9D8C]" },
            { label: "Atestados", value: summary.atestados, tone: "text-[#B26B00]" },
            { label: "Declarações", value: summary.declaracoes, tone: "text-[#5A4C86]" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-[#E7DDD7] bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>
              <p className={`mt-3 text-3xl font-bold ${item.tone}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-[#E7DDD7] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="w-full xl:max-w-xl">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar documento
              </label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busque por receita, exame, atestado ou declaração"
                className="w-full rounded-2xl border border-[#D8CCC5] bg-[#FAF6F3] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A7B5E5] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "Todos" },
                { key: "receita", label: "Receitas" },
                { key: "exame", label: "Exames" },
                { key: "atestado", label: "Atestados" },
                { key: "declaracao", label: "Declarações" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key as FilterType)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    filter === item.key
                      ? "bg-[#164957] text-white"
                      : "border border-[#D8CCC5] bg-white text-[#5A4C86] hover:bg-[#FAF6F3]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-6 text-sm text-slate-500 shadow-sm">
              Carregando documentos...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="rounded-[28px] border border-[#E7DDD7] bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Nenhum documento encontrado
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Quando um documento for liberado para você, ele aparecerá aqui.
              </p>
            </div>
          ) : (
            filteredDocuments.map((item) => (
              <article
                key={item.id}
                className="rounded-[28px] border border-[#E7DDD7] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EEF3EF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#164957]">
                        {getDocumentTypeLabel(item)}
                      </span>

                      <span className="text-xs text-slate-400">
                        Emitido em {formatDate(item.issued_at || item.created_at)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-950">
                      {getDocumentTitle(item)}
                    </h3>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {getDocumentDescription(item)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/documentos-medicos/${item.id}`}
                      className="rounded-2xl bg-[#164957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
                    >
                      Abrir documento
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


