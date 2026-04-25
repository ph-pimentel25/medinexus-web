"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  created_at: string | null;
  requested_start_at: string | null;
  requested_end_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  clinics?: {
    trade_name: string | null;
    city: string | null;
    state: string | null;
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
  created_at: string | null;
  requested_start_at: string | null;
  requested_end_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  clinics?:
    | {
        trade_name: string | null;
        city: string | null;
        state: string | null;
      }
    | {
        trade_name: string | null;
        city: string | null;
        state: string | null;
      }[]
    | null;
  specialties?:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
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

type DoctorRow = {
  name: string | null;
  crm: string | null;
  crm_state: string | null;
};

type MedicalRecordRow = {
  allergies: string | null;
  chronic_conditions: string | null;
  continuous_medications: string | null;
  surgical_history: string | null;
  family_history: string | null;
  habits: string | null;
  anamnesis_summary: string | null;
  updated_at: string | null;
};

type ConsultationNoteRow = {
  chief_complaint: string | null;
  history_present_illness: string | null;
  consultation_anamnesis: string | null;
  observations: string | null;
  updated_at: string | null;
  consultation_started_at: string | null;
  consultation_closed_at: string | null;
  consultation_duration_seconds: number | null;
  locked_at: string | null;
};

type HistoryItem = {
  id: string;
  appointment_id: string;
  chief_complaint: string | null;
  consultation_anamnesis: string | null;
  observations: string | null;
  consultation_closed_at: string | null;
  consultation_duration_seconds: number | null;
  doctors?: {
    name: string | null;
  } | null;
  specialties?: {
    name: string | null;
  } | null;
};

type RawHistoryItem = {
  id: string;
  appointment_id: string;
  chief_complaint: string | null;
  consultation_anamnesis: string | null;
  observations: string | null;
  consultation_closed_at: string | null;
  consultation_duration_seconds: number | null;
  doctors?: { name: string | null } | { name: string | null }[] | null;
  specialties?: { name: string | null } | { name: string | null }[] | null;
};

type PrescriptionRow = {
  id: string;
  document_type: "medication" | "exam" | "freeform";
  title: string | null;
  content: string | null;
  guidance: string | null;
  locked_at: string | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "Não definido";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatBirthDate(value: string | null) {
  if (!value) return "Não informada";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function getAge(value: string | null) {
  if (!value) return "Não informada";

  const today = new Date();
  const birthDate = new Date(`${value}T12:00:00`);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return `${age} anos`;
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "00:00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
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

function getCharacterLabel(
  createdAt?: string | null,
  confirmedStartAt?: string | null
) {
  if (!createdAt || !confirmedStartAt) return "Rotina";

  const created = new Date(createdAt).getTime();
  const confirmed = new Date(confirmedStartAt).getTime();

  if (Number.isNaN(created) || Number.isNaN(confirmed)) return "Rotina";

  const diffHours = Math.abs(confirmed - created) / (1000 * 60 * 60);
  return diffHours < 24 ? "Encaixe" : "Rotina";
}

function getConsultationStatusMeta(status: AppointmentStatus) {
  switch (status) {
    case "confirmed":
      return {
        label: "Consulta em atendimento",
        badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        description: "Prontuário liberado para edição.",
      };
    case "completed":
      return {
        label: "Atendimento encerrado",
        badgeClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        description: "Prontuário bloqueado por política interna.",
      };
    case "pending":
      return {
        label: "Aguardando confirmação",
        badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        description: "Consulta ainda não confirmada.",
      };
    case "rejected":
      return {
        label: "Consulta recusada",
        badgeClass: "bg-red-50 text-red-700 ring-1 ring-red-200",
        description: "Essa consulta não seguirá para atendimento.",
      };
    case "cancelled":
      return {
        label: "Consulta cancelada",
        badgeClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        description: "Consulta cancelada antes do atendimento.",
      };
    default:
      return {
        label: status,
        badgeClass: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
        description: "Status atual da consulta.",
      };
  }
}

function buildHistorySummary(item: {
  chief_complaint: string | null;
  consultation_anamnesis: string | null;
  observations: string | null;
}) {
  const raw =
    item.consultation_anamnesis ||
    item.observations ||
    item.chief_complaint ||
    "Sem resumo disponível.";

  return raw.length > 260 ? `${raw.slice(0, 260)}...` : raw;
}

export default function MedicoConsultaProntuarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const appointmentId = params?.id;

  const [loading, setLoading] = useState(true);
  const [savingRecord, setSavingRecord] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [endingConsultation, setEndingConsultation] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [downloadingPrescription, setDownloadingPrescription] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [doctorId, setDoctorId] = useState("");
  const [doctor, setDoctor] = useState<DoctorRow | null>(null);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(
    null
  );
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [healthPlanName, setHealthPlanName] = useState("Não informado");

  const [medicalRecordUpdatedAt, setMedicalRecordUpdatedAt] = useState<
    string | null
  >(null);
  const [consultationNoteUpdatedAt, setConsultationNoteUpdatedAt] = useState<
    string | null
  >(null);

  const [consultationStartedAt, setConsultationStartedAt] = useState<
    string | null
  >(null);
  const [consultationClosedAt, setConsultationClosedAt] = useState<
    string | null
  >(null);
  const [consultationDurationSeconds, setConsultationDurationSeconds] = useState<
    number | null
  >(null);
  const [consultationLockedAt, setConsultationLockedAt] = useState<
    string | null
  >(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const [medicalRecordForm, setMedicalRecordForm] = useState({
    allergies: "",
    chronic_conditions: "",
    continuous_medications: "",
    surgical_history: "",
    family_history: "",
    habits: "",
    anamnesis_summary: "",
  });

  const [consultationForm, setConsultationForm] = useState({
    chief_complaint: "",
    history_present_illness: "",
    consultation_anamnesis: "",
    observations: "",
  });

  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    document_type: "medication" as "medication" | "exam" | "freeform",
    title: "Receituário médico",
    content: "",
    guidance: "",
  });

  useEffect(() => {
    if (appointmentId) {
      loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  useEffect(() => {
    if (!consultationStartedAt || consultationLockedAt || consultationClosedAt) {
      return;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      const start = new Date(consultationStartedAt).getTime();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      setElapsedSeconds(diff);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [consultationStartedAt, consultationLockedAt, consultationClosedAt]);

  async function ensureConsultationSessionStarted(
    currentAppointment: AppointmentData,
    currentDoctorId: string,
    userId: string | null
  ) {
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("consultation_notes")
      .upsert(
        {
          appointment_id: currentAppointment.id,
          patient_id: currentAppointment.patient_id,
          clinic_id: currentAppointment.clinic_id,
          doctor_id: currentDoctorId,
          specialty_id: currentAppointment.specialty_id,
          created_by: userId,
          consultation_started_at: nowIso,
        },
        {
          onConflict: "appointment_id",
        }
      )
      .select(
        `
        chief_complaint,
        history_present_illness,
        consultation_anamnesis,
        observations,
        updated_at,
        consultation_started_at,
        consultation_closed_at,
        consultation_duration_seconds,
        locked_at
      `
      )
      .single<ConsultationNoteRow>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

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
      setMessage("Você não possui acesso à área médica.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setDoctorId(member.doctor_id);

    const { data: appointmentData, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        id,
        status,
        patient_id,
        clinic_id,
        doctor_id,
        specialty_id,
        created_at,
        requested_start_at,
        requested_end_at,
        confirmed_start_at,
        confirmed_end_at,
        clinics (
          trade_name,
          city,
          state
        ),
        specialties (
          name
        )
      `)
      .eq("id", appointmentId)
      .eq("doctor_id", member.doctor_id)
      .maybeSingle();

    if (appointmentError || !appointmentData) {
      setMessage("Consulta não encontrada para este médico.");
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
      created_at: rawAppointment.created_at,
      requested_start_at: rawAppointment.requested_start_at,
      requested_end_at: rawAppointment.requested_end_at,
      confirmed_start_at: rawAppointment.confirmed_start_at,
      confirmed_end_at: rawAppointment.confirmed_end_at,
      clinics: pickOne(rawAppointment.clinics),
      specialties: pickOne(rawAppointment.specialties),
    };

    if (normalizedAppointment.status === "completed") {
      setMessage("Esse atendimento já foi encerrado e o prontuário está bloqueado.");
      setMessageType("info");
      setLoading(false);

      setTimeout(() => {
        router.push("/medico/solicitacoes");
      }, 1200);

      return;
    }

    setAppointment(normalizedAppointment);

    const [
      profileResponse,
      patientResponse,
      doctorResponse,
      medicalRecordResponse,
      consultationNoteResponse,
      historyResponse,
      prescriptionResponse,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, phone")
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
        .from("medical_records")
        .select(
          `
          allergies,
          chronic_conditions,
          continuous_medications,
          surgical_history,
          family_history,
          habits,
          anamnesis_summary,
          updated_at
        `
        )
        .eq("patient_id", normalizedAppointment.patient_id)
        .eq("clinic_id", normalizedAppointment.clinic_id)
        .maybeSingle<MedicalRecordRow>(),
      supabase
        .from("consultation_notes")
        .select(
          `
          chief_complaint,
          history_present_illness,
          consultation_anamnesis,
          observations,
          updated_at,
          consultation_started_at,
          consultation_closed_at,
          consultation_duration_seconds,
          locked_at
        `
        )
        .eq("appointment_id", normalizedAppointment.id)
        .maybeSingle<ConsultationNoteRow>(),
      supabase
        .from("consultation_notes")
        .select(
          `
          id,
          appointment_id,
          chief_complaint,
          consultation_anamnesis,
          observations,
          consultation_closed_at,
          consultation_duration_seconds,
          doctors (
            name
          ),
          specialties (
            name
          )
        `
        )
        .eq("patient_id", normalizedAppointment.patient_id)
        .eq("clinic_id", normalizedAppointment.clinic_id)
        .neq("appointment_id", normalizedAppointment.id)
        .not("consultation_closed_at", "is", null)
        .order("consultation_closed_at", { ascending: false }),
      supabase
        .from("prescriptions")
        .select("id, document_type, title, content, guidance, locked_at")
        .eq("appointment_id", normalizedAppointment.id)
        .maybeSingle<PrescriptionRow>(),
    ]);

    if (profileResponse.error) {
      setMessage(
        `Erro ao carregar perfil do paciente: ${profileResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (patientResponse.error) {
      setMessage(
        `Erro ao carregar ficha do paciente: ${patientResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (historyResponse.error) {
      setMessage(
        `Erro ao carregar histórico do paciente: ${historyResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    setPatientProfile(profileResponse.data || null);
    setPatient(patientResponse.data || null);
    setDoctor(doctorResponse.data || null);

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

    if (medicalRecordResponse.data) {
      setMedicalRecordForm({
        allergies: medicalRecordResponse.data.allergies || "",
        chronic_conditions: medicalRecordResponse.data.chronic_conditions || "",
        continuous_medications:
          medicalRecordResponse.data.continuous_medications || "",
        surgical_history: medicalRecordResponse.data.surgical_history || "",
        family_history: medicalRecordResponse.data.family_history || "",
        habits: medicalRecordResponse.data.habits || "",
        anamnesis_summary: medicalRecordResponse.data.anamnesis_summary || "",
      });

      setMedicalRecordUpdatedAt(medicalRecordResponse.data.updated_at || null);
    }

    let currentConsultationNote = consultationNoteResponse.data || null;

    if (
      normalizedAppointment.status === "confirmed" &&
      (!currentConsultationNote || !currentConsultationNote.consultation_started_at)
    ) {
      try {
        currentConsultationNote = await ensureConsultationSessionStarted(
          normalizedAppointment,
          member.doctor_id,
          user.id
        );
      } catch (error: any) {
        setMessage(`Erro ao iniciar atendimento: ${error.message}`);
        setMessageType("error");
        setLoading(false);
        return;
      }
    }

    if (currentConsultationNote) {
      setConsultationForm({
        chief_complaint: currentConsultationNote.chief_complaint || "",
        history_present_illness:
          currentConsultationNote.history_present_illness || "",
        consultation_anamnesis:
          currentConsultationNote.consultation_anamnesis || "",
        observations: currentConsultationNote.observations || "",
      });

      setConsultationNoteUpdatedAt(currentConsultationNote.updated_at || null);
      setConsultationStartedAt(
        currentConsultationNote.consultation_started_at || null
      );
      setConsultationClosedAt(
        currentConsultationNote.consultation_closed_at || null
      );
      setConsultationDurationSeconds(
        currentConsultationNote.consultation_duration_seconds || null
      );
      setConsultationLockedAt(currentConsultationNote.locked_at || null);

      if (
        currentConsultationNote.consultation_started_at &&
        !currentConsultationNote.locked_at &&
        !currentConsultationNote.consultation_closed_at
      ) {
        const now = Date.now();
        const start = new Date(
          currentConsultationNote.consultation_started_at
        ).getTime();
        setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      } else if (currentConsultationNote.consultation_duration_seconds) {
        setElapsedSeconds(currentConsultationNote.consultation_duration_seconds);
      }
    }

    const rawHistoryItems = (historyResponse.data || []) as RawHistoryItem[];
    const normalizedHistory: HistoryItem[] = rawHistoryItems.map((item) => ({
      id: item.id,
      appointment_id: item.appointment_id,
      chief_complaint: item.chief_complaint,
      consultation_anamnesis: item.consultation_anamnesis,
      observations: item.observations,
      consultation_closed_at: item.consultation_closed_at,
      consultation_duration_seconds: item.consultation_duration_seconds,
      doctors: pickOne(item.doctors),
      specialties: pickOne(item.specialties),
    }));

    setHistoryItems(normalizedHistory);

    if (prescriptionResponse.data) {
      setPrescriptionId(prescriptionResponse.data.id);
      setPrescriptionForm({
        document_type: prescriptionResponse.data.document_type || "medication",
        title: prescriptionResponse.data.title || "Receituário médico",
        content: prescriptionResponse.data.content || "",
        guidance: prescriptionResponse.data.guidance || "",
      });
    }

    setLoading(false);
  }

  function handleMedicalRecordChange(
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setMedicalRecordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleConsultationChange(
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setConsultationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePrescriptionChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setPrescriptionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function getMedicalRecordPayload(userId: string | null) {
    if (!appointment) return null;

    return {
      patient_id: appointment.patient_id,
      clinic_id: appointment.clinic_id,
      created_by: userId,
      allergies: medicalRecordForm.allergies || null,
      chronic_conditions: medicalRecordForm.chronic_conditions || null,
      continuous_medications: medicalRecordForm.continuous_medications || null,
      surgical_history: medicalRecordForm.surgical_history || null,
      family_history: medicalRecordForm.family_history || null,
      habits: medicalRecordForm.habits || null,
      anamnesis_summary: medicalRecordForm.anamnesis_summary || null,
      updated_at: new Date().toISOString(),
    };
  }

  function getConsultationPayload(
    userId: string | null,
    options?: {
      closeNow?: boolean;
    }
  ) {
    if (!appointment) return null;

    const nowIso = new Date().toISOString();
    const startedAt = consultationStartedAt || nowIso;
    const closeNow = options?.closeNow || false;
    const closedAt = closeNow ? nowIso : consultationClosedAt || null;

    const durationSeconds = closeNow
      ? Math.max(
          0,
          Math.floor(
            (new Date(nowIso).getTime() - new Date(startedAt).getTime()) / 1000
          )
        )
      : consultationDurationSeconds || null;

    return {
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      clinic_id: appointment.clinic_id,
      doctor_id: doctorId,
      specialty_id: appointment.specialty_id,
      created_by: userId,
      chief_complaint: consultationForm.chief_complaint || null,
      history_present_illness:
        consultationForm.history_present_illness || null,
      consultation_anamnesis:
        consultationForm.consultation_anamnesis || null,
      observations: consultationForm.observations || null,
      consultation_started_at: startedAt,
      consultation_closed_at: closedAt,
      consultation_duration_seconds: durationSeconds,
      locked_at: closeNow ? nowIso : null,
      updated_at: nowIso,
    };
  }

  async function handleSaveMedicalRecord() {
    if (!appointment || consultationLockedAt) return;

    setSavingRecord(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = getMedicalRecordPayload(user?.id || null);

    if (!payload) {
      setSavingRecord(false);
      return;
    }

    const { error } = await supabase
      .from("medical_records")
      .upsert(payload, {
        onConflict: "patient_id,clinic_id",
      });

    if (error) {
      setMessage(`Erro ao salvar anamnese base: ${error.message}`);
      setMessageType("error");
      setSavingRecord(false);
      return;
    }

    const nowIso = new Date().toISOString();
    setMedicalRecordUpdatedAt(nowIso);
    setMessage("Anamnese base do paciente salva com sucesso.");
    setMessageType("success");
    setSavingRecord(false);
  }

  async function handleSaveConsultationNotes() {
    if (!appointment || consultationLockedAt) return;

    if (!["confirmed", "completed"].includes(appointment.status)) {
      setMessage(
        "O prontuário da consulta só pode ser preenchido para consultas confirmadas ou concluídas."
      );
      setMessageType("error");
      return;
    }

    setSavingNote(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = getConsultationPayload(user?.id || null);

    if (!payload) {
      setSavingNote(false);
      return;
    }

    const { error } = await supabase
      .from("consultation_notes")
      .upsert(payload, {
        onConflict: "appointment_id",
      });

    if (error) {
      setMessage(`Erro ao salvar notas da consulta: ${error.message}`);
      setMessageType("error");
      setSavingNote(false);
      return;
    }

    const nowIso = new Date().toISOString();
    setConsultationStartedAt(payload.consultation_started_at || null);
    setConsultationNoteUpdatedAt(nowIso);
    setMessage("Notas da consulta salvas com sucesso.");
    setMessageType("success");
    setSavingNote(false);
  }

  async function handleSavePrescription() {
    if (!appointment || consultationLockedAt) return;

    if (!prescriptionForm.content.trim()) {
      setMessage("Digite o conteúdo principal do receituário.");
      setMessageType("error");
      return;
    }

    setSavingPrescription(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      clinic_id: appointment.clinic_id,
      doctor_id: appointment.doctor_id,
      specialty_id: appointment.specialty_id,
      created_by: user?.id || null,
      document_type: prescriptionForm.document_type,
      title: prescriptionForm.title || null,
      content: prescriptionForm.content || null,
      guidance: prescriptionForm.guidance || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("prescriptions")
      .upsert(payload, {
        onConflict: "appointment_id",
      })
      .select("id")
      .single();

    if (error) {
      setMessage(`Erro ao salvar receituário: ${error.message}`);
      setMessageType("error");
      setSavingPrescription(false);
      return;
    }

    setPrescriptionId(data.id);
    setMessage("Receituário salvo com sucesso.");
    setMessageType("success");
    setSavingPrescription(false);
  }

  async function handleEndConsultation() {
    if (!appointment || consultationLockedAt) return;

    if (appointment.status !== "confirmed") {
      setMessage("Somente consultas confirmadas podem ser encerradas.");
      setMessageType("error");
      return;
    }

    setEndingConsultation(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const medicalPayload = getMedicalRecordPayload(user?.id || null);
    const consultationPayload = getConsultationPayload(user?.id || null, {
      closeNow: true,
    });

    if (!medicalPayload || !consultationPayload) {
      setEndingConsultation(false);
      return;
    }

    const { error: medicalError } = await supabase
      .from("medical_records")
      .upsert(medicalPayload, {
        onConflict: "patient_id,clinic_id",
      });

    if (medicalError) {
      setMessage(
        `Erro ao salvar anamnese antes de encerrar: ${medicalError.message}`
      );
      setMessageType("error");
      setEndingConsultation(false);
      return;
    }

    const { error: consultationError } = await supabase
      .from("consultation_notes")
      .upsert(consultationPayload, {
        onConflict: "appointment_id",
      });

    if (consultationError) {
      setMessage(
        `Erro ao salvar notas antes de encerrar: ${consultationError.message}`
      );
      setMessageType("error");
      setEndingConsultation(false);
      return;
    }

    const { error: appointmentError } = await supabase
      .from("appointments")
      .update({
        status: "completed",
      })
      .eq("id", appointment.id);

    if (appointmentError) {
      setMessage(`Erro ao encerrar atendimento: ${appointmentError.message}`);
      setMessageType("error");
      setEndingConsultation(false);
      return;
    }

    setConsultationClosedAt(consultationPayload.consultation_closed_at || null);
    setConsultationLockedAt(consultationPayload.locked_at || null);
    setConsultationDurationSeconds(
      consultationPayload.consultation_duration_seconds || null
    );
    setElapsedSeconds(consultationPayload.consultation_duration_seconds || 0);

    setMessage("Atendimento encerrado com sucesso. O prontuário foi bloqueado.");
    setMessageType("success");
    setEndingConsultation(false);

    setTimeout(() => {
      router.push("/medico/solicitacoes");
    }, 1000);
  }

  async function handleDownloadAnamnesisPdf() {
    if (!appointment) return;

    setDownloadingPdf(true);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let y = 18;

      const brandDark: [number, number, number] = [27, 75, 88];
      const brandInk: [number, number, number] = [48, 59, 65];
      const softGray: [number, number, number] = [241, 245, 249];

      const ensureSpace = (needed = 24) => {
        if (y + needed > pageHeight - 18) {
          doc.addPage();
          y = 18;
        }
      };

      const drawHeader = () => {
        doc.setFillColor(...brandDark);
        doc.roundedRect(margin, y, contentWidth, 18, 4, 4, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.text("MediNexus", margin + 6, y + 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Relatório de anamnese e consulta", margin + 6, y + 15);

        y += 26;
        doc.setTextColor(...brandInk);
      };

      const drawSectionTitle = (title: string) => {
        ensureSpace(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...brandDark);
        doc.text(title, margin, y);
        y += 8;
        doc.setTextColor(...brandInk);
      };

      const drawField = (label: string, value: string) => {
        const safeValue = value?.trim() ? value.trim() : "Não informado";
        const lines = doc.splitTextToSize(safeValue, contentWidth - 8);
        const blockHeight = Math.max(16, lines.length * 6 + 10);

        ensureSpace(blockHeight + 4);

        doc.setFillColor(...softGray);
        doc.roundedRect(margin, y, contentWidth, blockHeight, 4, 4, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, margin + 4, y + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(lines, margin + 4, y + 12);

        y += blockHeight + 4;
      };

      drawHeader();

      drawSectionTitle("Dados do paciente");
      drawField("Paciente", patientProfile?.full_name || "Não informado");
      drawField("Data de nascimento", formatBirthDate(patient?.birth_date || null));
      drawField("Idade", patientAge);
      drawField("Plano", healthPlanName);
      drawField("Clínica", appointment.clinics?.trade_name || "Não informada");
      drawField("Especialidade", appointment.specialties?.name || "Não informada");
      drawField(
        "Caráter da solicitação",
        getCharacterLabel(appointment.created_at, appointment.confirmed_start_at)
      );

      drawSectionTitle("Anamnese base");
      drawField("Alergias", medicalRecordForm.allergies);
      drawField("Doenças crônicas", medicalRecordForm.chronic_conditions);
      drawField(
        "Medicamentos em uso contínuo",
        medicalRecordForm.continuous_medications
      );
      drawField("Histórico cirúrgico", medicalRecordForm.surgical_history);
      drawField("Histórico familiar", medicalRecordForm.family_history);
      drawField("Hábitos", medicalRecordForm.habits);
      drawField("Resumo de anamnese", medicalRecordForm.anamnesis_summary);

      drawSectionTitle("Consulta atual");
      drawField("Queixa principal", consultationForm.chief_complaint);
      drawField("História da doença atual", consultationForm.history_present_illness);
      drawField("Anamnese da consulta", consultationForm.consultation_anamnesis);
      drawField("Observações", consultationForm.observations);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Emitido em ${new Date().toLocaleString("pt-BR")}`,
        margin,
        pageHeight - 10
      );

      const fileName = `anamnese-${slugify(
        patientProfile?.full_name || "paciente"
      )}.pdf`;

      doc.save(fileName);
    } finally {
      setDownloadingPdf(false);
    }
  }

  function handlePrintAnamnesis() {
    if (!appointment) return;

    setPrinting(true);

    const popup = window.open("", "_blank", "width=900,height=1200");

    if (!popup) {
      setPrinting(false);
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>Anamnese - MediNexus</title>
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 24px;
              color: #303B41;
              background: #F8F4F2;
            }
            .sheet {
              max-width: 820px;
              margin: 0 auto;
              background: white;
              border-radius: 18px;
              padding: 28px;
            }
            .header {
              background: #1B4B58;
              color: white;
              border-radius: 16px;
              padding: 20px;
              margin-bottom: 18px;
            }
            h1, h2, h3 { margin-top: 0; }
            .card {
              border: 1px solid #E6E1DE;
              border-radius: 14px;
              padding: 16px;
              margin-bottom: 14px;
            }
            .content { white-space: pre-wrap; line-height: 1.65; }
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
              .sheet { border-radius: 0; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <h1>MediNexus</h1>
              <p>Relatório de anamnese e consulta</p>
            </div>

            <div class="card">
              <div class="badge">Caráter da solicitação: ${escapeHtml(
                getCharacterLabel(appointment.created_at, appointment.confirmed_start_at)
              )}</div>
              <h2>${escapeHtml(patientProfile?.full_name || "Paciente")}</h2>
              <p><strong>Plano:</strong> ${escapeHtml(healthPlanName)}</p>
              <p><strong>Nascimento:</strong> ${escapeHtml(
                formatBirthDate(patient?.birth_date || null)
              )}</p>
              <p><strong>Clínica:</strong> ${escapeHtml(
                appointment.clinics?.trade_name || "Não informada"
              )}</p>
            </div>

            <div class="card">
              <h3>Anamnese base</h3>
              <div class="content">
Alergias: ${escapeHtml(medicalRecordForm.allergies || "Não informado")}

Doenças crônicas: ${escapeHtml(medicalRecordForm.chronic_conditions || "Não informado")}

Medicamentos em uso contínuo: ${escapeHtml(
      medicalRecordForm.continuous_medications || "Não informado"
    )}

Histórico cirúrgico: ${escapeHtml(medicalRecordForm.surgical_history || "Não informado")}

Histórico familiar: ${escapeHtml(medicalRecordForm.family_history || "Não informado")}

Hábitos: ${escapeHtml(medicalRecordForm.habits || "Não informado")}

Resumo: ${escapeHtml(medicalRecordForm.anamnesis_summary || "Não informado")}
              </div>
            </div>

            <div class="card">
              <h3>Consulta atual</h3>
              <div class="content">
Queixa principal: ${escapeHtml(consultationForm.chief_complaint || "Não informado")}

História da doença atual: ${escapeHtml(
      consultationForm.history_present_illness || "Não informado"
    )}

Anamnese da consulta: ${escapeHtml(
      consultationForm.consultation_anamnesis || "Não informado"
    )}

Observações: ${escapeHtml(consultationForm.observations || "Não informado")}
              </div>
            </div>
          </div>

          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `);

    popup.document.close();
    setPrinting(false);
  }

  async function handleDownloadPrescriptionPdf() {
    if (!appointment) return;

    setDownloadingPrescription(true);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 16;
      const width = pageWidth - margin * 2;
      let y = 18;

      const drawTitle = () => {
        doc.setFillColor(27, 75, 88);
        doc.roundedRect(margin, y, width, 20, 4, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("MediNexus", margin + 6, y + 9);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Receituário médico digital", margin + 6, y + 15);
        y += 28;
        doc.setTextColor(48, 59, 65);
      };

      const drawBlock = (label: string, value: string) => {
        const text = value?.trim() ? value.trim() : "Não informado";
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

      drawBlock(
        "Caráter da solicitação",
        getCharacterLabel(appointment.created_at, appointment.confirmed_start_at)
      );
      drawBlock("Paciente", patientProfile?.full_name || "Não informado");
      drawBlock("Data de nascimento", formatBirthDate(patient?.birth_date || null));
      drawBlock("Plano", healthPlanName);
      drawBlock("Clínica", appointment.clinics?.trade_name || "Não informada");
      drawBlock("Título", prescriptionForm.title || "Receituário médico");
      drawBlock(
        "Tipo",
        prescriptionForm.document_type === "medication"
          ? "Receita medicamentosa"
          : prescriptionForm.document_type === "exam"
          ? "Solicitação de exame"
          : "Documento livre"
      );
      drawBlock("Conteúdo", prescriptionForm.content || "Não informado");
      drawBlock("Orientações", prescriptionForm.guidance || "Não informado");

      y += 8;
      doc.setDrawColor(160, 160, 160);
      doc.line(margin + 38, y + 14, pageWidth - margin - 38, y + 14);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(doctor?.name || "Médico", pageWidth / 2, y + 24, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `CRM ${doctor?.crm || "não informado"}${
          doctor?.crm_state ? ` / ${doctor.crm_state}` : ""
        }`,
        pageWidth / 2,
        y + 30,
        { align: "center" }
      );

      doc.save(
        `receituario-${slugify(patientProfile?.full_name || "paciente")}.pdf`
      );
    } finally {
      setDownloadingPrescription(false);
    }
  }

  function handlePrintPrescription() {
    if (!appointment) return;

    const popup = window.open("", "_blank", "width=900,height=1200");

    if (!popup) return;

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
                getCharacterLabel(appointment.created_at, appointment.confirmed_start_at)
              )}</div>
              <div class="title">${escapeHtml(
                prescriptionForm.title || "Receituário médico"
              )}</div>
              <div class="sub">Data de emissão: ${escapeHtml(
                new Date().toLocaleDateString("pt-BR")
              )}</div>
              <div class="sub">Clínica: ${escapeHtml(
                appointment.clinics?.trade_name || "Clínica MediNexus"
              )}</div>
            </div>

            <div class="card">
              <strong>Paciente:</strong> ${escapeHtml(
                patientProfile?.full_name || "Paciente"
              )}<br />
              <strong>Plano:</strong> ${escapeHtml(healthPlanName)}<br />
              <strong>Nascimento:</strong> ${escapeHtml(
                formatBirthDate(patient?.birth_date || null)
              )}
            </div>

            <div class="card">
              <h3 style="margin-top:0;">Prescrição / orientações</h3>
              <div class="content">${escapeHtml(prescriptionForm.content)}</div>
            </div>

            ${
              prescriptionForm.guidance?.trim()
                ? `
              <div class="card">
                <h3 style="margin-top:0;">Observações</h3>
                <div class="content">${escapeHtml(prescriptionForm.guidance)}</div>
              </div>
            `
                : ""
            }

            <div class="signature">
              <div class="line"></div>
              <div><strong>${escapeHtml(doctor?.name || "Médico")}</strong></div>
              <div class="muted">CRM: ${escapeHtml(
                `${doctor?.crm || "não informado"}${
                  doctor?.crm_state ? ` / ${doctor.crm_state}` : ""
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

  const patientAge = useMemo(
    () => getAge(patient?.birth_date || null),
    [patient?.birth_date]
  );

  const isLocked = Boolean(consultationLockedAt);
  const timerLabel = formatDuration(
    consultationClosedAt ? consultationDurationSeconds : elapsedSeconds
  );
  const statusMeta = getConsultationStatusMeta(appointment?.status || "pending");
  const characterLabel = getCharacterLabel(
    appointment?.created_at,
    appointment?.confirmed_start_at
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando prontuário...</p>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="app-shell py-10">
          <Alert variant="error">Consulta não encontrada.</Alert>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/medico/solicitacoes"
              className="text-sm font-medium text-sky-700 hover:underline"
            >
              ← Voltar para solicitações do médico
            </Link>

            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-sky-700">
              Prontuário da consulta
            </p>
            <h1 className="mt-3 app-section-title">
              {patientProfile?.full_name || "Paciente"}
            </h1>
            <p className="app-section-subtitle">
              Registre anamnese, evolução, observações e documentos médicos.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-slate-500">Consulta</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusMeta.badgeClass}`}
                >
                  {statusMeta.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {statusMeta.description}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-slate-500">Tempo de atendimento</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {timerLabel}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {consultationStartedAt
                  ? `Iniciado em ${formatDateTime(consultationStartedAt)}`
                  : "Será iniciado ao abrir o prontuário."}
              </p>
            </div>
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
              Este atendimento já foi encerrado e o prontuário está bloqueado para edição.
            </Alert>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDownloadAnamnesisPdf}
            disabled={downloadingPdf}
            className="app-button-secondary"
          >
            {downloadingPdf ? "Gerando PDF..." : "Baixar anamnese em PDF"}
          </button>

          <button
            type="button"
            onClick={handlePrintAnamnesis}
            disabled={printing}
            className="app-button-secondary"
          >
            {printing ? "Preparando impressão..." : "Imprimir anamnese"}
          </button>

          <button
            type="button"
            onClick={handleEndConsultation}
            disabled={endingConsultation || isLocked}
            className="app-button-primary"
          >
            {endingConsultation ? "Encerrando..." : "Encerrar atendimento"}
          </button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Nascimento</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {formatBirthDate(patient?.birth_date || null)}
            </h3>
          </div>

          <div className="metric-card metric-card--success">
            <p className="text-sm text-green-700">Idade</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {patientAge}
            </h3>
          </div>

          <div className="metric-card metric-card--warning">
            <p className="text-sm text-yellow-700">Plano</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {healthPlanName}
            </h3>
          </div>

          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Especialidade</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {appointment.specialties?.name || "Não informada"}
            </h3>
          </div>

          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Caráter</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {characterLabel}
            </h3>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="app-card p-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              Dados do paciente
            </h2>

            <div className="mt-5 grid gap-3 text-slate-700">
              <p>
                <span className="font-semibold">Nome:</span>{" "}
                {patientProfile?.full_name || "Não informado"}
              </p>
              <p>
                <span className="font-semibold">E-mail:</span>{" "}
                {patientProfile?.email || "Não informado"}
              </p>
              <p>
                <span className="font-semibold">Telefone:</span>{" "}
                {patientProfile?.phone || "Não informado"}
              </p>
              <p>
                <span className="font-semibold">Clínica:</span>{" "}
                {appointment.clinics?.trade_name || "Não informada"}
              </p>
              <p>
                <span className="font-semibold">Local:</span>{" "}
                {appointment.clinics?.city || "Cidade não informada"} /{" "}
                {appointment.clinics?.state || "Estado não informado"}
              </p>
            </div>
          </div>

          <div className="app-card p-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              Dados da consulta
            </h2>

            <div className="mt-5 grid gap-3 text-slate-700">
              <p>
                <span className="font-semibold">Horário sugerido:</span>{" "}
                {appointment.requested_start_at
                  ? `${formatDateTime(
                      appointment.requested_start_at
                    )} até ${formatDateTime(appointment.requested_end_at)}`
                  : "Não definido"}
              </p>
              <p>
                <span className="font-semibold">Horário confirmado:</span>{" "}
                {appointment.confirmed_start_at
                  ? `${formatDateTime(
                      appointment.confirmed_start_at
                    )} até ${formatDateTime(appointment.confirmed_end_at)}`
                  : "Ainda não confirmado"}
              </p>
              <p>
                <span className="font-semibold">Início do atendimento:</span>{" "}
                {formatDateTime(consultationStartedAt)}
              </p>
              <p>
                <span className="font-semibold">Encerramento:</span>{" "}
                {formatDateTime(consultationClosedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="app-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Anamnese base do paciente
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Histórico geral reutilizável em futuras consultas na clínica.
                </p>
              </div>

              {medicalRecordUpdatedAt && (
                <span className="text-sm text-slate-500">
                  Atualizado em {formatDateTime(medicalRecordUpdatedAt)}
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-5">
              {[
                ["allergies", "Alergias", "Ex: Dipirona, penicilina, alimentos..."],
                ["chronic_conditions", "Doenças crônicas", "Ex: Hipertensão, diabetes, asma..."],
                ["continuous_medications", "Medicamentos em uso contínuo", "Liste medicamentos, dose e frequência"],
                ["surgical_history", "Histórico cirúrgico", "Cirurgias, internações e datas relevantes"],
                ["family_history", "Histórico familiar", "Doenças familiares relevantes"],
                ["habits", "Hábitos", "Ex: alimentação, sono, álcool, tabagismo, atividade física"],
                ["anamnesis_summary", "Resumo de anamnese", "Resumo clínico geral do paciente"],
              ].map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {label}
                  </label>
                  <textarea
                    name={name}
                    value={(medicalRecordForm as any)[name]}
                    onChange={handleMedicalRecordChange}
                    className="app-textarea"
                    placeholder={placeholder}
                    disabled={isLocked}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleSaveMedicalRecord}
                disabled={savingRecord || isLocked}
                className="app-button-primary"
              >
                {savingRecord ? "Salvando..." : "Salvar anamnese base"}
              </button>
            </div>
          </div>

          <div className="app-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Notas desta consulta
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Registro específico do atendimento atual.
                </p>
              </div>

              {consultationNoteUpdatedAt && (
                <span className="text-sm text-slate-500">
                  Atualizado em {formatDateTime(consultationNoteUpdatedAt)}
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-5">
              {[
                ["chief_complaint", "Queixa principal", "Motivo principal da consulta"],
                ["history_present_illness", "História da doença atual", "Evolução, duração, fatores de melhora/piora, sintomas associados"],
                ["consultation_anamnesis", "Anamnese da consulta", "Anamnese direcionada do atendimento"],
                ["observations", "Observações", "Condutas, observações clínicas e orientações"],
              ].map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {label}
                  </label>
                  <textarea
                    name={name}
                    value={(consultationForm as any)[name]}
                    onChange={handleConsultationChange}
                    className="app-textarea"
                    placeholder={placeholder}
                    disabled={isLocked}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleSaveConsultationNotes}
                disabled={savingNote || isLocked}
                className="app-button-primary"
              >
                {savingNote ? "Salvando..." : "Salvar notas da consulta"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 app-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Receituário premium
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Gere receita, solicitação de exame ou documento livre com assinatura médica.
              </p>
            </div>

            <span className="rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 ring-1 ring-purple-200">
              Caráter da solicitação: {characterLabel}
            </span>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tipo de documento
                </label>
                <select
                  name="document_type"
                  value={prescriptionForm.document_type}
                  onChange={handlePrescriptionChange}
                  className="app-input"
                  disabled={isLocked}
                >
                  <option value="medication">Receita medicamentosa</option>
                  <option value="exam">Solicitação de exame</option>
                  <option value="freeform">Documento livre</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Identificação do documento
                </label>
                <input
                  name="title"
                  value={prescriptionForm.title}
                  onChange={handlePrescriptionChange}
                  className="app-input"
                  placeholder="Ex: Receituário médico / Solicitação de exame"
                  disabled={isLocked}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Prescrição / solicitação
                </label>
                <textarea
                  name="content"
                  value={prescriptionForm.content}
                  onChange={handlePrescriptionChange}
                  className="app-textarea"
                  placeholder="Digite medicamentos, exames, orientações ou texto principal"
                  disabled={isLocked}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Observações complementares
                </label>
                <textarea
                  name="guidance"
                  value={prescriptionForm.guidance}
                  onChange={handlePrescriptionChange}
                  className="app-textarea"
                  placeholder="Orientações adicionais ao paciente"
                  disabled={isLocked}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSavePrescription}
                  disabled={savingPrescription || isLocked}
                  className="app-button-primary"
                >
                  {savingPrescription ? "Salvando..." : "Salvar receituário"}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPrescriptionPdf}
                  disabled={downloadingPrescription}
                  className="app-button-secondary"
                >
                  {downloadingPrescription ? "Gerando PDF..." : "Baixar PDF"}
                </button>

                <button
                  type="button"
                  onClick={handlePrintPrescription}
                  className="app-button-secondary"
                >
                  Imprimir
                </button>
              </div>

              {prescriptionId && (
                <p className="text-sm text-slate-500">
                  Receituário salvo e vinculado a esta consulta.
                </p>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[var(--brand-offwhite,#F8F4F2)] p-5 shadow-sm">
              <div className="rounded-[24px] bg-[var(--brand-petrol,#1B4B58)] p-5 text-white">
                <h3 className="text-2xl font-bold">MediNexus</h3>
                <p className="mt-1 text-sm text-white/80">
                  Receituário médico digital
                </p>
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                  Caráter da solicitação: {characterLabel}
                </span>

                <h4 className="mt-4 text-2xl font-bold text-slate-900">
                  {prescriptionForm.title || "Receituário médico"}
                </h4>

                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p>
                    <strong>Clínica:</strong>{" "}
                    {appointment.clinics?.trade_name || "Clínica MediNexus"}
                  </p>
                  <p>
                    <strong>Paciente:</strong>{" "}
                    {patientProfile?.full_name || "Paciente"}
                  </p>
                  <p>
                    <strong>Plano:</strong> {healthPlanName}
                  </p>
                  <p>
                    <strong>Nascimento:</strong>{" "}
                    {formatBirthDate(patient?.birth_date || null)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Prescrição / orientações
                </h5>
                <div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                  {prescriptionForm.content ||
                    "O conteúdo do receituário aparecerá aqui."}
                </div>
              </div>

              {prescriptionForm.guidance.trim() && (
                <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                  <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Observações
                  </h5>
                  <div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                    {prescriptionForm.guidance}
                  </div>
                </div>
              )}

              <div className="mt-8 px-4 text-center">
                <div className="mx-auto mb-3 h-px w-72 bg-slate-300" />
                <p className="font-semibold text-slate-900">
                  {doctor?.name || "Médico"}
                </p>
                <p className="text-sm text-slate-500">
                  CRM: {doctor?.crm || "não informado"}
                  {doctor?.crm_state ? ` / ${doctor.crm_state}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 app-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Histórico do paciente nesta clínica
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Resumos de consultas anteriores para apoio ao atendimento.
              </p>
            </div>

            <span className="text-sm text-slate-500">
              {historyItems.length} registro(s)
            </span>
          </div>

          {historyItems.length === 0 ? (
            <p className="mt-6 text-slate-500">
              Nenhuma consulta anterior concluída encontrada para este paciente nesta clínica.
            </p>
          ) : (
            <div className="mt-6 grid gap-4">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {item.specialties?.name || "Especialidade não informada"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Médico: {item.doctors?.name || "Não informado"}
                      </p>
                    </div>

                    <div className="text-sm text-slate-500">
                      <p>{formatDateTime(item.consultation_closed_at)}</p>
                      <p>
                        Duração:{" "}
                        {formatDuration(item.consultation_duration_seconds)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-4">
                    <p className="text-sm leading-7 text-slate-700">
                      {buildHistorySummary(item)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}