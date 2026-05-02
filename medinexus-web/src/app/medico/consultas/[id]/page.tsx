"use client";

import Link from "next/link";
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

  useEffect(() => {
    loadPage();
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
            private_notes,
            summary,
            created_at,
            updated_at
          `
          )
          .eq("appointment_id", appointmentId)
          .maybeSingle<ConsultationNoteRow>(),

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
            private_notes,
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
    const loadedNotes = notesResponse.data || null;

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

    setLoading(false);
  }

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

    doc.save(`anamnese-${patientName.replaceAll(" ", "-").toLowerCase()}.pdf`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-slate-600">Carregando prontuário...</p>
        </section>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-700">
            {message || "Consulta não encontrada."}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_82%_12%,#EDE7FF_0,transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]" />

        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pb-12 lg:pt-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#283C7A]">
                Prontuário médico
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950">
                Atendimento de {patientName}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Registre anamnese, notas da consulta, documentos médicos e
                histórico clínico do paciente.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/medico/solicitacoes"
                className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-6 py-4 text-sm font-bold text-[#5E4B9A] shadow-sm transition hover:bg-[#F6F3FF]"
              >
                Voltar
              </Link>

              <Link
                href={`/medico/consultas/${appointmentId}/documentos`}
                className="inline-flex justify-center rounded-2xl bg-[#6E56CF] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_50px_-30px_rgba(110,86,207,0.9)] transition hover:bg-[#5E4B9A]"
              >
                Emitir documentos
              </Link>

              {!isClosed && (
                <button
                  type="button"
                  onClick={handleCloseAppointment}
                  disabled={closing}
                  className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_50px_-30px_rgba(40,60,122,0.9)] transition hover:bg-[#213366] disabled:opacity-50"
                >
                  {closing ? "Encerrando..." : "Encerrar atendimento"}
                </button>
              )}
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

        {isClosed && (
          <div className="mb-6 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
            Este atendimento foi encerrado. Por política interna, os registros
            ficam preservados para histórico e não devem ser alterados.
          </div>
        )}

        <div className="mb-8 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[28px] border border-[#D9D6F4] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Paciente
            </p>
            <p className="mt-2 font-bold text-slate-950">{patientName}</p>
            <p className="mt-1 text-sm text-slate-500">
              {getAge(patient?.birth_date)} • CPF {patient?.cpf || "N/I"}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#D9D6F4] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Consulta
            </p>
            <p className="mt-2 font-bold text-slate-950">
              {formatDateTime(appointmentStart)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Status: {appointment.status || "não informado"}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#D9D6F4] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Tempo
            </p>
            <p className="mt-2 text-2xl font-bold text-[#283C7A]">
              {appointment.finished_at
                ? "Encerrada"
                : secondsToClock(elapsedSeconds)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Início: {formatDateTime(appointment.started_at)}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#D9D6F4] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Documentos
            </p>
            <p className="mt-2 text-2xl font-bold text-[#6E56CF]">
              {documents.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Emitidos nesta consulta
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[38px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#283C7A]">
              Dados do paciente
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-3xl bg-[#F8FAFC] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Contato
                </p>
                <p className="mt-2 font-semibold text-slate-800">
                  {patient?.phone || "Telefone não informado"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {patient?.email || "E-mail não informado"}
                </p>
              </div>

              <div className="rounded-3xl bg-[#F8FAFC] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Plano
                </p>
                <p className="mt-2 font-semibold text-slate-800">
                  {patient?.health_plan_operator || "Particular/Não informado"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {patient?.health_plan_product_name || "Modelo não informado"}
                </p>
              </div>

              <div className="rounded-3xl bg-[#F8FAFC] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Médico e clínica
                </p>
                <p className="mt-2 font-semibold text-slate-800">
                  {doctorName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  CRM {doctor?.crm || "N/I"}
                  {doctor?.crm_state ? ` / ${doctor.crm_state}` : ""} •{" "}
                  {clinicName}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[38px] border border-[#D9D6F4] bg-gradient-to-br from-[#F6F3FF] to-[#F1F5FF] p-7 shadow-[0_24px_80px_-70px_rgba(94,75,154,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6E56CF]">
              Histórico recente
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Resumo da consulta anterior
            </h2>

            {lastPreviousSummary ? (
              <p className="mt-4 whitespace-pre-line leading-8 text-slate-700">
                {lastPreviousSummary}
              </p>
            ) : (
              <p className="mt-4 leading-8 text-slate-600">
                Nenhum resumo anterior encontrado para este paciente.
              </p>
            )}

            {previousNotes.length > 0 && (
              <div className="mt-6 grid gap-3">
                {previousNotes.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[26px] bg-white/80 p-4 ring-1 ring-white"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Consulta anterior
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-[38px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#283C7A]">
                  Anamnese base
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Ficha médica do paciente
                </h2>
              </div>

              <button
                type="button"
                onClick={handleDownloadAnamnesisPdf}
                className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-5 py-3 text-sm font-bold text-[#5E4B9A] transition hover:bg-[#F6F3FF]"
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
                className="min-h-[130px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                placeholder="História clínica geral, queixas recorrentes, informações importantes..."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <textarea
                  value={recordForm.allergies}
                  onChange={(event) =>
                    updateRecord("allergies", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                  placeholder="Alergias"
                />

                <textarea
                  value={recordForm.chronic_conditions}
                  onChange={(event) =>
                    updateRecord("chronic_conditions", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                  placeholder="Condições crônicas"
                />

                <textarea
                  value={recordForm.continuous_medications}
                  onChange={(event) =>
                    updateRecord("continuous_medications", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                  placeholder="Medicações contínuas"
                />

                <textarea
                  value={recordForm.family_history}
                  onChange={(event) =>
                    updateRecord("family_history", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                  placeholder="Histórico familiar"
                />

                <textarea
                  value={recordForm.surgical_history}
                  onChange={(event) =>
                    updateRecord("surgical_history", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                  placeholder="Histórico cirúrgico"
                />

                <textarea
                  value={recordForm.lifestyle_notes}
                  onChange={(event) =>
                    updateRecord("lifestyle_notes", event.target.value)
                  }
                  disabled={isClosed}
                  className="min-h-[100px] rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                  placeholder="Hábitos e estilo de vida"
                />
              </div>

              {!isClosed && (
                <button
                  type="button"
                  onClick={handleSaveRecord}
                  disabled={savingRecord}
                  className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#213366] disabled:opacity-50"
                >
                  {savingRecord ? "Salvando..." : "Salvar anamnese"}
                </button>
              )}
            </div>
          </section>

          <section className="rounded-[38px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6E56CF]">
              Notas da consulta
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Registro do atendimento atual
            </h2>

            <div className="mt-6 grid gap-4">
              <textarea
                value={notesForm.subjective}
                onChange={(event) =>
                  updateNotes("subjective", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[100px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                placeholder="Queixa principal / relato do paciente"
              />

              <textarea
                value={notesForm.objective}
                onChange={(event) =>
                  updateNotes("objective", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[100px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                placeholder="Exame físico / achados objetivos"
              />

              <textarea
                value={notesForm.assessment}
                onChange={(event) =>
                  updateNotes("assessment", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[100px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                placeholder="Avaliação / hipótese diagnóstica"
              />

              <textarea
                value={notesForm.plan}
                onChange={(event) => updateNotes("plan", event.target.value)}
                disabled={isClosed}
                className="min-h-[100px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                placeholder="Conduta / plano terapêutico"
              />

              <textarea
                value={notesForm.summary}
                onChange={(event) =>
                  updateNotes("summary", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[90px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                placeholder="Resumo da consulta para histórico"
              />

              <textarea
                value={notesForm.private_notes}
                onChange={(event) =>
                  updateNotes("private_notes", event.target.value)
                }
                disabled={isClosed}
                className="min-h-[90px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white disabled:opacity-70"
                placeholder="Notas privadas do médico"
              />

              {!isClosed && (
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="inline-flex justify-center rounded-2xl bg-[#6E56CF] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#5E4B9A] disabled:opacity-50"
                >
                  {savingNotes ? "Salvando..." : "Salvar notas"}
                </button>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[38px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#283C7A]">
                Documentos emitidos
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Receita, exames, atestados e declarações
              </h2>
            </div>

            <Link
              href={`/medico/consultas/${appointmentId}/documentos`}
              className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#213366]"
            >
              Novo documento
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="mt-6 rounded-[30px] bg-[#F8FAFC] p-6 text-slate-600">
              Nenhum documento emitido para esta consulta ainda.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="grid gap-4 rounded-[28px] border border-[#E0E7FF] bg-[#F8FAFC] p-5 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6E56CF]">
                      {getDocumentLabel(document.document_type)}
                    </p>
                    <Link
  href={`/documentos-medicos/${document.id}`}
  className="mt-2 inline-flex text-xl font-bold text-slate-950 transition hover:text-[#6E56CF]"
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
    </main>
  );
}