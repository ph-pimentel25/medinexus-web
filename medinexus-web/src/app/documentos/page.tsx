"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type DocumentType =
  | "prescription"
  | "exam_request"
  | "medical_certificate"
  | "attendance_declaration"
  | "clinical_summary";

type MedicalDocumentRow = {
  id: string;
  document_type: DocumentType;
  status: "draft" | "issued" | "cancelled";
  patient_id: string;
  doctor_id: string | null;
  clinic_id: string | null;
  appointment_id: string | null;
  title: string | null;
  clinical_indication: string | null;
  plain_text: string | null;
  released_to_patient: boolean;
  released_at: string | null;
  doctor_name: string | null;
  doctor_crm: string | null;
  doctor_crm_state: string | null;
  clinic_name: string | null;
  created_at: string;
  issued_at: string | null;
};

type FilterType = "all" | DocumentType;

const documentFilters: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "prescription", label: "Receitas" },
  { value: "exam_request", label: "Exames" },
  { value: "medical_certificate", label: "Atestados" },
  { value: "attendance_declaration", label: "Declarações" },
  { value: "clinical_summary", label: "Resumos" },
];

function getDocumentLabel(type: DocumentType) {
  const labels: Record<DocumentType, string> = {
    prescription: "Receita médica",
    exam_request: "Solicitação de exame",
    medical_certificate: "Atestado médico",
    attendance_declaration: "Declaração de comparecimento",
    clinical_summary: "Resumo clínico",
  };

  return labels[type] || "Documento médico";
}

function getDocumentDescription(type: DocumentType) {
  const labels: Record<DocumentType, string> = {
    prescription: "Prescrição, medicamento e orientações terapêuticas.",
    exam_request: "Pedido médico para realização de exame.",
    medical_certificate: "Documento médico para afastamento ou comprovação.",
    attendance_declaration: "Comprovação de comparecimento ao atendimento.",
    clinical_summary: "Resumo clínico do atendimento realizado.",
  };

  return labels[type] || "Documento emitido pela MediNexus.";
}

function formatDateTime(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getDocumentTone(type: DocumentType) {
  if (type === "prescription") {
    return {
      badge: "bg-blue-50 text-blue-700 ring-blue-200",
      card: "from-[#F1F5FF] to-white",
      icon: "R",
    };
  }

  if (type === "exam_request") {
    return {
      badge: "bg-violet-50 text-violet-700 ring-violet-200",
      card: "from-[#F6F3FF] to-white",
      icon: "E",
    };
  }

  if (type === "medical_certificate") {
    return {
      badge: "bg-amber-50 text-amber-700 ring-amber-200",
      card: "from-[#FFF7ED] to-white",
      icon: "A",
    };
  }

  if (type === "attendance_declaration") {
    return {
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      card: "from-[#ECFDF5] to-white",
      icon: "D",
    };
  }

  return {
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    card: "from-[#F8FAFC] to-white",
    icon: "S",
  };
}

export default function DocumentosPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<MedicalDocumentRow[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

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
      setMessage("Você precisa estar logado para acessar seus documentos.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("medical_documents")
      .select(
        `
        id,
        document_type,
        status,
        patient_id,
        doctor_id,
        clinic_id,
        appointment_id,
        title,
        clinical_indication,
        plain_text,
        released_to_patient,
        released_at,
        doctor_name,
        doctor_crm,
        doctor_crm_state,
        clinic_name,
        created_at,
        issued_at
      `
      )
      .eq("patient_id", user.id)
      .eq("status", "issued")
      .eq("released_to_patient", true)
      .order("issued_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Erro ao carregar documentos: ${error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setDocuments((data || []) as MedicalDocumentRow[]);
    setLoading(false);
  }

  const filteredDocuments = useMemo(() => {
    const query = normalize(search);

    return documents.filter((document) => {
      const matchesType =
        filter === "all" || document.document_type === filter;

      const searchable = normalize(
        [
          document.title,
          getDocumentLabel(document.document_type),
          document.doctor_name,
          document.clinic_name,
          document.clinical_indication,
          document.plain_text,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesSearch = !query || searchable.includes(query);

      return matchesType && matchesSearch;
    });
  }, [documents, search, filter]);

  const stats = useMemo(() => {
    return {
      total: documents.length,
      prescriptions: documents.filter(
        (item) => item.document_type === "prescription"
      ).length,
      exams: documents.filter((item) => item.document_type === "exam_request")
        .length,
      certificates: documents.filter(
        (item) => item.document_type === "medical_certificate"
      ).length,
    };
  }, [documents]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-slate-600">Carregando documentos...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />

        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pb-12 lg:pt-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-[#D9D6F4] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#283C7A] shadow-sm">
                Documentos do paciente
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950">
                Seus documentos médicos em um só lugar
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Acesse receitas, solicitações de exame, atestados, declarações e
                resumos clínicos liberados pelo médico.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-7 py-4 text-sm font-bold text-[#5E4B9A] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6F3FF]"
                >
                  Voltar ao dashboard
                </Link>

                <Link
                  href="/solicitacoes"
                  className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-7 py-4 text-sm font-bold text-white shadow-[0_18px_50px_-30px_rgba(40,60,122,0.9)] transition hover:-translate-y-0.5 hover:bg-[#213366]"
                >
                  Minhas solicitações
                </Link>
              </div>
            </div>

            <div className="rounded-[38px] bg-gradient-to-br from-[#283C7A] via-[#4B4EA3] to-[#6E56CF] p-7 text-white shadow-[0_28px_90px_-65px_rgba(40,60,122,0.9)]">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/60">
                Visão geral
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-[28px] bg-white/12 p-5 ring-1 ring-white/15">
                  <p className="text-4xl font-bold">{stats.total}</p>
                  <p className="mt-1 text-sm text-white/70">
                    documentos liberados
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.prescriptions}</p>
                    <p className="mt-1 text-xs text-white/70">receitas</p>
                  </div>

                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.exams}</p>
                    <p className="mt-1 text-xs text-white/70">exames</p>
                  </div>

                  <div className="rounded-[24px] bg-white/12 p-4 ring-1 ring-white/15">
                    <p className="text-2xl font-bold">{stats.certificates}</p>
                    <p className="mt-1 text-xs text-white/70">atestados</p>
                  </div>
                </div>

                <div className="rounded-[28px] bg-white p-5 text-[#283C7A]">
                  <p className="font-bold">
                    Documentos emitidos aparecem aqui quando liberados pelo médico.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Use o botão imprimir/salvar PDF dentro de cada documento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="rounded-[38px] border border-[#D9D6F4] bg-white p-6 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Buscar documento
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6E56CF] focus:bg-white"
                placeholder="Busque por título, médico, clínica ou conteúdo"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {documentFilters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded-2xl px-5 py-4 text-sm font-bold transition ${
                    filter === item.value
                      ? "bg-[#283C7A] text-white"
                      : "border border-[#D9D6F4] bg-white text-[#5E4B9A] hover:bg-[#F6F3FF]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="mt-8 rounded-[34px] border border-[#D9D6F4] bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6F3FF] text-2xl">
              📄
            </div>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950">
              Nenhum documento encontrado
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
              Quando um médico emitir e liberar receitas, atestados, declarações
              ou solicitações de exame, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((document) => {
              const tone = getDocumentTone(document.document_type);
              const label = getDocumentLabel(document.document_type);
              const title = document.title || label;

              return (
                <article
                  key={document.id}
                  className={`group overflow-hidden rounded-[34px] border border-[#D9D6F4] bg-gradient-to-br ${tone.card} shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)] transition hover:-translate-y-1.5 hover:shadow-[0_32px_90px_-70px_rgba(40,60,122,0.65)]`}
                >
                  <div className="p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#283C7A] to-[#6E56CF] text-lg font-bold text-white`}
                      >
                        {tone.icon}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ring-1 ${tone.badge}`}
                      >
                        {label}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-950">
                      {title}
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {getDocumentDescription(document.document_type)}
                    </p>

                    <div className="mt-5 rounded-2xl border border-[#E0E7FF] bg-white/75 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Emitido por
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {document.doctor_name || "Médico não informado"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {document.clinic_name || "Clínica não informada"}
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                          Emitido em
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {formatDateTime(
                            document.issued_at || document.created_at
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                          Liberação
                        </p>
                        <p className="mt-2 text-sm font-semibold text-emerald-700">
                          Liberado
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/documentos-medicos/${document.id}`}
                      className="mt-6 inline-flex w-full justify-center rounded-2xl bg-[#283C7A] px-5 py-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(40,60,122,0.22)] transition hover:bg-[#213366]"
                    >
                      Abrir documento
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}