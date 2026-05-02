"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../components/alert";
import { supabase } from "../../lib/supabase";

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
  cid_code: string | null;
  cid_description: string | null;
  content: Record<string, unknown> | null;
  plain_text: string | null;
  released_to_patient: boolean;
  released_at: string | null;
  days_off: number | null;
  purpose: string | null;
  starts_at: string | null;
  ends_at: string | null;
  doctor_name: string | null;
  doctor_crm: string | null;
  doctor_crm_state: string | null;
  clinic_name: string | null;
  created_at: string;
  issued_at: string | null;
};

type PatientRow = {
  full_name: string | null;
  cpf: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  health_plan_operator: string | null;
  health_plan_product_name: string | null;
  health_plan_card_number: string | null;
};

type ClinicRow = {
  trade_name: string | null;
  legal_name: string | null;
  city: string | null;
  state: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  phone: string | null;
  email: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function getAge(birthDate?: string | null) {
  if (!birthDate) return "Não informado";

  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return `${age} anos`;
}

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

function getDocumentSubtitle(type: DocumentType) {
  const subtitles: Record<DocumentType, string> = {
    prescription: "Prescrição e orientações terapêuticas",
    exam_request: "Pedido médico para realização de exame",
    medical_certificate: "Documento médico para afastamento ou comprovação",
    attendance_declaration: "Comprovação de comparecimento ao atendimento",
    clinical_summary: "Resumo clínico do atendimento realizado",
  };

  return subtitles[type] || "Documento emitido pela MediNexus";
}

function getContentText(content: Record<string, unknown> | null, key: string) {
  const value = content?.[key];

  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  return "";
}

function buildClinicAddress(clinic: ClinicRow | null) {
  if (!clinic) return "Endereço não informado";

  const line1 = [clinic.address_street, clinic.address_number]
    .filter(Boolean)
    .join(", ");

  const line2 = [
    clinic.address_neighborhood,
    clinic.address_city || clinic.city,
    clinic.address_state || clinic.state,
  ]
    .filter(Boolean)
    .join(" • ");

  if (line1 && line2) return `${line1} — ${line2}`;
  if (line1) return line1;
  if (line2) return line2;

  return "Endereço não informado";
}

function normalizeFileName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function DocumentoMedicoPage() {
  const params = useParams<{ id: string }>();
  const documentId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<MedicalDocumentRow | null>(null);
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [clinic, setClinic] = useState<ClinicRow | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    loadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function loadDocument() {
    setLoading(true);
    setMessage("");

    const { data: documentData, error: documentError } = await supabase
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
        cid_code,
        cid_description,
        content,
        plain_text,
        released_to_patient,
        released_at,
        days_off,
        purpose,
        starts_at,
        ends_at,
        doctor_name,
        doctor_crm,
        doctor_crm_state,
        clinic_name,
        created_at,
        issued_at
      `
      )
      .eq("id", documentId)
      .maybeSingle<MedicalDocumentRow>();

    if (documentError || !documentData) {
      setMessage(
        `Erro ao carregar documento: ${
          documentError?.message || "documento não encontrado"
        }`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    const [patientResponse, clinicResponse] = await Promise.all([
      supabase
        .from("patients")
        .select(
          `
          full_name,
          cpf,
          birth_date,
          phone,
          email,
          health_plan_operator,
          health_plan_product_name,
          health_plan_card_number
        `
        )
        .eq("id", documentData.patient_id)
        .maybeSingle<PatientRow>(),

      documentData.clinic_id
        ? supabase
            .from("clinics")
            .select(
              `
              trade_name,
              legal_name,
              city,
              state,
              address_street,
              address_number,
              address_neighborhood,
              address_city,
              address_state,
              phone,
              email
            `
            )
            .eq("id", documentData.clinic_id)
            .maybeSingle<ClinicRow>()
        : Promise.resolve({ data: null, error: null }),
    ]);

    setDocument(documentData);
    setPatient(patientResponse.data || null);
    setClinic((clinicResponse.data || null) as ClinicRow | null);
    setLoading(false);
  }

  const patientName = patient?.full_name || "Paciente não informado";
  const clinicName =
    document?.clinic_name ||
    clinic?.trade_name ||
    clinic?.legal_name ||
    "Clínica não informada";

  const documentTitle = document
    ? document.title || getDocumentLabel(document.document_type)
    : "Documento médico";

  const issuedAt = document?.issued_at || document?.created_at;

  const fileName = useMemo(() => {
    return normalizeFileName(`${documentTitle}-${patientName || "paciente"}`);
  }, [documentTitle, patientName]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-slate-600">Carregando documento médico...</p>
        </section>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {message && <Alert variant={messageType}>{message}</Alert>}

          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-2xl bg-[#283C7A] px-6 py-4 text-sm font-bold text-white"
          >
            Voltar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          header,
          .document-actions,
          .no-print {
            display: none !important;
          }

          .document-shell {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }

          .document-paper {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            min-height: 100vh !important;
          }

          .document-page-break {
            page-break-before: always;
          }
        }
      `}</style>

      <section className="document-shell mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="document-actions mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#283C7A]">
              Documento médico
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
              {documentTitle}
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {document.appointment_id && (
              <Link
                href={`/medico/consultas/${document.appointment_id}`}
                className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-6 py-4 text-sm font-bold text-[#5E4B9A] shadow-sm transition hover:bg-[#F6F3FF]"
              >
                Voltar ao prontuário
              </Link>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_50px_-30px_rgba(40,60,122,0.9)] transition hover:bg-[#213366]"
            >
              Imprimir / salvar PDF
            </button>
          </div>
        </div>

        {message && (
          <div className="document-actions mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <article className="document-paper overflow-hidden rounded-[34px] border border-[#D9D6F4] bg-white shadow-[0_34px_110px_-75px_rgba(40,60,122,0.55)]">
          <section className="relative bg-gradient-to-br from-[#283C7A] via-[#4B4EA3] to-[#6E56CF] px-8 py-8 text-white sm:px-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_38%)]" />

            <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.26em] text-white/65">
                  MediNexus
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
                  {documentTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                  {getDocumentSubtitle(document.document_type)}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/20 bg-white/12 p-5 text-sm backdrop-blur">
                <p className="font-bold text-white">Emitido em</p>
                <p className="mt-1 text-white/75">{formatDateTime(issuedAt)}</p>

                <p className="mt-4 font-bold text-white">Status</p>
                <p className="mt-1 text-white/75">
                  {document.status === "issued"
                    ? "Emitido"
                    : document.status === "draft"
                      ? "Rascunho"
                      : "Cancelado"}
                </p>
              </div>
            </div>
          </section>

          <section className="grid border-b border-[#E0E7FF] bg-[#F8FAFC] md:grid-cols-3">
            <div className="border-b border-[#E0E7FF] p-6 md:border-b-0 md:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Paciente
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {patientName}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                CPF: {patient?.cpf || "Não informado"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Nascimento: {formatDate(patient?.birth_date)} •{" "}
                {getAge(patient?.birth_date)}
              </p>
            </div>

            <div className="border-b border-[#E0E7FF] p-6 md:border-b-0 md:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Médico
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {document.doctor_name || "Médico não informado"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                CRM {document.doctor_crm || "não informado"}
                {document.doctor_crm_state
                  ? ` / ${document.doctor_crm_state}`
                  : ""}
              </p>
            </div>

            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Unidade
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {clinicName}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {buildClinicAddress(clinic)}
              </p>
            </div>
          </section>

          <section className="px-8 py-8 sm:px-12">
            {document.document_type === "prescription" && (
              <div className="space-y-6">
                <DocumentBlock
                  title="Prescrição"
                  content={
                    getContentText(document.content, "medication_name") ||
                    "Medicamento não informado."
                  }
                />

                <DocumentBlock
                  title="Modo de uso"
                  content={
                    getContentText(document.content, "medication_use") ||
                    "Modo de uso não informado."
                  }
                />

                {document.plain_text && (
                  <DocumentBlock title="Orientações" content={document.plain_text} />
                )}
              </div>
            )}

            {document.document_type === "exam_request" && (
              <div className="space-y-6">
                <DocumentBlock
                  title="Exame solicitado"
                  content={
                    getContentText(document.content, "exam_name") ||
                    "Exame não informado."
                  }
                />

                <DocumentBlock
                  title="Indicação clínica"
                  content={
                    document.clinical_indication ||
                    "Indicação clínica não informada."
                  }
                />

                {getContentText(document.content, "exam_observation") && (
                  <DocumentBlock
                    title="Observação"
                    content={getContentText(
                      document.content,
                      "exam_observation"
                    )}
                  />
                )}

                {document.cid_code && (
                  <DocumentBlock
                    title="CID"
                    content={`${document.cid_code}${
                      document.cid_description
                        ? ` — ${document.cid_description}`
                        : ""
                    }`}
                  />
                )}
              </div>
            )}

            {document.document_type === "medical_certificate" && (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-[#E0E7FF] bg-white p-6">
                  <p className="text-lg leading-9 text-slate-800">
                    Atesto, para os devidos fins, que{" "}
                    <strong>{patientName}</strong> necessita de afastamento por{" "}
                    <strong>{document.days_off || 0} dia(s)</strong>.
                  </p>
                </div>

                {document.cid_code && (
                  <DocumentBlock
                    title="CID"
                    content={`${document.cid_code}${
                      document.cid_description
                        ? ` — ${document.cid_description}`
                        : ""
                    }`}
                  />
                )}

                {document.purpose && (
                  <DocumentBlock title="Finalidade" content={document.purpose} />
                )}

                {document.plain_text && (
                  <DocumentBlock title="Observações" content={document.plain_text} />
                )}
              </div>
            )}

            {document.document_type === "attendance_declaration" && (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-[#E0E7FF] bg-white p-6">
                  <p className="text-lg leading-9 text-slate-800">
                    Declaro, para os devidos fins, que{" "}
                    <strong>{patientName}</strong> compareceu ao atendimento
                    médico nesta unidade.
                  </p>
                </div>

                {document.purpose && (
                  <DocumentBlock title="Finalidade" content={document.purpose} />
                )}

                {document.plain_text && (
                  <DocumentBlock title="Observações" content={document.plain_text} />
                )}
              </div>
            )}

            {document.document_type === "clinical_summary" && (
              <div className="space-y-6">
                <DocumentBlock
                  title="Resumo clínico"
                  content={
                    document.clinical_indication ||
                    document.plain_text ||
                    "Resumo não informado."
                  }
                />

                {document.plain_text && document.clinical_indication && (
                  <DocumentBlock title="Conduta" content={document.plain_text} />
                )}
              </div>
            )}
          </section>

          <section className="border-t border-[#E0E7FF] px-8 py-8 sm:px-12">
            <div className="grid gap-8 md:grid-cols-[1fr_260px] md:items-end">
              <div>
                <p className="text-sm leading-7 text-slate-500">
                  Documento emitido eletronicamente pela MediNexus. A validade
                  clínica e legal depende das informações registradas pelo
                  profissional responsável e das regras aplicáveis ao atendimento.
                </p>

                {document.released_to_patient && (
                  <p className="mt-3 text-sm font-semibold text-emerald-700">
                    Documento liberado para visualização do paciente.
                  </p>
                )}
              </div>

              <div className="text-center">
                <div className="mb-3 h-px bg-slate-300" />
                <p className="font-bold text-slate-950">
                  {document.doctor_name || "Médico responsável"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  CRM {document.doctor_crm || "não informado"}
                  {document.doctor_crm_state
                    ? ` / ${document.doctor_crm_state}`
                    : ""}
                </p>
              </div>
            </div>
          </section>
        </article>

        <p className="document-actions mt-4 text-center text-xs font-semibold text-slate-400">
          Para baixar em PDF, clique em “Imprimir / salvar PDF” e escolha
          “Salvar como PDF”. Nome sugerido: {fileName}.pdf
        </p>
      </section>
    </main>
  );
}

function DocumentBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[28px] border border-[#E0E7FF] bg-[#F8FAFC] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6E56CF]">
        {title}
      </p>
      <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-800">
        {content}
      </p>
    </div>
  );
}