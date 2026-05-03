"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import Alert from "../../../components/alert";
import { supabase } from "../../../lib/supabase";

type MemberRow = {
  doctor_id: string | null;
  member_role: "owner" | "admin" | "doctor";
};

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

type AppointmentData = {
  id: string;
  status: AppointmentStatus;
  patient_id: string;
  clinic_id: string;
  doctor_id: string;
  specialty_id: string | null;
  confirmed_start_at: string | null;
  clinics?: {
    trade_name: string | null;
  } | null;
  specialties?: {
    name: string | null;
  } | null;
};

type RawAppointmentData = {
  id: string;
  status: AppointmentStatus;
  patient_id: string;
  clinic_id: string;
  doctor_id: string;
  specialty_id: string | null;
  confirmed_start_at: string | null;
  clinics?: { trade_name: string | null } | { trade_name: string | null }[] | null;
  specialties?: { name: string | null } | { name: string | null }[] | null;
};

type PatientProfile = {
  full_name: string | null;
};

type PatientRow = {
  birth_date: string | null;
  default_health_plan_id: string | null;
};

type HealthPlanRow = {
  name: string | null;
};

type DoctorRow = {
  name: string | null;
  crm: string | null;
  crm_state: string | null;
};

type PrescriptionRow = {
  document_type: "medication" | "exam" | "freeform";
  title: string | null;
  content: string | null;
  guidance: string | null;
  locked_at: string | null;
  updated_at: string | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatBirthDate(value: string | null) {
  if (!value) return "NÃ£o informada";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function formatDateTime(value: string | null) {
  if (!value) return "NÃ£o definido";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function MedicoReceituarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const appointmentId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [patientName, setPatientName] = useState("Paciente");
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [healthPlanName, setHealthPlanName] = useState("NÃ£o informado");
  const [doctor, setDoctor] = useState<DoctorRow | null>(null);
  const [lockedAt, setLockedAt] = useState<string | null>(null);

  const [form, setForm] = useState({
    document_type: "medication" as "medication" | "exam" | "freeform",
    title: "",
    content: "",
    guidance: "",
  });

  useEffect(() => {
    if (appointmentId) {
      loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  async function loadPage() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from("clinic_members")
      .select("doctor_id, member_role")
      .eq("user_id", user.id)
      .eq("member_role", "doctor")
      .single<MemberRow>();

    if (memberError || !member || !member.doctor_id) {
      setMessage("VocÃª nÃ£o possui acesso Ã  Ã¡rea mÃ©dica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data: appointmentData, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        id,
        status,
        patient_id,
        clinic_id,
        doctor_id,
        specialty_id,
        confirmed_start_at,
        clinics (
          trade_name
        ),
        specialties (
          name
        )
      `)
      .eq("id", appointmentId)
      .eq("doctor_id", member.doctor_id)
      .maybeSingle();

    if (appointmentError || !appointmentData) {
      setMessage("Consulta nÃ£o encontrada.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const rawAppointment = appointmentData as RawAppointmentData;
    const normalizedAppointment: AppointmentData = {
      id: rawAppointment.id,
      status: rawAppointment.status,
      patient_id: rawAppointment.patient_id,
      clinic_id: rawAppointment.clinic_id,
      doctor_id: rawAppointment.doctor_id,
      specialty_id: rawAppointment.specialty_id,
      confirmed_start_at: rawAppointment.confirmed_start_at,
      clinics: pickOne(rawAppointment.clinics),
      specialties: pickOne(rawAppointment.specialties),
    };

    setAppointment(normalizedAppointment);

    const [
      patientProfileResponse,
      patientResponse,
      doctorResponse,
      prescriptionResponse,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", normalizedAppointment.patient_id)
        .maybeSingle<PatientProfile>(),
      supabase
        .from("patients")
        .select("birth_date, default_health_plan_id")
        .eq("id", normalizedAppointment.patient_id)
        .maybeSingle<PatientRow>(),
      supabase
        .from("doctors")
        .select("name, crm, crm_state")
        .eq("id", normalizedAppointment.doctor_id)
        .maybeSingle<DoctorRow>(),
      supabase
        .from("prescriptions")
        .select("document_type, title, content, guidance, locked_at, updated_at")
        .eq("appointment_id", normalizedAppointment.id)
        .maybeSingle<PrescriptionRow>(),
    ]);

    setPatientName(patientProfileResponse.data?.full_name || "Paciente");
    setBirthDate(patientResponse.data?.birth_date || null);
    setDoctor(doctorResponse.data || null);
    setLockedAt(prescriptionResponse.data?.locked_at || null);

    if (patientResponse.data?.default_health_plan_id) {
      const { data: planData } = await supabase
        .from("health_plans")
        .select("name")
        .eq("id", patientResponse.data.default_health_plan_id)
        .maybeSingle<HealthPlanRow>();

      setHealthPlanName(planData?.name || "NÃ£o informado");
    }

    if (prescriptionResponse.data) {
      setForm({
        document_type: prescriptionResponse.data.document_type || "medication",
        title: prescriptionResponse.data.title || "",
        content: prescriptionResponse.data.content || "",
        guidance: prescriptionResponse.data.guidance || "",
      });
    }

    setLoading(false);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSave() {
    if (!appointment || lockedAt) return;

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("prescriptions").upsert(
      {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        clinic_id: appointment.clinic_id,
        doctor_id: appointment.doctor_id,
        specialty_id: appointment.specialty_id,
        created_by: user?.id || null,
        document_type: form.document_type,
        title: form.title || null,
        content: form.content || null,
        guidance: form.guidance || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "appointment_id",
      }
    );

    if (error) {
      setMessage(`Erro ao salvar receituÃ¡rio: ${error.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("ReceituÃ¡rio salvo com sucesso.");
    setMessageType("success");
    setSaving(false);
  }

  async function handleDownloadPdf() {
    if (!appointment) return;

    setDownloading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 16;
      const width = pageWidth - margin * 2;
      let y = 18;

      const drawTitle = () => {
        doc.setFillColor(27, 75, 88);
        doc.roundedRect(margin, y, width, 18, 4, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("MediNexus", margin + 6, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("ReceituÃ¡rio / SolicitaÃ§Ã£o mÃ©dica", margin + 6, y + 14);
        y += 26;
        doc.setTextColor(48, 59, 65);
      };

      const drawBlock = (label: string, value: string) => {
        const text = value?.trim() ? value.trim() : "NÃ£o informado";
        const lines = doc.splitTextToSize(text, width - 8);
        const blockHeight = Math.max(16, lines.length * 6 + 10);

        if (y + blockHeight > 275) {
          doc.addPage();
          y = 18;
        }

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

      drawTitle();

      drawBlock("Paciente", patientName);
      drawBlock("Data de nascimento", formatBirthDate(birthDate));
      drawBlock("Plano", healthPlanName);
      drawBlock("ClÃ­nica", appointment.clinics?.trade_name || "NÃ£o informada");
      drawBlock(
        "Especialidade",
        appointment.specialties?.name || "NÃ£o informada"
      );
      drawBlock("TÃ­tulo", form.title || "Sem tÃ­tulo");
      drawBlock(
        "Tipo de documento",
        form.document_type === "medication"
          ? "Receita medicamentosa"
          : form.document_type === "exam"
          ? "SolicitaÃ§Ã£o de exame"
          : "Documento livre"
      );
      drawBlock("ConteÃºdo", form.content || "NÃ£o informado");
      drawBlock("OrientaÃ§Ãµes", form.guidance || "NÃ£o informado");

      y += 8;
      doc.setDrawColor(160, 160, 160);
      doc.line(margin, y + 14, pageWidth - margin, y + 14);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(doctor?.name || "MÃ©dico", margin, y + 24);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `CRM ${doctor?.crm || "nÃ£o informado"}${doctor?.crm_state ? ` / ${doctor.crm_state}` : ""}`,
        margin,
        y + 30
      );

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text(
        `Emitido em ${new Date().toLocaleString("pt-BR")}`,
        margin,
        y + 38
      );

      doc.save(`receituario-${slugify(patientName)}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando receituÃ¡rio...</p>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="app-shell py-10">
          <Alert variant="error">Consulta nÃ£o encontrada.</Alert>
        </section>
      </main>
    );
  }

  const isLocked = Boolean(lockedAt);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href={`/medico/consultas/${appointment.id}`}
              className="text-sm font-medium text-sky-700 hover:underline"
            >
              â† Voltar para o prontuÃ¡rio
            </Link>

            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-sky-700">
              ReceituÃ¡rio mÃ©dico
            </p>
            <h1 className="mt-3 app-section-title">{patientName}</h1>
            <p className="app-section-subtitle">
              Gere uma receita, solicitaÃ§Ã£o de exame ou documento livre com assinatura mÃ©dica.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-slate-500">Consulta</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatDateTime(appointment.confirmed_start_at)}
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        {isLocked && (
          <div className="mb-6">
            <Alert variant="info">
              Este receituÃ¡rio estÃ¡ bloqueado para ediÃ§Ã£o.
            </Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Paciente</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">{patientName}</h3>
          </div>

          <div className="metric-card metric-card--success">
            <p className="text-sm text-green-700">Nascimento</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {formatBirthDate(birthDate)}
            </h3>
          </div>

          <div className="metric-card metric-card--warning">
            <p className="text-sm text-yellow-700">Plano</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {healthPlanName}
            </h3>
          </div>

          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">CRM</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {doctor?.crm || "NÃ£o informado"}
              {doctor?.crm_state ? ` / ${doctor.crm_state}` : ""}
            </h3>
          </div>
        </div>

        <div className="app-card p-8">
          <div className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tipo de documento
              </label>
              <select
                name="document_type"
                value={form.document_type}
                onChange={handleChange}
                className="app-input"
                disabled={isLocked}
              >
                <option value="medication">Receita medicamentosa</option>
                <option value="exam">SolicitaÃ§Ã£o de exame</option>
                <option value="freeform">Documento livre</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
               CarÃ¡ter da solicitaÃ§Ã£o 
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="app-input"
                placeholder="Ex: Rotina / EmergÃªncia"
                disabled={isLocked}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                ConteÃºdo principal
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                className="app-textarea"
                placeholder="Digite o medicamento, posologia, exame solicitado ou texto principal do documento"
                disabled={isLocked}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                OrientaÃ§Ãµes complementares
              </label>
              <textarea
                name="guidance"
                value={form.guidance}
                onChange={handleChange}
                className="app-textarea"
                placeholder="OrientaÃ§Ãµes adicionais ao paciente"
                disabled={isLocked}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || isLocked}
                className="app-button-primary"
              >
                {saving ? "Salvando..." : "Salvar receituÃ¡rio"}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="app-button-secondary"
              >
                {downloading ? "Gerando PDF..." : "Baixar PDF"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

