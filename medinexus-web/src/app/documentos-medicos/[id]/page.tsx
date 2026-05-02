"use client";

import type { ReactNode } from "react";
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

function formatLongDate(value?: string | null) {
  const date = value ? new Date(value) : new Date();

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
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

function getOfficialTitle(type: DocumentType) {
  const labels: Record<DocumentType, string> = {
    prescription: "RECEITA MÉDICA",
    exam_request: "SOLICITAÇÃO DE EXAME",
    medical_certificate: "ATESTADO MÉDICO",
    attendance_declaration: "DECLARAÇÃO DE COMPARECIMENTO",
    clinical_summary: "RESUMO CLÍNICO",
  };

  return labels[type] || "DOCUMENTO MÉDICO";
}

function getContentText(content: Record<string, unknown> | null, key: string) {
  const value = content?.[key];

  if (typeof value === "string") return value.trim();
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

function getDocumentNumber(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function getDaysText(days?: number | null) {
  if (!days || days <= 0) return "0 dia";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

function getPatientPlan(patient: PatientRow | null) {
  const operator = patient?.health_plan_operator?.trim();
  const product = patient?.health_plan_product_name?.trim();

  if (!operator && !product) return "Particular / não informado";

  return [operator, product].filter(Boolean).join(" — ");
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

    if (patientResponse.error) {
      setMessage(`Erro ao carregar paciente: ${patientResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (clinicResponse.error) {
      setMessage(`Erro ao carregar clínica: ${clinicResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

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

  const officialTitle = document
    ? getOfficialTitle(document.document_type)
    : "DOCUMENTO MÉDICO";

  const screenTitle = document
    ? document.title || getDocumentLabel(document.document_type)
    : "Documento médico";

  const issuedAt = document?.issued_at || document?.created_at;

  const fileName = useMemo(() => {
    return normalizeFileName(`${officialTitle}-${patientName || "paciente"}`);
  }, [officialTitle, patientName]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F3F5FB]">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-slate-600">Carregando documento médico...</p>
        </section>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="min-h-screen bg-[#F3F5FB]">
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

  const medicationName = getContentText(document.content, "medication_name");
  const medicationUse = getContentText(document.content, "medication_use");
  const examName = getContentText(document.content, "exam_name");
  const examObservation = getContentText(document.content, "exam_observation");
  const notes = getContentText(document.content, "notes");

  return (
    <main className="min-h-screen bg-[#F3F5FB]">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 210mm;
            min-height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body > header,
          .document-actions,
          .no-print {
            display: none !important;
          }

          .document-stage {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }

          .medical-paper {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 18mm 20mm 15mm 20mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .screen-only-shadow {
            box-shadow: none !important;
          }
        }
      `}</style>

      <section className="document-actions mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-[28px] border border-[#D9D6F4] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#283C7A]">
              Visualização do documento
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">
              {screenTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Para o PDF ficar limpo, desative “Cabeçalhos e rodapés” na tela de
              impressão.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {document.appointment_id && (
              <Link
                href={`/medico/consultas/${document.appointment_id}`}
                className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-5 py-3 text-sm font-bold text-[#5E4B9A] transition hover:bg-[#F6F3FF]"
              >
                Voltar ao prontuário
              </Link>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#213366]"
            >
              Imprimir / salvar PDF
            </button>
          </div>
        </div>
      </section>

      <section className="document-stage flex justify-center px-4 pb-12 sm:px-6 lg:px-8">
        <article className="medical-paper screen-only-shadow relative flex min-h-[1122px] w-full max-w-[794px] flex-col bg-white px-16 py-14 text-slate-950 shadow-[0_30px_100px_-70px_rgba(15,23,42,0.65)]">
          <div className="border-b border-slate-300 pb-5">
            <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <p className="text-[22px] font-bold leading-tight text-[#283C7A]">
                  {clinicName}
                </p>

                <div className="mt-2 max-w-[480px] space-y-1 text-[11px] leading-5 text-slate-600">
                  <p>{buildClinicAddress(clinic)}</p>
                  {clinic?.phone && <p>Telefone: {clinic.phone}</p>}
                  {clinic?.email && <p>E-mail: {clinic.email}</p>}
                </div>
              </div>

              <div className="text-right text-[11px] leading-5 text-slate-500">
                <p className="font-bold uppercase tracking-[0.14em] text-slate-500">
                  MediNexus
                </p>
                <p>Documento Nº {getDocumentNumber(document.id)}</p>
                <p>Emitido em {formatDateTime(issuedAt)}</p>
              </div>
            </div>
          </div>

          <section className="mt-10 text-center">
            <h2 className="text-[20px] font-bold uppercase tracking-[0.04em] text-slate-950">
              {officialTitle}
            </h2>
          </section>

          <section className="mt-9 border border-slate-300">
            <div className="border-b border-slate-300 bg-slate-50 px-4 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Identificação do paciente
              </p>
            </div>

            <div className="grid text-[13px] leading-6">
              <PatientCell label="Paciente" value={patientName} />
              <PatientCell label="CPF" value={patient?.cpf || "Não informado"} />
              <PatientCell
                label="Nascimento"
                value={`${formatDate(patient?.birth_date)} • ${getAge(
                  patient?.birth_date
                )}`}
              />
              <PatientCell
                label="Telefone"
                value={patient?.phone || "Não informado"}
              />
              <PatientCell label="Convênio" value={getPatientPlan(patient)} />
              <PatientCell
                label="Carteirinha"
                value={patient?.health_plan_card_number || "Não informado"}
              />
            </div>
          </section>

          <section className="mt-11 flex-1">
            {document.document_type === "prescription" && (
              <div>
                <PaperSectionTitle>Prescrição</PaperSectionTitle>

                <div className="mt-6 space-y-7">
                  <PaperItem
                    title="Medicamento"
                    content={medicationName || "Medicamento não informado."}
                  />

                  <PaperItem
                    title="Modo de uso"
                    content={medicationUse || "Modo de uso não informado."}
                  />

                  {notes && <PaperItem title="Orientações" content={notes} />}
                </div>
              </div>
            )}

            {document.document_type === "exam_request" && (
              <div>
                <PaperSectionTitle>Exame solicitado</PaperSectionTitle>

                <div className="mt-6 space-y-7">
                  <PaperItem
                    title="Exame"
                    content={examName || "Exame não informado."}
                  />

                  <PaperItem
                    title="Indicação clínica"
                    content={
                      document.clinical_indication ||
                      "Indicação clínica não informada."
                    }
                  />

                  {examObservation && (
                    <PaperItem title="Observações" content={examObservation} />
                  )}

                  {document.cid_code && (
                    <PaperItem
                      title="CID"
                      content={`${document.cid_code}${
                        document.cid_description
                          ? ` — ${document.cid_description}`
                          : ""
                      }`}
                    />
                  )}
                </div>
              </div>
            )}

            {document.document_type === "medical_certificate" && (
              <div>
                <p className="text-[15.5px] leading-9 text-slate-900">
                  Atesto, para os devidos fins, que{" "}
                  <strong>{patientName}</strong>, portador(a) do CPF{" "}
                  <strong>{patient?.cpf || "não informado"}</strong>, foi
                  atendido(a) nesta unidade e necessita de afastamento de suas
                  atividades por{" "}
                  <strong>{getDaysText(document.days_off)}</strong>.
                </p>

                <div className="mt-9 space-y-7">
                  {document.cid_code && (
                    <PaperItem
                      title="CID"
                      content={`${document.cid_code}${
                        document.cid_description
                          ? ` — ${document.cid_description}`
                          : ""
                      }`}
                    />
                  )}

                  {document.purpose && (
                    <PaperItem title="Finalidade" content={document.purpose} />
                  )}

                  {notes && <PaperItem title="Observações" content={notes} />}
                </div>
              </div>
            )}

            {document.document_type === "attendance_declaration" && (
              <div>
                <p className="text-[15.5px] leading-9 text-slate-900">
                  Declaro, para os devidos fins, que{" "}
                  <strong>{patientName}</strong>, portador(a) do CPF{" "}
                  <strong>{patient?.cpf || "não informado"}</strong>,
                  compareceu ao atendimento médico nesta unidade na data de{" "}
                  <strong>{formatDateTime(issuedAt)}</strong>.
                </p>

                <div className="mt-9 space-y-7">
                  {document.purpose && (
                    <PaperItem title="Finalidade" content={document.purpose} />
                  )}

                  {notes && <PaperItem title="Observações" content={notes} />}
                </div>
              </div>
            )}

            {document.document_type === "clinical_summary" && (
              <div>
                <PaperSectionTitle>Resumo clínico</PaperSectionTitle>

                <div className="mt-6 space-y-7">
                  <PaperItem
                    title="Resumo"
                    content={
                      document.clinical_indication ||
                      "Resumo clínico não informado."
                    }
                  />

                  {notes && <PaperItem title="Conduta" content={notes} />}
                </div>
              </div>
            )}
          </section>

          <section className="mt-14">
            <p className="text-center text-[13px] text-slate-700">
              {clinic?.address_city || clinic?.city || "Cidade"},{" "}
              {formatLongDate(issuedAt)}.
            </p>

            <div className="mt-20 flex justify-center">
              <div className="w-[350px] text-center">
                <div className="border-t border-slate-500 pt-3" />

                <p className="text-[14px] font-bold leading-5 text-slate-950">
                  {document.doctor_name || "Médico responsável"}
                </p>

                <p className="mt-1 text-[12px] text-slate-600">
                  CRM {document.doctor_crm || "não informado"}
                  {document.doctor_crm_state
                    ? ` / ${document.doctor_crm_state}`
                    : ""}
                </p>
              </div>
            </div>
          </section>

          <footer className="mt-auto border-t border-slate-200 pt-3">
            <div className="grid gap-1 text-[9.5px] leading-4 text-slate-500 sm:grid-cols-[1fr_auto] sm:items-center">
              <p>
                Documento emitido eletronicamente pela MediNexus. Validade
                condicionada às informações registradas pelo profissional.
              </p>
              <p>Nº {getDocumentNumber(document.id)}</p>
            </div>
          </footer>
        </article>
      </section>
    </main>
  );
}

function PatientCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-200 px-4 py-2">
      <span className="font-bold text-slate-950">{label}:</span>{" "}
      <span className="text-slate-700">{value}</span>
    </div>
  );
}

function PaperSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="border-b border-slate-300 pb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-[#283C7A]">
      {children}
    </h3>
  );
}

function PaperItem({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 whitespace-pre-line text-[14.5px] leading-8 text-slate-900">
        {content}
      </p>
    </div>
  );
}