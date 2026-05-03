"use client";

import { useEffect, useState } from "react";
import {
  downloadPrescriptionPdf,
  printPrescription,
  PrescriptionPayload,
} from "@/app/lib/prescription-utils";

type PrescriptionEditorProps = {
  clinicName: string;
  clinicCity?: string | null;
  clinicState?: string | null;
  doctorName: string;
  doctorCrm: string;
  patientName: string;
  patientPlan?: string | null;
  patientBirthDate?: string | null;
  characterLabel?: string;
  initialTitle?: string | null;
  initialContent?: string | null;
  initialNotes?: string | null;
  onSave: (payload: {
    title: string;
    content: string;
    notes: string;
  }) => Promise<void>;
};

export default function PrescriptionEditor({
  clinicName,
  clinicCity,
  clinicState,
  doctorName,
  doctorCrm,
  patientName,
  patientPlan,
  patientBirthDate,
  characterLabel = "Rotina",
  initialTitle,
  initialContent,
  initialNotes,
  onSave,
}: PrescriptionEditorProps) {
  const [title, setTitle] = useState(initialTitle || "ReceituÃ¡rio mÃ©dico");
  const [content, setContent] = useState(initialContent || "");
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(initialTitle || "ReceituÃ¡rio mÃ©dico");
    setContent(initialContent || "");
    setNotes(initialNotes || "");
  }, [initialTitle, initialContent, initialNotes]);

  const payload: PrescriptionPayload = {
    clinicName,
    clinicCity,
    clinicState,
    doctorName,
    doctorCrm,
    patientName,
    patientPlan,
    patientBirthDate,
    characterLabel,
    title,
    content,
    notes,
    createdAt: new Date().toISOString(),
  };

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        title,
        content,
        notes,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-[var(--color-plum-soft,#efe8ff)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-plum,#594E86)]">
              CarÃ¡ter da solicitaÃ§Ã£o: {characterLabel}
            </span>
            <h2 className="mt-3 text-2xl font-bold text-[var(--color-graphite,#303B41)]">
              ReceituÃ¡rio premium
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Escreva o receituÃ¡rio, salve no histÃ³rico e gere PDF/ impressÃ£o.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => printPrescription(payload)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Imprimir
            </button>

            <button
              type="button"
              onClick={() => downloadPrescriptionPdf(payload)}
              className="rounded-xl border border-[var(--color-brand,#1B4B58)] px-4 py-2 text-sm font-semibold text-[var(--color-brand,#1B4B58)] transition hover:bg-[var(--color-brand,#1B4B58)] hover:text-white"
            >
              Baixar PDF
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[var(--color-brand,#1B4B58)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar receituÃ¡rio"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                TÃ­tulo
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[var(--color-brand,#1B4B58)] focus:ring-2 focus:ring-[var(--color-brand,#1B4B58)]/15"
                placeholder="Ex.: ReceituÃ¡rio mÃ©dico"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                PrescriÃ§Ã£o / orientaÃ§Ãµes
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[var(--color-brand,#1B4B58)] focus:ring-2 focus:ring-[var(--color-brand,#1B4B58)]/15"
                placeholder="Ex.:\nâ€¢ Tomar medicamento X de 8/8h por 7 dias\nâ€¢ Retornar em caso de febre\nâ€¢ Realizar exame Y"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                ObservaÃ§Ãµes complementares
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[var(--color-brand,#1B4B58)] focus:ring-2 focus:ring-[var(--color-brand,#1B4B58)]/15"
                placeholder="ObservaÃ§Ãµes adicionais, retorno, recomendaÃ§Ãµes..."
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-[var(--color-offwhite,#F8F4F2)] p-5 shadow-sm">
            <div className="rounded-[24px] bg-[var(--color-brand,#1B4B58)] p-5 text-white">
              <h3 className="text-2xl font-bold">MediNexus</h3>
              <p className="mt-1 text-sm text-white/80">ReceituÃ¡rio mÃ©dico digital</p>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <span className="inline-flex rounded-full bg-[var(--color-plum-soft,#efe8ff)] px-3 py-1 text-xs font-semibold text-[var(--color-plum,#594E86)]">
                CarÃ¡ter da solicitaÃ§Ã£o: {characterLabel}
              </span>

              <h4 className="mt-4 text-2xl font-bold text-[var(--color-graphite,#303B41)]">
                {title || "ReceituÃ¡rio mÃ©dico"}
              </h4>

              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p>
                  <strong>ClÃ­nica:</strong> {clinicName}
                  {clinicCity ? ` â€¢ ${clinicCity}` : ""}
                  {clinicState ? `/${clinicState}` : ""}
                </p>
                <p>
                  <strong>Paciente:</strong> {patientName}
                </p>
                <p>
                  <strong>Plano:</strong> {patientPlan || "-"}
                </p>
                <p>
                  <strong>Nascimento:</strong>{" "}
                  {patientBirthDate
                    ? new Date(patientBirthDate).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                PrescriÃ§Ã£o / orientaÃ§Ãµes
              </h5>
              <div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                {content || "O conteÃºdo do receituÃ¡rio aparecerÃ¡ aqui."}
              </div>
            </div>

            {notes.trim() && (
              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  ObservaÃ§Ãµes
                </h5>
                <div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                  {notes}
                </div>
              </div>
            )}

            <div className="mt-8 px-4 text-center">
              <div className="mx-auto mb-3 h-px w-72 bg-slate-300" />
              <p className="font-semibold text-[var(--color-graphite,#303B41)]">
                {doctorName}
              </p>
              <p className="text-sm text-slate-500">CRM: {doctorCrm}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


