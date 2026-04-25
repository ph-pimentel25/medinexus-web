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

export default function MedicoConsultaProntuarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const appointmentId = params?.id;

  const [loading, setLoading] = useState(true);
  const [savingRecord, setSavingRecord] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [doctorId, setDoctorId] = useState("");
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(
    null
  );
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [healthPlanName, setHealthPlanName] = useState<string>("Não informado");

  const [medicalRecordUpdatedAt, setMedicalRecordUpdatedAt] = useState<
    string | null
  >(null);
  const [consultationNoteUpdatedAt, setConsultationNoteUpdatedAt] = useState<
    string | null
  >(null);

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
      requested_start_at: rawAppointment.requested_start_at,
      requested_end_at: rawAppointment.requested_end_at,
      confirmed_start_at: rawAppointment.confirmed_start_at,
      confirmed_end_at: rawAppointment.confirmed_end_at,
      clinics: pickOne(rawAppointment.clinics),
      specialties: pickOne(rawAppointment.specialties),
    };

    setAppointment(normalizedAppointment);

    const [
      profileResponse,
      patientResponse,
      medicalRecordResponse,
      consultationNoteResponse,
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
        .from("medical_records")
        .select(`
          allergies,
          chronic_conditions,
          continuous_medications,
          surgical_history,
          family_history,
          habits,
          anamnesis_summary,
          updated_at
        `)
        .eq("patient_id", normalizedAppointment.patient_id)
        .eq("clinic_id", normalizedAppointment.clinic_id)
        .maybeSingle<MedicalRecordRow>(),
      supabase
        .from("consultation_notes")
        .select(`
          chief_complaint,
          history_present_illness,
          consultation_anamnesis,
          observations,
          updated_at
        `)
        .eq("appointment_id", normalizedAppointment.id)
        .maybeSingle<ConsultationNoteRow>(),
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

    setPatientProfile(profileResponse.data || null);
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

    if (consultationNoteResponse.data) {
      setConsultationForm({
        chief_complaint: consultationNoteResponse.data.chief_complaint || "",
        history_present_illness:
          consultationNoteResponse.data.history_present_illness || "",
        consultation_anamnesis:
          consultationNoteResponse.data.consultation_anamnesis || "",
        observations: consultationNoteResponse.data.observations || "",
      });

      setConsultationNoteUpdatedAt(
        consultationNoteResponse.data.updated_at || null
      );
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

  async function handleSaveMedicalRecord() {
    if (!appointment || !doctorId) return;

    setSavingRecord(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      patient_id: appointment.patient_id,
      clinic_id: appointment.clinic_id,
      created_by: user?.id || null,
      allergies: medicalRecordForm.allergies || null,
      chronic_conditions: medicalRecordForm.chronic_conditions || null,
      continuous_medications: medicalRecordForm.continuous_medications || null,
      surgical_history: medicalRecordForm.surgical_history || null,
      family_history: medicalRecordForm.family_history || null,
      habits: medicalRecordForm.habits || null,
      anamnesis_summary: medicalRecordForm.anamnesis_summary || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("medical_records").upsert(payload, {
      onConflict: "patient_id,clinic_id",
    });

    if (error) {
      setMessage(`Erro ao salvar anamnese base: ${error.message}`);
      setMessageType("error");
      setSavingRecord(false);
      return;
    }

    setMedicalRecordUpdatedAt(new Date().toISOString());
    setMessage("Anamnese base do paciente salva com sucesso.");
    setMessageType("success");
    setSavingRecord(false);
  }

  async function handleSaveConsultationNotes() {
    if (!appointment || !doctorId) return;

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

    const payload = {
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      clinic_id: appointment.clinic_id,
      doctor_id: doctorId,
      specialty_id: appointment.specialty_id,
      created_by: user?.id || null,
      chief_complaint: consultationForm.chief_complaint || null,
      history_present_illness:
        consultationForm.history_present_illness || null,
      consultation_anamnesis:
        consultationForm.consultation_anamnesis || null,
      observations: consultationForm.observations || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("consultation_notes").upsert(payload, {
      onConflict: "appointment_id",
    });

    if (error) {
      setMessage(`Erro ao salvar notas da consulta: ${error.message}`);
      setMessageType("error");
      setSavingNote(false);
      return;
    }

    setConsultationNoteUpdatedAt(new Date().toISOString());
    setMessage("Notas da consulta salvas com sucesso.");
    setMessageType("success");
    setSavingNote(false);
  }

  const patientAge = useMemo(
    () => getAge(patient?.birth_date || null),
    [patient?.birth_date]
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
              Registre anamnese, queixa principal e observações clínicas da
              consulta.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-slate-500">Status da consulta</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {appointment.status}
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="metric-card metric-card--neutral">
            <p className="text-sm text-slate-500">Data de nascimento</p>
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
                <span className="font-semibold">Status:</span>{" "}
                {appointment.status}
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
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Alergias
                </label>
                <textarea
                  name="allergies"
                  value={medicalRecordForm.allergies}
                  onChange={handleMedicalRecordChange}
                  className="app-textarea"
                  placeholder="Ex: Dipirona, penicilina, alimentos..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Doenças crônicas
                </label>
                <textarea
                  name="chronic_conditions"
                  value={medicalRecordForm.chronic_conditions}
                  onChange={handleMedicalRecordChange}
                  className="app-textarea"
                  placeholder="Ex: Hipertensão, diabetes, asma..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Medicamentos em uso contínuo
                </label>
                <textarea
                  name="continuous_medications"
                  value={medicalRecordForm.continuous_medications}
                  onChange={handleMedicalRecordChange}
                  className="app-textarea"
                  placeholder="Liste medicamentos, dose e frequência"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Histórico cirúrgico
                </label>
                <textarea
                  name="surgical_history"
                  value={medicalRecordForm.surgical_history}
                  onChange={handleMedicalRecordChange}
                  className="app-textarea"
                  placeholder="Cirurgias, internações e datas relevantes"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Histórico familiar
                </label>
                <textarea
                  name="family_history"
                  value={medicalRecordForm.family_history}
                  onChange={handleMedicalRecordChange}
                  className="app-textarea"
                  placeholder="Doenças familiares relevantes"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Hábitos
                </label>
                <textarea
                  name="habits"
                  value={medicalRecordForm.habits}
                  onChange={handleMedicalRecordChange}
                  className="app-textarea"
                  placeholder="Ex: alimentação, sono, álcool, tabagismo, atividade física"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Resumo de anamnese
                </label>
                <textarea
                  name="anamnesis_summary"
                  value={medicalRecordForm.anamnesis_summary}
                  onChange={handleMedicalRecordChange}
                  className="app-textarea"
                  placeholder="Resumo clínico geral do paciente"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveMedicalRecord}
                disabled={savingRecord}
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
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Queixa principal
                </label>
                <textarea
                  name="chief_complaint"
                  value={consultationForm.chief_complaint}
                  onChange={handleConsultationChange}
                  className="app-textarea"
                  placeholder="Motivo principal da consulta"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  História da doença atual
                </label>
                <textarea
                  name="history_present_illness"
                  value={consultationForm.history_present_illness}
                  onChange={handleConsultationChange}
                  className="app-textarea"
                  placeholder="Evolução, duração, fatores de melhora/piora, sintomas associados"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Anamnese da consulta
                </label>
                <textarea
                  name="consultation_anamnesis"
                  value={consultationForm.consultation_anamnesis}
                  onChange={handleConsultationChange}
                  className="app-textarea"
                  placeholder="Anamnese direcionada do atendimento"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Observações
                </label>
                <textarea
                  name="observations"
                  value={consultationForm.observations}
                  onChange={handleConsultationChange}
                  className="app-textarea"
                  placeholder="Condutas, observações clínicas e orientações"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveConsultationNotes}
                disabled={savingNote}
                className="app-button-primary"
              >
                {savingNote ? "Salvando..." : "Salvar notas da consulta"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}