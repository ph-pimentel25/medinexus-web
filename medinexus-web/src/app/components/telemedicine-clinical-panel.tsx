"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  User,
  History,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Activity,
  Pill,
  Sparkles,
  Phone,
  Calendar,
  X,
  Loader2,
  BookOpen,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { ANAMNESIS_TEMPLATES, type AnamnesisTemplate } from "../lib/anamnesis-templates";
import { loadTriage, type PreConsultationTriage } from "../lib/pre-consultation-triage";

interface PatientData {
  id?: string;
  full_name: string | null;
  cpf: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  health_plan_operator: string | null;
  health_plan_product_name: string | null;
  health_plan_card_number: string | null;
}

interface AppointmentDetails {
  id: string;
  status: string | null;
  patient_id: string | null;
  clinic_id: string | null;
  doctor_id: string | null;
  patients: PatientData | PatientData[] | null;
  doctors: { name: string | null; crm: string | null; crm_state: string | null } | null;
  clinics: { trade_name: string | null; legal_name: string | null; city: string | null; state: string | null } | null;
}

interface MedicalRecordData {
  id?: string;
  patient_id: string;
  base_anamnesis: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
  continuous_medications: string | null;
  family_history: string | null;
  surgical_history: string | null;
  lifestyle_notes: string | null;
  updated_at?: string | null;
}

interface ConsultationNoteData {
  id?: string;
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
}

interface PreviousNoteItem {
  id: string;
  appointment_id: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  summary: string | null;
  created_at: string | null;
}

interface TelemedicineClinicalPanelProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(val?: string | null) {
  if (!val) return "Não informado";
  try {
    return new Date(`${val}T00:00:00`).toLocaleDateString("pt-BR");
  } catch {
    return val;
  }
}

function getAge(birthDate?: string | null) {
  if (!birthDate) return "Idade não informada";
  try {
    const birth = new Date(`${birthDate}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} anos`;
  } catch {
    return "";
  }
}

function formatCpf(val?: string | null) {
  if (!val) return "Não informado";
  const digits = val.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return val;
}

export function TelemedicineClinicalPanel({
  appointmentId,
  isOpen,
  onClose,
}: TelemedicineClinicalPanelProps) {
  const [activeTab, setActiveTab] = useState<"soap" | "record" | "history">("soap");
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [lastSavedNoteAt, setLastSavedNoteAt] = useState<string | null>(null);
  const [lastSavedRecordAt, setLastSavedRecordAt] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordData | null>(null);
  const [consultationNote, setConsultationNote] = useState<ConsultationNoteData | null>(null);
  const [previousNotes, setPreviousNotes] = useState<PreviousNoteItem[]>([]);
  const [triage, setTriage] = useState<PreConsultationTriage | null>(null);

  // Forms
  const [soapForm, setSoapForm] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    private_notes: "",
  });

  const [recordForm, setRecordForm] = useState({
    allergies: "",
    chronic_conditions: "",
    continuous_medications: "",
    surgical_history: "",
    family_history: "",
    lifestyle_notes: "",
    base_anamnesis: "",
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        // 1. Carrega dados da consulta
        const { data: apptData, error: apptErr } = await supabase
          .from("appointments")
          .select(`
            id, status, patient_id, clinic_id, doctor_id,
            patients (
              id, full_name, cpf, birth_date, phone, email,
              health_plan_operator, health_plan_product_name, health_plan_card_number
            ),
            doctors (name, crm, crm_state),
            clinics (trade_name, legal_name, city, state)
          `)
          .eq("id", appointmentId)
          .maybeSingle();

        if (apptErr || !apptData) throw new Error("Não foi possível carregar a consulta.");

        if (!mounted) return;
        setAppointment(apptData as unknown as AppointmentDetails);

        const patientId = apptData.patient_id;

        // 2. Carrega Ficha do Paciente (medical_records)
        const recordPromise = patientId
          ? supabase
              .from("medical_records")
              .select("*")
              .eq("patient_id", patientId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null });

        // 3. Carrega Nota da Consulta Atual (RPC seguro)
        const notePromise = supabase.rpc("read_own_consultation_note", {
          p_appointment_id: appointmentId,
        });

        // 4. Carrega Histórico Anterior
        const prevPromise = patientId
          ? supabase
              .from("consultation_notes")
              .select("id, appointment_id, subjective, objective, assessment, plan, summary, created_at")
              .eq("patient_id", patientId)
              .neq("appointment_id", appointmentId)
              .order("created_at", { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [], error: null });

        const [recRes, noteRes, prevRes] = await Promise.all([
          recordPromise,
          notePromise,
          prevPromise,
        ]);

        if (!mounted) return;

        if (recRes.data) {
          const rec = recRes.data as MedicalRecordData;
          setMedicalRecord(rec);
          setRecordForm({
            allergies: rec.allergies || "",
            chronic_conditions: rec.chronic_conditions || "",
            continuous_medications: rec.continuous_medications || "",
            surgical_history: rec.surgical_history || "",
            family_history: rec.family_history || "",
            lifestyle_notes: rec.lifestyle_notes || "",
            base_anamnesis: rec.base_anamnesis || "",
          });
        }

        if (noteRes.data) {
          const n = noteRes.data as ConsultationNoteData;
          setConsultationNote(n);
          setSoapForm({
            subjective: n.subjective || "",
            objective: n.objective || "",
            assessment: n.assessment || "",
            plan: n.plan || "",
            private_notes: n.private_notes || "",
          });
        }

        if (prevRes.data) {
          setPreviousNotes((prevRes.data as PreviousNoteItem[]) || []);
        }

        // 5. Carrega Triagem Pré-Consulta
        const loadedTriage = loadTriage(appointmentId);
        setTriage(loadedTriage);
      } catch (err: any) {
        if (mounted) {
          setStatusMessage({
            text: err?.message || "Erro ao carregar prontuário.",
            type: "error",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [appointmentId, isOpen]);

  // Aplicar modelo rápido
  function handleApplyTemplate(template: AnamnesisTemplate) {
    setSelectedTemplateId(template.id);
    setSoapForm((prev) => ({
      subjective: prev.subjective ? `${prev.subjective}\n\n${template.subjective}` : template.subjective,
      objective: prev.objective ? `${prev.objective}\n\n${template.objective}` : template.objective,
      assessment: prev.assessment ? `${prev.assessment}\n\n${template.assessment}` : template.assessment,
      plan: prev.plan ? `${prev.plan}\n\n${template.plan}` : template.plan,
      private_notes: prev.private_notes,
    }));
    setStatusMessage({
      text: `Modelo de ${template.specialty} inserido com sucesso!`,
      type: "success",
    });
  }

  // Salvar Registro de Atendimento Atual (SOAP)
  async function handleSaveSoap() {
    if (!appointment) return;
    setSavingNote(true);
    setStatusMessage(null);

    try {
      const summaryParts = [
        soapForm.subjective ? `Queixa/Subjetivo: ${soapForm.subjective}` : "",
        soapForm.objective ? `Achados/Objetivo: ${soapForm.objective}` : "",
        soapForm.assessment ? `Avaliação: ${soapForm.assessment}` : "",
        soapForm.plan ? `Conduta: ${soapForm.plan}` : "",
      ].filter(Boolean);
      const generatedSummary = summaryParts.join("\n\n");

      const payload = {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        clinic_id: appointment.clinic_id,
        subjective: soapForm.subjective,
        objective: soapForm.objective,
        assessment: soapForm.assessment,
        plan: soapForm.plan,
        private_notes: soapForm.private_notes,
        summary: generatedSummary,
      };

      if (consultationNote?.id) {
        const { error } = await supabase
          .from("consultation_notes")
          .update(payload)
          .eq("id", consultationNote.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("consultation_notes")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        if (data) {
          setConsultationNote((prev) => ({ ...prev, id: data.id, ...payload }));
        }
      }

      const nowStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSavedNoteAt(nowStr);
      setStatusMessage({
        text: `Registro do atendimento salvo com sucesso às ${nowStr}!`,
        type: "success",
      });
    } catch (err: any) {
      setStatusMessage({
        text: `Erro ao salvar atendimento: ${err?.message || "falha no banco de dados"}`,
        type: "error",
      });
    } finally {
      setSavingNote(false);
    }
  }

  // Salvar Ficha Permanente do Paciente
  async function handleSaveRecord() {
    if (!appointment?.patient_id) return;
    setSavingRecord(true);
    setStatusMessage(null);

    try {
      const payload = {
        patient_id: appointment.patient_id,
        allergies: recordForm.allergies,
        chronic_conditions: recordForm.chronic_conditions,
        continuous_medications: recordForm.continuous_medications,
        surgical_history: recordForm.surgical_history,
        family_history: recordForm.family_history,
        lifestyle_notes: recordForm.lifestyle_notes,
        base_anamnesis: recordForm.base_anamnesis,
      };

      if (medicalRecord?.id) {
        const { error } = await supabase
          .from("medical_records")
          .update(payload)
          .eq("id", medicalRecord.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("medical_records")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        if (data) {
          setMedicalRecord((prev) => ({ ...prev, id: data.id, ...payload }));
        }
      }

      const nowStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSavedRecordAt(nowStr);
      setStatusMessage({
        text: `Ficha do paciente salva com sucesso às ${nowStr}!`,
        type: "success",
      });
    } catch (err: any) {
      setStatusMessage({
        text: `Erro ao salvar ficha: ${err?.message || "falha no banco de dados"}`,
        type: "error",
      });
    } finally {
      setSavingRecord(false);
    }
  }

  if (!isOpen) return null;

  const patient = Array.isArray(appointment?.patients)
    ? appointment?.patients[0]
    : appointment?.patients;

  const hasAllergies = Boolean(recordForm.allergies.trim());

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-slate-800 bg-slate-900/98 shadow-2xl backdrop-blur-md sm:w-[480px] md:w-[520px] lg:relative lg:w-[480px] xl:w-[540px]"
      aria-label="Prontuário Médico da Telemedicina"
    >
      {/* Top Header do Painel */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mn-teal/20 text-teal-400">
            <Stethoscope size={18} />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Prontuário Médico Digital
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              CFM Nº 1.821/2007 • Registro em Tempo Real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/medico/consultas/${appointmentId}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir prontuário completo em nova aba"
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <span>Ver Completo</span>
            <ExternalLink size={12} />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Fechar painel do prontuário"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Cartão de Identificação Rápida do Paciente */}
      <div className="border-b border-slate-800/80 bg-slate-950/40 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-bold text-white">
                {patient?.full_name || "Paciente sem nome"}
              </span>
              <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                {getAge(patient?.birth_date)}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
              <span>CPF: <strong className="font-mono text-slate-300">{formatCpf(patient?.cpf)}</strong></span>
              <span>•</span>
              <span>Plano: <strong className="text-teal-400">{patient?.health_plan_operator || "Particular"}</strong></span>
              {patient?.phone && (
                <>
                  <span>•</span>
                  <a
                    href={`https://wa.me/55${patient.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                    title="Conversar no WhatsApp"
                  >
                    <Phone size={10} />
                    <span>WhatsApp</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Badge de Alerta de Alergia */}
        {hasAllergies && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-xs text-rose-200">
            <AlertTriangle size={14} className="shrink-0 text-rose-400" />
            <div className="truncate">
              <strong className="font-bold text-rose-300">Alergias:</strong>{" "}
              <span className="truncate">{recordForm.allergies}</span>
            </div>
          </div>
        )}
      </div>

      {/* Abas de Navegação */}
      <div className="flex shrink-0 border-b border-slate-800 bg-slate-950/80 px-2 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("soap")}
          className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-bold transition ${
            activeTab === "soap"
              ? "border-teal-400 text-teal-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity size={14} />
          <span>Atendimento Atual (SOAP)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("record")}
          className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-bold transition ${
            activeTab === "record"
              ? "border-teal-400 text-teal-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <User size={14} />
          <span>Ficha do Paciente</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-bold transition ${
            activeTab === "history"
              ? "border-teal-400 text-teal-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History size={14} />
          <span>Histórico & Triagem</span>
        </button>
      </div>

      {/* Mensagem de Feedback */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between border-b px-4 py-2 text-xs font-semibold ${
            statusMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/60 text-emerald-300"
              : "border-rose-500/30 bg-rose-950/60 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Conteúdo das Abas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-200">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <Loader2 size={24} className="animate-spin text-teal-400" />
            <p className="mt-3 text-xs">Carregando dados do prontuário…</p>
          </div>
        ) : (
          <>
            {/* TAB 1: SOAP / ATENDIMENTO ATUAL */}
            {activeTab === "soap" && (
              <div className="space-y-4">
                {/* Templates Rápidos */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <Sparkles size={12} className="text-teal-400" />
                      Modelos de Anamnese (1-Clique)
                    </span>
                    {selectedTemplateId && (
                      <span className="text-[10px] text-teal-400 font-semibold">Modelo aplicado</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ANAMNESIS_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          selectedTemplateId === tmpl.id
                            ? "bg-teal-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {tmpl.specialty}
                      </button>
                    ))}
                  </div>
                </div>

                {/* S - Subjetivo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-300 flex items-center gap-1">
                      <span>S — Subjetivo</span>
                      <span className="text-[10px] font-normal text-slate-400">(Queixa principal, relato na chamada e HMA)</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={soapForm.subjective}
                    onChange={(e) => setSoapForm({ ...soapForm, subjective: e.target.value })}
                    placeholder="Descreva o motivo da consulta, sintomas relatados pelo paciente, duração e queixas..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>

                {/* O - Objetivo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-300 flex items-center gap-1">
                      <span>O — Objetivo</span>
                      <span className="text-[10px] font-normal text-slate-400">(Exame visual por vídeo e dados aferidos)</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={soapForm.objective}
                    onChange={(e) => setSoapForm({ ...soapForm, objective: e.target.value })}
                    placeholder="Ex: Bom estado geral, fácies atípica, lesão visualizada em tela, PA informada pelo paciente..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>

                {/* A - Avaliação */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-300 flex items-center gap-1">
                      <span>A — Avaliação</span>
                      <span className="text-[10px] font-normal text-slate-400">(Hipótese diagnóstica, raciocínio clínico e CID-10)</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={soapForm.assessment}
                    onChange={(e) => setSoapForm({ ...soapForm, assessment: e.target.value })}
                    placeholder="Ex: 1. Cefaleia tensional episódica (G44.2). 2. Rinite alérgica em agudização."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>

                {/* P - Plano & Conduta */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-300 flex items-center gap-1">
                      <span>P — Plano / Conduta</span>
                      <span className="text-[10px] font-normal text-slate-400">(Prescrições, orientações e exames)</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={soapForm.plan}
                    onChange={(e) => setSoapForm({ ...soapForm, plan: e.target.value })}
                    placeholder="Orientações fornecidas, medicamentos receitados, pedidos de exames complementares e prazo de retorno..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>

                {/* Notas Privadas */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-purple-400" />
                      <span>Notas Confidenciais do Médico</span>
                    </label>
                    <span className="text-[10px] text-purple-400/80 font-medium">Não visíveis ao paciente</span>
                  </div>
                  <textarea
                    rows={2}
                    value={soapForm.private_notes}
                    onChange={(e) => setSoapForm({ ...soapForm, private_notes: e.target.value })}
                    placeholder="Anotações internas, impressões reservadas ou pendências para a próxima consulta..."
                    className="w-full rounded-xl border border-purple-900/40 bg-purple-950/20 p-3 text-xs text-purple-100 placeholder-purple-400/40 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                </div>

                {/* Botão de Salvar SOAP */}
                <div className="sticky bottom-0 pt-2 pb-1 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
                  <button
                    type="button"
                    onClick={handleSaveSoap}
                    disabled={savingNote}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-[0.99] py-3 px-4 text-xs font-bold text-white shadow-lg shadow-teal-900/20 disabled:opacity-50 transition"
                  >
                    {savingNote ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Salvando Atendimento…</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Salvar Atendimento (SOAP)</span>
                      </>
                    )}
                  </button>
                  {lastSavedNoteAt && (
                    <p className="mt-1.5 text-center text-[10px] text-slate-500">
                      Última gravação salva às {lastSavedNoteAt}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: FICHA DO PACIENTE (PRONTUÁRIO BASE) */}
            {activeTab === "record" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle size={15} />
                    <span>Alergias e Reações Adversas</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-300/80">
                    Medicamentos, substâncias, alimentos ou contrastes a que o paciente tem alergia confirmada.
                  </p>
                  <textarea
                    rows={2}
                    value={recordForm.allergies}
                    onChange={(e) => setRecordForm({ ...recordForm, allergies: e.target.value })}
                    placeholder="Ex: Alergia a Penicilina, Dipirona, Frutos do Mar..."
                    className="mt-2 w-full rounded-lg border border-amber-500/40 bg-slate-950 p-2.5 text-xs text-amber-100 placeholder-amber-400/30 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                {/* Condições Crônicas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Condições Crônicas / Patologias Prévias
                  </label>
                  <textarea
                    rows={2}
                    value={recordForm.chronic_conditions}
                    onChange={(e) => setRecordForm({ ...recordForm, chronic_conditions: e.target.value })}
                    placeholder="Ex: Hipertensão Arterial Sistêmica (HAS), Diabetes Mellitus tipo 2, Asma..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 transition"
                  />
                </div>

                {/* Medicações Contínuas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Medicações de Uso Contínuo
                  </label>
                  <textarea
                    rows={2}
                    value={recordForm.continuous_medications}
                    onChange={(e) => setRecordForm({ ...recordForm, continuous_medications: e.target.value })}
                    placeholder="Ex: Losartana 50mg 1x/dia, Metformina 850mg 2x/dia..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 transition"
                  />
                </div>

                {/* Histórico Cirúrgico */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Histórico Cirúrgico & Internações
                  </label>
                  <textarea
                    rows={2}
                    value={recordForm.surgical_history}
                    onChange={(e) => setRecordForm({ ...recordForm, surgical_history: e.target.value })}
                    placeholder="Ex: Apendicectomia em 2018, Colecistectomia por videolaparoscopia..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 transition"
                  />
                </div>

                {/* Histórico Familiar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Histórico Familiar Relevante
                  </label>
                  <textarea
                    rows={2}
                    value={recordForm.family_history}
                    onChange={(e) => setRecordForm({ ...recordForm, family_history: e.target.value })}
                    placeholder="Ex: Pai falecido por IAM aos 58 anos. Mãe portadora de neoplasia de mama aos 49..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 transition"
                  />
                </div>

                {/* Estilo de Vida */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Estilo de Vida, Hábitos & Dieta
                  </label>
                  <textarea
                    rows={2}
                    value={recordForm.lifestyle_notes}
                    onChange={(e) => setRecordForm({ ...recordForm, lifestyle_notes: e.target.value })}
                    placeholder="Ex: Não fumante, etilista social. Pratica musculação 3x/semana. Qualidade do sono regular..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 transition"
                  />
                </div>

                {/* Anamnese Geral */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Anamnese Base / Antecedentes Pessoais
                  </label>
                  <textarea
                    rows={2}
                    value={recordForm.base_anamnesis}
                    onChange={(e) => setRecordForm({ ...recordForm, base_anamnesis: e.target.value })}
                    placeholder="Histórico clínico geral permanente do paciente..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 transition"
                  />
                </div>

                {/* Botão de Salvar Ficha */}
                <div className="sticky bottom-0 pt-2 pb-1 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
                  <button
                    type="button"
                    onClick={handleSaveRecord}
                    disabled={savingRecord}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-[0.99] py-3 px-4 text-xs font-bold text-white shadow-lg shadow-teal-900/20 disabled:opacity-50 transition"
                  >
                    {savingRecord ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Salvando Ficha do Paciente…</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Salvar Ficha do Paciente</span>
                      </>
                    )}
                  </button>
                  {lastSavedRecordAt && (
                    <p className="mt-1.5 text-center text-[10px] text-slate-500">
                      Ficha salva às {lastSavedRecordAt}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: HISTÓRICO & TRIAGEM PRÉ-CONSULTA */}
            {activeTab === "history" && (
              <div className="space-y-4">
                {/* Triagem Pré-Consulta */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                      <Sparkles size={14} className="text-teal-400" />
                      Triagem Pré-Consulta
                    </span>
                    {triage ? (
                      <span className="rounded-full bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        Preenchida pelo Paciente
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Não preenchida</span>
                    )}
                  </div>

                  {triage ? (
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Queixa Relatada na Triagem:
                        </span>
                        <p className="mt-0.5 text-slate-200 font-medium">{triage.chiefComplaint}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Duração:</span>
                          <span className="text-slate-300 font-semibold">{triage.duration || "Não informada"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Escala de Dor (0-10):</span>
                          <span className="text-amber-400 font-bold">{triage.painLevel} / 10</span>
                        </div>
                      </div>

                      {triage.associatedSymptoms && triage.associatedSymptoms.length > 0 && (
                        <div className="pt-1 border-t border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block mb-1">Sintomas Associados:</span>
                          <div className="flex flex-wrap gap-1">
                            {triage.associatedSymptoms.map((s, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {triage.aiSummary && (
                        <div className="mt-3 rounded-xl border border-teal-500/20 bg-teal-950/20 p-3 text-[11px] text-teal-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-teal-300">
                            <span>Sumário Clínico Preliminar (IA)</span>
                            <span className="text-[10px] bg-teal-900/40 px-1.5 py-0.5 rounded">
                              {triage.aiSummary.urgencyLevel}
                            </span>
                          </div>
                          <p className="text-slate-300">{triage.aiSummary.clinicalSummaryText}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      O paciente não realizou o questionário preliminar de triagem antes desta sessão.
                    </p>
                  )}
                </div>

                {/* Consultas Anteriores */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    Consultas Anteriores do Paciente ({previousNotes.length})
                  </span>

                  {previousNotes.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center text-xs text-slate-400">
                      Nenhum atendimento anterior registrado para este paciente no sistema.
                    </div>
                  ) : (
                    previousNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-2 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-teal-300">
                            {note.created_at
                              ? new Date(note.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Data não informada"}
                          </span>
                          <span className="text-[10px] text-slate-500">Atendimento Concluído</span>
                        </div>

                        {note.assessment && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block">Diagnóstico:</span>
                            <p className="text-slate-300 font-medium">{note.assessment}</p>
                          </div>
                        )}

                        {note.plan && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block">Conduta anterior:</span>
                            <p className="text-slate-400 line-clamp-2">{note.plan}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Atalho para Prescrições e Atestados */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                  <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <FileText size={14} className="text-purple-400" />
                    <span>Emissão de Documentos Digitais</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Emita receitas com padrão CFM, solicitações de exames laboratoriais ou atestados com validação ICP-Brasil.
                  </p>
                  <Link
                    href={`/medico/consultas/${appointmentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 transition"
                  >
                    <span>Emitir Receitas, Exames & Atestados</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
