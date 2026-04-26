"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type MaybeArray<T> = T | T[] | null | undefined;

type PrescriptionRow = {
  id: string;
  appointment_id: string;
  patient_id: string;
  clinic_id: string;
  doctor_id: string;
  specialty_id: string | null;
  document_type:
    | "medication"
    | "exam"
    | "freeform"
    | "sick_note"
    | "attendance_declaration";
  title: string | null;
  content: string | null;
  guidance: string | null;
  issued_at: string | null;
  created_at: string;
  clinics?: MaybeArray<{
    trade_name: string | null;
    city: string | null;
    state: string | null;
  }>;
  doctors?: MaybeArray<{
    name: string | null;
    crm: string | null;
    crm_state: string | null;
  }>;
  specialties?: MaybeArray<{
    name: string | null;
  }>;
  appointments?: MaybeArray<{
    confirmed_start_at: string | null;
    confirmed_end_at: string | null;
  }>;
};

type PatientProfile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type PatientRow = {
  birth_date: string | null;
  default_health_plan_id: string | null;
};

type HealthPlanRow = {
  name: string | null;
};

type DocumentItem = {
  id: string;
  document_type:
    | "medication"
    | "exam"
    | "freeform"
    | "sick_note"
    | "attendance_declaration";
  title: string | null;
  content: string | null;
  guidance: string | null;
  issued_at: string | null;
  created_at: string;
  clinic: {
    trade_name: string | null;
    city: string | null;
    state: string | null;
  } | null;
  doctor: {
    name: string | null;
    crm: string | null;
    crm_state: string | null;
  } | null;
  specialty: {
    name: string | null;
  } | null;
  appointment: {
    confirmed_start_at: string | null;
    confirmed_end_at: string | null;
  } | null;
};

function pickOne<T>(value: MaybeArray<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDate(value: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleDateString("pt-BR");
}

function formatBirthDate(value: string | null) {
  if (!value) return "Não informada";

  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDocumentTypeLabel(type: DocumentItem["document_type"]) {
  switch (type) {
    case "medication":
      return "Receita medicamentosa";
    case "exam":
      return "Solicitação de exame";
    case "freeform":
      return "Documento livre";
    case "sick_note":
      return "Atestado médico";
    case "attendance_declaration":
      return "Declaração de comparecimento";
    default:
      return "Documento médico";
  }
}

function getDocumentTypeBadge(type: DocumentItem["document_type"]) {
  switch (type) {
    case "medication":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "exam":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "freeform":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "sick_note":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "attendance_declaration":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export default function DocumentosMedicosPage() {
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [healthPlanName, setHealthPlanName] = useState("Não informado");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

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
      setMessage("Você precisa estar logado para acessar seus documentos médicos.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const [profileResponse, patientResponse, documentsResponse] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", user.id)
          .maybeSingle<PatientProfile>(),
        supabase
          .from("patients")
          .select("birth_date, default_health_plan_id")
          .eq("id", user.id)
          .maybeSingle<PatientRow>(),
        supabase
          .from("prescriptions")
          .select(`
            id,
            appointment_id,
            patient_id,
            clinic_id,
            doctor_id,
            specialty_id,
            document_type,
            title,
            content,
            guidance,
            issued_at,
            created_at,
            clinics (
              trade_name,
              city,
              state
            ),
            doctors (
              name,
              crm,
              crm_state
            ),
            specialties (
              name
            ),
            appointments (
              confirmed_start_at,
              confirmed_end_at
            )
          `)
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

    if (profileResponse.error) {
      setMessage(`Erro ao carregar perfil: ${profileResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (patientResponse.error) {
      setMessage(`Erro ao carregar dados do paciente: ${patientResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (documentsResponse.error) {
      setMessage(`Erro ao carregar documentos: ${documentsResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setProfile(profileResponse.data || null);
    setPatient(patientResponse.data || null);

    if (patientResponse.data?.default_health_plan_id) {
      const { data: planData } = await supabase
        .from("health_plans")
        .select("name")
        .eq("id", patientResponse.data.default_health_plan_id)
        .maybeSingle<HealthPlanRow>();

      setHealthPlanName(planData?.name || "Não informado");
    } else {
      setHealthPlanName("Não informado");
    }

    const rawDocuments = (documentsResponse.data || []) as PrescriptionRow[];

    const normalizedDocuments: DocumentItem[] = rawDocuments.map((item) => ({
      id: item.id,
      document_type: item.document_type,
      title: item.title,
      content: item.content,
      guidance: item.guidance,
      issued_at: item.issued_at,
      created_at: item.created_at,
      clinic: pickOne(item.clinics),
      doctor: pickOne(item.doctors),
      specialty: pickOne(item.specialties),
      appointment: pickOne(item.appointments),
    }));

    setDocuments(normalizedDocuments);
    setLoading(false);
  }

  async function handleDownloadPdf(item: DocumentItem) {
    setDownloadingId(item.id);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 16;
      const width = pageWidth - margin * 2;
      let y = 18;

      const drawHeader = () => {
        doc.setFillColor(27, 75, 88);
        doc.roundedRect(margin, y, width, 20, 4, 4, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("MediNexus", margin + 6, y + 9);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Documento médico digital", margin + 6, y + 15);

        y += 28;
        doc.setTextColor(48, 59, 65);
      };

      const ensureSpace = (height: number) => {
        if (y + height > pageHeight - 18) {
          doc.addPage();
          y = 18;
        }
      };

      const drawBlock = (label: string, value: string) => {
        const safeValue = value?.trim() ? value.trim() : "Não informado";
        const lines = doc.splitTextToSize(safeValue, width - 8);
        const blockHeight = Math.max(16, lines.length * 6 + 10);

        ensureSpace(blockHeight + 4);

        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, y, width, blockHeight, 4, 4, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, margin + 4, y + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(lines, margin + 4, y + 12);

        y += blockHeight + 4;
      };

      drawHeader();

      drawBlock("Tipo de documento", getDocumentTypeLabel(item.document_type));
      drawBlock("Título", item.title || getDocumentTypeLabel(item.document_type));
      drawBlock("Paciente", profile?.full_name || "Paciente");
      drawBlock("Data de nascimento", formatBirthDate(patient?.birth_date || null));
      drawBlock("Plano", healthPlanName);
      drawBlock("Clínica", item.clinic?.trade_name || "Não informada");
      drawBlock(
        "Local",
        `${item.clinic?.city || "Cidade não informada"} / ${
          item.clinic?.state || "Estado não informado"
        }`
      );
      drawBlock(
        "Especialidade",
        item.specialty?.name || "Não informada"
      );
      drawBlock(
        "Data de emissão",
        formatDate(item.issued_at || item.created_at)
      );
      drawBlock("Conteúdo", item.content || "Não informado");
      drawBlock("Orientações", item.guidance || "Não informado");

      y += 8;
      ensureSpace(44);

      doc.setDrawColor(160, 160, 160);
      doc.line(margin + 38, y + 14, pageWidth - margin - 38, y + 14);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(item.doctor?.name || "Médico", pageWidth / 2, y + 24, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `CRM ${item.doctor?.crm || "não informado"}${
          item.doctor?.crm_state ? ` / ${item.doctor.crm_state}` : ""
        }`,
        pageWidth / 2,
        y + 30,
        { align: "center" }
      );

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Emitido pela plataforma MediNexus em ${new Date().toLocaleString("pt-BR")}`,
        margin,
        pageHeight - 10
      );

      doc.save(
        `${slugify(getDocumentTypeLabel(item.document_type))}-${slugify(
          profile?.full_name || "paciente"
        )}.pdf`
      );
    } finally {
      setDownloadingId(null);
    }
  }

  function handlePrint(item: DocumentItem) {
    const popup = window.open("", "_blank", "width=900,height=1200");

    if (!popup) return;

    popup.document.write(`
      <html>
        <head>
          <title>${escapeHtml(getDocumentTypeLabel(item.document_type))} - MediNexus</title>
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
              <p>Documento médico digital</p>
            </div>

            <div class="card">
              <div class="badge">${escapeHtml(getDocumentTypeLabel(item.document_type))}</div>
              <div class="title">${escapeHtml(
                item.title || getDocumentTypeLabel(item.document_type)
              )}</div>
              <div class="sub">Data de emissão: ${escapeHtml(
                formatDate(item.issued_at || item.created_at)
              )}</div>
              <div class="sub">Clínica: ${escapeHtml(
                item.clinic?.trade_name || "Não informada"
              )}</div>
            </div>

            <div class="card">
              <strong>Paciente:</strong> ${escapeHtml(
                profile?.full_name || "Paciente"
              )}<br />
              <strong>Plano:</strong> ${escapeHtml(healthPlanName)}<br />
              <strong>Nascimento:</strong> ${escapeHtml(
                formatBirthDate(patient?.birth_date || null)
              )}<br />
              <strong>Especialidade:</strong> ${escapeHtml(
                item.specialty?.name || "Não informada"
              )}
            </div>

            <div class="card">
              <h3 style="margin-top:0;">Conteúdo</h3>
              <div class="content">${escapeHtml(
                item.content || "Não informado"
              )}</div>
            </div>

            ${
              item.guidance?.trim()
                ? `
              <div class="card">
                <h3 style="margin-top:0;">Orientações</h3>
                <div class="content">${escapeHtml(item.guidance)}</div>
              </div>
            `
                : ""
            }

            <div class="signature">
              <div class="line"></div>
              <div><strong>${escapeHtml(item.doctor?.name || "Médico")}</strong></div>
              <div class="muted">CRM: ${escapeHtml(
                `${item.doctor?.crm || "não informado"}${
                  item.doctor?.crm_state ? ` / ${item.doctor.crm_state}` : ""
                }`
              )}</div>
            </div>
          </div>

          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  }

  const counters = useMemo(() => {
    return {
      total: documents.length,
      medication: documents.filter((item) => item.document_type === "medication")
        .length,
      exam: documents.filter((item) => item.document_type === "exam").length,
      other: documents.filter(
        (item) =>
          item.document_type !== "medication" && item.document_type !== "exam"
      ).length,
    };
  }, [documents]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando documentos médicos...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-700">
              Documentos médicos
            </p>
            <h1 className="mt-3 app-section-title">
              Seus documentos em um só lugar
            </h1>
            <p className="app-section-subtitle">
              Acesse receituários, solicitações de exame e documentos emitidos nos seus atendimentos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="app-button-secondary text-center">
              Voltar ao dashboard
            </Link>

            <Link href="/historico-clinico" className="app-button-primary text-center">
              Histórico clínico
            </Link>
          </div>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Total</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {counters.total}
            </h3>
          </div>

          <div className="metric-card metric-card--success">
            <p className="text-sm text-green-700">Receitas</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {counters.medication}
            </h3>
          </div>

          <div className="metric-card metric-card--warning">
            <p className="text-sm text-yellow-700">Exames</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {counters.exam}
            </h3>
          </div>

          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Outros</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">
              {counters.other}
            </h3>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="app-card p-8">
            <p className="text-slate-700">
              Você ainda não possui documentos médicos emitidos.
            </p>

            <div className="mt-6">
              <Link href="/busca" className="app-button-primary">
                Buscar nova consulta
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {documents.map((item) => (
              <article key={item.id} className="app-card p-8">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ${getDocumentTypeBadge(
                          item.document_type
                        )}`}
                      >
                        {getDocumentTypeLabel(item.document_type)}
                      </span>

                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-200">
                        {item.specialty?.name || "Especialidade"}
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-900">
                      {item.title || getDocumentTypeLabel(item.document_type)}
                    </h2>

                    <p className="mt-2 text-slate-600">
                      Emitido em {formatDate(item.issued_at || item.created_at)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">
                      {item.clinic?.trade_name || "Clínica não informada"}
                    </p>
                    <p>
                      {item.clinic?.city || "Cidade não informada"} /{" "}
                      {item.clinic?.state || "Estado não informado"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-slate-700">
                  <p>
                    <span className="font-semibold">Médico:</span>{" "}
                    {item.doctor?.name || "Não informado"}
                    {item.doctor?.crm
                      ? ` • CRM ${item.doctor.crm}${
                          item.doctor.crm_state ? ` / ${item.doctor.crm_state}` : ""
                        }`
                      : ""}
                  </p>

                  <p>
                    <span className="font-semibold">Consulta:</span>{" "}
                    {formatDateTime(item.appointment?.confirmed_start_at || null)}
                  </p>

                  <p>
                    <span className="font-semibold">Paciente:</span>{" "}
                    {profile?.full_name || "Paciente"}
                  </p>

                  <p>
                    <span className="font-semibold">Plano:</span>{" "}
                    {healthPlanName}
                  </p>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Conteúdo
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-slate-700 leading-7">
                    {item.content || "Não informado"}
                  </p>
                </div>

                {item.guidance && (
                  <div className="mt-5 rounded-2xl bg-blue-50 px-4 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                      Orientações
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-blue-900 leading-7">
                      {item.guidance}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(item)}
                    disabled={downloadingId === item.id}
                    className="app-button-primary"
                  >
                    {downloadingId === item.id ? "Gerando PDF..." : "Baixar PDF"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrint(item)}
                    className="app-button-secondary"
                  >
                    Imprimir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}