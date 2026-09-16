"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building, MapPin, Calendar, Save, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

type DoctorRow = {
  id: string;
  user_id: string | null;
  clinic_id: string | null;
  name: string | null;
  crm: string | null;
  crm_state?: string | null;
  crm_uf?: string | null;
  state?: string | null;
  specialty?: string | null;
  bio: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type ClinicRow = {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
  city: string | null;
  state: string | null;
};

function formatSafeDate(value?: string | null) {
  if (!value) return "Não informado";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Não informado";
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "Não informado";
  }
}

export default function MedicoPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctor, setDoctor] = useState<DoctorRow | null>(null);
  const [clinic, setClinic] = useState<ClinicRow | null>(null);

  const [name, setName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("RJ");
  const [specialty, setSpecialty] = useState("Clínica Geral");
  const [bio, setBio] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Você precisa fazer login como médico.");
        setIsError(true);
        setLoading(false);
        return;
      }

      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (doctorError) {
        setMessage(`Erro ao carregar perfil: ${doctorError.message}`);
        setIsError(true);
        setLoading(false);
        return;
      }

      if (!doctorData?.id) {
        setMessage("Nenhum registro médico vinculado a este login.");
        setIsError(true);
        setLoading(false);
        return;
      }

      const doc = doctorData as DoctorRow;
      setDoctor(doc);
      setName(doc.name || "");
      setCrm(doc.crm || "");
      setCrmState(doc.crm_state || doc.crm_uf || doc.state || "RJ");
      setSpecialty(doc.specialty || "Clínica Geral");
      setBio(doc.bio || "");
      setIsActive(doc.is_active ?? true);

      if (doc.clinic_id) {
        const { data: clinicData } = await supabase
          .from("clinics")
          .select("id, trade_name, legal_name, city, state")
          .eq("id", doc.clinic_id)
          .maybeSingle();

        setClinic((clinicData as ClinicRow) || null);
      }
    } catch {
      setMessage("Erro inesperado ao carregar os dados.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!doctor?.id) return;

    if (!name.trim() || !crm.trim()) {
      setMessage("Preencha nome e CRM.");
      setIsError(true);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload: Record<string, string | boolean | null> = {
        name: name.trim(),
        crm: crm.trim(),
        bio: bio.trim() || null,
        is_active: isActive,
      };

      if (doctor.crm_state !== undefined) payload.crm_state = crmState.trim().toUpperCase();
      if (doctor.crm_uf !== undefined) payload.crm_uf = crmState.trim().toUpperCase();
      if (doctor.specialty !== undefined) payload.specialty = specialty.trim();

      const { error } = await supabase.from("doctors").update(payload).eq("id", doctor.id);

      if (error) throw error;

      setMessage("Perfil médico atualizado com sucesso!");
      setIsError(false);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Falha na comunicação com o banco.";
      setMessage(`Erro ao salvar: ${errMessage}`);
      setIsError(true);
    } finally {
      setSaving(false);
    }
  }

  const completion = useMemo(() => {
    const fields = [name.trim(), crm.trim(), crmState.trim(), bio.trim()];
    const done = fields.filter(Boolean).length;
    return Math.round((done / fields.length) * 100);
  }, [name, crm, crmState, bio]);

  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F] font-sans pb-16">
      <section className="border-b border-[#E7E2DD] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link href="/medico/dashboard" className="text-xs font-semibold text-[#164957] hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <span className="text-[#2E393F]/30">•</span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7A9D8C]">
                Área do Especialista
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#164957]">
              Meus dados profissionais
            </h1>
          </div>

          <div className="flex gap-2">
            <Link
              href="/medico/dashboard"
              className="rounded-xl border border-[#E7E2DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#5A4C86] transition hover:bg-[#FAF6F3]"
            >
              Dashboard
            </Link>
            <Link
              href="/medico/solicitacoes"
              className="rounded-xl bg-[#164957] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#164957]/90 shadow-sm"
            >
              Solicitações
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className={`mb-6 p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
            isError ? "bg-red-50 border-red-200 text-red-700" : "bg-[#EEF3EF] border-[#7A9D8C]/40 text-[#164957]"
          }`}>
            {isError ? <AlertCircle className="w-4 h-4 shrink-0 text-red-600" /> : <Check className="w-4 h-4 shrink-0 text-[#7A9D8C]" />}
            <span>{message}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#E7E2DD] bg-white p-8 text-center text-xs text-[#2E393F]/60">
            Carregando perfil...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
            <aside className="space-y-6">
              <section className="rounded-2xl border border-[#E7E2DD] bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#164957] text-lg font-bold text-[#FAF6F3]">
                    {name ? name.slice(0, 2).toUpperCase() : "MD"}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[#164957] truncate">{name || "Médico"}</h2>
                    <p className="text-xs text-[#2E393F]/70 mt-0.5">CRM {crm || "N/I"} / {crmState}</p>
                    <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isActive ? "bg-[#EEF3EF] text-[#164957]" : "bg-slate-100 text-slate-500"
                    }`}>
                      {isActive ? "Perfil Ativo" : "Perfil Pausado"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-[#FAF6F3] p-3.5 border border-[#E7E2DD]">
                  <div className="flex justify-between text-xs font-semibold text-[#2E393F]/80">
                    <span>Completude do Perfil</span>
                    <span className="text-[#164957] font-bold">{completion}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white overflow-hidden border border-[#E7E2DD]">
                    <div className="h-full bg-[#164957] transition-all" style={{ width: `${completion}%` }} />
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E7E2DD] space-y-3">
                  <div className="rounded-xl border border-[#E7E2DD] p-3.5 bg-[#FAF6F3]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#2E393F]/50 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-[#164957]" /> Clínica Vinculada
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#2E393F]">
                      {clinic?.trade_name || clinic?.legal_name || "Atendimento Autônomo"}
                    </p>
                    {clinic?.city && (
                      <p className="text-[11px] text-[#2E393F]/60 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#7A9D8C]" /> {clinic.city}, {clinic.state}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#E7E2DD] p-3.5 bg-[#FAF6F3]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#2E393F]/50 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#164957]" /> Cadastrado em
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#2E393F]">
                      {formatSafeDate(doctor?.created_at)}
                    </p>
                  </div>
                </div>
              </section>
            </aside>

            <section className="rounded-2xl border border-[#E7E2DD] bg-white p-6 sm:p-7 shadow-sm">
              <h2 className="text-lg font-bold text-[#164957]">Editar informações</h2>
              <p className="text-xs text-[#2E393F]/70 mt-0.5">Dados utilizados na emissão de documentos e receitas com QR Code.</p>

              <form onSubmit={handleSave} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2E393F]/80 mb-1">Nome Profissional</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] px-3.5 py-2.5 text-xs text-[#2E393F] outline-none focus:bg-white focus:border-[#164957]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-[#2E393F]/80 mb-1">CRM</label>
                    <input
                      value={crm}
                      onChange={(e) => setCrm(e.target.value)}
                      className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] px-3.5 py-2.5 text-xs text-[#2E393F] outline-none focus:bg-white focus:border-[#164957]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2E393F]/80 mb-1">UF</label>
                    <input
                      value={crmState}
                      maxLength={2}
                      onChange={(e) => setCrmState(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] px-3.5 py-2.5 text-xs uppercase text-[#2E393F] outline-none focus:bg-white focus:border-[#164957]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2E393F]/80 mb-1">Especialidade</label>
                  <input
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] px-3.5 py-2.5 text-xs text-[#2E393F] outline-none focus:bg-white focus:border-[#164957]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2E393F]/80 mb-1">Biografia</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] p-3 text-xs text-[#2E393F] outline-none focus:bg-white focus:border-[#164957] resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#164957] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#164957]/90 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}