"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  GenericRow,
  formatDate,
  formatDateTime,
  getClinicLocation,
  getClinicName,
  getDetailSections,
  getDoctorCrm,
  getDoctorName,
  getDocumentSubtitle,
  getDocumentType,
  getIssuedAt,
  getMainText,
  getPatientBirthDate,
  getPatientDocument,
  getPatientName,
  getPatientPhone,
  getSignatureStatusLabel,
  getStatus,
  valueOf,
} from "../../lib/medical-document-utils";

type DetailItem = {
  title: string;
  value: string;
  priority?: number;
};

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function normalizeContent(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function upsertDetail(
  sections: DetailItem[],
  title: string,
  value: string,
  priority: number
) {
  const exists = sections.some(
    (item) => normalizeTitle(item.title) === normalizeTitle(title)
  );

  if (!exists) {
    sections.push({
      title,
      value,
      priority,
    });
  }
}

function buildRequiredDetails(
  rawSections: DetailItem[],
  documentType: string
): DetailItem[] {
  const sections = [...rawSections];
  const isCertificate = documentType.toLowerCase().includes("atestado");

  if (isCertificate) {
    upsertDetail(sections, "CID / Classificação", "Não informado", 1);
    upsertDetail(sections, "Dias de afastamento", "Não informado", 3);
    upsertDetail(sections, "Finalidade", "Não informada", 5);
  }

  return sections.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

function removeDuplicatedDetails(
  sections: DetailItem[],
  mainText: string
): DetailItem[] {
  const normalizedMainText = normalizeContent(mainText);

  return sections.filter((section) => {
    const title = normalizeTitle(section.title);
    const value = normalizeContent(section.value);

    if (!value) return false;

    if (title.includes("observacoes") || title.includes("observacao")) {
      if (value === "nao informado" || value === "não informado") return false;
      if (normalizedMainText && value === normalizedMainText) return false;
    }

    return true;
  });
}

export default function DocumentoMedicoPage() {
  const params = useParams();
  const router = useRouter();

  const documentId = String(params?.id || "");

  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [medicalDocument, setMedicalDocument] = useState<GenericRow | null>(
    null
  );
  const [patient, setPatient] = useState<GenericRow | null>(null);
  const [doctor, setDoctor] = useState<GenericRow | null>(null);
  const [clinic, setClinic] = useState<GenericRow | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  async function loadDocument() {
    setLoading(true);
    setMessage("");

    if (!documentId) {
      setMessage("Documento não informado.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("medical_documents")
      .select("*")
      .eq("id", documentId)
      .maybeSingle();

    if (error) {
      setMessage(`Erro ao carregar documento: ${error.message}`);
      setLoading(false);
      return;
    }

    if (!data) {
      setMessage("Documento não encontrado.");
      setLoading(false);
      return;
    }

    const doc = data as GenericRow;
    setMedicalDocument(doc);

    const patientId = valueOf(doc, ["patient_id"]);
    const doctorId = valueOf(doc, ["doctor_id"]);
    const clinicId = valueOf(doc, ["clinic_id"]);

    if (patientId) {
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .maybeSingle();

      setPatient((patientData as GenericRow) || null);
    }

    if (doctorId) {
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", doctorId)
        .maybeSingle();

      setDoctor((doctorData as GenericRow) || null);
    }

    if (clinicId) {
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", clinicId)
        .maybeSingle();

      setClinic((clinicData as GenericRow) || null);
    }

    setLoading(false);
  }

  const documentType = useMemo(
    () => getDocumentType(medicalDocument),
    [medicalDocument]
  );

  const mainText = useMemo(
    () => getMainText(medicalDocument),
    [medicalDocument]
  );

  const rawDetailSections = useMemo(
    () => getDetailSections(medicalDocument),
    [medicalDocument]
  );

  const detailSections = useMemo(() => {
    const required = buildRequiredDetails(rawDetailSections, documentType);
    return removeDuplicatedDetails(required, mainText);
  }, [rawDetailSections, documentType, mainText]);

  const issuedAt = getIssuedAt(medicalDocument);
  const validationToken = valueOf(medicalDocument, ["validation_token"]);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || origin || "http://localhost:3000";

  const validationUrl =
    appUrl && documentId && validationToken
      ? `${appUrl}/validar-documento/${documentId}?token=${validationToken}`
      : "";

  const signatureValidationUrl = valueOf(medicalDocument, [
    "signature_validation_url",
  ]);

  const finalValidationUrl = signatureValidationUrl || validationUrl;

  const patientBirthDate = getPatientBirthDate(patient, medicalDocument);
  const patientPhone = getPatientPhone(patient, medicalDocument);

  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F]">
      <section className="screen-actions border-b border-[#E7DDD7] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#2E393F] transition hover:bg-[#FAF6F3]"
            >
              Voltar
            </button>

            <Link
              href="/documentos"
              className="rounded-full border border-[#D8CCC5] bg-white px-5 py-3 text-sm font-semibold text-[#2E393F] transition hover:bg-[#FAF6F3]"
            >
              Meus documentos
            </Link>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-[#164957] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
          >
            Imprimir / salvar PDF
          </button>
        </div>
      </section>

      {loading ? (
        <section className="mx-auto max-w-[920px] px-5 py-12 sm:px-8">
          <div className="rounded-[2rem] border border-[#E7DDD7] bg-white/75 p-8 text-sm text-[#2E393F]/60 shadow-sm">
            Carregando documento médico...
          </div>
        </section>
      ) : message ? (
        <section className="mx-auto max-w-[920px] px-5 py-12 sm:px-8">
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
            {message}
          </div>
        </section>
      ) : (
        <section className="document-preview mx-auto max-w-[900px] px-5 py-10 sm:px-8">
          <article className="medical-document">
            <header className="doc-header">
              <div className="doc-brand">
                <div className="doc-logo">
                  <Image
                    src="/brand/medinexus-logo.png"
                    alt="MediNexus"
                    fill
                    priority
                    className="object-contain object-left"
                  />
                </div>

                <div>
                  <p className="doc-kicker">Documento médico</p>
                  <h1 className="doc-heading">{documentType}</h1>
                  <p className="doc-description">
                    {getDocumentSubtitle(medicalDocument)}
                  </p>
                </div>
              </div>

              <div className="doc-status">
                <p className="mini-label">Status</p>
                <p className="status-main">{getStatus(medicalDocument)}</p>
                <p className="status-date">{formatDateTime(issuedAt)}</p>
              </div>
            </header>

            <section className="identity-grid">
              <div className="identity-card">
                <p className="mini-label">Paciente</p>
                <h2>{getPatientName(patient, medicalDocument)}</h2>
                <p>CPF/documento: {getPatientDocument(patient, medicalDocument)}</p>
                <p>
                  Nascimento:{" "}
                  {patientBirthDate
                    ? formatDate(patientBirthDate)
                    : "Não informado"}
                </p>
                <p>Telefone: {patientPhone || "Não informado"}</p>
              </div>

              <div className="identity-card">
                <p className="mini-label">Profissional</p>
                <h2>{getDoctorName(doctor, medicalDocument)}</h2>
                <p>{getDoctorCrm(doctor, medicalDocument)}</p>
                <p>Responsável pela emissão</p>
              </div>

              <div className="identity-card">
                <p className="mini-label">Unidade</p>
                <h2>{getClinicName(clinic, medicalDocument)}</h2>
                <p>{getClinicLocation(clinic, medicalDocument)}</p>
                <p>Atendimento registrado na MediNexus</p>
              </div>
            </section>

            <section className="doc-content-area">
              {mainText && (
                <div className="clinical-block">
                  <p className="mini-label">Conteúdo principal</p>
                  <div className="clinical-text">{mainText}</div>
                </div>
              )}

              {detailSections.length > 0 && (
                <div className="detail-grid">
                  {detailSections.map((section) => (
                    <div
                      key={`${section.title}-${section.value}`}
                      className="detail-block"
                    >
                      <p className="mini-label">{section.title}</p>
                      <p>{section.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="doc-lower">
              <div className="signature-block">
                <div className="signature-line" />
                <p className="signature-name">
                  {getDoctorName(doctor, medicalDocument)}
                </p>
                <p className="signature-crm">
                  {getDoctorCrm(doctor, medicalDocument)}
                </p>
              </div>

              <div className="validation-row">
                <div className="validation-copy">
                  <p className="mini-label">Validação</p>
                  <p>
                    {getSignatureStatusLabel(medicalDocument)}. Escaneie o QR
                    Code para verificar a autenticidade deste documento na
                    plataforma MediNexus.
                  </p>
                </div>

                {finalValidationUrl && (
                  <div className="qr-box">
                    <QRCodeSVG value={finalValidationUrl} size={104} />
                    <p>Validar documento</p>
                  </div>
                )}
              </div>
            </section>

            <footer className="doc-footer">
              <p>MediNexus • Saúde conectada</p>
              <p>ID do documento: {documentId}</p>
            </footer>
          </article>
        </section>
      )}

      <style jsx global>{`
        .medical-document {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 1120px;
          overflow: hidden;
          border: 1px solid #e7ddd7;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 35px 100px -80px rgba(46, 57, 63, 0.75);
          font-family: Arial, Helvetica, sans-serif;
          color: #2e393f;
        }

        .doc-header {
          display: grid;
          grid-template-columns: 1fr 160px;
          gap: 28px;
          align-items: center;
          padding: 34px 42px;
          border-bottom: 1px solid #d8ccc5;
          background: #faf6f3;
        }

        .doc-brand {
          display: grid;
          gap: 20px;
        }

        .doc-logo {
          position: relative;
          width: 142px;
          height: 34px;
        }

        .doc-kicker,
        .mini-label {
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.035em;
          font-size: 11px;
          line-height: 1.2;
          font-weight: 700;
        }

        .doc-kicker {
          color: #164957;
        }

        .mini-label {
          color: #7a9d8c;
        }

        .doc-heading {
          margin: 8px 0 0;
          font-size: 34px;
          line-height: 1.02;
          letter-spacing: -0.035em;
          font-weight: 720;
          color: #2e393f;
        }

        .doc-description {
          margin: 9px 0 0;
          max-width: 620px;
          font-size: 13px;
          line-height: 1.45;
          color: rgba(46, 57, 63, 0.68);
        }

        .doc-status {
          border: 1px solid #d8ccc5;
          border-radius: 18px;
          background: #ffffff;
          padding: 18px;
        }

        .status-main {
          margin: 8px 0 0;
          font-size: 16px;
          line-height: 1.2;
          font-weight: 700;
        }

        .status-date {
          margin: 8px 0 0;
          font-size: 12px;
          line-height: 1.35;
          color: rgba(46, 57, 63, 0.62);
        }

        .identity-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid #e7ddd7;
        }

        .identity-card {
          min-height: 150px;
          padding: 24px 22px;
          border-right: 1px solid #e7ddd7;
        }

        .identity-card:last-child {
          border-right: 0;
        }

        .identity-card h2 {
          margin: 10px 0 0;
          font-size: 17px;
          line-height: 1.25;
          font-weight: 700;
          color: #2e393f;
        }

        .identity-card p:not(.mini-label) {
          margin: 7px 0 0;
          font-size: 12.5px;
          line-height: 1.45;
          color: rgba(46, 57, 63, 0.68);
        }

        .doc-content-area {
          padding: 32px 42px 24px;
        }

        .clinical-block {
          margin-bottom: 18px;
        }

        .clinical-text {
          min-height: 120px;
          margin-top: 12px;
          padding: 24px;
          border: 1px solid #d8ccc5;
          border-radius: 18px;
          background: #ffffff;
          font-size: 16px;
          line-height: 1.6;
          color: #2e393f;
          white-space: pre-wrap;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .detail-block {
          min-height: 92px;
          padding: 18px;
          border: 1px solid #d8ccc5;
          border-radius: 16px;
          background: #ffffff;
        }

        .detail-block p:last-child {
          margin: 11px 0 0;
          font-size: 16px;
          line-height: 1.4;
          font-weight: 500;
          color: #2e393f;
        }

        .doc-lower {
          margin-top: auto;
          padding: 18px 42px 22px;
        }

        .signature-block {
          max-width: 470px;
          margin: 0 auto;
          text-align: center;
        }

        .signature-line {
          height: 1px;
          width: 100%;
          background: #2e393f;
        }

        .signature-name {
          margin: 13px 0 0;
          font-size: 16px;
          line-height: 1.25;
          font-weight: 700;
          color: #2e393f;
        }

        .signature-crm {
          margin: 4px 0 0;
          font-size: 12px;
          line-height: 1.3;
          color: rgba(46, 57, 63, 0.62);
        }

        .validation-row {
          display: grid;
          grid-template-columns: 1fr 116px;
          align-items: center;
          gap: 28px;
          margin-top: 34px;
        }

        .validation-copy {
          padding: 18px;
          border: 1px solid #d8ccc5;
          border-radius: 16px;
          background: #ffffff;
        }

        .validation-copy p:last-child {
          margin: 9px 0 0;
          font-size: 12.5px;
          line-height: 1.45;
          color: rgba(46, 57, 63, 0.68);
        }

        .qr-box {
          text-align: center;
        }

        .qr-box p {
          margin: 5px 0 0;
          font-size: 9px;
          color: rgba(46, 57, 63, 0.55);
        }

        .doc-footer {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: auto;
          padding: 10px 42px;
          border-top: 1px solid #e7ddd7;
          background: #faf6f3;
          font-size: 9px;
          line-height: 1.2;
          color: rgba(46, 57, 63, 0.58);
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          html,
          body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }

          body > header,
          .screen-actions,
          .fixed,
          .floating,
          .navbar,
          nav {
            display: none !important;
          }

          body * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }

          main,
          .document-preview {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }

          .medical-document {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .doc-header {
            height: 40mm !important;
            grid-template-columns: 1fr 40mm !important;
            gap: 10mm !important;
            padding: 7mm 11mm !important;
          }

          .doc-logo {
            width: 38mm !important;
            height: 8mm !important;
          }

          .doc-brand {
            gap: 4mm !important;
          }

          .doc-kicker,
          .mini-label {
            font-size: 8.8pt !important;
            line-height: 1.2 !important;
            letter-spacing: 0.025em !important;
            font-weight: 700 !important;
          }

          .doc-heading {
            margin-top: 1.6mm !important;
            font-size: 25pt !important;
            line-height: 1.02 !important;
            letter-spacing: -0.03em !important;
            font-weight: 700 !important;
          }

          .doc-description {
            margin-top: 2mm !important;
            max-width: 128mm !important;
            font-size: 9.4pt !important;
            line-height: 1.38 !important;
          }

          .doc-status {
            padding: 4mm !important;
            border-radius: 4mm !important;
          }

          .status-main {
            margin-top: 2mm !important;
            font-size: 11pt !important;
            font-weight: 700 !important;
          }

          .status-date {
            margin-top: 2mm !important;
            font-size: 8.8pt !important;
          }

          .identity-grid {
            height: 44mm !important;
          }

          .identity-card {
            min-height: 44mm !important;
            padding: 5mm !important;
          }

          .identity-card h2 {
            margin-top: 2.5mm !important;
            font-size: 12.6pt !important;
            line-height: 1.23 !important;
            font-weight: 700 !important;
          }

          .identity-card p:not(.mini-label) {
            margin-top: 1.8mm !important;
            font-size: 9.5pt !important;
            line-height: 1.38 !important;
          }

          .doc-content-area {
            padding: 7mm 11mm 5mm !important;
          }

          .clinical-block {
            margin-bottom: 4mm !important;
          }

          .clinical-text {
            min-height: 34mm !important;
            margin-top: 2.5mm !important;
            padding: 5mm !important;
            border-radius: 4mm !important;
            font-size: 12.2pt !important;
            line-height: 1.55 !important;
          }

          .detail-grid {
            gap: 4mm !important;
          }

          .detail-block {
            min-height: 23mm !important;
            padding: 4mm !important;
            border-radius: 4mm !important;
          }

          .detail-block p:last-child {
            margin-top: 2.3mm !important;
            font-size: 12pt !important;
            line-height: 1.35 !important;
          }

          .doc-lower {
            padding: 5mm 11mm 5mm !important;
          }

          .signature-block {
            max-width: 105mm !important;
          }

          .signature-name {
            margin-top: 3mm !important;
            font-size: 12pt !important;
            line-height: 1.25 !important;
            font-weight: 700 !important;
          }

          .signature-crm {
            margin-top: 1mm !important;
            font-size: 9.2pt !important;
          }

          .validation-row {
            grid-template-columns: 1fr 28mm !important;
            gap: 7mm !important;
            margin-top: 8mm !important;
          }

          .validation-copy {
            padding: 4mm !important;
            border-radius: 4mm !important;
          }

          .validation-copy p:last-child {
            margin-top: 2mm !important;
            font-size: 9pt !important;
            line-height: 1.4 !important;
          }

          .qr-box svg {
            width: 26mm !important;
            height: 26mm !important;
          }

          .qr-box p {
            margin-top: 1mm !important;
            font-size: 7pt !important;
          }

          .doc-footer {
            height: 8mm !important;
            padding: 2.2mm 11mm !important;
            font-size: 7.4pt !important;
          }
        }
      `}</style>
    </main>
  );
}