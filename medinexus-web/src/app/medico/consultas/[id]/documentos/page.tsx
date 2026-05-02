"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../../../components/alert";
import { supabase } from "../../../../lib/supabase";

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
  patients:
    | {
        full_name: string | null;
        cpf: string | null;
        birth_date: string | null;
        phone: string | null;
        health_plan_operator: string | null;
        health_plan_product_name: string | null;
      }
    | {
        full_name: string | null;
        cpf: string | null;
        birth_date: string | null;
        phone: string | null;
        health_plan_operator: string | null;
        health_plan_product_name: string | null;
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

type DocumentType =
  | "prescription"
  | "exam_request"
  | "medical_certificate"
  | "attendance_declaration"
  | "clinical_summary";

type FormState = {
  documentType: DocumentType;
  title: string;
  clinicalIndication: string;
  cidCode: string;
  cidDescription: string;
  plainText: string;
  medicationName: string;
  medicationUse: string;
  examName: string;
  examObservation: string;
  daysOff: string;
  purpose: string;
  releaseToPatient: boolean;
};

const documentTypeOptions: {
  value: DocumentType;
  label: string;
  description: string;
}[] = [
  {
    value: "prescription",
    label: "Receita médica",
    description: "Prescrição de medicamento, orientações e conduta.",
  },
  {
    value: "exam_request",
    label: "Solicitação de exame",
    description: "Pedido de exame com indicação clínica e observações.",
  },
  {
    value: "medical_certificate",
    label: "Atestado médico",
    description: "Afastamento com CID, dias e finalidade.",
  },
  {
    value: "attendance_declaration",
    label: "Declaração de comparecimento",
    description: "Comprova presença do paciente no atendimento.",
  },
  {
    value: "clinical_summary",
    label: "Resumo clínico",
    description: "Resumo objetivo da consulta e conduta.",
  },
];

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

function getDocumentLabel(type: DocumentType) {
  return (
    documentTypeOptions.find((item) => item.value === type)?.label ||
    "Documento médico"
  );
}

function getDefaultTitle(type: DocumentType) {
  if (type === "prescription") return "Receita médica";
  if (type === "exam_request") return "Solicitação de exame";
  if (type === "medical_certificate") return "Atestado médico";
  if (type === "attendance_declaration") return "Declaração de comparecimento";
  return "Resumo clínico";
}

function createPlainText(form: FormState, patientName: string) {
  if (form.documentType === "prescription") {
    return [
      `Paciente: ${patientName}`,
      "",
      "Receita médica",
      "",
      form.medicationName ? `Medicamento: ${form.medicationName}` : "",
      form.medicationUse ? `Modo de uso: ${form.medicationUse}` : "",
      form.plainText ? `Orientações: ${form.plainText}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (form.documentType === "exam_request") {
    return [
      `Paciente: ${patientName}`,
      "",
      "Solicitação de exame",
      "",
      form.examName ? `Exame solicitado: ${form.examName}` : "",
      form.clinicalIndication
        ? `Indicação clínica: ${form.clinicalIndication}`
        : "",
      form.examObservation ? `Observação: ${form.examObservation}` : "",
      form.cidCode ? `CID: ${form.cidCode}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (form.documentType === "medical_certificate") {
    return [
      `Paciente: ${patientName}`,
      "",
      "Atestado médico",
      "",
      `Atesto, para os devidos fins, que o(a) paciente acima identificado(a) necessita de afastamento por ${
        form.daysOff || "0"
      } dia(s).`,
      form.cidCode ? `CID: ${form.cidCode}` : "",
      form.cidDescription ? `Descrição: ${form.cidDescription}` : "",
      form.purpose ? `Finalidade: ${form.purpose}` : "",
      form.plainText ? `Observações: ${form.plainText}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (form.documentType === "attendance_declaration") {
    return [
      `Declaro, para os devidos fins, que ${patientName} compareceu ao atendimento médico nesta unidade.`,
      form.purpose ? `Finalidade: ${form.purpose}` : "",
      form.plainText ? `Observações: ${form.plainText}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Paciente: ${patientName}`,
    "",
    "Resumo clínico",
    "",
    form.clinicalIndication ? `Resumo: ${form.clinicalIndication}` : "",
    form.plainText ? `Conduta/observações: ${form.plainText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function getContentPayload(form: FormState) {
  return {
    medication_name: form.medicationName,
    medication_use: form.medicationUse,
    exam_name: form.examName,
    exam_observation: form.examObservation,
    notes: form.plainText,
    purpose: form.purpose,
    days_off: form.daysOff ? Number(form.daysOff) : null,
  };
}

export default function ConsultaDocumentosPage() {
  const params = useParams<{ id: string }>();
  const appointmentId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appointment, setAppointment] = useState<AppointmentRow | null>(null);
  const [documents, setDocuments] = useState<MedicalDocumentRow[]>([]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [form, setForm] = useState<FormState>({
    documentType: "prescription",
    title: "Receita médica",
    clinicalIndication: "",
    cidCode: "",
    cidDescription: "",
    plainText: "",
    medicationName: "",
    medicationUse: "",
    examName: "",
    examObservation: "",
    daysOff: "1",
    purpose: "",
    releaseToPatient: true,
  });

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

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
        patients (
          full_name,
          cpf,
          birth_date,
          phone,
          health_plan_operator,
          health_plan_product_name
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

    const { data: documentsData, error: documentsError } = await supabase
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
      .order("created_at", { ascending: false });

    if (documentsError) {
      setMessage(`Erro ao carregar documentos: ${documentsError.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    setAppointment(appointmentData);
    setDocuments((documentsData || []) as MedicalDocumentRow[]);
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

  const selectedType = useMemo(
    () =>
      documentTypeOptions.find((item) => item.value === form.documentType) ||
      documentTypeOptions[0],
    [form.documentType]
  );

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleChangeType(type: DocumentType) {
    setForm((prev) => ({
      ...prev,
      documentType: type,
      title: getDefaultTitle(type),
      releaseToPatient: true,
    }));
  }

  async function handleIssueDocument() {
    if (!appointment) return;

    setSaving(true);
    setMessage("");

    const plainText = createPlainText(form, patientName);

    if (!plainText.trim()) {
      setMessage("Preencha o conteúdo do documento antes de emitir.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("medical_documents").insert({
      document_type: form.documentType,
      status: "issued",
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      clinic_id: appointment.clinic_id,
      appointment_id: appointment.id,
      title: form.title || getDefaultTitle(form.documentType),
      clinical_indication: form.clinicalIndication || null,
      cid_code: form.cidCode || null,
      cid_description: form.cidDescription || null,
      content: getContentPayload(form),
      plain_text: plainText,
      released_to_patient: form.releaseToPatient,
      days_off:
        form.documentType === "medical_certificate" && form.daysOff
          ? Number(form.daysOff)
          : null,
      purpose: form.purpose || null,
      doctor_name: doctorName,
      doctor_crm: doctor?.crm || null,
      doctor_crm_state: doctor?.crm_state || null,
      clinic_name: clinicName,
    });

    if (error) {
      setMessage(`Erro ao emitir documento: ${error.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("Documento emitido com sucesso.");
    setMessageType("success");

    setForm((prev) => ({
      ...prev,
      clinicalIndication: "",
      cidCode: "",
      cidDescription: "",
      plainText: "",
      medicationName: "",
      medicationUse: "",
      examName: "",
      examObservation: "",
      daysOff: "1",
      purpose: "",
      releaseToPatient: true,
    }));

    await loadPage();
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-slate-600">Carregando documentos...</p>
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
                Documentos médicos
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950">
                Emitir documentos da consulta
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Gere receita, solicitação de exame, atestado, declaração e resumo
                clínico vinculados ao atendimento.
              </p>
            </div>

            <Link
              href={`/medico/consultas/${appointmentId}`}
              className="inline-flex justify-center rounded-2xl border border-[#D9D6F4] bg-white px-6 py-4 text-sm font-bold text-[#5E4B9A] shadow-sm transition hover:bg-[#F6F3FF]"
            >
              Voltar ao prontuário
            </Link>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        <div className="mb-8 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[28px] border border-[#D9D6F4] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Paciente
            </p>
            <p className="mt-2 font-bold text-slate-950">{patientName}</p>
            <p className="mt-1 text-sm text-slate-500">
              CPF: {patient?.cpf || "Não informado"}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#D9D6F4] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Médico
            </p>
            <p className="mt-2 font-bold text-slate-950">{doctorName}</p>
            <p className="mt-1 text-sm text-slate-500">
              CRM {doctor?.crm || "não informado"}
              {doctor?.crm_state ? ` / ${doctor.crm_state}` : ""}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#D9D6F4] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Clínica
            </p>
            <p className="mt-2 font-bold text-slate-950">{clinicName}</p>
            <p className="mt-1 text-sm text-slate-500">
              {clinic?.city || "Cidade"} / {clinic?.state || "UF"}
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
              Status: {appointment?.status || "não informado"}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[38px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#283C7A]">
              Novo documento
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Escolha o tipo e preencha os dados
            </h2>

            <div className="mt-6 grid gap-3">
              {documentTypeOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleChangeType(item.value)}
                  className={`rounded-[26px] border p-5 text-left transition ${
                    form.documentType === item.value
                      ? "border-[#6E56CF] bg-[#F6F3FF]"
                      : "border-[#E0E7FF] bg-[#F8FAFC] hover:bg-white"
                  }`}
                >
                  <p className="font-bold text-slate-950">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[38px] border border-[#D9D6F4] bg-white p-7 shadow-[0_24px_80px_-70px_rgba(40,60,122,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6E56CF]">
              {selectedType.label}
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
              Conteúdo do documento
            </h2>

            <div className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Título
                </label>
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                />
              </div>

              {form.documentType === "prescription" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Medicamento
                    </label>
                    <input
                      value={form.medicationName}
                      onChange={(event) =>
                        updateForm("medicationName", event.target.value)
                      }
                      className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                      placeholder="Ex: Dipirona 500mg"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Modo de uso
                    </label>
                    <textarea
                      value={form.medicationUse}
                      onChange={(event) =>
                        updateForm("medicationUse", event.target.value)
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                      placeholder="Ex: Tomar 1 comprimido a cada 6 horas por 3 dias."
                    />
                  </div>
                </>
              )}

              {form.documentType === "exam_request" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Exame solicitado
                    </label>
                    <input
                      value={form.examName}
                      onChange={(event) =>
                        updateForm("examName", event.target.value)
                      }
                      className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                      placeholder="Ex: Ultrassonografia de abdome total"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Indicação clínica
                    </label>
                    <textarea
                      value={form.clinicalIndication}
                      onChange={(event) =>
                        updateForm("clinicalIndication", event.target.value)
                      }
                      className="min-h-[100px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                      placeholder="Ex: Investigação de dor abdominal."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Observação
                    </label>
                    <textarea
                      value={form.examObservation}
                      onChange={(event) =>
                        updateForm("examObservation", event.target.value)
                      }
                      className="min-h-[90px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                      placeholder="Jejum, preparo ou observações adicionais."
                    />
                  </div>
                </>
              )}

              {form.documentType === "medical_certificate" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Dias de afastamento
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.daysOff}
                        onChange={(event) =>
                          updateForm("daysOff", event.target.value)
                        }
                        className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        CID
                      </label>
                      <input
                        value={form.cidCode}
                        onChange={(event) =>
                          updateForm("cidCode", event.target.value)
                        }
                        className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                        placeholder="Ex: J11"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Finalidade
                      </label>
                      <select
                        value={form.purpose}
                        onChange={(event) =>
                          updateForm("purpose", event.target.value)
                        }
                        className="w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                      >
                        <option value="">Selecione</option>
                        <option value="Trabalhista">Trabalhista</option>
                        <option value="Acadêmica">Acadêmica</option>
                        <option value="Esportiva">Esportiva</option>
                        <option value="Outros fins">Outros fins</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Descrição do CID / observação médica
                    </label>
                    <textarea
                      value={form.cidDescription}
                      onChange={(event) =>
                        updateForm("cidDescription", event.target.value)
                      }
                      className="min-h-[100px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                    />
                  </div>
                </>
              )}

              {(form.documentType === "attendance_declaration" ||
                form.documentType === "clinical_summary") && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Finalidade / resumo
                    </label>
                    <textarea
                      value={form.clinicalIndication}
                      onChange={(event) =>
                        updateForm("clinicalIndication", event.target.value)
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                      placeholder="Descreva a finalidade ou resumo clínico."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Observações adicionais
                </label>
                <textarea
                  value={form.plainText}
                  onChange={(event) =>
                    updateForm("plainText", event.target.value)
                  }
                  className="min-h-[110px] w-full rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#6E56CF] focus:bg-white"
                  placeholder="Orientações adicionais, conduta ou observações."
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-[#D9D6F4] bg-[#F8FAFC] p-4 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.releaseToPatient}
                  onChange={(event) =>
                    updateForm("releaseToPatient", event.target.checked)
                  }
                />
                Liberar documento para o paciente
              </label>

              <button
                type="button"
                onClick={handleIssueDocument}
                disabled={saving}
                className="inline-flex justify-center rounded-2xl bg-[#283C7A] px-7 py-4 text-sm font-bold text-white shadow-[0_18px_50px_-30px_rgba(40,60,122,0.9)] transition hover:bg-[#213366] disabled:opacity-50"
              >
                {saving ? "Emitindo..." : "Emitir documento"}
              </button>
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
                Histórico documental da consulta
              </h2>
            </div>
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