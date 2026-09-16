"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { 
  Calendar, 
  FileText, 
  Activity, 
  Search, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Sparkles,
  Bell,
  ArrowRight
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { BottomNav } from "../components/bottom-nav";

type ProfileRow = {
  id: string;
  full_name?: string | null;
};

type AppointmentRow = {
  id: string;
  status: string | null;
  doctor_id: string | null;
  clinic_id: string | null;
  requested_start_at: string | null;
  confirmed_start_at: string | null;
  patient_confirmation_status: string | null;
  created_at: string | null;
};

type DoctorRow = {
  id: string;
  name: string | null;
};

type ClinicRow = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
};

type NotificationRow = {
  id: string;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
  appointment_id?: string | null;
  document_id?: string | null;
  link_href?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
};

type DashboardAppointment = AppointmentRow & {
  doctor_name?: string;
  clinic_name?: string;
  clinic_location?: string;
};

function getFirstName(fullName?: string | null) {
  const cleaned = (fullName || "").trim();
  if (!cleaned) return "Paciente";
  return cleaned.split(" ")[0];
}

function formatShortDate(dateString?: string | null) {
  if (!dateString) return "Data a definir";
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBestAppointmentDate(appointment: AppointmentRow) {
  return appointment.confirmed_start_at || appointment.requested_start_at || appointment.created_at;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsLoggedOut(true);
      setLoading(false);
      return;
    }

    setIsLoggedOut(false);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select(
        "id, status, doctor_id, clinic_id, requested_start_at, confirmed_start_at, patient_confirmation_status, created_at"
      )
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const safeAppointments = (appointmentsData as AppointmentRow[]) || [];

    const doctorIds = Array.from(
      new Set(safeAppointments.map((item) => item.doctor_id).filter(Boolean))
    ) as string[];

    const clinicIds = Array.from(
      new Set(safeAppointments.map((item) => item.clinic_id).filter(Boolean))
    ) as string[];

    let doctorsMap = new Map<string, DoctorRow>();
    let clinicsMap = new Map<string, ClinicRow>();

    if (doctorIds.length > 0) {
      const { data: doctorsData } = await supabase
        .from("doctors")
        .select("id, name")
        .in("id", doctorIds);

      doctorsMap = new Map(
        ((doctorsData as DoctorRow[]) || []).map((item) => [item.id, item])
      );
    }

    if (clinicIds.length > 0) {
      const { data: clinicsData } = await supabase
        .from("clinics")
        .select("id, name, city, state")
        .in("id", clinicIds);

      clinicsMap = new Map(
        ((clinicsData as ClinicRow[]) || []).map((item) => [item.id, item])
      );
    }

    const enrichedAppointments: DashboardAppointment[] = safeAppointments.map(
      (item) => {
        const doctor = item.doctor_id ? doctorsMap.get(item.doctor_id) : undefined;
        const clinic = item.clinic_id ? clinicsMap.get(item.clinic_id) : undefined;

        return {
          ...item,
          doctor_name: doctor?.name || "Especialista Clínico",
          clinic_name: clinic?.name || "Clínica MediNexus",
          clinic_location:
            clinic?.city && clinic?.state
              ? `${clinic.city}, ${clinic.state}`
              : "Rio de Janeiro, RJ",
        };
      }
    );

    const { data: notificationsData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4);

    setProfile(profileData as ProfileRow);
    setAppointments(enrichedAppointments);
    setNotifications((notificationsData as NotificationRow[]) || []);
    setLoading(false);
  }

  const firstName = getFirstName(profile?.full_name);

  const summary = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((item) => item.status === "pending").length;
    const confirmed = appointments.filter((item) => item.status === "confirmed").length;
    const unread = notifications.filter((item) => !item.is_read).length;

    return { total, pending, confirmed, unread };
  }, [appointments, notifications]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return [...appointments]
      .filter((item) => {
        const dateStr = getBestAppointmentDate(item);
        return dateStr ? new Date(dateStr) >= now : true;
      })
      .sort((a, b) => {
        const dateA = new Date(getBestAppointmentDate(a) || 0).getTime();
        const dateB = new Date(getBestAppointmentDate(b) || 0).getTime();
        return dateA - dateB;
      })[0];
  }, [appointments]);

  return (
    <div className="min-h-screen bg-[#FAF6F3] text-[#2E393F] pb-24 lg:pb-16 font-sans">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Banner de Demonstração / Aviso caso não logado */}
        {isLoggedOut && (
          <div className="bg-[#164957] text-[#FAF6F3] p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="text-xs">
              <span className="font-bold">Modo de visualização rápida:</span> Faça login para carregar seu histórico clínico completo.
            </div>
            <Link
              href="/login"
              className="bg-[#7A9D8C] hover:bg-[#7A9D8C]/90 text-[#164957] font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-sm"
            >
              Entrar
            </Link>
          </div>
        )}

        {/* Cabeçalho de Saudação */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#164957] tracking-tight">
              Olá, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-[#2E393F]/70 mt-0.5">
              Sua saúde e histórico clínico integrados em um só lugar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/notificacoes"
              className="p-2.5 bg-white border border-[#E7E2DD] rounded-xl text-[#2E393F]/70 hover:text-[#164957] shadow-sm relative transition"
            >
              <Bell className="w-4 h-4" strokeWidth={1.8} />
              {summary.unread > 0 && (
                <span className="w-2 h-2 bg-[#5A4C86] rounded-full absolute top-2 right-2" />
              )}
            </Link>
            <div className="w-9 h-9 rounded-xl bg-[#164957] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Grade 2x2 de Ações Rápidas */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Agendar consulta", icon: Calendar, href: "/busca", color: "text-[#164957]" },
              { label: "Meus documentos", icon: FileText, href: "/documentos", color: "text-[#164957]" },
              { label: "Histórico e exames", icon: Activity, href: "/historico-clinico", color: "text-[#164957]" },
              { label: "Buscar com IA", icon: Search, href: "/busca", color: "text-[#5A4C86]", badge: true },
            ].map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className="bg-white border border-[#E7E2DD] p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:border-[#164957]/40 transition group aspect-square"
                >
                  <div className={`w-11 h-11 rounded-xl bg-[#FAF6F3] ${action.color} flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <span className="text-xs font-semibold text-[#2E393F] leading-tight flex items-center gap-1">
                    {action.label}
                    {action.badge && <Sparkles className="w-3 h-3 text-[#5A4C86]" />}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Card Destaque: Próxima Consulta */}
        <section className="bg-white border border-[#E7E2DD] p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-mono font-semibold text-[#164957] uppercase tracking-wider">
              Próxima consulta
            </span>
            <Link href="/solicitacoes" className="text-xs font-medium text-[#5A4C86] hover:underline flex items-center gap-0.5">
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {nextAppointment ? (
            <Link
              href="/solicitacoes"
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF6F3] hover:bg-[#FAF6F3]/80 border border-[#E7E2DD]/70 transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#164957] text-[#FAF6F3] flex items-center justify-center font-bold text-xs shadow-sm">
                  {nextAppointment.doctor_name?.substring(0, 2).toUpperCase() || "MD"}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2E393F]">
                    {nextAppointment.doctor_name}
                  </div>
                  <div className="text-[11px] text-[#2E393F]/70 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#7A9D8C]" />
                    <span>{nextAppointment.clinic_name} · {nextAppointment.clinic_location}</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#164957] flex items-center gap-1 mt-1 font-semibold">
                    <Clock className="w-3 h-3" />
                    <span>{formatShortDate(getBestAppointmentDate(nextAppointment))}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#2E393F]/40" />
            </Link>
          ) : (
            <div className="p-4 rounded-xl bg-[#FAF6F3] border border-dashed border-[#E7E2DD] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#2E393F]">Nenhuma consulta agendada</p>
                <p className="text-[11px] text-[#2E393F]/60">Busque médicos e clínicas disponíveis na rede.</p>
              </div>
              <Link
                href="/busca"
                className="bg-[#164957] hover:bg-[#164957]/90 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition shadow-sm"
              >
                Agendar
              </Link>
            </div>
          )}
        </section>

        {/* Resumo de Indicadores da Conta */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-[#E7E2DD] p-4 rounded-2xl text-center shadow-sm">
            <p className="text-[11px] text-[#2E393F]/60 font-medium">Total de Consultas</p>
            <p className="text-xl font-bold text-[#164957] mt-1">{summary.total}</p>
          </div>
          <div className="bg-white border border-[#E7E2DD] p-4 rounded-2xl text-center shadow-sm">
            <p className="text-[11px] text-[#2E393F]/60 font-medium">Confirmadas</p>
            <p className="text-xl font-bold text-[#7A9D8C] mt-1">{summary.confirmed}</p>
          </div>
          <div className="bg-white border border-[#E7E2DD] p-4 rounded-2xl text-center shadow-sm">
            <p className="text-[11px] text-[#2E393F]/60 font-medium">Pendentes</p>
            <p className="text-xl font-bold text-[#5A4C86] mt-1">{summary.pending}</p>
          </div>
        </section>

      </main>

      {/* Barra de Navegação Inferior para Mobile */}
      <BottomNav />
    </div>
  );
}