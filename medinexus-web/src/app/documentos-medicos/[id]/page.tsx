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
  getPrescriptionItems,
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

    setOrigin(window.location.origin);
    const doc = data as GenericRow;
    setMedicalDocument(doc);
    const snapshot = doc.identity_snapshot as { patient?: GenericRow; doctor?: GenericRow; clinic?: GenericRow } | null;
    if (snapshot) { setPatient(snapshot.patient || null); setDoctor(snapshot.doctor || null); setClinic(snapshot.clinic || null); setLoading(false); return; }

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




  useEffect(() => {
    const initialLoad = setTimeout(() => void loadDocument(), 0);
    return () => clearTimeout(initialLoad);
  }, [documentId]);

  const documentType = useMemo(
    () => getDocumentType(medicalDocument),
    [medicalDocument]
  );

  const mainText = useMemo(
    () => getMainText(medicalDocument),
    [medicalDocument]
  );

  const medicationItems = getPrescriptionItems(medicalDocument);

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
      ? `${appUrl}/validar-documentos/${documentId}?token=${validationToken}`
      : "";

  const signatureValidationUrl = valueOf(medicalDocument, [
    "signature_validation_url",
  ]);

  const finalValidationUrl = signatureValidationUrl || validationUrl;

  const patientBirthDate = getPatientBirthDate(patient, medicalDocument);
  const patientPhone = getPatientPhone(patient, medicalDocument);

  return (
    <main className="min-h-screen bg-mn-sand text-mn-graphite">
      <section className="screen-actions border-b border-mn-border bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full border border-mn-border bg-white px-5 py-3 text-sm font-semibold text-mn-graphite transition hover:bg-mn-sand"
            >
              Voltar
            </button>

            <Link
              href="/documentos"
              className="rounded-full border border-mn-border bg-white px-5 py-3 text-sm font-semibold text-mn-graphite transition hover:bg-mn-sand"
            >
              Meus documentos
            </Link>
          </div>

          {valueOf(medicalDocument, ["signature_status"]) === "signed" && /^https:\/\//.test(valueOf(medicalDocument, ["signed_pdf_url"])) ? <a className="mn-button" href={valueOf(medicalDocument, ["signed_pdf_url"])} target="_blank" rel="noopener noreferrer">Abrir PDF certificado original</a> : <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-mn-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
          >
            Imprimir / salvar PDF
          </button>}
        </div>
      </section>

      {loading ? (
        <section className="mx-auto max-w-[920px] px-5 py-12 sm:px-8">
          <div className="rounded-2xl border border-mn-border bg-white/75 p-8 text-sm text-mn-graphite/60 shadow-sm">
            Carregando documento médico...
          </div>
        </section>
      ) : message ? (
        <section className="mx-auto max-w-[920px] px-5 py-12 sm:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
            {message}
          </div>
        </section>
      ) : (
        <section className="document-preview mx-auto max-w-[900px] px-5 py-10 sm:px-8">
          <article className="medical-document">
            {valueOf(medicalDocument, ["status"]) === "draft" && <div className="mb-5 border-2 border-amber-700 p-3 text-center text-sm font-bold">RASCUNHO — PENDENTE DE ASSINATURA DIGITAL ICP-BRASIL<br />Não emitido para uso como documento médico.</div>}
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
                <p>{[valueOf(clinic, ["address_street"]), valueOf(clinic, ["address_number"]), valueOf(clinic, ["address_complement"])].filter(Boolean).join(", ") || valueOf(clinic, ["address_text"])}</p>
              </div>
            </section>

            <section className="doc-content-area">
              {medicationItems.map((item,index)=><div className="medication-block" key={`${index}-${item.name}`}><h2>{item.name}</h2>{item.details.map(detail=><p key={detail}>{detail}</p>)}</div>)}
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
                {valueOf(medicalDocument, ["signature_image"]) && <Image src={valueOf(medicalDocument, ["signature_image"])} alt="Assinatura autorizada do médico" width={280} height={78} unoptimized className="signature-image" />}
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
                    {valueOf(medicalDocument, ["signature_image"]) ? "Assinatura manuscrita autorizada pelo médico. Registro verificável na plataforma" : getSignatureStatusLabel(medicalDocument)}. Escaneie o QR
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
        .medication-block { break-inside: avoid; margin-bottom: 16px; } .medication-block h2 { font-size: 18px; font-weight: 700; margin-bottom: 8px; } .medication-block p { font-size: 12px; line-height: 1.6; }
        .medical-document { width: 100%; min-height: 1040px; padding: 32px; border: 1px solid #d4dadd; background: white; box-shadow: 0 20px 80px -55px #16495780; font-family: Arial, Helvetica, sans-serif; color: #18272d; overflow-wrap: anywhere; }
        .doc-header { display: grid; grid-template-columns: 1fr 155px; gap: 20px; align-items: start; padding-bottom: 18px; border-bottom: 3px solid #164957; }
        .doc-brand { display: grid; gap: 14px; } .doc-logo { position: relative; width: 138px; height: 35px; }
        .doc-kicker, .mini-label { margin: 0; font-size: 9px; line-height: 1.4; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #52676c; }
        .doc-heading { margin: 4px 0; font-size: 23px; line-height: 1.2; font-weight: 700; text-transform: uppercase; }
        .doc-description { font-size: 11px; color: #52676c; line-height: 1.5; }
        .doc-status { border: 1px solid #b7c4c8; padding: 12px; } .status-main { font-size: 13px; font-weight: 700; margin: 5px 0; } .status-date { font-size: 11px; }
        .identity-grid { display: grid; grid-template-columns: 1.2fr 1fr; border: 1px solid #b7c4c8; margin-top: 16px; }
        .identity-card { padding: 12px; border-bottom: 1px solid #b7c4c8; } .identity-card:first-child { grid-row: span 2; border-right: 1px solid #b7c4c8; border-bottom: 0; } .identity-card:last-child { border-bottom: 0; }
        .identity-card h2 { margin: 5px 0; font-size: 13px; font-weight: 700; } .identity-card p:not(.mini-label) { font-size: 11px; line-height: 1.6; margin: 3px 0; }
        .doc-content-area { padding: 22px 0; } .clinical-block { margin-bottom: 18px; } .clinical-text { white-space: pre-wrap; margin-top: 8px; font-size: 13px; line-height: 1.8; }
        .detail-grid { display: block; border-top: 1px solid #b7c4c8; } .detail-block { display: grid; grid-template-columns: 145px 1fr; gap: 14px; border-bottom: 1px solid #b7c4c8; padding: 10px 0; } .detail-block p:last-child { white-space: pre-wrap; font-size: 12px; line-height: 1.6; }
        .doc-lower { margin-top: 34px; } .signature-block { max-width: 340px; margin: 0 auto; text-align: center; } .signature-image { margin: 0 auto 5px; object-fit: contain; max-height: 78px; } .signature-line { border-top: 1px solid #52676c; } .signature-name { font-size: 12px; font-weight: 700; margin: 7px 0 3px; } .signature-crm { font-size: 11px; }
        .validation-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: 30px; border-top: 1px solid #b7c4c8; padding-top: 16px; } .validation-copy { max-width: 480px; } .validation-copy p:last-child { font-size: 10px; line-height: 1.6; margin-top: 5px; } .qr-box { text-align: center; flex-shrink: 0; } .qr-box p { font-size: 8px; margin-top: 4px; }
        .doc-footer { border-top: 1px solid #b7c4c8; display: flex; justify-content: space-between; gap: 12px; padding-top: 10px; margin-top: 18px; font-size: 8px; }
        @media screen and (max-width: 600px) { .medical-document { padding: 18px; min-height: 0; } .doc-header { grid-template-columns: 1fr; } .doc-status { display: flex; align-items: center; gap: 10px; } .doc-heading { font-size: 20px; } .identity-grid { grid-template-columns: 1fr; } .identity-card:first-child { grid-row: auto; border-right: 0; border-bottom: 1px solid #b7c4c8; } .detail-block { grid-template-columns: 1fr; gap: 5px; } .doc-footer { flex-direction: column; } }
        @media print {
          @page { size: A4; margin: 14mm; }
          html, body, main { margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
          body > header, .screen-actions, nav, .fixed { display: none !important; }
          .document-preview { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
          .medical-document { display: block; width: auto; min-height: 0; padding: 0; border: 0; box-shadow: none; overflow: visible; }
          .doc-header, .identity-grid, .signature-block, .detail-block, .doc-footer { break-inside: avoid; }
          .doc-lower { margin-top: 6mm; } .validation-row { margin-top: 4mm; padding-top: 3mm; break-inside: avoid; } .doc-content-area { padding: 4mm 0; } .clinical-text { font-size: 10pt; line-height: 1.5; }
          .clinical-text { orphans: 3; widows: 3; }
          .doc-heading { font-size: 18pt; } .doc-kicker, .mini-label { font-size: 8pt; } .qr-box svg { width: 23mm; height: 23mm; }
        }
      `}</style>
    </main>
  );
}