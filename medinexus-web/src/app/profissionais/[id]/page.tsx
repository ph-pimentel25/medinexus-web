"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Share2, 
  Copy, 
  ShieldCheck, 
  Video, 
  Building2, 
  ArrowLeft,
  Sparkles,
  Stethoscope
} from "lucide-react";
import DoctorAvatar from "../../components/doctor-avatar";
import { supabase } from "../../lib/supabase";

type ClinicData = {
  id?: string;
  trade_name: string | null;
  legal_name: string | null;
  city: string | null;
  state: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
};

type SpecialtyItem = {
  specialty_id: string;
  specialties: {
    name: string;
  } | null;
};

type DoctorProfile = {
  id: string;
  name: string | null;
  crm: string | null;
  crm_state: string | null;
  bio: string | null;
  photo_path: string | null;
  is_active: boolean | null;
  clinic_id: string | null;
  created_at: string | null;
  clinics: ClinicData | ClinicData[] | null;
  doctor_specialties?: SpecialtyItem[] | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

export default function DoctorPublicProfilePage() {
  const params = useParams();
  const doctorId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDoctor() {
      if (!doctorId) return;
      setLoading(true);
      setErrorMessage("");

      try {
        const { data, error } = await supabase
          .from("doctors")
          .select(`
            id,
            name,
            crm,
            crm_state,
            bio,
            photo_path,
            is_active,
            clinic_id,
            created_at,
            clinics (
              id,
              trade_name,
              legal_name,
              city,
              state,
              address_street,
              address_number,
              address_neighborhood,
              address_city,
              address_state
            ),
            doctor_specialties (
              specialty_id,
              specialties (
                name
              )
            )
          `)
          .eq("id", doctorId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setErrorMessage("Profissional não encontrado ou perfil indisponível.");
        } else {
          setDoctor(data as unknown as DoctorProfile);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao carregar perfil.";
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    }

    loadDoctor();
  }, [doctorId]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${doctor?.name || "Médico"} | MediNexus`,
          text: `Agende uma consulta online com ${doctor?.name || "o especialista"} pela MediNexus.`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-mn-sand flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-mn-teal border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">Carregando perfil profissional...</p>
        </div>
      </main>
    );
  }

  if (errorMessage || !doctor) {
    return (
      <main className="min-h-screen bg-mn-sand flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-mn-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Stethoscope size={28} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Perfil não encontrado</h1>
          <p className="mt-2 text-sm text-slate-600">
            {errorMessage || "Não conseguimos localizar os dados deste especialista."}
          </p>
          <div className="mt-6">
            <Link
              href="/profissionais"
              className="inline-flex items-center gap-2 rounded-2xl bg-mn-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#123B46]"
            >
              <ArrowLeft size={16} />
              Ver outros especialistas
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const clinic = pickOne(doctor.clinics);
  const clinicName = clinic?.trade_name || clinic?.legal_name || "Atendimento Particular";
  const clinicCity = clinic?.address_city || clinic?.city || "";
  const clinicState = clinic?.address_state || clinic?.state || "";
  const clinicNeighborhood = clinic?.address_neighborhood || "";
  const locationString = [clinicNeighborhood, clinicCity, clinicState].filter(Boolean).join(" • ");

  const specialties = (doctor.doctor_specialties || [])
    .map((s) => s.specialties?.name)
    .filter(Boolean) as string[];

  // Convênios padrão suportados pela plataforma
  const conveniosPadrao = ["Particular", "Unimed", "Bradesco Saúde", "SulAmérica", "Amil"];

  return (
    <main className="min-h-screen bg-gradient-to-b from-mn-sand to-white pb-24 text-slate-900">
      {/* Topo / Barra de navegação minimalista */}
      <header className="border-b border-mn-border/60 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/profissionais" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-mn-teal transition">
            <ArrowLeft size={15} />
            <span>Voltar</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-mn-teal flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900">MediNexus</span>
          </Link>

          <button
            onClick={handleShare}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-mn-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            {copied ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span className="text-emerald-700">Copiado!</span>
              </>
            ) : (
              <>
                <Share2 size={13} />
                <span>Compartilhar</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo Central - Design Cartão Digital / Link na Bio */}
      <div className="mx-auto max-w-xl px-4 pt-6 sm:px-6">
        {/* Card Principal */}
        <section className="relative overflow-hidden rounded-3xl border border-mn-border bg-white p-6 sm:p-8 shadow-sm">
          {/* Faixa decorativa superior com as cores do Brand Book */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-mn-teal via-[#1e5868] to-mn-purple opacity-95" />

          {/* Avatar e Status */}
          <div className="relative flex flex-col items-center text-center pt-6">
            <div className="rounded-full ring-4 ring-white shadow-lg bg-white overflow-hidden">
              <DoctorAvatar path={doctor.photo_path} name={doctor.name || "Doutor"} size={96} />
            </div>

            {/* Selo Verificado */}
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Médico Verificado</span>
            </div>

            {/* Nome e CRM */}
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {doctor.name || "Profissional de Saúde"}
            </h1>

            <p className="mt-1 text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              CRM {doctor.crm || "—"} {doctor.crm_state ? `• ${doctor.crm_state}` : ""}
            </p>

            {/* Especialidades */}
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {specialties.length > 0 ? (
                specialties.map((spec, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-mn-sage-light/60 px-3 py-1 text-xs font-bold text-mn-teal"
                  >
                    {spec}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-mn-sand px-3 py-1 text-xs font-semibold text-slate-600">
                  Clínica Geral
                </span>
              )}
            </div>

            {/* Modalidades de Atendimento */}
            <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-sm">
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-mn-border bg-mn-sand/50 p-2.5 text-xs font-semibold text-slate-700">
                <Video size={16} className="text-mn-teal" />
                <span>Telemedicina</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-mn-border bg-mn-sand/50 p-2.5 text-xs font-semibold text-slate-700">
                <Building2 size={16} className="text-mn-purple" />
                <span>Presencial</span>
              </div>
            </div>
          </div>

          {/* Divisor */}
          <hr className="my-6 border-slate-100" />

          {/* Biografia / Sobre */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sobre o Especialista</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {doctor.bio ||
                "Especialista comprometido com o acolhimento, atendimento humanizado e cuidado preventivo contínuo através da plataforma MediNexus."}
            </p>
          </div>

          {/* Convênios Aceitos (Filtro em Destaque) */}
          <div className="mt-6 space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Planos e Convênios</h2>
            <div className="flex flex-wrap gap-2">
              {conveniosPadrao.map((plan, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-xl border border-mn-border bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                >
                  <CheckCircle2 size={13} className="text-mn-teal" />
                  {plan}
                </span>
              ))}
            </div>
          </div>

          {/* Local de Atendimento */}
          {clinic && (
            <div className="mt-6 rounded-2xl border border-mn-border bg-mn-sand/30 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-mn-teal/10 p-2 text-mn-teal">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{clinicName}</h3>
                  {locationString && (
                    <p className="mt-0.5 text-xs text-slate-500">{locationString}</p>
                  )}
                  {clinic.address_street && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {clinic.address_street} {clinic.address_number ? `, nº ${clinic.address_number}` : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botão de Ação Principal (Linktree Style CTA) */}
          <div className="mt-8 space-y-3">
            <Link
              href={`/busca?${doctor.clinic_id ? `clinicId=${doctor.clinic_id}&` : ""}doctorId=${doctor.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-mn-teal py-4 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#123B46] active:scale-[0.98]"
            >
              <Calendar size={18} />
              <span>Agendar Consulta Online</span>
            </Link>

            <button
              onClick={handleShare}
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-mn-border bg-white py-3.5 text-center text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
              <span>{copied ? "Link do perfil copiado com sucesso!" : "Copiar link deste perfil"}</span>
            </button>
          </div>
        </section>

        {/* Rodapé Institucional */}
        <footer className="mt-8 text-center text-xs text-slate-400 space-y-2">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <Sparkles size={14} className="text-mn-teal" />
            Perfil verificado e hospedado na rede MediNexus
          </p>
          <p>© 2026 MediNexus. Conectar é cuidar.</p>
        </footer>
      </div>
    </main>
  );
}
