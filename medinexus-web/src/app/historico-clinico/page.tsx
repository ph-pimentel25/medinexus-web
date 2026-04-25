"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import Alert from "@/app/components/alert";

type MaybeArray<T> = T | T[] | null | undefined;

function pickOne<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

type AppointmentRow = {
  id: string;
  status: string | null;
  created_at: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  clinics?: MaybeArray<{
    id: string;
    trade_name: string | null;
    city: string | null;
    state: string | null;
  }>;
  doctors?: MaybeArray<{
    id: string;
    full_name: string | null;
    crm: string | null;
  }>;
  specialties?: MaybeArray<{
    id: string;
    name: string | null;
  }>;
};

type ConsultationNoteRow = {
  appointment_id: string;
  summary: string | null;
};

type PrescriptionRow = {
  id: string;
  appointment_id: string;
  created_at: string | null;
  title: string | null;
};

type HistoryItem = {
  id: string;
  clinicName: string;
  clinicLocation: string;
  doctorName: string;
  doctorCrm: string;
  specialtyName: string;
  consultationDate: string;
  characterLabel: string;
  summary: string;
  hasPrescription: boolean;
  prescriptionTitle: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

function getCharacterLabel(createdAt?: string | null, confirmedStartAt?: string | null) {
  if (!createdAt || !confirmedStartAt) return "Rotina";
  const created = new Date(createdAt).getTime();
  const confirmed = new Date(confirmedStartAt).getTime();
  if (Number.isNaN(created) || Number.isNaN(confirmed)) return "Rotina";

  const hours = Math.abs(confirmed - created) / (1000 * 60 * 60);
  return hours < 24 ? "Encaixe" : "Rotina";
}

export default function HistoricoClinicoPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setMessage("Faça login para visualizar seu histórico clínico.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        status,
        created_at,
        confirmed_start_at,
        confirmed_end_at,
        clinics(id, trade_name, city, state),
        doctors(id, full_name, crm),
        specialties(id, name)
      `)
      .eq("patient_id", user.id)
      .in("status", ["confirmed", "completed"])
      .order("confirmed_start_at", { ascending: false });

    if (appointmentsError) {
      setMessage("Erro ao carregar o histórico clínico.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const appointments = ((appointmentsData ?? []) as AppointmentRow[]);

    if (!appointments.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    const appointmentIds = appointments.map((item) => item.id);

    const { data: notesData } = await supabase
      .from("consultation_notes")
      .select("appointment_id, summary")
      .in("appointment_id", appointmentIds);

    const { data: prescriptionsData } = await supabase
      .from("prescriptions")
      .select("id, appointment_id, created_at, title")
      .in("appointment_id", appointmentIds);

    const notesMap = new Map<string, ConsultationNoteRow>();
    ((notesData ?? []) as ConsultationNoteRow[]).forEach((row) => {
      notesMap.set(row.appointment_id, row);
    });

    const prescriptionsMap = new Map<string, PrescriptionRow>();
    ((prescriptionsData ?? []) as PrescriptionRow[]).forEach((row) => {
      if (!prescriptionsMap.has(row.appointment_id)) {
        prescriptionsMap.set(row.appointment_id, row);
      }
    });

    const historyItems: HistoryItem[] = appointments.map((appointment) => {
      const clinic = pickOne(appointment.clinics);
      const doctor = pickOne(appointment.doctors);
      const specialty = pickOne(appointment.specialties);
      const note = notesMap.get(appointment.id);
      const prescription = prescriptionsMap.get(appointment.id);

      return {
        id: appointment.id,
        clinicName: clinic?.trade_name || "Clínica MediNexus",
        clinicLocation: `${clinic?.city || "-"}${clinic?.state ? ` / ${clinic.state}` : ""}`,
        doctorName: doctor?.full_name || "Médico não identificado",
        doctorCrm: doctor?.crm || "-",
        specialtyName: specialty?.name || "Especialidade não informada",
        consultationDate: formatDateTime(appointment.confirmed_start_at),
        characterLabel: getCharacterLabel(
          appointment.created_at,
          appointment.confirmed_start_at
        ),
        summary:
          note?.summary?.trim() ||
          "Ainda não há resumo clínico registrado para esta consulta.",
        hasPrescription: Boolean(prescription),
        prescriptionTitle: prescription?.title || null,
      };
    });

    setItems(historyItems);
    setLoading(false);
  }

  const totalConsultations = useMemo(() => items.length, [items]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-brand,#1B4B58)]">
          Histórico clínico
        </span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--color-graphite,#303B41)]">
          Sua jornada clínica em um só lugar
        </h1>
        <p className="mt-3 max-w-3xl text-base text-slate-600">
          Consulte atendimentos anteriores, resumos médicos e acompanhe a evolução
          do seu histórico na MediNexus.
        </p>
      </div>

      {message && (
        <div className="mb-6">
          <Alert variant={messageType}>{message}</Alert>
        </div>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Consultas no histórico</p>
          <p className="mt-2 text-4xl font-bold text-[var(--color-graphite,#303B41)]">
            {totalConsultations}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Área do paciente</p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-brand,#1B4B58)]">
            Histórico consolidado
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Acesso rápido</p>
          <Link
            href="/busca"
            className="mt-3 inline-flex rounded-xl bg-[var(--color-brand,#1B4B58)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Buscar nova consulta
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Carregando histórico...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">
            Você ainda não possui consultas concluídas/confirmadas no histórico.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((item) => (
            <section
              key={item.id}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-[var(--color-brand-soft,#e6f2f4)] px-3 py-1 text-xs font-semibold text-[var(--color-brand,#1B4B58)]">
                      {item.specialtyName}
                    </span>
                    <span className="inline-flex rounded-full bg-[var(--color-plum-soft,#efe8ff)] px-3 py-1 text-xs font-semibold text-[var(--color-plum,#594E86)]">
                      Caráter da solicitação: {item.characterLabel}
                    </span>
                    {item.hasPrescription && (
                      <span className="inline-flex rounded-full bg-[var(--color-sage-soft,#edf5f1)] px-3 py-1 text-xs font-semibold text-[var(--color-sage,#7A9D8D)]">
                        Receituário disponível
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-[var(--color-graphite,#303B41)]">
                    {item.clinicName}
                  </h2>

                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>
                      <strong>Médico:</strong> {item.doctorName} • CRM {item.doctorCrm}
                    </p>
                    <p>
                      <strong>Local:</strong> {item.clinicLocation}
                    </p>
                    <p>
                      <strong>Consulta:</strong> {item.consultationDate}
                    </p>
                    {item.prescriptionTitle && (
                      <p>
                        <strong>Receituário:</strong> {item.prescriptionTitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[var(--color-offwhite,#F8F4F2)] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Resumo da consulta
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                  {item.summary}
                </p>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}