"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { 
  User, 
  Award, 
  Building, 
  MapPin, 
  Calendar, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
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
  address_city: string | null;
  address_state: string | null;
  address_neighborhood: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getClinicName(clinic: ClinicRow | null) {
  return clinic?.trade_name || clinic?.legal_name || "Atendimento Autônomo / Consultório Próprio";
}

function getClinicLocation(clinic: ClinicRow | null) {
  if (!clinic) return "Endereço profissional independente";
  const parts = [
    clinic.address_neighborhood,
    clinic.address_city || clinic.city,
    clinic.address_state || clinic.state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Localização sob consulta";
}

export default function MedicoPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [doctor, setDoctor] = useState<DoctorRow | null>(null);
  const [clinic, setClinic] = useState<ClinicRow | null>(null);

  const [name, setName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado como médico.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    // Busca tolerante a diferentes nomes de colunas
    const { data: doctorData, error: doctorError } = await supabase
      .from("doctors")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (doctorError) {
      setMessage(`Erro ao carregar perfil médico: ${doctorError.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (!doctorData?.id) {
      setMessage("Nenhum cadastro médico encontrado para este usuário.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const loadedDoctor = doctorData as DoctorRow;

    setDoctor(loadedDoctor);
    setName(loadedDoctor.name || "");
    setCrm(loadedDoctor.crm || "");
    setCrmState(loadedDoctor.crm_state || loadedDoctor.crm_uf || loadedDoctor.state || "RJ");
    setSpecialty(loadedDoctor.specialty || "Clínica Geral");
    setBio(loadedDoctor.bio || "");
    setIsActive(loadedDoctor.is_active ?? true);

    if (loadedDoctor.clinic_id) {
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("id, trade_name, legal_name, city, state, address_city, address_state, address_neighborhood")
        .eq("id", loadedDoctor.clinic_id)
        .maybeSingle();

      setClinic((clinicData as ClinicRow) || null);
    } else {
      setClinic(null);
    }

    setLoading(false);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!doctor?.id) {
      setMessage("Cadastro médico não encontrado.");
      setMessageType("error");
      return;
    }

    if (!name.trim()) {
      setMessage("Informe o nome profissional.");
      setMessageType("error");
      return;
    }

    if (!crm.trim()) {
      setMessage("Informe o CRM.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    const updatePayload: Record<string, any> = {
      name: name.trim(),
      crm: crm.trim(),
      bio: bio.trim() || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    // Atualiza o estado respeitando a coluna que estiver ativa na tabela
    if (doctor.crm_state !== undefined) updatePayload.crm_state = crmState.trim().toUpperCase();
    if (doctor.crm_uf !== undefined) updatePayload.crm_uf = crmState.trim().toUpperCase();
    if (doctor.specialty !== undefined) updatePayload.specialty = specialty.trim();

    const { error } = await supabase
      .from("doctors")
      .update(updatePayload)
      .eq("id", doctor.id);

    if (error) {
      setMessage(`Erro ao salvar perfil: ${error.message}`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("Perfil médico atualizado com sucesso!");
    setMessageType("success");
    await loadProfile();
    setSaving(false);
  }

  const completion = useMemo(() => {
    const fields = [name.trim(), crm.trim(), crmState.trim(), bio.trim()];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [name, crm, crmState, bio]);

  return (
    <main className="min-h-screen bg-[#FAF6F3] text-[#2E393F] font-sans pb-16">
      {/* Cabeçalho */}
      <section className="border-b border-[#E7E2DD] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/medico/dashboard" 
                className="text-xs font-semibold text-[#164957] hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
              </Link>
              <span className="text-[#2E393F]/30">•</span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7A9D8C]">
                Área do Especialista
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#164957]">
              Meus dados profissionais
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#2E393F]/70">
              Gerencie suas informações de exibição, registro profissional e biografia médica.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
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

      {/* Conteúdo Principal */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Alerta de Feedback Integrado */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
            messageType === "success" 
              ? "bg-[#EEF3EF] border-[#7A9D8C]/40 text-[#164957]" 
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {messageType === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#7A9D8C] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#E7E2DD] bg-white p-8 text-center text-xs text-[#2E393F]/60 shadow-sm">
            Carregando perfil profissional...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
            {/* Coluna Esquerda: Resumo do Card */}
            <aside className="space-y-6">
              <section className="rounded-2xl border border-[#E7E2DD] bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#164957] text-lg font-bold text-[#FAF6F3] shadow-sm">
                    {name ? name.slice(0, 2).toUpperCase() : "MD"}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[#164957] truncate">
                      {name || "Dr. Profissional"}
                    </h2>
                    <p className="text-xs text-[#2E393F]/70 flex items-center gap-1 mt-0.5">
                      <span>CRM {crm || "Não informado"}</span>
                      {crmState && <span>/ {crmState.toUpperCase()}</span>}
                      <span>•</span>
                      <span>{specialty}</span>
                    </p>

                    <span
                      className={`mt-2.5 inline-flex rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-[#EEF3EF] text-[#164957] border border-[#7A9D8C]/30"
                          : "bg-slate-100 text-[#2E393F]/50"
                      }`}
                    >
                      {isActive ? "Perfil ativo na rede" : "Perfil oculto"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-[#FAF6F3] p-4 border border-[#E7E2DD]/70">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#2E393F]/80">Completude do cadastro</span>
                    <span className="font-bold text-[#164957]">{completion}%</span>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white border border-[#E7E2DD]/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#164957] to-[#7A9D8C]"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-[#E7E2DD] p-3.5 bg-[#FAF6F3]/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#2E393F]/50 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#164957]" /> Clínica / Vínculo
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#2E393F]">
                      {getClinicName(clinic)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#2E393F]/60 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#7A9D8C]" />
                      <span>{getClinicLocation(clinic)}</span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#E7E2DD] p-3.5 bg-[#FAF6F3]/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#2E393F]/50 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#164957]" /> Membro desde
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#2E393F]">
                      {formatDate(doctor?.created_at)}
                    </p>
                  </div>
                </div>
              </section>

              {/* Atalhos */}
              <section className="rounded-2xl border border-[#E7E2DD] bg-white p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2E393F]/60 mb-3">
                  Navegação do Especialista
                </h3>
                <div className="grid gap-2">
                  <Link
                    href="/medico/dashboard"
                    className="rounded-xl bg-[#FAF6F3] hover:bg-[#164957] hover:text-white px-4 py-2.5 text-xs font-semibold text-[#164957] transition border border-[#E7E2DD]"
                  >
                    Abrir Painel Clínico
                  </Link>
                  <Link
                    href="/medico/disponibilidade"
                    className="rounded-xl bg-white hover:bg-[#FAF6F3] px-4 py-2.5 text-xs font-semibold text-[#5A4C86] transition border border-[#E7E2DD]"
                  >
                    Gerenciar Horários de Atendimento
                  </Link>
                  <Link
                    href="/medico/solicitacoes"
                    className="rounded-xl bg-white hover:bg-[#FAF6F3] px-4 py-2.5 text-xs font-semibold text-[#5A4C86] transition border border-[#E7E2DD]"
                  >
                    Visualizar Solicitações de Pacientes
                  </Link>
                </div>
              </section>
            </aside>

            {/* Coluna Direita: Formulário de Edição */}
            <section className="rounded-2xl border border-[#E7E2DD] bg-white p-6 sm:p-7 shadow-sm">
              <h2 className="text-lg font-bold text-[#164957]">
                Editar informações cadastrais
              </h2>
              <p className="mt-0.5 text-xs text-[#2E393F]/70">
                Estas informações alimentam a busca pública e os documentos emitidos com QR Code.
              </p>

              <form onSubmit={handleSave} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#2E393F]/80">
                    Nome Profissional Completo
                  </label>
                  <div className="relative">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex.: Dr. Rafael Mendes"
                      className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] px-3.5 py-2.5 text-xs text-[#2E393F] outline-none transition focus:border-[#164957] focus:bg-white"
                    />
                    <User className="w-4 h-4 text-[#2E393F]/30 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold text-[#2E393F]/80">
                      Número do CRM
                    </label>
                    <input
                      value={crm}
                      onChange={(e) => setCrm(e.target.value)}
                      placeholder="Ex.: 123456"
                      className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] px-3.5 py-2.5 text-xs text-[#2E393F] outline-none transition focus:border-[#164957] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#2E393F]/80">
                      UF do CRM
                    </label>
                    <input
                      value={crmState}
                      onChange={(e) => setCrmState(e.target.value)}
                      placeholder="RJ"
                      maxLength={2}
                      className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] px-3.5 py-2.5 text-xs uppercase text-[#2E393F] outline-none transition focus:border-[#164957] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#2E393F]/80">
                    Especialidade Médica Principal
                  </label>
                  <div className="relative">
                    <input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Ex.: Clínica Geral, Cardiologia, Pediatria"
                      className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] px-3.5 py-2.5 text-xs text-[#2E393F] outline-none transition focus:border-[#164957] focus:bg-white"
                    />
                    <Award className="w-4 h-4 text-[#2E393F]/30 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#2E393F]/80">
                    Biografia e Apresentação
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Descreva sua abordagem clínica, áreas de foco e orientações de atendimento para os pacientes..."
                    rows={4}
                    className="w-full rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] p-3.5 text-xs leading-relaxed text-[#2E393F] outline-none transition focus:border-[#164957] focus:bg-white resize-none"
                  />
                </div>

                {/* Alternância de Visibilidade */}
                <div className="rounded-xl border border-[#E7E2DD] bg-[#FAF6F3] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#2E393F]">
                      Exibir perfil nas buscas de pacientes
                    </p>
                    <p className="text-[11px] text-[#2E393F]/60">
                      Quando ativo, seu nome fica disponível para solicitação de novas consultas.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsActive((prev) => !prev)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#EEF3EF] text-[#164957] border border-[#7A9D8C]/40"
                        : "bg-white border border-[#E7E2DD] text-[#2E393F]/60"
                    }`}
                  >
                    {isActive ? "Ativo" : "Pausado"}
                  </button>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7E2DD]">
                  <Link
                    href="/medico/dashboard"
                    className="rounded-xl border border-[#E7E2DD] bg-white px-5 py-2.5 text-xs font-semibold text-[#2E393F]/70 transition hover:bg-[#FAF6F3]"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#164957] px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-[#164957]/90 shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Salvando..." : "Salvar perfil"}
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