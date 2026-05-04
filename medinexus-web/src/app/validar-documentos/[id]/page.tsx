"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type ValidationRow = {
  document_id: string;
  document_type: string | null;
  document_status: string | null;
  issued_at: string | null;
  patient_name: string | null;
  doctor_name: string | null;
  doctor_crm: string | null;
  doctor_crm_state: string | null;
  clinic_name: string | null;
  clinic_location: string | null;
  signature_status: string | null;
  signature_provider: string | null;
  signature_validation_url: string | null;
  signed_pdf_url: string | null;
  signed_at: string | null;
  validation_result: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getTypeLabel(value?: string | null) {
  const raw = String(value || "").toLowerCase();

  if (raw.includes("prescription") || raw.includes("receita")) return "Receita médica";
  if (raw.includes("exam") || raw.includes("exame")) return "Solicitação de exame";
  if (raw.includes("certificate") || raw.includes("atestado")) return "Atestado médico";
  if (raw.includes("attendance") || raw.includes("declara")) return "Declaração de comparecimento";

  return value || "Documento médico";
}

function getSignatureLabel(value?: string | null) {
  const raw = String(value || "");

  const labels: Record<string, string> = {
    unsigned: "Validação MediNexus",
    pending: "Assinatura pendente",
    signed: "Assinado digitalmente",
    failed: "Falha na assinatura",
  };

  return labels[raw] || "Validação MediNexus";
}

export default function ValidarDocumentoPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const documentId = String(params?.id || "");
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState<ValidationRow | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    validateDocument();
  }, [documentId, token]);

  async function validateDocument() {
    setLoading(true);
    setMessage("");

    if (!documentId || !token) {
      setMessage("Link de validação incompleto.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("validate_medical_document", {
      p_document_id: documentId,
      p_validation_token: token,
    });

    if (error) {
      setMessage(`Erro ao validar documento: ${error.message}`);
      setLoading(false);
      return;
    }

    const firstRow = Array.isArray(data) ? data[0] : null;

    if (!firstRow) {
      setMessage("Documento não encontrado ou código de validação inválido.");
      setDocumentData(null);
      setLoading(false);
      return;
    }

    setDocumentData(firstRow as ValidationRow);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F]">
      <section className="relative overflow-hidden border-b border-[#E7DDD7]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(122,157,140,0.25),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(90,76,134,0.20),transparent_32%)]" />

        <div className="relative mx-auto max-w-[1100px] px-6 py-20 sm:px-10 lg:px-14">
          <div className="mb-7 inline-flex rounded-full border border-[#D8CCC5] bg-white/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#164957] shadow-sm backdrop-blur-xl">
            Validação MediNexus
          </div>

          <h1 className="max-w-4xl text-[3.2rem] font-semibold leading-[0.96] tracking-[-0.065em] text-[#2E393F] sm:text-[4.6rem]">
            Verificação de documento médico.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#2E393F]/68">
            Esta página confirma se o documento foi emitido dentro da plataforma
            MediNexus e se o código de validação corresponde ao registro.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-6 py-12 sm:px-10">
        {loading ? (
          <div className="rounded-[2.4rem] border border-[#E7DDD7] bg-white/70 p-8 text-sm text-[#2E393F]/60 shadow-sm">
            Validando documento...
          </div>
        ) : message ? (
          <div className="rounded-[2.4rem] border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">
              Documento não validado
            </h2>
            <p className="mt-3 leading-7">{message}</p>
          </div>
        ) : documentData ? (
          <article className="overflow-hidden rounded-[2.6rem] border border-[#E7DDD7] bg-white shadow-[0_35px_100px_-80px_rgba(46,57,63,0.75)]">
            <div className="bg-gradient-to-br from-[#164957] via-[#2E393F] to-[#5A4C86] p-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                Documento validado
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em]">
                {getTypeLabel(documentData.document_type)}
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/70">
                Este documento possui registro correspondente na plataforma
                MediNexus.
              </p>
            </div>

            <div className="grid gap-0 md:grid-cols-2">
              <div className="border-b border-[#E7DDD7] p-7 md:border-r">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
                  Paciente
                </p>
                <p className="mt-3 text-lg font-semibold text-[#2E393F]">
                  {documentData.patient_name || "Não informado"}
                </p>
              </div>

              <div className="border-b border-[#E7DDD7] p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
                  Emissão
                </p>
                <p className="mt-3 text-lg font-semibold text-[#2E393F]">
                  {formatDateTime(documentData.issued_at)}
                </p>
              </div>

              <div className="border-b border-[#E7DDD7] p-7 md:border-r">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
                  Profissional
                </p>
                <p className="mt-3 text-lg font-semibold text-[#2E393F]">
                  {documentData.doctor_name || "Não informado"}
                </p>
                <p className="mt-2 text-sm text-[#2E393F]/58">
                  CRM {documentData.doctor_crm || "não informado"}
                  {documentData.doctor_crm_state
                    ? ` / ${documentData.doctor_crm_state}`
                    : ""}
                </p>
              </div>

              <div className="border-b border-[#E7DDD7] p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
                  Unidade
                </p>
                <p className="mt-3 text-lg font-semibold text-[#2E393F]">
                  {documentData.clinic_name || "MediNexus"}
                </p>
                <p className="mt-2 text-sm text-[#2E393F]/58">
                  {documentData.clinic_location || "Local não informado"}
                </p>
              </div>

              <div className="p-7 md:border-r">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
                  Assinatura
                </p>
                <p className="mt-3 text-lg font-semibold text-[#2E393F]">
                  {getSignatureLabel(documentData.signature_status)}
                </p>
                <p className="mt-2 text-sm text-[#2E393F]/58">
                  Provedor: {documentData.signature_provider || "MediNexus"}
                </p>
              </div>

              <div className="p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9D8C]">
                  PDF assinado
                </p>

                {documentData.signed_pdf_url ? (
                  <a
                    href={documentData.signed_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-full bg-[#164957] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Abrir PDF assinado
                  </a>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[#2E393F]/58">
                    Documento ainda sem PDF assinado anexado.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-[#E7DDD7] bg-[#FAF6F3] p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#164957]">
                Importante
              </p>

              <p className="mt-3 text-sm leading-7 text-[#2E393F]/65">
                Esta validação confirma a emissão dentro da MediNexus. Para
                validade jurídica avançada, o documento deve estar assinado por
                integração compatível, ICP-Brasil, Atesta CFM ou serviço oficial
                equivalente.
              </p>
            </div>
          </article>
        ) : null}

        <div className="mt-8">
          <Link
            href="/"
            className="rounded-full border border-[#D8CCC5] bg-white/70 px-6 py-3 text-sm font-semibold text-[#2E393F] shadow-sm transition hover:bg-white"
          >
            Voltar para MediNexus
          </Link>
        </div>
      </section>
    </main>
  );
}