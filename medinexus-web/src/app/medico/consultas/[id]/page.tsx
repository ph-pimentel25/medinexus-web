"use client";

import ClinicalAISummary from "../../../components/clinical-ai-summary";
import AuthorizedClinicalHistory from "../../../components/authorized-clinical-history";
import HealthMetricsTracker from "../../../components/health-metrics-tracker";
import MemedWidget from "../../../components/memed-widget";
import { ANAMNESIS_TEMPLATES } from "../../../lib/anamnesis-templates";
import {
  Video,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  FileText,
  Clock,
  Phone,
  Mail,
  Power,
  Building,
  User,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { markDocumentPreview } from "../../../lib/document-preview";
import Link from "next/link";
import { Reviews, ReviewForm } from "../../../components/reviews";
import { PostConsultationChatModal } from "../../../components/post-consultation-chat-modal";
import { loadTriage, type PreConsultationTriage } from "../../../lib/pre-consultation-triage";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import Alert from "../../../components/alert";
import { supabase } from "../../../lib/supabase";

type AppointmentRow = {
  id: string;
  status: string | null;
  patient_id: string | null;
  clinic_id: string | null;
  doctor_id: string | null;
  requested_start_at: string | null;
  requested_end_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  patients:
    | {
        full_name: string | null;
        cpf: string | null;
        birth_date: string | null;
        phone: string | null;
        email: string | null;
        health_plan_operator: string | null;
        health_plan_product_name: string | null;
        health_plan_card_number: string | null;
      }
    | {
        full_name: string | null;
        cpf: string | null;
        birth_date: string | null;
        phone: string | null;
        email: string | null;
        health_plan_operator: string | null;
        health_plan_product_name: string | null;
        health_plan_card_number: string | null;
      }[]
    | null;
  doctors:
    | {
        name: string | null;
        crm: string | null;
        crm_state: string | null;
      }
    | {
        name: string | null;
        crm: string | null;
        crm_state: string | null;
      }[]
    | null;
  clinics:
    | {
        trade_name: string | null;
        legal_name: string | null;
        city: string | null;
        state: string | null;
      }
    | {
        trade_name: string | null;
        legal_name: string | null;
        city: string | null;
        state: string | null;
      }[]
    | null;
};

type MedicalRecordRow = {
  id: string;
  patient_id: string;
  base_anamnesis: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
  continuous_medications: string | null;
  family_history: string | null;
  surgical_history: string | null;
  lifestyle_notes: string | null;
  updated_at: string | null;
};

type ConsultationNoteRow = {
  id: string;
  appointment_id: string;
  patient_id: string | null;
  doctor_id: string | null;
  clinic_id: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  private_notes: string | null;
  summary: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type MedicalDocumentRow = {
  id: string;
  document_type:
    | "prescription"
    | "exam_request"
    | "medical_certificate"
    | "attendance_declaration"
    | "clinical_summary";
  status: "draft" | "issued" | "cancelled";
  title: string | null;
  released_to_patient: boolean;
  created_at: string;
  issued_at: string | null;
};

type RecordForm = {
  base_anamnesis: string;
  allergies: string;
  chronic_conditions: string;
  continuous_medications: string;
  family_history: string;
  surgical_history: string;
  lifestyle_notes: string;
};

type NotesForm = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  private_notes: string;
  summary: string;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

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

function secondsToClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((item) => String(item).padStart(2, "0"))
    .join(":");
}

function getDocumentLabel(type: MedicalDocumentRow["document_type"]) {
  const labels = {
    prescription: "Receita médica",
    exam_request: "Solicitação de exame",
    medical_certificate: "Atestado médico",
    attendance_declaration: "Declaração de comparecimento",
    clinical_summary: "Resumo clínico",
  };

  return labels[type] || "Documento médico";
}

function buildSummary(notes: NotesForm) {
  const parts = [
    notes.subjective ? `Queixa/evolução: ${notes.subjective}` : "",
    notes.objective ? `Exame/achados: ${notes.objective}` : "",
    notes.assessment ? `Avaliação: ${notes.assessment}` : "",
    notes.plan ? `Conduta: ${notes.plan}` : "",
  ].filter(Boolean);

  return parts.join("\n\n");
}

export default function MedicoConsultaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const appointmentId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [savingRecord, setSavingRecord] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [closing, setClosing] = useState(false);

  const [appointment, setAppointment] = useState<AppointmentRow | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordRow | null>(
    null
  );
  const [consultationNote, setConsultationNote] =
    useState<ConsultationNoteRow | null>(null);
  const [documents, setDocuments] = useState<MedicalDocumentRow[]>([]);
  const [previousNotes, setPreviousNotes] = useState<ConsultationNoteRow[]>([]);
  const [patientTriage, setPatientTriage] = useState<PreConsultationTriage | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [recordForm, setRecordForm] = useState<RecordForm>({
    base_anamnesis: "",
    allergies: "",
    chronic_conditions: "",
    continuous_medications: "",
    family_history: "",
    surgical_history: "",
    lifestyle_notes: "",
  });

  const [notesForm, setNotesForm] = useState<NotesForm>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    private_notes: "",
    summary: "",
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );


  async function loadPage() {
    setLoading(true);
    setMessage("");

    const { data: appointmentData, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        status,
        patient_id,
        clinic_id,
        doctor_id,
        requested_start_at,
        requested_end_at,
        confirmed_start_at,
        confirmed_end_at,
        started_at,
        finished_at,
        patients (
          full_name,
          cpf,
          birth_date,
          phone,
          email,
          health_plan_operator,
          health_plan_product_name,
          health_plan_card_number
        ),
        doctors (
          name,
          crm,
          crm_state
        ),
        clinics (
          trade_name,
          legal_name,
          city,
          state
        )
      `
      )
      .eq("id", appointmentId)
      .maybeSingle<AppointmentRow>();

    if (appointmentError || !appointmentData) {
      setMessage(
        `Erro ao carregar consulta: ${
          appointmentError?.message || "consulta não encontrada"
        }`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    let loadedAppointment = appointmentData;

    if (!loadedAppointment.started_at && !loadedAppointment.finished_at) {
      const { data: startedAppointment, error: startError } = await supabase
        .from("appointments")
        .update({
          started_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .select(
          `
          id,
          status,
          patient_id,
          clinic_id,
          doctor_id,
          requested_start_at,
          requested_end_at,
          confirmed_start_at,
          confirmed_end_at,
          started_at,
          finished_at,
          patients (
            full_name,
            cpf,
            birth_date,
            phone,
            email,
            health_plan_operator,
            health_plan_product_name,
            health_plan_card_number
          ),
          doctors (
            name,
            crm,
            crm_state
          ),
          clinics (
            trade_name,
            legal_name,
            city,
            state
          )
        `
        )
        .maybeSingle<AppointmentRow>();

      if (!startError && startedAppointment) {
        loadedAppointment = startedAppointment;
      }
    }

    const [recordResponse, notesResponse, documentsResponse, previousResponse] =
      await Promise.all([
        supabase
          .from("medical_records")
          .select(
            `
            id,
            patient_id,
            base_anamnesis,
            allergies,
            chronic_conditions,
            continuous_medications,
            family_history,
            surgical_history,
            lifestyle_notes,
            updated_at
          `
          )
          .eq("patient_id", loadedAppointment.patient_id)
          .maybeSingle<MedicalRecordRow>(),

        supabase.rpc("read_own_consultation_note",{p_appointment_id:appointmentId}),

        supabase
          .from("medical_documents")
          .select(
            `
            id,
            document_type,
            status,
            title,
            released_to_patient,
            created_at,
            issued_at
          `
          )
          .eq("appointment_id", appointmentId)
          .order("created_at", { ascending: false }),

        supabase
          .from("consultation_notes")
          .select(
            `
            id,
            appointment_id,
            patient_id,
            doctor_id,
            clinic_id,
            subjective,
            objective,
            assessment,
            plan,
            summary,
            created_at,
            updated_at
          `
          )
          .eq("patient_id", loadedAppointment.patient_id)
          .neq("appointment_id", appointmentId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    if (recordResponse.error && recordResponse.error.code !== "PGRST116") {
      setMessage(`Erro ao carregar anamnese: ${recordResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (notesResponse.error && notesResponse.error.code !== "PGRST116") {
      setMessage(
        `Erro ao carregar notas da consulta: ${notesResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (documentsResponse.error) {
      setMessage(
        `Erro ao carregar documentos: ${documentsResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (previousResponse.error) {
      setMessage(
        `Erro ao carregar histórico anterior: ${previousResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    const loadedRecord = recordResponse.data || null;
    const loadedNotes = (notesResponse.data as ConsultationNoteRow | null) || null;

    setAppointment(loadedAppointment);
    setMedicalRecord(loadedRecord);
    setConsultationNote(loadedNotes);
    setDocuments((documentsResponse.data || []) as MedicalDocumentRow[]);
    setPreviousNotes((previousResponse.data || []) as ConsultationNoteRow[]);

    setRecordForm({
      base_anamnesis: loadedRecord?.base_anamnesis || "",
      allergies: loadedRecord?.allergies || "",
      chronic_conditions: loadedRecord?.chronic_conditions || "",
      continuous_medications: loadedRecord?.continuous_medications || "",
      family_history: loadedRecord?.family_history || "",
      surgical_history: loadedRecord?.surgical_history || "",
      lifestyle_notes: loadedRecord?.lifestyle_notes || "",
    });

    setNotesForm({
      subjective: loadedNotes?.subjective || "",
      objective: loadedNotes?.objective || "",
      assessment: loadedNotes?.assessment || "",
      plan: loadedNotes?.plan || "",
      private_notes: loadedNotes?.private_notes || "",
      summary: loadedNotes?.summary || "",
    });

    setPatientTriage(loadTriage(appointmentId));

    setLoading(false);
  }


  function updateRecord<K extends keyof RecordForm>(
    key: K,
    value: RecordForm[K]
  ) {
    setRecordForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }


  function updateNotes<K extends keyof NotesForm>(key: K, value: NotesForm[K]) {
    setNotesForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }


  async function handleSaveRecord() {
    if (!appointment?.patient_id) return;

    setSavingRecord(true);
    setMessage("");

    if (medicalRecord?.id) {
      const { error } = await supabase
        .from("medical_records")
        .update({
          ...recordForm,
        })
        .eq("id", medicalRecord.id);

      if (error) {
        setMessage(`Erro ao salvar anamnese base: ${error.message}`);
        setMessageType("error");
        setSavingRecord(false);
        return;
      }
    } else {
      const { error } = await supabase.from("medical_records").insert({
        patient_id: appointment.patient_id,
        ...recordForm,
      });

      if (error) {
        setMessage(`Erro ao salvar anamnese base: ${error.message}`);
        setMessageType("error");
        setSavingRecord(false);
        return;
      }
    }

    setMessage("Anamnese base salva com sucesso.");
    setMessageType("success");
    await loadPage();
    setSavingRecord(false);
  }


  async function handleSaveNotes() {
    if (!appointment) return;

    setSavingNotes(true);
    setMessage("");

    const generatedSummary = notesForm.summary || buildSummary(notesForm);

    const payload = {
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      clinic_id: appointment.clinic_id,
      subjective: notesForm.subjective,
      objective: notesForm.objective,
      assessment: notesForm.assessment,
      plan: notesForm.plan,
      private_notes: notesForm.private_notes,
      summary: generatedSummary,
    };

    if (consultationNote?.id) {
      const { error } = await supabase
        .from("consultation_notes")
        .update(payload)
        .eq("id", consultationNote.id);

      if (error) {
        setMessage(`Erro ao salvar notas da consulta: ${error.message}`);
        setMessageType("error");
        setSavingNotes(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("consultation_notes")
        .insert(payload);

      if (error) {
        setMessage(`Erro ao salvar notas da consulta: ${error.message}`);
        setMessageType("error");
        setSavingNotes(false);
        return;
      }
    }

    setMessage("Notas da consulta salvas com sucesso.");
    setMessageType("success");
    await loadPage();
    setSavingNotes(false);
  }


  async function handleCloseAppointment() {
    if (!appointment) return;

    const confirmClose = window.confirm(
      "Deseja encerrar este atendimento? Depois disso, o prontuário ficará fechado para edição."
    );

    if (!confirmClose) return;

    setClosing(true);
    setMessage("");

    const generatedSummary = notesForm.summary || buildSummary(notesForm);

    if (!consultationNote?.id) {
      const { error: insertError } = await supabase
        .from("consultation_notes")
        .insert({
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          clinic_id: appointment.clinic_id,
          subjective: notesForm.subjective,
          objective: notesForm.objective,
          assessment: notesForm.assessment,
          plan: notesForm.plan,
          private_notes: notesForm.private_notes,
          summary: generatedSummary,
        });

      if (insertError) {
        setMessage(`Erro ao salvar notas antes de encerrar: ${insertError.message}`);
        setMessageType("error");
        setClosing(false);
        return;
      }
    } else {
      const { error: updateNoteError } = await supabase
        .from("consultation_notes")
        .update({
          subjective: notesForm.subjective,
          objective: notesForm.objective,
          assessment: notesForm.assessment,
          plan: notesForm.plan,
          private_notes: notesForm.private_notes,
          summary: generatedSummary,
        })
        .eq("id", consultationNote.id);

      if (updateNoteError) {
        setMessage(`Erro ao salvar notas antes de encerrar: ${updateNoteError.message}`);
        setMessageType("error");
        setClosing(false);
        return;
      }
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
      })
      .eq("id", appointment.id);

    if (error) {
      setMessage(`Erro ao encerrar atendimento: ${error.message}`);
      setMessageType("error");
      setClosing(false);
      return;
    }

    setMessage("Atendimento encerrado com sucesso.");
    setMessageType("success");
    await loadPage();
    setClosing(false);
  }


  function handleDownloadAnamnesisPdf() {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 18;

    doc.setFillColor(40, 60, 122);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 4, 4, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("MediNexus", margin + 8, y + 10);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Anamnese base do paciente", margin + 8, y + 18);

    y += 38;

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Dados do paciente", margin, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const patientLines = [
      `Nome: ${patientName}`,
      `CPF: ${patient?.cpf || "Não informado"}`,
      `Nascimento: ${formatDate(patient?.birth_date)} (${getAge(
        patient?.birth_date
      )})`,
      `Telefone: ${patient?.phone || "Não informado"}`,
      `Plano: ${patient?.health_plan_operator || "Particular/Não informado"} ${
        patient?.health_plan_product_name || ""
      }`,
    ];

    patientLines.forEach((line) => {
      doc.text(line, margin, y);
      y += 6;
    });

    y += 6;

    const sections = [
      ["Anamnese base", recordForm.base_anamnesis],
      ["Alergias", recordForm.allergies],
      ["Condições crônicas", recordForm.chronic_conditions],
      ["Medicações contínuas", recordForm.continuous_medications],
      ["Histórico familiar", recordForm.family_history],
      ["Histórico cirúrgico", recordForm.surgical_history],
      ["Hábitos e estilo de vida", recordForm.lifestyle_notes],
    ];

    sections.forEach(([title, content]) => {
      if (y > 260) {
        doc.addPage();
        y = 18;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, margin, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const lines = doc.splitTextToSize(
        content || "Não informado.",
        pageWidth - margin * 2
      );

      doc.text(lines, margin, y);
      y += lines.length * 5 + 8;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} por ${doctorName}`,
      margin,
      286
    );

    markDocumentPreview(doc);
      doc.save(`anamnese-${patientName.replaceAll(" ", "-").toLowerCase()}.pdf`);
  }


  useEffect(() => {
    const initialLoad = setTimeout(() => void loadPage(), 0);
    return () => clearTimeout(initialLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  useEffect(() => {
    if (!appointment?.started_at || appointment?.finished_at) return;

    function updateTimer() {
      const start = new Date(appointment?.started_at || "").getTime();
      const now = Date.now();

      if (!Number.isNaN(start)) {
        setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      }
    }

    updateTimer();

    const interval = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(interval);
  }, [appointment?.started_at, appointment?.finished_at]);

  const patient = pickOne(appointment?.patients);
  const doctor = pickOne(appointment?.doctors);
  const clinic = pickOne(appointment?.clinics);

  const patientName = patient?.full_name || "Paciente não informado";
  const doctorName = doctor?.name || "Médico não informado";
  const clinicName =
    clinic?.trade_name || clinic?.legal_name || "Clínica não informada";

  const appointmentStart =
    appointment?.confirmed_start_at || appointment?.requested_start_at;

  const isClosed = Boolean(appointment?.finished_at);

  const lastPreviousSummary = useMemo(() => {
    const item = previousNotes[0];

    if (!item) return null;

    return (
      item.summary ||
      buildSummary({
        subjective: item.subjective || "",
        objective: item.objective || "",
        assessment: item.assessment || "",
        plan: item.plan || "",
        private_notes: item.private_notes || "",
        summary: item.summary || "",
      })
    );
  }, [previousNotes]);

  if (loading) {
    return (
      <main className="min-h-screen bg-mn-sand">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-slate-600">Carregando prontuário...</p>
        </section>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="min-h-screen bg-mn-sand">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {message || "Consulta não encontrada."}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mn-sand pb-16">
      {/* Top Context & Action Bar */}
      <section className="border-b border-mn-border/80 bg-white sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/medico/solicitacoes"
            className="inline-flex items-center gap-2 rounded-xl border border-mn-border bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-mn-sand hover:text-mn-teal active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Voltar aos atendimentos</span>
          </Link>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                isClosed
                  ? "bg-slate-100 text-slate-700"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isClosed ? "bg-slate-400" : "bg-emerald-500 animate-pulse"
                }`}
              />
              {isClosed ? "Atendimento Encerrado" : "Atendimento em Andamento"}
            </span>

            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-mn-border bg-mn-sand px-3 py-1 text-xs font-semibold text-slate-700">
              <Clock size={13} className="text-mn-teal" />
              <span>Duração:</span>
              <strong className="font-mono text-mn-teal font-bold">
                {isClosed ? "Concluída" : secondsToClock(elapsedSeconds)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Main Header & Clinical Actions */}
      <section className="border-b border-mn-border bg-white/90 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full border border-mn-teal/20 bg-mn-teal-light/40 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-mn-teal">
                  Prontuário Médico Digital • CFM 1.821/2007
                </span>
                {patient?.health_plan_operator ? (
                  <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-mn-purple border border-purple-200">
                    {patient.health_plan_operator}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    Particular
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                Atendimento de {patientName}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
                Registre anamnese, evolução clínica (SOAP), emita documentos médicos com assinatura e inicie a teleconsulta ao vivo.
              </p>
            </div>

            {/* Action Bar com Hierarquia Perfeita */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link
                href={`/telemedicina/${appointmentId}`}
                className="inline-flex items-center gap-2 rounded-xl bg-mn-teal px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#123B46] active:scale-95"
              >
                <div className="relative flex items-center justify-center">
                  <Video size={16} />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <span>Telemedicina (1-Clique)</span>
              </Link>

              <MemedWidget 
                doctorId={appointment?.doctor_id || ""} 
                buttonClassName="inline-flex items-center gap-2 rounded-xl bg-mn-purple px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#483B6E] active:scale-95" 
                buttonLabel="Emitir documentos" 
              />

              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-mn-teal/30 bg-[#E8F3EE] px-4 py-3 text-xs font-bold text-mn-teal shadow-2xs transition hover:bg-[#D4E8DF] active:scale-95"
              >
                <MessageSquare size={16} />
                <span>Chat Pós-Consulta (7 dias)</span>
              </button>

              {!isClosed && (
                <button
                  type="button"
                  onClick={handleCloseAppointment}
                  disabled={closing}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 active:scale-95 disabled:opacity-50"
                >
                  <Power size={14} className="text-slate-400" />
                  <span>{closing ? "Encerrando..." : "Encerrar atendimento"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {message && (
          <div>
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        {isClosed && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
            Este atendimento foi encerrado. Os registros ficam arquivados para conformidade jurídica (CFM) e não podem ser alterados.
          </div>
        )}

        {/* Painel Unificado de Dados do Paciente e Consulta */}
        <div className="rounded-3xl border border-mn-border bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Paciente */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-mn-teal text-white font-black text-lg">
                {patientName
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Paciente
                </span>
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {patientName}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {getAge(patient?.birth_date)} • CPF: {patient?.cpf || "Não informado"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {patient?.phone && (
                    <a
                      href={`https://wa.me/55${patient.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      <Phone size={11} />
                      {patient.phone}
                    </a>
                  )}
                  {patient?.email && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[180px]">
                      <Mail size={11} />
                      {patient.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Consulta & Plano */}
            <div className="border-t border-slate-100 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 space-y-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Agendamento & Local
                </span>
                <p className="mt-1 text-xs font-semibold text-slate-900">
                  {formatDateTime(appointmentStart)}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {clinicName}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Cobertura
                </span>
                <p className="mt-0.5 text-xs font-semibold text-mn-purple">
                  {patient?.health_plan_operator || "Particular (Sem Convênio)"}{" "}
                  {patient?.health_plan_product_name ? `• ${patient.health_plan_product_name}` : ""}
                </p>
              </div>
            </div>

            {/* Métricas Clínicas */}
            <div className="border-t border-slate-100 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-mn-sand p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Tempo Atendimento
                </span>
                <p className="mt-1 font-mono text-xl font-bold text-mn-teal">
                  {appointment.finished_at ? "Encerrada" : secondsToClock(elapsedSeconds)}
                </p>
                <p className="text-[10px] text-slate-400">
                  {appointment.started_at ? `Iniciado ${formatDate(appointment.started_at)}` : "Em aguardo"}
                </p>
              </div>

              <div className="rounded-2xl bg-mn-sand p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Documentos
                </span>
                <p className="mt-1 font-mono text-xl font-bold text-mn-purple">
                  {documents.length}
                </p>
                <p className="text-[10px] text-slate-400">Emitidos nesta sessão</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo da Consulta Anterior (se houver) */}
        {lastPreviousSummary && (
          <div className="rounded-3xl border border-mn-border bg-white p-6 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mn-purple">
              Histórico Recente do Paciente
            </span>
            <h3 className="mt-1 text-base font-bold text-slate-900">
              Resumo da Consulta Anterior
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 whitespace-pre-line bg-mn-sand/60 p-4 rounded-2xl border border-mn-border/60">
              {lastPreviousSummary}
            </p>
          </div>
        )}

        {patientTriage && (
          <section className="mb-6 rounded-[38px] border border-mn-teal/30 bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F3EE] text-mn-teal">
                  <Sparkles size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-mn-teal">
                    Triagem Pré-Consulta com IA (Respondida pelo Paciente)
                  </p>
                  <h3 className="text-xl font-bold text-slate-900">
                    {patientTriage.chiefComplaint}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    patientTriage.aiSummary.urgencyLevel.includes("Prioritário")
                      ? "bg-red-100 text-red-800"
                      : patientTriage.aiSummary.urgencyLevel.includes("Moderado")
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {patientTriage.aiSummary.urgencyLevel}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  Dor: {patientTriage.painLevel}/10
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3 text-xs">
              <div className="rounded-2xl bg-mn-sand p-4">
                <span className="font-bold text-slate-500 uppercase">Evolução</span>
                <p className="mt-1 font-semibold text-slate-800">{patientTriage.duration}</p>
              </div>
              <div className="rounded-2xl bg-mn-sand p-4">
                <span className="font-bold text-slate-500 uppercase">Sintomas Associados</span>
                <p className="mt-1 font-semibold text-slate-800">
                  {patientTriage.associatedSymptoms.length > 0
                    ? patientTriage.associatedSymptoms.join(", ")
                    : "Nenhum informado"}
                </p>
              </div>
              <div className="rounded-2xl bg-mn-sand p-4">
                <span className="font-bold text-slate-500 uppercase">Medicação em Domicílio</span>
                <p className="mt-1 font-semibold text-slate-800">
                  {patientTriage.previousMedication || "Nenhuma relatada"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-mn-border/80 bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-600 uppercase">
                Hipóteses Sugeridas pela IA:
              </span>
              <ul className="mt-1.5 list-disc pl-5 text-xs text-slate-700 space-y-1">
                {patientTriage.aiSummary.suggestedHypotheses.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setNotesForm((prev) => ({
                    ...prev,
                    subjective: prev.subjective
                      ? `${prev.subjective}\n\n${patientTriage.aiSummary.clinicalSummaryText}`
                      : patientTriage.aiSummary.clinicalSummaryText,
                  }));
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-mn-teal px-4 py-2.5 text-xs font-bold text-white hover:bg-[#123B46] transition"
              >
                <Sparkles size={14} />
                <span>Importar Resumo da Triagem para Queixa da Anamnese</span>
              </button>
            </div>
          </section>
        )}

        {appointment.patient_id && (
          <div className="space-y-6">
            <AuthorizedClinicalHistory patientId={appointment.patient_id} />
            <HealthMetricsTracker readOnly patientName={patientName} />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-[38px] border border-mn-purple-light bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-mn-teal">
                  Anamnese base
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Ficha médica do paciente
                </h2>
              </div>

              <button
                type="button"
                onClick={handleDownloadAnamnesisPdf}
                className="inline-flex justify-center rounded-2xl border border-mn-purple-light bg-white px-5 py-3 text-sm font-bold text-mn-purple transition hover:bg-mn-purple-light"
              >
                Baixar PDF
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <textarea
                value={recordForm.base_anamnesis}
                onChange={(event) =>
                  updateRecord("base_anamnesis", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[130px] w-full rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                placeholder="História clínica geral, queixas recorrentes, informações importantes..."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <textarea
                  value={recordForm.allergies}
                  onChange={(event) =>
                    updateRecord("allergies", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                  placeholder="Alergias"
                />

                <textarea
                  value={recordForm.chronic_conditions}
                  onChange={(event) =>
                    updateRecord("chronic_conditions", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                  placeholder="Condições crônicas"
                />

                <textarea
                  value={recordForm.continuous_medications}
                  onChange={(event) =>
                    updateRecord("continuous_medications", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                  placeholder="Medicações contínuas"
                />

                <textarea
                  value={recordForm.family_history}
                  onChange={(event) =>
                    updateRecord("family_history", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                  placeholder="Histórico familiar"
                />

                <textarea
                  value={recordForm.surgical_history}
                  onChange={(event) =>
                    updateRecord("surgical_history", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                  placeholder="Histórico cirúrgico"
                />

                <textarea
                  value={recordForm.lifestyle_notes}
                  onChange={(event) =>
                    updateRecord("lifestyle_notes", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                  placeholder="Hábitos e estilo de vida"
                />
              </div>

              {!isClosed && (
                <button
                  type="button"
                  onClick={handleSaveRecord}
                  disabled={savingRecord}
                  className="inline-flex justify-center rounded-2xl bg-mn-teal px-7 py-4 text-sm font-bold text-white transition hover:bg-mn-teal disabled:opacity-50"
                >
                  {savingRecord ? "Salvando..." : "Salvar anamnese"}
                </button>
              )}
            </div>
          </section>

          <section className="rounded-[38px] border border-mn-purple-light bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-mn-purple">
              Notas da consulta
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Registro do atendimento atual
            </h2>

            {/* Modelos Customizados de Anamnese por Especialidade */}
            {!isClosed && (
              <div className="mt-4 rounded-2xl border border-mn-teal/20 bg-mn-sage-light/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-mn-teal">
                    ⚡ Modelos Customizados de Anamnese por Especialidade:
                  </p>
                  <span className="text-[11px] text-slate-500">Economize tempo em 1 clique</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {ANAMNESIS_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setNotesForm((prev) => ({
                          ...prev,
                          subjective: tmpl.subjective,
                          objective: tmpl.objective,
                          assessment: tmpl.assessment,
                          plan: tmpl.plan,
                          summary: `Atendimento de ${tmpl.specialty}. ${tmpl.assessment.slice(0, 100)}...`,
                        }));
                      }}
                      className="rounded-xl border border-mn-teal/30 bg-white px-3 py-1.5 text-xs font-semibold text-mn-teal shadow-xs transition hover:bg-mn-teal hover:text-white"
                    >
                      {tmpl.specialty}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-4">
              <textarea
                value={notesForm.subjective}
                onChange={(event) =>
                  updateNotes("subjective", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[100px] w-full rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                placeholder="Queixa principal / relato do paciente"
              />

              <textarea
                value={notesForm.objective}
                onChange={(event) =>
                  updateNotes("objective", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[100px] w-full rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                placeholder="Exame físico / achados objetivos"
              />

              <textarea
                value={notesForm.assessment}
                onChange={(event) =>
                  updateNotes("assessment", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[100px] w-full rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                placeholder="Avaliação / hipótese diagnóstica"
              />

              <textarea
                value={notesForm.plan}
                onChange={(event) => updateNotes("plan", event.target.value)}
                disabled={isClosed}
                className="min-h-[100px] w-full rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                placeholder="Conduta / plano terapêutico"
              />

              <textarea
                value={notesForm.summary}
                onChange={(event) =>
                  updateNotes("summary", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[90px] w-full rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                placeholder="Resumo da consulta para histórico"
              />

              <textarea
                value={notesForm.private_notes}
                onChange={(event) =>
                  updateNotes("private_notes", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[90px] w-full rounded-2xl border border-mn-purple-light bg-mn-sand px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-mn-purple focus:bg-white disabled:opacity-70"
                placeholder="Notas privadas do médico"
              />

              {!isClosed && (
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="inline-flex justify-center rounded-2xl bg-mn-purple px-7 py-4 text-sm font-bold text-white transition hover:bg-mn-purple disabled:opacity-50"
                >
                  {savingNotes ? "Salvando..." : "Salvar notas"}
                </button>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[38px] border border-mn-purple-light bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-mn-teal">
                Documentos emitidos
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Receita, exames, atestados e declarações
              </h2>
            </div>

            <MemedWidget 
              doctorId={appointment?.doctor_id || ""} 
              buttonClassName="inline-flex justify-center rounded-2xl bg-mn-teal px-6 py-4 text-sm font-bold text-white transition hover:bg-mn-teal" 
              buttonLabel="Novo documento" 
            />
          </div>

          {documents.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-mn-sand p-6 text-slate-600">
              Nenhum documento emitido para esta consulta ainda.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="grid gap-4 rounded-2xl border border-mn-purple-light bg-mn-sand p-5 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-mn-purple">
                      {getDocumentLabel(document.document_type)}
                    </p>
                    <Link
  href={`/documentos-medicos/${document.id}`}
  className="mt-2 inline-flex text-xl font-bold text-slate-950 transition hover:text-mn-purple"
>
  {document.title || "Documento médico"}
</Link>
                    <p className="mt-1 text-sm text-slate-500">
                      Emitido em:{" "}
                      {formatDateTime(document.issued_at || document.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                        document.status === "issued"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : document.status === "draft"
                            ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            : "bg-red-50 text-red-700 ring-1 ring-red-200"
                      }`}
                    >
                      {document.status}
                    </span>

                    {document.released_to_patient && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 ring-1 ring-blue-200">
                        Liberado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
      {appointment?.patient_id && <div className="mx-auto max-w-7xl space-y-4 px-4 pb-12"><ClinicalAISummary appointmentId={appointment.id} canReview/><Reviews kind="patient" targetId={appointment.patient_id}/>{appointment.status === "completed" && <ReviewForm appointmentId={appointment.id} kind="patient" />}</div>}

      <PostConsultationChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        appointmentId={appointmentId}
        patientName={patientName}
        doctorName={doctorName}
        appointmentDate={appointmentStart || undefined}
        viewerRole="doctor"
      />
    </main>
  );
}

