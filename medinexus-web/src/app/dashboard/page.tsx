"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Calendar, FileText, Activity, Search, ChevronRight, Clock, MapPin, Bell } from "lucide-react";
import DashboardOverview from "../components/dashboard-overview";
import { supabase } from "../lib/supabase";

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
  trade_name: string | null;
  address_city: string | null;
  address_state: string | null;
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
        .select("id, trade_name, address_city, address_state, city, state")
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
          doctor_name: doctor?.name || "Profissional não informado",
          clinic_name: clinic?.trade_name || "Consultório não informado",
          clinic_location:
            (clinic?.address_city || clinic?.city) && (clinic?.address_state || clinic?.state)
              ? `${clinic.address_city || clinic.city}, ${clinic.address_state || clinic.state}`
              : "Endereço não informado",
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


  useEffect(() => {
    const initialLoad = setTimeout(() => void loadDashboard(), 0);
    return () => clearTimeout(initialLoad);
  }, []);

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
      .filter((item) => ["pending", "confirmed"].includes(item.status || ""))
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

  return <main className="mn-dashboard min-h-screen bg-mn-sand">
    <DashboardOverview eyebrow="Seu espaço de cuidado" title={`Olá, ${firstName}.`} description="Cuide de você com mais tranquilidade. Estamos por perto em cada etapa."
      loading={loading} actions={[{label:"Encontrar atendimento",href:"/descobrir"}]}
      metrics={[{label:"Consultas confirmadas",value:summary.confirmed,hint:"Seus atendimentos confirmados"},{label:"Consultas recentes",value:summary.total,hint:"Seu histórico de solicitações"},{label:"Aguardando confirmação",value:summary.pending,hint:"Acompanhe o retorno da clínica"},{label:"Avisos não lidos",value:summary.unread,hint:"Entre as últimas atualizações"}]} />
    <div className="mn-dashboard-content">
      {isLoggedOut && <p role="alert" className="mn-panel">Entre na sua conta para acessar seus atendimentos.</p>}
      <div className="mn-quick-actions">{[
        {label:"Agendar consulta",icon:Calendar,href:"/busca",description:"Escolha seu atendimento"},
        {label:"Meus documentos",icon:FileText,href:"/documentos",description:"Tudo em um só lugar"},
        {label:"Histórico clínico",icon:Activity,href:"/historico-clinico",description:"Acompanhe seu cuidado"},
        {label:"Buscar profissionais",icon:Search,href:"/descobrir",description:"Encontre quem está perto"},
      ].map(({label,icon:Icon,href,description})=><Link key={href} href={href} className="mn-quick-action"><span className="mn-action-icon"><Icon size={23} strokeWidth={1.6}/></span><strong>{label}</strong><span>{description}</span><ChevronRight size={15} className="mn-action-arrow"/></Link>)}</div>
      <div className="mn-dashboard-columns">
        <section className="mn-panel"><div className="mn-panel-heading"><div><h2>Próximas consultas</h2><p>Seu cuidado, com data e hora.</p></div><Link href="/solicitacoes">Ver todas <ChevronRight size={14}/></Link></div>
          {loading ? <div className="mn-skeleton h-28" role="status" aria-label="Carregando consultas"/> : nextAppointment ? <Link href="/solicitacoes" className="mn-appointment-preview">
            <span className="mn-person-avatar">{nextAppointment.doctor_name?.slice(0,2).toUpperCase()}</span><div className="min-w-0 flex-1"><h3>{nextAppointment.doctor_name}</h3><p>{nextAppointment.clinic_name}</p><p className="flex items-center gap-1.5"><MapPin size={13}/>{nextAppointment.clinic_location}</p><p className="mn-appointment-time"><Clock size={14}/>{formatShortDate(getBestAppointmentDate(nextAppointment))}</p></div><ChevronRight size={18}/>
          </Link> : <div className="mn-empty-state"><Calendar size={30} strokeWidth={1.3}/><h3>Sua próxima consulta começa aqui</h3><p>Encontre um profissional e escolha o melhor horário para você.</p><Link href="/descobrir" className="mn-button-secondary">Buscar atendimento</Link></div>}
          <div className="mn-care-note"><Activity size={19}/><p><strong>Cuidado que acompanha você.</strong><br/>Mantenha seu perfil atualizado para facilitar seus próximos atendimentos.</p><Link href="/perfil" aria-label="Atualizar meu perfil"><ChevronRight size={18}/></Link></div>
        </section>
        <section className="mn-panel"><div className="mn-panel-heading"><div><h2>Últimas atualizações</h2><p>O que há de novo por aqui.</p></div><Link href="/notificacoes" aria-label="Ver todas as notificações"><Bell size={17}/></Link></div>
          {loading ? <div className="mn-skeleton h-28"/> : notifications.length ? <div className="mn-update-list">{notifications.map(n=><Link key={n.id} href="/notificacoes"><span className="mn-update-icon"><Bell size={15}/></span><div><h3>{n.title||"Atualização do atendimento"}</h3><p>{n.message||"Veja os detalhes na sua central de avisos."}</p><time>{formatShortDate(n.created_at)}</time></div>{!n.is_read&&<span className="mn-unread-dot" aria-label="Não lida"/>}</Link>)}</div> : <div className="mn-empty-state"><Bell size={28} strokeWidth={1.3}/><h3>Tudo em dia</h3><p>Novas informações sobre seus atendimentos aparecem aqui.</p></div>}
        </section>
      </div>
    </div>
  </main>;
}
