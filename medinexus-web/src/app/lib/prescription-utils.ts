import jsPDF from "jspdf";

export type PrescriptionPayload = {
  clinicName: string;
  clinicCity?: string | null;
  clinicState?: string | null;
  doctorName: string;
  doctorCrm: string;
  patientName: string;
  patientPlan?: string | null;
  patientBirthDate?: string | null;
  characterLabel?: string;
  title?: string | null;
  content: string;
  notes?: string | null;
  createdAt?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitText(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text || "", maxWidth);
}

export function generatePrescriptionPdf(payload: PrescriptionPayload) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(248, 244, 242);
  doc.rect(0, 0, 210, 297, "F");

  // Header
  doc.setFillColor(27, 75, 88);
  doc.roundedRect(margin, 12, contentWidth, 20, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MediNexus", margin + 6, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Receituário médico digital", margin + 6, 29);

  // Card topo
  doc.setTextColor(48, 59, 65);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 38, contentWidth, 34, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(payload.title?.trim() || "Receituário médico", margin + 6, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Caráter da solicitação: ${payload.characterLabel || "Rotina"}`,
    margin + 6,
    55
  );
  doc.text(
    `Data de emissão: ${formatDate(payload.createdAt || new Date().toISOString())}`,
    margin + 6,
    61
  );

  doc.text(
    `Clínica: ${payload.clinicName}${payload.clinicCity ? ` â€¢ ${payload.clinicCity}` : ""}${payload.clinicState ? `/${payload.clinicState}` : ""}`,
    margin + 6,
    67
  );

  // Bloco paciente
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 78, contentWidth, 28, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Dados do paciente", margin + 6, 87);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nome: ${payload.patientName}`, margin + 6, 94);
  doc.text(`Plano: ${payload.patientPlan || "-"}`, margin + 6, 100);
  doc.text(`Nascimento: ${formatDate(payload.patientBirthDate)}`, margin + 96, 100);

  // Corpo principal
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 112, contentWidth, 110, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Prescrição / orientações", margin + 6, 122);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const contentLines = splitText(doc, payload.content || "", contentWidth - 12);
  doc.text(contentLines, margin + 6, 131);

  let currentY = 131 + contentLines.length * 6 + 6;

  if (payload.notes?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Observações", margin + 6, currentY);

    currentY += 7;
    doc.setFont("helvetica", "normal");
    const notesLines = splitText(doc, payload.notes, contentWidth - 12);
    doc.text(notesLines, margin + 6, currentY);
    currentY += notesLines.length * 6 + 8;
  }

  // Assinatura
  const signatureY = Math.max(currentY + 10, 236);

  doc.setDrawColor(170, 170, 170);
  doc.line(margin + 40, signatureY, margin + 140, signatureY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(payload.doctorName, pageWidth / 2, signatureY + 7, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`CRM: ${payload.doctorCrm}`, pageWidth / 2, signatureY + 13, {
    align: "center",
  });

  // Rodapé
  doc.setTextColor(89, 78, 134);
  doc.setFontSize(9);
  doc.text(
    "Documento gerado pela plataforma MediNexus",
    pageWidth / 2,
    286,
    { align: "center" }
  );

  return doc;
}

export function downloadPrescriptionPdf(payload: PrescriptionPayload) {
  const doc = generatePrescriptionPdf(payload);
  const fileName = `receituario-${payload.patientName
    .toLowerCase()
    .replace(/\s+/g, "-")}.pdf`;
  doc.save(fileName);
}

export function printPrescription(payload: PrescriptionPayload) {
  const popup = window.open("", "_blank", "width=900,height=1200");

  if (!popup) return;

  const issueDate = formatDate(payload.createdAt || new Date().toISOString());

  popup.document.write(`
    <html>
      <head>
        <title>Receituário - MediNexus</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 24px;
            font-family: Arial, Helvetica, sans-serif;
            background: #F8F4F2;
            color: #303B41;
          }
          .sheet {
            max-width: 820px;
            margin: 0 auto;
            background: white;
            border-radius: 18px;
            padding: 28px;
            box-shadow: 0 18px 45px rgba(0,0,0,0.08);
          }
          .header {
            background: #1B4B58;
            color: white;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 18px;
          }
          .header h1 {
            margin: 0;
            font-size: 30px;
          }
          .header p {
            margin: 6px 0 0;
            opacity: .9;
          }
          .card {
            border: 1px solid #E6E1DE;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 16px;
          }
          .title {
            font-size: 28px;
            font-weight: 700;
            color: #303B41;
            margin: 0 0 8px;
          }
          .sub {
            font-size: 14px;
            color: #5C6870;
            margin-bottom: 6px;
          }
          .content {
            white-space: pre-wrap;
            line-height: 1.7;
            font-size: 16px;
          }
          .signature {
            margin-top: 42px;
            text-align: center;
          }
          .line {
            width: 320px;
            border-top: 1px solid #8A8A8A;
            margin: 0 auto 12px;
          }
          .muted { color: #66727A; }
          .badge {
            display: inline-block;
            background: #EFE8FF;
            color: #594E86;
            padding: 8px 14px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 13px;
            margin-bottom: 10px;
          }
          @media print {
            body { background: white; padding: 0; }
            .sheet { box-shadow: none; border-radius: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <h1>MediNexus</h1>
            <p>Receituário médico digital</p>
          </div>

          <div class="card">
            <div class="badge">Caráter da solicitação: ${escapeHtml(
              payload.characterLabel || "Rotina"
            )}</div>
            <div class="title">${escapeHtml(payload.title?.trim() || "Receituário médico")}</div>
            <div class="sub">Data de emissão: ${escapeHtml(issueDate)}</div>
            <div class="sub">
              Clínica: ${escapeHtml(payload.clinicName)}
              ${payload.clinicCity ? " â€¢ " + escapeHtml(payload.clinicCity) : ""}
              ${payload.clinicState ? "/" + escapeHtml(payload.clinicState) : ""}
            </div>
          </div>

          <div class="card">
            <strong>Paciente:</strong> ${escapeHtml(payload.patientName)}<br />
            <strong>Plano:</strong> ${escapeHtml(payload.patientPlan || "-")}<br />
            <strong>Nascimento:</strong> ${escapeHtml(formatDate(payload.patientBirthDate))}
          </div>

          <div class="card">
            <h3 style="margin-top:0;">Prescrição / orientações</h3>
            <div class="content">${escapeHtml(payload.content)}</div>
          </div>

          ${
            payload.notes?.trim()
              ? `
            <div class="card">
              <h3 style="margin-top:0;">Observações</h3>
              <div class="content">${escapeHtml(payload.notes)}</div>
            </div>
          `
              : ""
          }

          <div class="signature">
            <div class="line"></div>
            <div><strong>${escapeHtml(payload.doctorName)}</strong></div>
            <div class="muted">CRM: ${escapeHtml(payload.doctorCrm)}</div>
          </div>
        </div>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  popup.document.close();
}


