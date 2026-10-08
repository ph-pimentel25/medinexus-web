"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import FamilyProfileSwitcher from "../components/family-profile-switcher";
import VaccineWallet from "../components/vaccine-wallet";

import {
  FlaskConical,
  MessageCircle,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";

type ExamOrderRow = {
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  clinic_id?: string | null;
  appointment_id?: string | null;
  title: string;
  category: string;
  instructions?: string | null;
  status: "solicitado" | "agendado" | "em_andamento" | "concluido";
  lab_name?: string | null;
  result_url?: string | null;
  result_notes?: string | null;
  scheduled_for?: string | null;
  completed_at?: string | null;
  created_at: string;
};

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
  status?: string | null;
  result_url?: string | null;
  created_at?: string | null;
  issued_at?: string | null;
  [key: string]: unknown;
};

type FilterType = "all" | "receita" | "exame" | "atestado" | "declaracao" | "vacinas";

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
  const [examOrders, setExamOrders] = useState<ExamOrderRow[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [query, setQuery] = useState("");

  const PARTNER_LAB_WHATSAPP = "5521979828341";

  async function loadDocuments() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para visualizar documentos.");
      setDocuments([]);
      setExamOrders([]);
      setLoading(false);
      return;
    }

    const [docsRes, examsRes] = await Promise.all([
      supabase
        .from("medical_documents")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("exam_orders")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (docsRes.error && !docsRes.data) {
      setMessage(`Erro ao carregar documentos: ${docsRes.error.message}`);
    }

    const safeDocs = ((docsRes.data as MedicalDocumentRow[]) || []).filter((item) => {
      const released =
        item.is_released_to_patient ?? item.released_to_patient ?? true;
      return released !== false;
    });

    const safeExams = (examsRes.data as ExamOrderRow[]) || [];
    setDocuments(safeDocs);
    setExamOrders(safeExams);
    setLoading(false);
  }

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadDocuments(), 0);
    return () => clearTimeout(initialLoad);
  }, []);

  // Exames pendentes para agendamento (status "solicitado")
  const pendingExams = useMemo(() => {
    const fromOrders = examOrders.filter((e) => e.status === "solicitado");
    const fromDocs = documents
      .filter((d) => matchesType(d, "exame"))
      .filter((d) => !examOrders.some((e) => e.title === d.title || e.id === d.id));
    return [...fromOrders, ...fromDocs];
  }, [examOrders, documents]);

  function handleBatchWhatsApp() {
    if (!pendingExams.length) return;
    const list = pendingExams
      .map((e, idx) => `${idx + 1}. ${"title" in e ? e.title : getDocumentTitle(e)}`)
      .join("\n");
    const text = encodeURIComponent(
      `Olá! Gostaria de solicitar o agendamento dos meus exames pela rede parceira MediNexus:\n\n${list}\n\nPor favor, confirmem as unidades disponíveis e orientações de preparo.`
    );
    window.open(`https://wa.me/${PARTNER_LAB_WHATSAPP}?text=${text}`, "_blank");
  }

  function handleSingleWhatsApp(title: string) {
    const text = encodeURIComponent(
      `Olá! Gostaria de agendar o exame "${title}" pela rede credenciada do MediNexus.`
    );
    window.open(`https://wa.me/${PARTNER_LAB_WHATSAPP}?text=${text}`, "_blank");
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
    <main className="min-h-screen bg-mn-sand">
      <section className="border-b border-mn-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-mn-border bg-mn-sand px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-mn-teal">
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
              className="rounded-2xl border border-mn-border bg-white px-5 py-3 text-sm font-semibold text-mn-purple transition hover:bg-mn-sand"
            >
              Dashboard
            </Link>

            <Link
              href="/solicitacoes"
              className="rounded-2xl bg-mn-teal px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
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

        <FamilyProfileSwitcher className="mb-6" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Total", value: summary.total, tone: "text-slate-950" },
            { label: "Receitas", value: summary.receitas, tone: "text-mn-teal" },
            { label: "Exames", value: summary.exames, tone: "text-mn-sage" },
            { label: "Atestados", value: summary.atestados, tone: "text-[#B26B00]" },
            { label: "Declarações", value: summary.declaracoes, tone: "text-mn-purple" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-mn-border bg-white p-5 shadow-sm"
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

        <div className="mt-6 rounded-2xl border border-mn-border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="w-full xl:max-w-xl">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar documento
              </label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busque por receita, exame, atestado ou declaração"
                className="w-full rounded-2xl border border-mn-border bg-mn-sand px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-mn-purple focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "Todos" },
                { key: "receita", label: "Receitas" },
                { key: "exame", label: "Exames" },
                { key: "atestado", label: "Atestados" },
                { key: "declaracao", label: "Declarações" },
                { key: "vacinas", label: "💉 Vacinas" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key as FilterType)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    filter === item.key
                      ? "bg-mn-teal text-white"
                      : "border border-mn-border bg-white text-mn-purple hover:bg-mn-sand"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filter === "vacinas" ? (
          <div className="mt-6">
            <VaccineWallet />
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {/* Banner de Agendamento Geral de Exames via WhatsApp */}
            {(filter === "all" || filter === "exame") && pendingExams.length > 0 && (
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50/50 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600">
                    <FlaskConical size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Você tem {pendingExams.length} exame{pendingExams.length > 1 ? "s" : ""} pendente{pendingExams.length > 1 ? "s" : ""} de agendamento
                    </h4>
                    <p className="text-xs text-slate-500">
                      Dispare a lista completa de uma só vez para a central de atendimento e agendamento dos laboratórios credenciados.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBatchWhatsApp}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#059669] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#047857] transition"
                >
                  <MessageCircle size={18} />
                  <span>Disparar todos os exames via WhatsApp</span>
                </button>
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-mn-border bg-white p-6 text-sm text-slate-500 shadow-sm">
                Carregando documentos...
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="rounded-2xl border border-mn-border bg-white p-10 text-center shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">
                  Nenhum documento encontrado
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Quando um documento for liberado para você, ele aparecerá aqui.
                </p>
              </div>
            ) : (
              filteredDocuments.map((item) => {
                const isExam = matchesType(item, "exame");
                const matchedOrder = examOrders.find((e) => e.title === item.title || e.id === item.id);
                const examStatus = matchedOrder?.status || (item.status as string) || "solicitado";
                const isCompleted = examStatus === "concluido";

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-mn-border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-mn-sage-light px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-mn-teal">
                            {getDocumentTypeLabel(item)}
                          </span>

                          {isExam && (
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-800"
                                  : examStatus === "em_andamento"
                                  ? "bg-purple-100 text-purple-800"
                                  : examStatus === "agendado"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isCompleted
                                ? "Concluído / Laudo liberado"
                                : examStatus === "em_andamento"
                                ? "Em análise laboratorial"
                                : examStatus === "agendado"
                                ? "Agendado no laboratório"
                                : "Pendente de agendamento"}
                            </span>
                          )}

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

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {isExam && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleSingleWhatsApp(getDocumentTitle(item))}
                            className="flex items-center gap-1.5 rounded-2xl border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                          >
                            <MessageCircle size={15} />
                            <span>Agendar via WhatsApp</span>
                          </button>
                        )}

                        {isExam && isCompleted && (
                          <a
                            href={matchedOrder?.result_url || (item.result_url as string) || `/documentos-medicos/${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                          >
                            <CheckCircle2 size={16} />
                            <span>Ver resultados</span>
                          </a>
                        )}

                        <Link
                          href={`/documentos-medicos/${item.id}`}
                          className="rounded-2xl bg-mn-teal px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
                        >
                          Abrir documento
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </section>
    </main>
  );
}


