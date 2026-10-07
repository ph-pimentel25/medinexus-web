import {
  CalendarDays,
  FileText,
  House,
  Search,
  UserRound,
  ArrowUpRight,
  MapPin,
  CheckCircle2,
  Stethoscope,
  Bell,
  Pill,
  ShoppingBag,
  Clock,
  Plus,
  Minus,
  FlaskConical,
  X,
  FileCheck,
  HelpCircle,
  Star,
  Play,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  Video,
  Heart,
  Users,
  Syringe,
  Sparkles,
  Fingerprint,
} from "lucide-react-native";
import { colors, shadows } from "./src/theme";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import type { Session } from "@supabase/supabase-js";
import { appUrl, configured, supabase } from "./src/supabase";
import { loadAccount } from "./src/account";
import AuthScreen from "./src/AuthScreen";
import AvailabilitySearch, { type RecentDoctor } from "./src/AvailabilitySearch";
import PatientProfile from "./src/PatientProfile";
import { Button, Toggle, Badge, EmptyState, type BadgeVariant } from "./src/ui";
import { showDirections } from "./src/directions";
import FamilySwitcher, { type FamilyMember, INITIAL_DEPENDENTS } from "./src/FamilySwitcher";
import VaccineWallet from "./src/VaccineWallet";
import TelemedicineModal from "./src/TelemedicineModal";
import HealthMetricsModal from "./src/HealthMetricsModal";
import TriageModal from "./src/TriageModal";
import PostConsultationChatModal from "./src/PostConsultationChatModal";
import * as SecureStore from "expo-secure-store";
import {
  requestNotificationPermission,
  scheduleMedicationReminder,
  scheduleAppointmentReminder,
  sendImmediateNotification,
} from "./src/notifications";

type Row = Record<string, unknown>;
type Appointment = {
  id: string;
  status: string;
  confirmed_start_at: string | null;
  requested_start_at: string | null;
  patient_confirmation_status: string | null;
  doctors: Row | Row[] | null;
  clinics: Row | Row[] | null;
};
type Found = {
  photoPath: string | null;
  id: string;
  name: string;
  clinicId: string | null;
  address: string;
  clinicName: string;
  specialtyId: string | null;
};
type External = {
  id: string;
  name: string;
  address: string;
  phone: string;
  mapsUrl: string;
  website: string;
  attributions: { provider: string; providerUri?: string }[];
};
type Slot = { start_at: string; end_at: string; clinic_id: string };

type Medication = {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  duration: string;
  remainingQuantity: number;
  totalQuantity: number;
  schedule: string[];
  reminderActive: boolean;
  status: "em_uso" | "a_comprar" | "concluido";
  doctorName?: string;
  prescriptionDate?: string;
  isContinuous?: boolean;
};

// 1. Ordem estrita dos botões inferiores: Início, Buscar, Consultas, Remédios e Documentos
const tabs = [
  { label: "Início", icon: House },
  { label: "Buscar", icon: Search },
  { label: "Consultas", icon: CalendarDays },
  { label: "Remédios", icon: Pill },
  { label: "Documentos", icon: FileText },
];

const shortcuts = [
  { label: "Agendar consulta", tab: "Buscar", icon: CalendarDays, background: colors.lightSage, color: colors.teal },
  { label: "Exames e laboratórios", tab: "Exames", icon: FlaskConical, background: colors.lightTeal, color: colors.teal },
  { label: "Meus remédios", tab: "Remédios", icon: Pill, background: colors.lightSage, color: colors.teal },
  { label: "Documentos médicos", tab: "Documentos", icon: FileText, background: colors.lightPurple, color: colors.purple },
];

export type HealthVideo = {
  id: string;
  title: string;
  category: "Cardiologia" | "Diabetes" | "Saúde Mental" | "Exames" | "Hábitos";
  categoryLabel: string;
  duration: string;
  youtubeId: string;
  author: string;
  description: string;
};

const HEALTH_VIDEOS: HealthVideo[] = [
  {
    id: "pressao-aferir",
    title: "Saiba como medir a pressão arterial corretamente",
    category: "Cardiologia",
    categoryLabel: "Cardiologia & Pressão",
    duration: "4 min",
    youtubeId: "NVAJa5o3rpc",
    author: "Dr. Drauzio Varella",
    description: "Postura correta, repouso prévio e orientações para identificar a hipertensão arterial.",
  },
  {
    id: "pressao-controle",
    title: "Formas de controle da hipertensão arterial",
    category: "Cardiologia",
    categoryLabel: "Cardiologia & Pressão",
    duration: "6 min",
    youtubeId: "jgzjHqKtPD8",
    author: "Dr. Drauzio Varella",
    description: "Alimentação com pouco sódio, exercícios e a importância do tratamento contínuo.",
  },
  {
    id: "pressao-podcast",
    title: "Hipertensão arterial e os perigos silenciosos",
    category: "Cardiologia",
    categoryLabel: "Cardiologia & Pressão",
    duration: "12 min",
    youtubeId: "sT-IQKuuLZo",
    author: "Dr. Drauzio Varella (DrauzioCast)",
    description: "Explicação médica sobre como a pressão alta afeta o coração e os rins sem dar sinais.",
  },
  {
    id: "diabetes-geral",
    title: "Diabetes: tudo o que você precisa saber",
    category: "Diabetes",
    categoryLabel: "Diabetes & Prevenção",
    duration: "8 min",
    youtubeId: "N4H7OoM9p60",
    author: "Dr. Drauzio Varella",
    description: "Sintomas, tipos de diabetes e orientações sobre como monitorar a glicose com segurança.",
  },
  {
    id: "diabetes-pre",
    title: "Pré-diabetes: Sinal de alerta para o organismo",
    category: "Diabetes",
    categoryLabel: "Diabetes & Prevenção",
    duration: "7 min",
    youtubeId: "KHfD1FmlA3Y",
    author: "Dr. Drauzio Varella",
    description: "Como diagnosticar precocemente e medidas práticas para evitar o avanço da condição.",
  },
  {
    id: "ansiedade-crise",
    title: "Como controlar uma crise de ansiedade",
    category: "Saúde Mental",
    categoryLabel: "Saúde Mental & Ansiedade",
    duration: "5 min",
    youtubeId: "8YG8HABY25w",
    author: "Dr. Drauzio Varella",
    description: "Técnicas de respiração diafragmática, aterramento e foco para momentos de tensão aguda.",
  },
  {
    id: "ansiedade-podcast",
    title: "O que é ansiedade e quando buscar ajuda profissional",
    category: "Saúde Mental",
    categoryLabel: "Saúde Mental & Ansiedade",
    duration: "15 min",
    youtubeId: "bxE9bQWkuxI",
    author: "Dr. Drauzio Varella",
    description: "A diferença médica entre a preocupação comum e o transtorno de ansiedade generalizada.",
  },
  {
    id: "estresse-corpo",
    title: "Como o estresse afeta o corpo e a mente",
    category: "Saúde Mental",
    categoryLabel: "Saúde Mental & Ansiedade",
    duration: "6 min",
    youtubeId: "V1_76mgWbkA",
    author: "Dr. Drauzio Varella",
    description: "Impactos do cortisol e estresse contínuo na imunidade, qualidade do sono e coração.",
  },
  {
    id: "checkup-rotina",
    title: "Check-up: para que servem os exames de rotina?",
    category: "Exames",
    categoryLabel: "Check-up & Exames",
    duration: "8 min",
    youtubeId: "eoIIovtPLwc",
    author: "Dr. Drauzio Varella",
    description: "A importância da medicina preventiva e os intervalos recomendados para cada perfil de paciente.",
  },
  {
    id: "exames-preventivos",
    title: "Quais os exames preventivos essenciais?",
    category: "Exames",
    categoryLabel: "Check-up & Exames",
    duration: "6 min",
    youtubeId: "78pihs7V22M",
    author: "Dr. Drauzio Varella",
    description: "Principais avaliações diagnósticas, laboratoriais e de rotina para manter a saúde em dia.",
  },
  {
    id: "remedios-cuidados",
    title: "Cuidados essenciais com o uso de medicamentos",
    category: "Hábitos",
    categoryLabel: "Remédios & Hábitos",
    duration: "5 min",
    youtubeId: "YD4BTTIQ42U",
    author: "Dr. Drauzio Varella",
    description: "Os perigos da automedicação e orientações para seguir a prescrição médica com rigor.",
  },
  {
    id: "habito-saudavel",
    title: "O que é ser uma pessoa saudável de verdade?",
    category: "Hábitos",
    categoryLabel: "Remédios & Hábitos",
    duration: "7 min",
    youtubeId: "9q7WaQqtWK4",
    author: "Dr. Drauzio Varella",
    description: "Pilares para a longevidade com qualidade de vida: sono regular, atividade e alimentação consciente.",
  },
];

const PARTNER_LABS = [
  {
    id: "lab-dasa",
    name: "Rede Laboratorial Dasa / Lâmina",
    description: "Exames de sangue, análises clínicas completas e bioquímica.",
    categories: ["Sangue", "Análises Clínicas", "Covid / Sorologias", "Hormônios"],
    discount: "Parceria com até 30% de desconto MediNexus",
    phone: "5521979828341",
  },
  {
    id: "lab-fleury",
    name: "Fleury Diagnósticos & Parceiros",
    description: "Exames laboratoriais de alta precisão e medicina diagnóstica.",
    categories: ["Sangue", "Check-up Geral", "Genética"],
    discount: "Condições especiais e atendimento prioritário",
    phone: "5521979828341",
  },
  {
    id: "lab-imagem",
    name: "Centro de Diagnóstico por Imagem Parceiro",
    description: "Ressonância Magnética, Tomografia, Ultrassom e Raio-X digital.",
    categories: ["Ressonância", "Tomografia", "Ultrassom", "Raio-X"],
    discount: "Agendamento rápido com laudo digital integrado",
    phone: "5521979828341",
  },
  {
    id: "lab-cardio",
    name: "Instituto Cardiológico Diagnóstico",
    description: "Eletrocardiograma (ECG), Holter 24h, MAPA e Ecocardiograma.",
    categories: ["Cardiologia", "ECG", "Holter", "MAPA"],
    discount: "Equipamentos de ponta e emissão ágil de laudos",
    phone: "5521979828341",
  },
];

const FAQ_ITEMS = [
  {
    q: "A MediNexus cobra taxa dos pacientes?",
    a: "Não! A utilização do MediNexus é 100% gratuita para pacientes. Não cobramos comissão, mensalidade ou taxas de agendamento.",
  },
  {
    q: "Como confirmo minha presença em uma consulta?",
    a: "Assim que a clínica confirma o horário, você verá o botão 'Confirmar presença' na aba Consultas ou Início. Basta tocar nele para confirmar sua ida.",
  },
  {
    q: "Como agendar exames em laboratórios parceiros?",
    a: "Você pode agendar exames através da aba Documentos ou pelo atalho 'Exames e laboratórios'. Você escolhe o laboratório credenciado e agenda com desconto em poucos toques.",
  },
  {
    q: "Posso adicionar remédios que tomo por conta própria?",
    a: "Sim! Na aba Remédios, toque em '+ Adicionar Remédio' para cadastrar remédios de uso contínuo, controlar doses e ativar lembretes no celular.",
  },
  {
    q: "Como funciona a avaliação mútua após o atendimento?",
    a: "Após a consulta ser finalizada pelo médico, o paciente pode avaliar o médico e o consultório (de 1 a 5 estrelas). O médico também registra o comparecimento do paciente.",
  },
];

const one = (row: Row | Row[] | null) => (Array.isArray(row) ? row[0] : row);
const when = (raw: string | null) =>
  raw ? new Date(raw).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Horário a definir";

const statusLabels: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmada",
  completed: "Concluída",
  cancelled: "Cancelada",
  cancelled_by_patient: "Cancelada por você",
  cancelled_by_clinic: "Cancelada pela clínica",
  no_show: "Não compareceu",
};

function getStatusVariant(status: string): BadgeVariant {
  if (status === "confirmed") return "confirmed";
  if (status === "pending") return "pending";
  if (status.startsWith("cancelled") || status === "no_show") return "cancelled";
  if (status === "completed") return "completed";
  return "neutral";
}

async function open(url: string) {
  if (!/^(https?:\/\/|tel:\+?[0-9]+$)/.test(url)) return;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Não foi possível abrir o link.");
  }
}

async function openYouTubeVideo(videoId: string) {
  const appUri = Platform.select({
    ios: `vnd.youtube://${videoId}`,
    android: `vnd.youtube:${videoId}`,
    default: `https://www.youtube.com/watch?v=${videoId}`,
  });
  const webUri = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const canOpen = await Linking.canOpenURL(appUri);
    if (canOpen) {
      await Linking.openURL(appUri);
      return;
    }
  } catch {
    // Continua para o fallback web
  }

  try {
    await Linking.openURL(webUri);
  } catch {
    Alert.alert("Erro ao abrir vídeo", "Não foi possível abrir o link do YouTube.");
  }
}

function Main() {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<Session | null>(null);
  const [initial, setInitial] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("Início");
  const [name, setName] = useState("");
  const [role, setRole] = useState("loading");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Row[]>([]);
  const [booking, setBooking] = useState<Found | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [includeExternal, setIncludeExternal] = useState(false);
  const [external, setExternal] = useState<External[]>([]);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [results, setResults] = useState<Found[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [avatar, setAvatar] = useState("");

  // Sub-abas, Modais e Filtros
  const [medTab, setMedTab] = useState<"meus" | "farmacia">("meus");
  const [docFilter, setDocFilter] = useState<"todos" | "exames" | "receitas" | "atestados" | "declaracoes" | "vacinas">("todos");
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState<"todas" | "remedios" | "consultas" | "exames">("todas");
  const [medications, setMedications] = useState<Medication[]>([]);

  // Gestão Familiar e Dependentes
  const [familyDependents, setFamilyDependents] = useState<FamilyMember[]>(INITIAL_DEPENDENTS);
  const [activeDependentId, setActiveDependentId] = useState<string>("self");

  // Telemedicina 1-Clique Nativa
  const [telemedicineCallActive, setTelemedicineCallActive] = useState(false);
  const [telemedicineAppointment, setTelemedicineAppointment] = useState<Appointment | null>(null);

  // MediNexus Saúde Conectada
  const [showHealthMetricsModal, setShowHealthMetricsModal] = useState(false);
  const [isHealthConnected, setIsHealthConnected] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync("medinexus_health_connected");
        if (stored === "true") setIsHealthConnected(true);
      } catch {}
    })();
  }, []);

  // Triagem Pré-Consulta com IA
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [triageAppointment, setTriageAppointment] = useState<Appointment | null>(null);

  // Chat Pós-Consulta (7 dias)
  const [showPostChatModal, setShowPostChatModal] = useState(false);
  const [postChatAppointment, setPostChatAppointment] = useState<Appointment | null>(null);

  // Notificações Push Nativas (Expo Push / APNs)
  const [pushStatusGranted, setPushStatusGranted] = useState(false);

  // Central de Vídeos Educativos e Auto-cuidado
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [videoCategory, setVideoCategory] = useState<string>("Todos");

  // Modal de Exames e Laboratórios Dedicado
  const [showExamModal, setShowExamModal] = useState(false);
  const [examSearchName, setExamSearchName] = useState("");

  // Modal de Adicionar Medicamento Manual (Uso contínuo)
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedInstructions, setNewMedInstructions] = useState("");
  const [newMedQuantity, setNewMedQuantity] = useState("30");
  const [newMedSchedule, setNewMedSchedule] = useState("08:00");
  const [newMedContinuous, setNewMedContinuous] = useState(true);

  // Modal de Ajuda & FAQ
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Modal de Avaliação Pós-Consulta (Paciente avalia Médico e Consultório)
  const [ratingAppointment, setRatingAppointment] = useState<Appointment | null>(null);
  const [doctorRating, setDoctorRating] = useState(5);
  const [clinicRating, setClinicRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewedAppointmentIds, setReviewedAppointmentIds] = useState<string[]>([]);

  // Controle de Busca Regional Condicional
  const [showRegionalSearch, setShowRegionalSearch] = useState(false);

  // Controle de Onboarding de Novo Usuário
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [hasShownOnboardingAlert, setHasShownOnboardingAlert] = useState(false);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) {
        setSession(data.session);
        setInitial(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_OUT") {
        setRole("loading");
        setName("");
        setCity("");
        setAppointments([]);
        setDocuments([]);
        setMedications([]);
        setResults([]);
        setExternal([]);
        setNotices([]);
        setUseAI(false);
        setIncludeExternal(false);
        setAvatar("");
        setBooking(null);
        setMessage("");
        setTab("Início");
        setIsProfileIncomplete(false);
        setHasShownOnboardingAlert(false);
      }
    });

    const appState = AppState.addEventListener("change", state => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
      appState.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    setMessage("");
    try {
      const account = await loadAccount(session.user, supabase);
      setName(account.name);
      setCity(account.city);
      setRole(account.role);

      if (account.role !== "patient") return;

      // Verifica se o cadastro está incompleto (para novos pacientes)
      const profileIncomplete = account.newPatient || !account.city;
      setIsProfileIncomplete(profileIncomplete);

      // Se for novo cadastro incompleto e ainda não alertamos, leva direto para Perfil
      if (profileIncomplete && !hasShownOnboardingAlert) {
        setHasShownOnboardingAlert(true);
        setTab("Perfil");
      }

      const [a, d, prefs] = await Promise.all([
        supabase
          .from("appointments")
          .select(
            "id,status,confirmed_start_at,requested_start_at,patient_confirmation_status,doctors(id,name,photo_path,clinic_id),clinics(trade_name,address_street,address_number,address_city,address_state)"
          )
          .eq("patient_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("medical_documents")
          .select("id,title,document_type,issued_at,signature_status,signed_pdf_url,content,plain_text,doctor_id")
          .eq("patient_id", session.user.id)
          .eq("released_to_patient", true)
          .eq("status", "issued")
          .order("issued_at", { ascending: false })
          .limit(50),
        supabase.from("patient_preferences").select("avatar_path").eq("patient_id", session.user.id).maybeSingle(),
      ]);

      if (a.error || d.error) throw new Error("Não foi possível carregar seus atendimentos. Tente novamente.");
      const appts = (a.data || []) as Appointment[];
      const docs = d.data || [];
      setAppointments(appts);
      setDocuments(docs);

      // Extração automática de medicamentos prescritos
      const extracted: Medication[] = [];
      docs.forEach(doc => {
        const docType = String(doc.document_type || "").toLowerCase();
        if (docType === "prescription" || String(doc.title || "").toLowerCase().includes("receita")) {
          const content = (doc.content as Record<string, unknown>) || {};
          const meds = Array.isArray(content.medications)
            ? (content.medications as Record<string, unknown>[])
            : content.medication_name
            ? [content]
            : [];

          meds.forEach((m, idx) => {
            const medName = String(m.medication_name || "Medicamento Prescrito");
            const medUse = String(m.medication_use || "Tomar conforme prescrição médica");
            const medDosage = String(m.dosage || "");
            const medDuration = String(m.duration || "Tratamento de 7 dias");
            const rawQty = String(m.quantity || "").match(/\d+/);
            const totalQty = rawQty ? parseInt(rawQty[0], 10) : 20;

            extracted.push({
              id: `${doc.id}-${idx}`,
              name: medName,
              dosage: medDosage,
              instructions: medUse,
              duration: medDuration,
              remainingQuantity: totalQty,
              totalQuantity: totalQty,
              schedule: ["08:00", "20:00"],
              reminderActive: true,
              status: "em_uso",
              prescriptionDate: String(doc.issued_at || ""),
            });
          });
        }
      });

      // Preserva medicações contínuas já adicionadas manualmente pelo usuário
      setMedications(prev => {
        const manualMeds = prev.filter(m => m.isContinuous);
        const combined = [...extracted];
        manualMeds.forEach(m => {
          if (!combined.some(c => c.id === m.id)) combined.push(m);
        });
        return combined;
      });

      if (prefs.data?.avatar_path) {
        const signed = await supabase.storage.from("patient-avatars").createSignedUrl(prefs.data.avatar_path, 3600);
        setAvatar(signed.data?.signedUrl || "");
      } else {
        setAvatar("");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }, [session?.user.id, hasShownOnboardingAlert]);

  useEffect(() => {
    void load();
  }, [load]);

  // Lista de médicos recentes para rebooking rápido
  const recentDoctors: RecentDoctor[] = appointments
    .filter(a => !!a.doctors)
    .reduce<RecentDoctor[]>((acc, a) => {
      const doc = one(a.doctors);
      if (doc && !acc.some(d => d.name === String(doc.name))) {
        acc.push({
          id: String(doc.id || a.id),
          name: String(doc.name || "Profissional"),
          photoPath: typeof doc.photo_path === "string" ? doc.photo_path : null,
          clinicName: String(one(a.clinics)?.trade_name || "Consultório"),
          clinicId: typeof doc.clinic_id === "string" ? doc.clinic_id : undefined,
        });
      }
      return acc;
    }, [])
    .slice(0, 5);

  async function handleRebookDoctor(doc: RecentDoctor) {
    const doctorObj: Found = {
      id: doc.id,
      name: doc.name,
      photoPath: doc.photoPath || null,
      clinicId: doc.clinicId || null,
      clinicName: doc.clinicName || "Consultório",
      address: "",
      specialtyId: doc.specialtyId || null,
    };
    await chooseDoctor(doctorObj);
  }

  async function find() {
    setBusy(true);
    setMessage("");
    setResults([]);
    setExternal([]);
    setNotices([]);
    setBooking(null);
    try {
      const current = await supabase.auth.getSession();
      const r = await fetch(appUrl + "/api/discovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${current.data.session?.access_token}`,
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ query, city, useAI, includeExternal }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Busca indisponível.");
      setResults(data.registered || []);
      setExternal(data.external || []);
      setNotices(data.notices || []);
      if (!data.registered?.length && !data.external?.length) {
        setMessage("Nenhum profissional encontrado nesta busca.");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível buscar.");
    } finally {
      setBusy(false);
    }
  }

  async function chooseDoctor(d: Found) {
    setBooking(d);
    setSlots([]);
    setSelectedSpecialty("");
    setMessage("");
    setBusy(true);
    try {
      const links = await supabase.from("doctor_specialties").select("specialty_id,specialties(name)").eq("doctor_id", d.id);
      if (links.error) throw links.error;
      const loaded = (links.data || []).map(row => ({ id: row.specialty_id, name: String(one(row.specialties)?.name || "Especialidade") }));
      setSpecialties(loaded);
      if (loaded.length > 0) {
        setSelectedSpecialty(loaded[0].id);
        const { data: slotData, error: slotErr } = await supabase.rpc("get_doctor_booking_slots", {
          p_doctor_id: d.id,
          p_specialty_id: loaded[0].id,
        });
        if (!slotErr && slotData) {
          setSlots(slotData);
        }
      }
    } catch {
      setMessage("Não foi possível carregar a agenda deste médico.");
    } finally {
      setBusy(false);
    }
  }

  async function chooseSpecialty(id: string) {
    if (!booking) return;
    setSelectedSpecialty(id);
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.rpc("get_doctor_booking_slots", { p_doctor_id: booking.id, p_specialty_id: id });
    setSlots(data || []);
    if (error) setMessage("Agenda indisponível. Tente novamente.");
    else if (!data?.length) setMessage("Não há horários disponíveis nos próximos 21 dias.");
    setBusy(false);
  }

  function requestBooking(slot: Slot) {
    if (!booking) return;
    Alert.alert(
      "Solicitar consulta particular",
      `${booking.name}\n${when(slot.start_at)}\nO horário depende da confirmação da clínica. Confirme valores diretamente com o consultório.`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Solicitar",
          onPress: () => {
            void (async () => {
              setBusy(true);
              const { error } = await supabase.rpc("request_doctor_booking", {
                p_doctor_id: booking.id,
                p_specialty_id: selectedSpecialty,
                p_start_at: slot.start_at,
              });
              if (error) {
                setMessage(error.message);
              } else {
                setBooking(null);
                setTab("Consultas");
                await load();
                setMessage("Solicitação enviada! Acompanhe a confirmação na aba Consultas.");
              }
              setBusy(false);
            })();
          },
        },
      ]
    );
  }

  async function locate() {
    setBusy(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("Você pode digitar sua cidade sem permitir o GPS.");
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      const address = await Location.reverseGeocodeAsync(position.coords);
      if (address[0]) setCity(address[0].city || address[0].subregion || "");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Localização indisponível.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(a: Appointment) {
    setBusy(true);
    const { data, error } = await supabase
      .from("appointments")
      .update({ patient_confirmation_status: "confirmed", patient_confirmed_at: new Date().toISOString() })
      .eq("id", a.id)
      .eq("patient_id", session!.user.id)
      .eq("status", "confirmed")
      .eq("patient_confirmation_status", "awaiting_confirmation")
      .select("id")
      .maybeSingle();
    if (error || !data) setMessage("Não foi possível confirmar. Atualize os atendimentos.");
    else await load();
    setBusy(false);
  }

  function directions(a: Appointment) {
    const c = one(a.clinics);
    if (!c?.address_street || !c.address_city) {
      Alert.alert("Endereço incompleto", "Confirme o endereço com a clínica antes de sair.");
      return;
    }
    const destination = [c.address_street, c.address_number, c.address_city, c.address_state].filter(Boolean).join(", ");
    void showDirections(destination, session!.user.id, open);
  }

  function adjustMedQuantity(medId: string, delta: number) {
    setMedications(prev =>
      prev.map(m => {
        if (m.id === medId) {
          const next = Math.max(0, m.remainingQuantity + delta);
          return { ...m, remainingQuantity: next, status: next === 0 ? "a_comprar" : "em_uso" };
        }
        return m;
      })
    );
  }

  function toggleMedReminder(medId: string) {
    setMedications(prev =>
      prev.map(m => {
        if (m.id === medId) {
          const next = !m.reminderActive;
          if (next) {
            void scheduleMedicationReminder(m.name, m.schedule[0] || "08:00");
            Alert.alert("Lembrete Push Ativo", `Você receberá alertas no iPhone todos os dias às ${m.schedule[0] || "08:00"} para tomar ${m.name}.`);
          } else {
            Alert.alert("Lembrete", "Lembretes desativados.");
          }
          return { ...m, reminderActive: next };
        }
        return m;
      })
    );
  }

  function orderMedicationPharmacy(med: Medication) {
    const text = encodeURIComponent(
      `Olá! Gostaria de cotar o medicamento ${med.name}${med.dosage ? ` (${med.dosage})` : ""} pelo MediNexus.`
    );
    void open(`https://wa.me/5521979828341?text=${text}`);
  }

  // 2. Fluxo separado e dedicado de agendamento de exames em clínicas e laboratórios
  function handleOpenExamBooking(examName = "") {
    setExamSearchName(examName);
    setShowExamModal(true);
  }

  function requestPartnerLabAppointment(lab: typeof PARTNER_LABS[0]) {
    const text = encodeURIComponent(
      `Olá! Gostaria de agendar o exame "${examSearchName || "Laboratorial"}" pelo MediNexus no ${lab.name}.`
    );
    void open(`https://wa.me/${lab.phone}?text=${text}`);
  }

  // 3. Adicionar Medicamento Manualmente (Uso contínuo)
  function handleSaveManualMedication() {
    if (!newMedName.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, informe o nome do medicamento.");
      return;
    }
    const qty = parseInt(newMedQuantity, 10) || 30;
    const newMed: Medication = {
      id: `manual-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      instructions: newMedInstructions.trim() || "Uso contínuo diário",
      duration: newMedContinuous ? "Uso contínuo" : "Tratamento",
      remainingQuantity: qty,
      totalQuantity: qty,
      schedule: [newMedSchedule || "08:00"],
      reminderActive: true,
      status: "em_uso",
      isContinuous: true,
    };

    void scheduleMedicationReminder(newMed.name, newMed.schedule[0] || "08:00");

    setMedications(prev => [newMed, ...prev]);
    setShowAddMedModal(false);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedInstructions("");
    setNewMedQuantity("30");
    setNewMedSchedule("08:00");
    Alert.alert("Medicamento adicionado", "Seu medicamento contínuo foi salvo e os lembretes ativados!");
  }

  // 4. Avaliação pós-consulta pelo paciente
  async function handleSubmitReview() {
    if (!ratingAppointment) return;
    setBusy(true);
    try {
      const doc = one(ratingAppointment.doctors);
      const clinic = one(ratingAppointment.clinics);
      const { error } = await supabase.from("care_reviews").insert({
        appointment_id: ratingAppointment.id,
        patient_id: session!.user.id,
        doctor_id: doc?.id || null,
        doctor_score: doctorRating,
        clinic_score: clinicRating,
        comment: reviewComment.trim() || null,
      });
      if (error) {
        // Se a tabela care_reviews tiver constraint ou já tiver sido avaliada, registra localmente
        console.warn("Review insert:", error.message);
      }
      setReviewedAppointmentIds(prev => [...prev, ratingAppointment.id]);
      setRatingAppointment(null);
      setReviewComment("");
      Alert.alert("Obrigado pela avaliação!", "Sua opinião é fundamental para a qualidade dos atendimentos.");
    } catch {
      setRatingAppointment(null);
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>MediNexus</Text>
        <Text style={styles.copy}>Configure o ambiente do aplicativo para conectar sua conta.</Text>
      </View>
    );
  }

  if (initial) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={[styles.copy, { marginTop: 12 }]}>Carregando sua conta…</Text>
      </View>
    );
  }

  if (!session) return <AuthScreen onCreated={() => setTab("Início")} openWeb={url => void open(url)} />;

  // Filtro de Documentos
  const filteredDocuments = documents.filter(doc => {
    const type = String(doc.document_type || "").toLowerCase();
    const title = String(doc.title || "").toLowerCase();
    if (docFilter === "todos") return true;
    if (docFilter === "exames") return type.includes("exam") || title.includes("exame");
    if (docFilter === "receitas") return type.includes("prescription") || title.includes("receita");
    if (docFilter === "atestados") return type.includes("certificate") || title.includes("atestado");
    if (docFilter === "declaracoes") return type.includes("declaration") || title.includes("comparecimento");
    return true;
  });

  // Consulta concluída que ainda não foi avaliada
  const unreviewedCompletedAppt = appointments.find(
    a => a.status === "completed" && !reviewedAppointmentIds.includes(a.id)
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.sand }}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={() => void load()} tintColor={colors.teal} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Superior com Marca, Ajuda, Sininho de Notificações e Avatar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>MEDINEXUS</Text>
            <Text style={styles.heading}>Olá, {name.split(" ")[0] || "bem-vindo"} 👋</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Botão de Ajuda & FAQ */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajuda e Suporte"
              onPress={() => setShowHelpModal(true)}
              style={styles.iconCircleBtn}
            >
              <HelpCircle size={20} color={colors.teal} />
            </Pressable>

            {/* Sininho de Notificações */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notificações"
              onPress={() => {
                setShowNotifications(true);
                setHasSeenNotifications(true);
              }}
              style={styles.iconCircleBtn}
            >
              <Bell size={20} color={colors.teal} />
              {!hasSeenNotifications && (appointments.filter(a => a.status === "confirmed").length > 0 || medications.length > 0) && (
                <View style={styles.bellDot} />
              )}
            </Pressable>

            {/* Avatar / Perfil */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir meu perfil"
              onPress={() => setTab("Perfil")}
              style={styles.avatarButton}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <UserRound size={22} color={colors.teal} />
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Banner Gentil de Concluir Cadastro para Contas Novas / Incompletas */}
        {isProfileIncomplete && tab !== "Perfil" && (
          <Pressable onPress={() => setTab("Perfil")} style={[styles.onboardingBanner, shadows.sm]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AlertCircle size={22} color={colors.teal} />
              <View style={{ flex: 1 }}>
                <Text style={styles.onboardingTitle}>Complete seus dados de cadastro</Text>
                <Text style={styles.onboardingCopy}>
                  Informe seu CPF, data de nascimento e endereço para agilizar confirmações de consultas e exames.
                </Text>
              </View>
              <ChevronRight size={18} color={colors.teal} />
            </View>
          </Pressable>
        )}

        {!!message && (
          <View style={[styles.alertBar, shadows.sm]}>
            <Text accessibilityRole="alert" style={styles.alertBarText}>
              {message}
            </Text>
          </View>
        )}

        {role === "loading" ? (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.copy}>{busy ? "Verificando sua conta…" : "Não foi possível carregar sua conta."}</Text>
            <Button title="Tentar novamente" disabled={busy} onPress={() => void load()} />
            <Button secondary title="Sair da conta" onPress={() => void supabase.auth.signOut()} />
          </View>
        ) : role !== "patient" ? (
          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.heading}>Área profissional</Text>
            <Text style={styles.copy}>A gestão médica e da clínica está disponível na plataforma web.</Text>
            <Button
              title="Abrir painel na web"
              onPress={() => void open(appUrl + (role === "doctor" ? "/medico/dashboard" : "/clinica/dashboard"))}
            />
            <Button secondary title="Sair" onPress={() => void supabase.auth.signOut()} />
          </View>
        ) : (
          <>
            {/* Gestão Familiar e Troca de Perfil de Dependentes */}
            <FamilySwitcher
              activeId={activeDependentId}
              onSelect={setActiveDependentId}
              dependents={familyDependents}
              onAdd={(m) => setFamilyDependents((prev) => [...prev, m])}
            />

            {/* ======================================================== */}
            {/* 1. TAB INÍCIO */}
            {/* ======================================================== */}
            {tab === "Início" && (
              <>
                <Text style={styles.copy}>Seu cuidado de saúde, organizado em um só lugar.</Text>

                {/* Métricas Rápidas */}
                <View style={styles.metrics}>
                  <Pressable accessibilityRole="button" onPress={() => setTab("Consultas")} style={[styles.metric, shadows.sm]}>
                    <View style={styles.metricIconBox}>
                      <CalendarDays size={20} color={colors.teal} />
                    </View>
                    <Text style={styles.metricNumber}>{appointments.filter(a => a.status === "confirmed").length}</Text>
                    <Text style={styles.metricLabel}>Consultas confirmadas</Text>
                  </Pressable>

                  <Pressable accessibilityRole="button" onPress={() => setTab("Remédios")} style={[styles.metric, shadows.sm]}>
                    <View style={[styles.metricIconBox, { backgroundColor: colors.lightTeal }]}>
                      <Pill size={20} color={colors.teal} />
                    </View>
                    <Text style={[styles.metricNumber, { color: colors.teal }]}>{medications.length}</Text>
                    <Text style={styles.metricLabel}>Remédios ativos</Text>
                  </Pressable>
                </View>

                {/* MediNexus Saúde Conectada */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowHealthMetricsModal(true)}
                  style={[styles.card, shadows.sm, { backgroundColor: colors.sandDark }]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isHealthConnected ? "#FFE4E6" : colors.lightSage, alignItems: "center", justifyContent: "center" }}>
                        <Heart size={18} color={isHealthConnected ? "#E11D48" : colors.teal} />
                      </View>
                      <View>
                        <Text style={styles.cardTitle}>MediNexus Saúde Conectada</Text>
                        <Text style={[styles.copy, { fontSize: 11 }]}>
                          {isHealthConnected ? (Platform.OS === "ios" ? "Autorizado via Apple Saúde" : "Autorizado via Health Connect") : "Toque para conectar sensores de biometria"}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={colors.teal} />
                  </View>
                  {isHealthConnected ? (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <View>
                        <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>Passos no Mês</Text>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.graphite }}>—</Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>Pico FC</Text>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#E11D48" }}>—</Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>Pressão</Text>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.success }}>—</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>
                        Monitore passos, FC e pressão com seu médico
                      </Text>
                      <View style={{ backgroundColor: colors.teal, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, color: "white", fontWeight: "700" }}>Conectar</Text>
                      </View>
                    </View>
                  )}
                </Pressable>

                {/* Avaliação Pendente Pós-Consulta (se houver consulta concluída recente) */}
                {unreviewedCompletedAppt && (
                  <View style={[styles.card, shadows.sm, { backgroundColor: colors.lightSage, borderColor: colors.teal }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Star size={24} color={colors.teal} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>Como foi sua consulta?</Text>
                        <Text style={styles.copy}>
                          Avalie seu atendimento com {String(one(unreviewedCompletedAppt.doctors)?.name || "o médico")}.
                        </Text>
                      </View>
                    </View>
                    <Button
                      title="Avaliar atendimento"
                      icon={Star}
                      onPress={() => setRatingAppointment(unreviewedCompletedAppt)}
                    />
                  </View>
                )}

                {/* Atalhos Rápidos com Exames Separados */}
                <Text style={styles.sectionHeading}>O que você precisa hoje?</Text>
                <View style={styles.shortcuts}>
                  {shortcuts.map(action => (
                    <Pressable
                      key={action.label}
                      accessibilityRole="button"
                      onPress={() => {
                        if (action.tab === "Exames") handleOpenExamBooking();
                        else setTab(action.tab);
                      }}
                      style={({ pressed }) => [
                        styles.shortcut,
                        shadows.sm,
                        { backgroundColor: action.background, opacity: pressed ? 0.8 : 1 },
                      ]}
                    >
                      <action.icon size={26} color={action.color} />
                      <Text style={styles.shortcutLabel}>{action.label}</Text>
                      <ArrowUpRight size={16} color={action.color} style={{ position: "absolute", right: 14, top: 16 }} />
                    </Pressable>
                  ))}
                </View>

                {/* Próximos Atendimentos */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>Próximos atendimentos</Text>
                  {appointments.length > 0 && (
                    <Pressable onPress={() => setTab("Consultas")}>
                      <Text style={styles.sectionLink}>Ver todos</Text>
                    </Pressable>
                  )}
                </View>

                {!appointments.length ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="Nenhuma consulta agendada"
                    description="Encontre médicos e clínicas perto de você para agendar um horário."
                    actionLabel="Agendar consulta"
                    onAction={() => setTab("Buscar")}
                  />
                ) : (
                  appointments.slice(0, 3).map(a => (
                    <View style={[styles.card, shadows.sm]} key={a.id}>
                      <View style={styles.cardHeaderRow}>
                        <Badge label={statusLabels[a.status] || a.status} variant={getStatusVariant(a.status)} />
                        <Text style={styles.date}>{when(a.confirmed_start_at || a.requested_start_at)}</Text>
                      </View>

                      <View style={styles.cardBodyRow}>
                        {!!one(a.doctors)?.photo_path ? (
                          <Image
                            source={{
                              uri: supabase.storage
                                .from("doctor-photos")
                                .getPublicUrl(String(one(a.doctors)?.photo_path)).data.publicUrl,
                            }}
                            style={styles.doctorThumb}
                          />
                        ) : (
                          <View style={styles.doctorThumbPlaceholder}>
                            <UserRound size={26} color={colors.teal} />
                          </View>
                        )}
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.cardTitle}>{String(one(a.doctors)?.name || "Profissional")}</Text>
                          <Text style={styles.copy}>{String(one(a.clinics)?.trade_name || "Consultório")}</Text>
                        </View>
                      </View>

                      {a.status === "confirmed" && (
                        <View style={{ gap: 8, marginTop: 4 }}>
                          <Button secondary title="Como chegar (Trajeto)" icon={MapPin} onPress={() => directions(a)} />
                          {a.patient_confirmation_status === "awaiting_confirmation" && (
                            <Button title="Confirmar presença" icon={CheckCircle2} disabled={busy} onPress={() => void confirm(a)} />
                          )}
                        </View>
                      )}
                    </View>
                  ))
                )}

                {/* Central de Saúde & Auto-Cuidado (Biblioteca de Vídeos por Tópicos) */}
                <View style={[styles.card, shadows.sm, { backgroundColor: colors.lightSage, borderColor: colors.teal, marginTop: 12 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={styles.videoBannerIconBox}>
                      <Play size={22} color="white" fill="white" />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.cardTitle, { color: colors.tealDark }]}>Central de Saúde & Auto-cuidado</Text>
                      <Text style={[styles.copy, { fontSize: 13, color: colors.graphite }]}>
                        Vídeos explicativos com o Dr. Drauzio Varella sobre pressão, diabetes, ansiedade e prevenção.
                      </Text>
                    </View>
                  </View>
                  <Button
                    title="Acessar Biblioteca de Vídeos"
                    icon={Play}
                    onPress={() => setShowVideoLibrary(true)}
                  />
                </View>
              </>
            )}

            {/* ======================================================== */}
            {/* 2. TAB BUSCAR (CONSULTAS MÉDICAS & BUSCA REGIONAL) */}
            {/* ======================================================== */}
            {tab === "Buscar" && (
              <>
                <AvailabilitySearch
                  userId={session.user.id}
                  recentDoctors={recentDoctors}
                  onRebookDoctor={handleRebookDoctor}
                  onBooked={() => {
                    setTab("Consultas");
                    void load();
                  }}
                  onSearchByRegion={specName => {
                    setShowRegionalSearch(true);
                    if (specName) setQuery(specName);
                  }}
                />

                {/* Seção Condicional: Buscar por Região e Mapa */}
                <View style={{ marginTop: 12, gap: 12 }}>
                  {!showRegionalSearch ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowRegionalSearch(true)}
                      style={[styles.regionalToggleBtn, shadows.sm]}
                    >
                      <MapPin size={18} color={colors.teal} />
                      <Text style={styles.regionalToggleText}>
                        Deseja buscar médicos por região e mapa em vez do horário?
                      </Text>
                      <ChevronDown size={18} color={colors.graphiteLight} />
                    </Pressable>
                  ) : (
                    <View style={[styles.card, shadows.sm]}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={styles.heading}>Buscar médicos por região</Text>
                        <Pressable onPress={() => setShowRegionalSearch(false)}>
                          <X size={20} color={colors.graphiteLight} />
                        </Pressable>
                      </View>
                      <TextInput
                        accessibilityLabel="Especialidade ou nome"
                        style={styles.input}
                        placeholder="Especialidade ou nome do profissional"
                        placeholderTextColor="#9CA3AF"
                        maxLength={180}
                        editable={!busy}
                        value={query}
                        onChangeText={setQuery}
                      />
                      <TextInput
                        accessibilityLabel="Cidade"
                        style={styles.input}
                        placeholder="Cidade (ex: Rio de Janeiro)"
                        placeholderTextColor="#9CA3AF"
                        maxLength={100}
                        editable={!busy}
                        value={city}
                        onChangeText={setCity}
                      />

                      <Button
                        secondary
                        title="Preencher com minha localização"
                        icon={MapPin}
                        disabled={busy}
                        onPress={() => void locate()}
                      />
                      <Toggle
                        label="Interpretar especialidade com inteligência artificial"
                        value={useAI}
                        onChange={setUseAI}
                        disabled={busy}
                      />
                      <Toggle
                        label="Incluir contatos externos do Google Maps"
                        value={includeExternal}
                        onChange={setIncludeExternal}
                        disabled={busy}
                      />

                      <Button
                        title="Buscar profissionais"
                        disabled={busy || query.length < 2 || city.length < 2}
                        onPress={() => void find()}
                      />

                      {notices.map(n => (
                        <Text style={styles.copy} key={n}>
                          {n}
                        </Text>
                      ))}

                      {results.map(d => (
                        <View style={[styles.card, shadows.sm]} key={d.id}>
                          <Badge label="REDE MEDINEXUS" variant="brand" />
                          <View style={styles.cardBodyRow}>
                            {d.photoPath ? (
                              <Image
                                source={{
                                  uri: supabase.storage.from("doctor-photos").getPublicUrl(d.photoPath).data.publicUrl,
                                }}
                                style={styles.doctorThumb}
                              />
                            ) : (
                              <View style={styles.doctorThumbPlaceholder}>
                                <UserRound size={26} color={colors.teal} />
                              </View>
                            )}
                            <View style={{ flex: 1, gap: 2 }}>
                              <Text style={styles.cardTitle}>{d.name}</Text>
                              <Text style={styles.copy}>{d.clinicName}</Text>
                              <Text style={[styles.copy, { fontSize: 12, color: colors.muted }]}>{d.address}</Text>
                            </View>
                          </View>
                          <Button title="Ver horários disponíveis" disabled={busy} onPress={() => void chooseDoctor(d)} />
                        </View>
                      ))}

                      {external.length > 0 && <Text style={styles.heading}>Outros contatos na região</Text>}
                      {external.map(d => (
                        <View key={d.id} style={[styles.card, shadows.sm]}>
                          <Badge label="CONTATO EXTERNO · GOOGLE MAPS" variant="external" />
                          <Text style={styles.cardTitle}>{d.name}</Text>
                          <Text style={styles.copy}>{d.address}</Text>
                          <Text style={[styles.copy, { fontSize: 12, color: colors.muted }]}>
                            Contato direto, sem agendamento pela MediNexus.
                          </Text>
                          {!!d.phone && (
                            <Button
                              secondary
                              title={d.phone}
                              onPress={() => void open("tel:" + d.phone.replace(/[^+0-9]/g, ""))}
                            />
                          )}
                          {!!d.mapsUrl && <Button secondary title="Ver no Google Maps" onPress={() => void open(d.mapsUrl)} />}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ======================================================== */}
            {/* 3. TAB CONSULTAS */}
            {/* ======================================================== */}
            {tab === "Consultas" && (
              <>
                <Text style={styles.heading}>Minhas consultas</Text>
                {!appointments.length ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="Nenhuma consulta cadastrada"
                    description="Quando você solicitar ou confirmar atendimentos, eles ficarão salvos aqui."
                    actionLabel="Buscar profissionais"
                    onAction={() => setTab("Buscar")}
                  />
                ) : (
                  appointments.map(a => (
                    <View style={[styles.card, shadows.sm]} key={a.id}>
                      <View style={styles.cardHeaderRow}>
                        <Badge label={statusLabels[a.status] || a.status} variant={getStatusVariant(a.status)} />
                        <Text style={styles.date}>{when(a.confirmed_start_at || a.requested_start_at)}</Text>
                      </View>

                      <View style={styles.cardBodyRow}>
                        {!!one(a.doctors)?.photo_path ? (
                          <Image
                            source={{
                              uri: supabase.storage
                                .from("doctor-photos")
                                .getPublicUrl(String(one(a.doctors)?.photo_path)).data.publicUrl,
                            }}
                            style={styles.doctorThumb}
                          />
                        ) : (
                          <View style={styles.doctorThumbPlaceholder}>
                            <UserRound size={26} color={colors.teal} />
                          </View>
                        )}
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.cardTitle}>{String(one(a.doctors)?.name || "Profissional")}</Text>
                          <Text style={styles.copy}>{String(one(a.clinics)?.trade_name || "Consultório")}</Text>
                        </View>
                      </View>

                      {a.status === "confirmed" && (
                        <View style={{ gap: 8, marginTop: 4 }}>
                          <Button
                            title="Telemedicina (1-Clique)"
                            icon={Video}
                            onPress={() => {
                              setTelemedicineAppointment(a);
                              setTelemedicineCallActive(true);
                            }}
                          />
                          <Button
                            secondary
                            title="Triagem Pré-Consulta (IA)"
                            icon={Sparkles}
                            onPress={() => {
                              setTriageAppointment(a);
                              setShowTriageModal(true);
                            }}
                          />
                          <Button secondary title="Como chegar" icon={MapPin} onPress={() => directions(a)} />
                          {a.patient_confirmation_status === "awaiting_confirmation" && (
                            <Button
                              title="Confirmar minha presença"
                              icon={CheckCircle2}
                              disabled={busy}
                              onPress={() => void confirm(a)}
                            />
                          )}
                        </View>
                      )}

                      {a.status === "pending" && (
                        <View style={{ gap: 8, marginTop: 4 }}>
                          <Button
                            secondary
                            title="Triagem Pré-Consulta (IA)"
                            icon={Sparkles}
                            onPress={() => {
                              setTriageAppointment(a);
                              setShowTriageModal(true);
                            }}
                          />
                        </View>
                      )}

                      {a.status === "completed" && (
                        <View style={{ gap: 8, marginTop: 4 }}>
                          <Button
                            secondary
                            title="Dúvidas Pós-Consulta (7 dias)"
                            icon={MessageSquare}
                            onPress={() => {
                              setPostChatAppointment(a);
                              setShowPostChatModal(true);
                            }}
                          />
                          <Button
                            secondary
                            title="Avaliar médico e consultório"
                            icon={Star}
                            onPress={() => setRatingAppointment(a)}
                          />
                        </View>
                      )}
                    </View>
                  ))
                )}
              </>
            )}

            {/* ======================================================== */}
            {/* 4. TAB REMÉDIOS (MEDICAMENTOS & FARMÁCIA) */}
            {/* ======================================================== */}
            {tab === "Remédios" && (
              <>
                <View style={{ gap: 4, marginBottom: 6 }}>
                  <Text style={styles.heading}>Controle de Medicamentos</Text>
                  <Text style={styles.copy}>Gerencie suas receitas, dosagens diárias e peça reposição na farmácia parceira.</Text>
                </View>

                {/* Banner de ação rápida para adicionar medicamento */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowAddMedModal(true)}
                  style={[styles.medAddBanner, shadows.sm]}
                >
                  <View style={styles.medAddIconCircle}>
                    <Plus size={20} color={colors.teal} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.medAddTitle}>Adicionar Medicamento</Text>
                    <Text style={styles.medAddSubtitle}>Cadastre remédios de uso contínuo, horários e estoque</Text>
                  </View>
                  <ChevronRight size={18} color={colors.graphiteLight} />
                </Pressable>

                {/* Sub-abas Meus Remédios vs Farmácia */}
                <View style={styles.segmentedControl}>
                  <Pressable
                    accessibilityRole="tab"
                    onPress={() => setMedTab("meus")}
                    style={[styles.segmentButton, medTab === "meus" && styles.segmentButtonActive]}
                  >
                    <Pill size={16} color={medTab === "meus" ? colors.teal : colors.graphite} />
                    <Text style={[styles.segmentText, medTab === "meus" && styles.segmentTextActive]}>Meus Remédios</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="tab"
                    onPress={() => setMedTab("farmacia")}
                    style={[styles.segmentButton, medTab === "farmacia" && styles.segmentButtonActive]}
                  >
                    <ShoppingBag size={16} color={medTab === "farmacia" ? colors.teal : colors.graphite} />
                    <Text style={[styles.segmentText, medTab === "farmacia" && styles.segmentTextActive]}>Farmácia & Pedidos</Text>
                  </Pressable>
                </View>

                {/* Sub-aba Meus Remédios */}
                {medTab === "meus" && (
                  <>
                    <Text style={styles.copy}>
                      Acompanhe prescrições médicas e medicamentos de uso contínuo cadastrados por você.
                    </Text>

                    {!medications.length ? (
                      <EmptyState
                        icon={Pill}
                        title="Nenhum medicamento ativo"
                        description="Você pode cadastrar seus remédios de uso contínuo ou aguardar a emissão de receitas médicas."
                        actionLabel="+ Adicionar medicamento"
                        onAction={() => setShowAddMedModal(true)}
                      />
                    ) : (
                      medications.map(med => (
                        <View style={[styles.card, shadows.sm]} key={med.id}>
                          <View style={styles.cardHeaderRow}>
                            <Badge
                              label={
                                med.isContinuous
                                  ? "USO CONTÍNUO"
                                  : med.status === "em_uso"
                                  ? "EM TRATAMENTO"
                                  : "A COMPRAR"
                              }
                              variant={med.status === "em_uso" ? "confirmed" : "pending"}
                            />
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Clock size={14} color={colors.teal} />
                              <Text style={styles.date}>{med.schedule.join(" · ")}</Text>
                            </View>
                          </View>

                          <View style={{ gap: 4 }}>
                            <Text style={styles.cardTitle}>
                              {med.name} {med.dosage ? `· ${med.dosage}` : ""}
                            </Text>
                            <Text style={[styles.copy, { color: colors.tealDark, fontWeight: "600" }]}>{med.instructions}</Text>
                            <Text style={[styles.copy, { fontSize: 13, color: colors.muted }]}>Duração: {med.duration}</Text>
                          </View>

                          {/* Contador de Doses Restantes */}
                          <View style={styles.medCounterRow}>
                            <View>
                              <Text style={styles.counterLabel}>Estoque restante:</Text>
                              <Text style={styles.counterValue}>{med.remainingQuantity} doses</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Tomei uma dose"
                                onPress={() => adjustMedQuantity(med.id, -1)}
                                style={styles.counterBtn}
                              >
                                <Minus size={16} color={colors.teal} />
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Adicionar estoque"
                                onPress={() => adjustMedQuantity(med.id, 1)}
                                style={styles.counterBtn}
                              >
                                <Plus size={16} color={colors.teal} />
                              </Pressable>
                            </View>
                          </View>

                          {/* Lembrete de Horário */}
                          <Toggle
                            label="Lembrete ativo para este horário"
                            value={med.reminderActive}
                            onChange={() => toggleMedReminder(med.id)}
                          />

                          {med.remainingQuantity <= 5 && (
                            <Button
                              secondary
                              title="Estoque baixo: Pedir na Farmácia"
                              icon={ShoppingBag}
                              onPress={() => setMedTab("farmacia")}
                            />
                          )}
                        </View>
                      ))
                    )}
                  </>
                )}

                {/* Sub-aba Farmácia & Pedidos */}
                {medTab === "farmacia" && (
                  <>
                    <View style={[styles.card, shadows.sm, { backgroundColor: colors.lightTeal, borderColor: colors.teal }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <ShoppingBag size={24} color={colors.teal} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardTitle, { color: colors.tealDark }]}>Farmácias Parceiras MediNexus</Text>
                          <Text style={[styles.copy, { fontSize: 13 }]}>
                            Receba orçamentos de remédios com desconto e entrega na sua residência.
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.sectionHeading}>Medicamentos para compra e reposição</Text>
                    {!medications.length ? (
                      <EmptyState
                        icon={ShoppingBag}
                        title="Nenhum medicamento pendente"
                        description="Quando houver receitas emitidas ou remédios cadastrados, você poderá cotar e pedir aqui."
                      />
                    ) : (
                      medications.map(med => (
                        <View style={[styles.card, shadows.sm]} key={`buy-${med.id}`}>
                          <View style={styles.cardHeaderRow}>
                            <Badge
                              label={med.isContinuous ? "USO CONTÍNUO" : "RECEITA DISPONÍVEL"}
                              variant="brand"
                            />
                            <Text style={styles.date}>{when(med.prescriptionDate || null)}</Text>
                          </View>
                          <Text style={styles.cardTitle}>
                            {med.name} {med.dosage ? `· ${med.dosage}` : ""}
                          </Text>
                          <Text style={styles.copy}>{med.instructions}</Text>
                          <Button
                            title="Cotar e pedir pelo WhatsApp da Farmácia"
                            icon={ShoppingBag}
                            onPress={() => orderMedicationPharmacy(med)}
                          />
                        </View>
                      ))
                    )}
                  </>
                )}
              </>
            )}

            {/* ======================================================== */}
            {/* 5. TAB DOCUMENTOS COM SUBDIVISÕES E FLUXO DE EXAMES */}
            {/* ======================================================== */}
            {tab === "Documentos" && (
              <>
                <Text style={styles.heading}>Documentos Médicos</Text>

                {/* Filtros em Pílula para Subdivisões */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsContainer}>
                  {(
                    [
                      ["todos", "Todos"],
                      ["exames", "Exames"],
                      ["receitas", "Receitas"],
                      ["vacinas", "Vacinas"],
                      ["atestados", "Atestados"],
                      ["declaracoes", "Declarações"],
                    ] as const
                  ).map(([filterKey, label]) => {
                    const active = docFilter === filterKey;
                    return (
                      <Pressable
                        key={filterKey}
                        onPress={() => setDocFilter(filterKey)}
                        style={[styles.filterPill, active && styles.filterPillActive]}
                      >
                        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {docFilter === "vacinas" ? (
                  <VaccineWallet activeDependentId={activeDependentId} patientName={name || "Você"} />
                ) : (
                  <>
                    {/* Cartão de Ação Rápida para Conectar com Laboratórios Credenciados */}
                    {(docFilter === "exames" || docFilter === "todos") && (
                      <View style={[styles.examBannerCard, shadows.sm]}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                          <View style={styles.examBannerIconBox}>
                            <FlaskConical size={22} color={colors.teal} />
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={styles.examBannerTitle}>Rede de Laboratórios Parceiros</Text>
                            <Text style={styles.examBannerDesc}>
                              Agende exames laboratoriais e de imagem com descontos exclusivos e atendimento prioritário.
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleOpenExamBooking()}
                          style={({ pressed }) => [
                            styles.examBannerBtn,
                            shadows.sm,
                            { opacity: pressed ? 0.9 : 1 },
                          ]}
                        >
                          <FlaskConical size={18} color="white" />
                          <Text style={styles.examBannerBtnText}>Agendar Exame em Laboratório Parceiro</Text>
                        </Pressable>
                      </View>
                    )}

                    {!filteredDocuments.length ? (
                      <EmptyState
                        icon={FileText}
                        title="Nenhum documento encontrado"
                        description={`Não há documentos na categoria "${docFilter}".`}
                      />
                    ) : (
                      filteredDocuments.map(d => {
                        const isSigned = d.signature_status === "signed";
                        const isExam = String(d.document_type || "").includes("exam") || String(d.title || "").toLowerCase().includes("exame");
                        return (
                          <View style={[styles.card, shadows.sm]} key={String(d.id)}>
                            <View style={styles.cardHeaderRow}>
                              <Badge
                                label={
                                  isExam
                                    ? "SOLICITAÇÃO DE EXAME"
                                    : isSigned
                                    ? "ASSINADO DIGITALMENTE"
                                    : "REGISTRO MEDINEXUS"
                                }
                                variant={isExam ? "external" : isSigned ? "confirmed" : "brand"}
                              />
                              <Text style={styles.date}>{when(String(d.issued_at || ""))}</Text>
                            </View>

                            <Text style={styles.cardTitle}>{String(d.title || "Documento médico")}</Text>

                            {/* Botão dedicado para agendar o exame em laboratório parceiro */}
                            {isExam && (
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => handleOpenExamBooking(String(d.title || "Exame Solicitado"))}
                                style={styles.itemExamActionBtn}
                              >
                                <FlaskConical size={16} color={colors.tealDark} />
                                <Text style={styles.itemExamActionText}>Agendar este exame com desconto</Text>
                                <ChevronRight size={16} color={colors.teal} />
                              </Pressable>
                            )}

                            <Button
                              secondary
                              title="Visualizar documento em PDF"
                              onPress={() =>
                                void open(
                                  isSigned && typeof d.signed_pdf_url === "string"
                                    ? d.signed_pdf_url
                                    : appUrl + `/documentos-medicos/${d.id}`
                                )
                              }
                            />
                          </View>
                        );
                      })
                    )}
                  </>
                )}
              </>
            )}

            {/* TAB PERFIL */}
            {tab === "Perfil" && (
              <>
                <PatientProfile
                  userId={session.user.id}
                  email={session.user.email || ""}
                  onSaved={load}
                  openPlans={() => void open(appUrl + "/perfil")}
                />
                <View style={[styles.card, shadows.sm, { gap: 10, marginTop: 4 }]}>
                  <Text style={styles.sectionHeading}>Acesso à plataforma</Text>
                  <Button secondary title="Rede de profissionais" onPress={() => void open(appUrl + "/profissionais")} />
                  <Button secondary title="Histórico clínico completo" onPress={() => void open(appUrl + "/historico-clinico")} />
                  <Button secondary title="Minhas avaliações" onPress={() => void open(appUrl + "/avaliacoes")} />
                  <Button secondary title="Sair da conta" onPress={() => void supabase.auth.signOut()} />
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL DEDICADO: AGENDAMENTO DE EXAMES & LABORATÓRIOS */}
      {/* ======================================================== */}
      <Modal visible={showExamModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg, { maxHeight: "88%" }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <FlaskConical size={22} color={colors.teal} />
                <Text style={styles.heading}>Laboratórios Credenciados</Text>
              </View>
              <Pressable onPress={() => setShowExamModal(false)} style={styles.closeBtn}>
                <X size={20} color={colors.graphite} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              <Text style={styles.copy}>
                Agende seus exames médicos em laboratórios parceiros da MediNexus com condições especiais e descontos.
              </Text>

              {/* Campo para o nome do exame */}
              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Exame a realizar</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Hemograma completo, Ressonância, Ultrassom..."
                  placeholderTextColor="#9CA3AF"
                  value={examSearchName}
                  onChangeText={setExamSearchName}
                />
              </View>

              <Text style={styles.sectionHeading}>Escolha o laboratório parceiro:</Text>

              {PARTNER_LABS.map(lab => (
                <View key={lab.id} style={[styles.card, shadows.sm]}>
                  <View style={styles.cardHeaderRow}>
                    <Badge label={lab.name} variant="brand" />
                  </View>
                  <Text style={styles.copy}>{lab.description}</Text>
                  <Text style={[styles.copy, { fontSize: 13, color: colors.tealDark, fontWeight: "600" }]}>
                    {lab.discount}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 4 }}>
                    {lab.categories.map(c => (
                      <View key={c} style={styles.examTag}>
                        <Text style={styles.examTagText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => requestPartnerLabAppointment(lab)}
                    style={({ pressed }) => [
                      styles.whatsappBtn,
                      shadows.sm,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <MessageSquare size={18} color="white" />
                    <Text style={styles.whatsappBtnText}>Solicitar agendamento via WhatsApp</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: ADICIONAR REMÉDIO DE USO CONTÍNUO */}
      {/* ======================================================== */}
      <Modal visible={showAddMedModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Pill size={22} color={colors.teal} />
                <Text style={styles.heading}>Novo Medicamento</Text>
              </View>
              <Pressable onPress={() => setShowAddMedModal(false)} style={styles.closeBtn}>
                <X size={20} color={colors.graphite} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
              <Text style={styles.copy}>
                Cadastre medicamentos de uso contínuo para manter controle de estoque e lembretes diários.
              </Text>

              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Nome do medicamento *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Losartana Potássica"
                  placeholderTextColor="#9CA3AF"
                  value={newMedName}
                  onChangeText={setNewMedName}
                />
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Dosagem</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 50mg - 1 comprimido"
                  placeholderTextColor="#9CA3AF"
                  value={newMedDosage}
                  onChangeText={setNewMedDosage}
                />
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Instruções de uso</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Tomar em jejum pela manhã"
                  placeholderTextColor="#9CA3AF"
                  value={newMedInstructions}
                  onChangeText={setNewMedInstructions}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.label}>Horário</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08:00"
                    placeholderTextColor="#9CA3AF"
                    value={newMedSchedule}
                    onChangeText={setNewMedSchedule}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.label}>Estoque (comprimidos)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="30"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={newMedQuantity}
                    onChangeText={setNewMedQuantity}
                  />
                </View>
              </View>

              <Toggle
                label="Medicamento de uso contínuo"
                value={newMedContinuous}
                onChange={setNewMedContinuous}
              />

              <Button title="Salvar Medicamento" onPress={handleSaveManualMedication} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL DE NOTIFICAÇÕES (SININHO COM "MOSTRAR TODAS") */}
      {/* ======================================================== */}
      <Modal visible={showNotifications} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg, { maxHeight: "85%" }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Bell size={22} color={colors.teal} />
                <Text style={styles.heading}>
                  {showAllNotifications ? "Todas as Notificações" : "Notificações Recentes"}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowNotifications(false);
                  setShowAllNotifications(false);
                }}
                style={styles.closeBtn}
              >
                <X size={20} color={colors.graphite} />
              </Pressable>
            </View>

            {/* Filtros dentro de "Mostrar todas" */}
            {showAllNotifications && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
                {(["todas", "remedios", "consultas", "exames"] as const).map(f => (
                  <Pressable
                    key={f}
                    onPress={() => setNotifFilter(f)}
                    style={[styles.filterPill, notifFilter === f && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterPillText, notifFilter === f && styles.filterPillTextActive]}>
                      {f === "todas" ? "Todas" : f === "remedios" ? "Remédios" : f === "consultas" ? "Consultas" : "Exames"}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
              {/* 1. Lembrete de Medicamentos */}
              {(notifFilter === "todas" || notifFilter === "remedios") && medications.length > 0 && (
                <View style={[styles.notifCard, { backgroundColor: colors.lightTeal }]}>
                  <Pill size={20} color={colors.teal} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.notifTitle}>Hora do Remédio</Text>
                    <Text style={styles.notifText}>
                      Lembre-se de tomar seus medicamentos programados para hoje: {medications[0].name}.
                    </Text>
                  </View>
                </View>
              )}

              {/* 2. Lembrete de Consulta Há Muito Tempo */}
              {(notifFilter === "todas" || notifFilter === "consultas") && (
                <View style={[styles.notifCard, { backgroundColor: colors.lightSage }]}>
                  <CalendarDays size={20} color={colors.teal} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.notifTitle}>Check-up Geral Preventivo</Text>
                    <Text style={styles.notifText}>
                      Faz tempo desde seu último check-up completo. Que tal agendar uma consulta preventiva?
                    </Text>
                  </View>
                </View>
              )}

              {/* 3. Lembrete de Exame Expirando */}
              {(notifFilter === "todas" || notifFilter === "exames") && (
                <View style={[styles.notifCard, { backgroundColor: colors.lightPurple }]}>
                  <FlaskConical size={20} color={colors.purple} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.notifTitle}>Validade de Solicitação de Exame</Text>
                    <Text style={styles.notifText}>
                      Suas guias de exames têm validade de 30 dias. Agende no laboratório parceiro para não expirar.
                    </Text>
                  </View>
                </View>
              )}

              {/* 4. Notificação de Consulta Confirmada */}
              {(notifFilter === "todas" || notifFilter === "consultas") &&
                appointments.filter(a => a.status === "confirmed").map(a => (
                  <View key={`notif-${a.id}`} style={[styles.notifCard, { backgroundColor: colors.lightSage }]}>
                    <CheckCircle2 size={20} color={colors.teal} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.notifTitle}>Consulta Confirmada</Text>
                      <Text style={styles.notifText}>
                        Com {String(one(a.doctors)?.name || "médico")} em {when(a.confirmed_start_at)}.
                      </Text>
                    </View>
                  </View>
                ))}

              {/* Notificações Push em Segundo Plano (APNs / Expo Push) */}
              <View style={[styles.notifCard, { backgroundColor: colors.lightSage, borderColor: colors.teal, borderWidth: 1 }]}>
                <Bell size={20} color={colors.teal} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.notifTitle}>Alertas Push em Segundo Plano</Text>
                  <Text style={styles.notifText}>
                    Receba avisos instantâneos 15 minutos antes da consulta e lembretes para tomar remédios.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void (async () => {
                        const perm = await requestNotificationPermission();
                        if (perm.granted) {
                          setPushStatusGranted(true);
                          await sendImmediateNotification(
                            "🔔 MediNexus Conectado",
                            "Seus lembretes em segundo plano no iPhone estão ativos!"
                          );
                          Alert.alert("Sucesso", "Notificação de teste enviada para o seu iPhone.");
                        } else {
                          Alert.alert("Permissão necessária", "Autorize as notificações do MediNexus nos Ajustes do iPhone.");
                        }
                      })();
                    }}
                    style={{ marginTop: 6, alignSelf: "flex-start", backgroundColor: colors.teal, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                  >
                    <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>Testar Notificação Push</Text>
                  </Pressable>
                </View>
              </View>

              {/* Botão de Alternar Mostrar Todas / Voltar */}
              {!showAllNotifications ? (
                <Button
                  secondary
                  title="Mostrar todas as notificações"
                  onPress={() => setShowAllNotifications(true)}
                />
              ) : (
                <Button
                  secondary
                  title="Voltar às mais recentes"
                  onPress={() => setShowAllNotifications(false)}
                />
              )}

              <Button
                title="Fechar"
                onPress={() => {
                  setShowNotifications(false);
                  setShowAllNotifications(false);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL DE AJUDA & FAQ */}
      {/* ======================================================== */}
      <Modal visible={showHelpModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg, { maxHeight: "85%" }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <HelpCircle size={22} color={colors.teal} />
                <Text style={styles.heading}>Ajuda & FAQ</Text>
              </View>
              <Pressable onPress={() => setShowHelpModal(false)} style={styles.closeBtn}>
                <X size={20} color={colors.graphite} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
              <Text style={styles.copy}>
                Tire suas dúvidas ou entre em contato direto com o suporte humano da MediNexus.
              </Text>

              {/* Botão de Suporte WhatsApp */}
              <View style={[styles.card, shadows.sm, { backgroundColor: colors.lightSage, borderColor: colors.teal }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MessageSquare size={22} color={colors.teal} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Suporte via WhatsApp</Text>
                    <Text style={styles.copy}>Fale com nossa equipe de atendimento em horário comercial.</Text>
                  </View>
                </View>
                <Button
                  title="Conversar no WhatsApp"
                  icon={MessageSquare}
                  onPress={() => void open("https://wa.me/5521979828341?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20no%20MediNexus")}
                />
              </View>

              <Text style={styles.sectionHeading}>Perguntas Frequentes:</Text>

              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <Pressable
                    key={item.q}
                    onPress={() => setExpandedFaq(isOpen ? null : idx)}
                    style={[styles.faqCard, shadows.sm]}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={styles.faqQuestion}>{item.q}</Text>
                      <ChevronDown
                        size={18}
                        color={colors.graphiteLight}
                        style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                      />
                    </View>
                    {isOpen && <Text style={styles.faqAnswer}>{item.a}</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL DE AVALIAÇÃO DE CONSULTA (MÉDICO & CONSULTÓRIO) */}
      {/* ======================================================== */}
      <Modal visible={ratingAppointment !== null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Star size={22} color={colors.teal} />
                <Text style={styles.heading}>Avaliar Consulta</Text>
              </View>
              <Pressable onPress={() => setRatingAppointment(null)} style={styles.closeBtn}>
                <X size={20} color={colors.graphite} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              <Text style={styles.copy}>
                Como foi seu atendimento com Dr(a). {String((ratingAppointment ? one(ratingAppointment.doctors) : null)?.name || "Profissional")}?
              </Text>

              {/* Avaliação do Médico */}
              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Avaliação do Médico (Atenção e Clareza)</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Pressable key={star} onPress={() => setDoctorRating(star)}>
                      <Star
                        size={32}
                        color={star <= doctorRating ? "#F59E0B" : colors.border}
                        fill={star <= doctorRating ? "#F59E0B" : "transparent"}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Avaliação da Clínica / Consultório */}
              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Avaliação do Consultório (Pontualidade e Estrutura)</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Pressable key={star} onPress={() => setClinicRating(star)}>
                      <Star
                        size={32}
                        color={star <= clinicRating ? "#F59E0B" : colors.border}
                        fill={star <= clinicRating ? "#F59E0B" : "transparent"}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Comentário opcional</Text>
                <TextInput
                  style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
                  multiline
                  placeholder="Escreva como foi sua experiência..."
                  placeholderTextColor="#9CA3AF"
                  value={reviewComment}
                  onChangeText={setReviewComment}
                />
              </View>

              <Button title="Enviar Avaliação" onPress={() => void handleSubmitReview()} disabled={busy} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL DE REAGENDAMENTO RÁPIDO COM O MÉDICO */}
      {/* ======================================================== */}
      <Modal visible={!!booking} animationType="slide" transparent onRequestClose={() => setBooking(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg, { maxHeight: "85%" }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                {booking?.photoPath ? (
                  <Image
                    source={{ uri: supabase.storage.from("doctor-photos").getPublicUrl(booking.photoPath).data.publicUrl }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                  />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lightSage, alignItems: "center", justifyContent: "center" }}>
                    <Stethoscope size={22} color={colors.teal} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{booking?.name}</Text>
                  <Text style={[styles.copy, { fontSize: 12 }]}>{booking?.clinicName || "Consultório Parceiro"}</Text>
                </View>
              </View>
              <Pressable onPress={() => setBooking(null)} style={styles.closeBtn}>
                <X size={20} color={colors.graphite} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              <Badge label="REAGENDAMENTO RÁPIDO" variant="brand" />
              <Text style={styles.copy}>
                Selecione a especialidade e o horário disponível na agenda do profissional:
              </Text>

              {/* Especialidades do médico */}
              {specialties.length > 1 && (
                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>Especialidade médica:</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {specialties.map(s => (
                      <Pressable
                        key={s.id}
                        onPress={() => void chooseSpecialty(s.id)}
                        style={[styles.filterPill, selectedSpecialty === s.id && styles.filterPillActive]}
                      >
                        <Text style={[styles.filterPillText, selectedSpecialty === s.id && styles.filterPillTextActive]}>
                          {s.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Horários disponíveis */}
              <View style={{ gap: 8 }}>
                <Text style={styles.sectionHeading}>Horários disponíveis:</Text>
                {busy ? (
                  <ActivityIndicator size="small" color={colors.teal} style={{ marginVertical: 16 }} />
                ) : !slots.length ? (
                  <View style={{ padding: 14, backgroundColor: colors.sand, borderRadius: 12 }}>
                    <Text style={[styles.copy, { textAlign: "center" }]}>
                      Não há horários automáticos disponíveis nos próximos 21 dias para este profissional.
                    </Text>
                  </View>
                ) : (
                  slots.map(slot => (
                    <Pressable
                      key={slot.start_at}
                      onPress={() => requestBooking(slot)}
                      style={[styles.slotCard, shadows.sm]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Clock size={16} color={colors.teal} />
                        <Text style={styles.slotTimeText}>{when(slot.start_at)}</Text>
                      </View>
                      <View style={styles.slotBookBtn}>
                        <Text style={styles.slotBookBtnText}>Solicitar</Text>
                        <ChevronRight size={14} color="white" />
                      </View>
                    </Pressable>
                  ))
                )}
              </View>

              <Button secondary title="Voltar" onPress={() => setBooking(null)} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: CENTRAL DE SAÚDE & VÍDEOS EDUCATIVOS */}
      {/* ======================================================== */}
      <Modal visible={showVideoLibrary} animationType="slide" transparent onRequestClose={() => setShowVideoLibrary(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg, { maxHeight: "90%" }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.metricIconBox, { backgroundColor: colors.lightSage }]}>
                  <Play size={20} color={colors.teal} fill={colors.teal} />
                </View>
                <View>
                  <Text style={styles.heading}>Central de Auto-cuidado</Text>
                  <Text style={[styles.copy, { fontSize: 12 }]}>Educação médica com Dr. Drauzio Varella</Text>
                </View>
              </View>
              <Pressable onPress={() => setShowVideoLibrary(false)} style={styles.closeBtn}>
                <X size={20} color={colors.graphite} />
              </Pressable>
            </View>

            {/* Categorias dos vídeos */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
              {(["Todos", "Cardiologia", "Diabetes", "Saúde Mental", "Exames", "Hábitos"] as const).map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setVideoCategory(cat)}
                  style={[styles.filterPill, videoCategory === cat && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, videoCategory === cat && styles.filterPillTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              {(videoCategory === "Todos"
                ? HEALTH_VIDEOS
                : HEALTH_VIDEOS.filter(v => v.category === videoCategory)
              ).map(video => (
                <View key={video.id} style={[styles.videoCard, shadows.sm]}>
                  <Image
                    source={{ uri: `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg` }}
                    style={styles.videoThumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.videoBadgeRow}>
                    <Badge label={video.categoryLabel} variant="brand" />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Clock size={13} color={colors.teal} />
                      <Text style={styles.tutorialDuration}>{video.duration}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{video.title}</Text>
                  <Text style={styles.videoAuthor}>{video.author}</Text>
                  <Text style={styles.copy}>{video.description}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void openYouTubeVideo(video.youtubeId)}
                    style={({ pressed }) => [
                      styles.videoWatchBtn,
                      shadows.sm,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Play size={16} color="white" fill="white" />
                    <Text style={styles.videoWatchBtnText}>Assistir no YouTube</Text>
                  </Pressable>
                </View>
              ))}

              <Button secondary title="Fechar" onPress={() => setShowVideoLibrary(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Telemedicina 1-Clique Nativa */}
      <TelemedicineModal
        visible={telemedicineCallActive}
        appointment={telemedicineAppointment as unknown as Record<string, unknown>}
        onClose={() => setTelemedicineCallActive(false)}
      />

      {/* MediNexus Saúde Conectada - Métricas Preventivas */}
      <HealthMetricsModal
        visible={showHealthMetricsModal}
        patientName={name || "Você"}
        isConnected={isHealthConnected}
        onConnectionChange={setIsHealthConnected}
        onClose={() => setShowHealthMetricsModal(false)}
      />

      {/* Triagem Pré-Consulta com IA */}
      <TriageModal
        visible={showTriageModal}
        onClose={() => setShowTriageModal(false)}
        appointmentId={triageAppointment?.id || ""}
        patientName={name || "Você"}
        doctorName={String(one(triageAppointment?.doctors || null)?.name || "o profissional")}
      />

      {/* Chat Pós-Consulta (7 dias) */}
      <PostConsultationChatModal
        visible={showPostChatModal}
        onClose={() => setShowPostChatModal(false)}
        appointmentId={postChatAppointment?.id || ""}
        patientName={name || "Você"}
        doctorName={String(one(postChatAppointment?.doctors || null)?.name || "Profissional")}
        appointmentDate={postChatAppointment?.confirmed_start_at || postChatAppointment?.requested_start_at || undefined}
      />

      {/* ======================================================== */}
      {/* BARRA DE NAVEGAÇÃO INFERIOR (BOTTOM TABS) */}
      {/* ORDEM: Início, Buscar, Consultas, Remédios e Documentos */}
      {/* ======================================================== */}
      {role === "patient" && (
        <View style={[styles.tabs, shadows.md, { paddingBottom: Math.max(12, insets.bottom) }]}>
          {tabs.map(({ label, icon: Icon }) => {
            const active = tab === label;
            return (
              <Pressable
                key={label}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setTab(label);
                  setMessage("");
                }}
                style={styles.tab}
              >
                <View style={[styles.tabIconWrapper, active && styles.tabIconWrapperActive]}>
                  <Icon size={20} color={active ? colors.teal : colors.graphite} strokeWidth={active ? 2.4 : 1.8} />
                </View>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.sand }}>
        <StatusBar style="dark" />
        <Main />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shortcuts: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  shortcut: {
    flexBasis: "46%",
    flexGrow: 1,
    minHeight: 110,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutLabel: { fontSize: 14, fontWeight: "700", color: colors.graphite },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28, gap: 12 },
  page: { padding: 20, gap: 16, paddingBottom: 36 },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: colors.teal, fontWeight: "700" },
  title: { fontSize: 34, fontWeight: "700", color: colors.graphite, letterSpacing: -1 },
  heading: { fontSize: 24, fontWeight: "700", color: colors.graphite, letterSpacing: -0.4 },
  sectionHeading: { fontSize: 18, fontWeight: "700", color: colors.graphite, letterSpacing: -0.2 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLink: { fontSize: 14, fontWeight: "600", color: colors.teal },
  copy: { fontSize: 14, lineHeight: 21, color: colors.graphiteLight },
  label: { fontSize: 13, fontWeight: "600", color: colors.graphite },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 15,
    fontSize: 15,
    color: colors.graphite,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  iconCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: "white",
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
  },
  avatarImg: { width: 42, height: 42, borderRadius: 21 },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  onboardingBanner: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.lightSage,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  onboardingTitle: { fontSize: 14, fontWeight: "700", color: colors.tealDark },
  onboardingCopy: { fontSize: 12, color: colors.graphite, lineHeight: 17, marginTop: 2 },
  alertBar: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.lightSage,
  },
  alertBarText: { color: colors.tealDark, fontSize: 14, fontWeight: "500" },
  metrics: { flexDirection: "row", gap: 12 },
  metric: {
    flex: 1,
    gap: 6,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
  },
  metricNumber: { fontSize: 32, fontWeight: "700", color: colors.teal },
  metricLabel: { fontSize: 13, color: colors.graphiteLight, fontWeight: "500" },
  card: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
    gap: 10,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardBodyRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  doctorThumb: { width: 56, height: 56, borderRadius: 16 },
  doctorThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.graphite },
  date: { fontSize: 13, fontWeight: "600", color: colors.teal },
  tabs: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, gap: 3, alignItems: "center", justifyContent: "center" },
  tabIconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tabIconWrapperActive: {
    backgroundColor: colors.lightSage,
  },
  tabText: { fontSize: 10, color: colors.graphiteLight, fontWeight: "500" },
  tabTextActive: { color: colors.teal, fontWeight: "700" },

  // Segmented Control (Remédios)
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: colors.lightSage,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.graphite,
  },
  segmentTextActive: {
    color: colors.teal,
    fontWeight: "700",
  },
  addMedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.teal,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addMedBtnText: { color: "white", fontSize: 13, fontWeight: "700" },

  // Contador de Medicamentos
  medCounterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  counterLabel: { fontSize: 12, color: colors.muted },
  counterValue: { fontSize: 15, fontWeight: "700", color: colors.graphite },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
  },

  // Filtros de Documentos
  filterPillsContainer: { gap: 8, paddingVertical: 4 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  filterPillText: { fontSize: 13, fontWeight: "600", color: colors.graphite },
  filterPillTextActive: { color: "white" },

  // Tutoriais de Auto-Cuidado
  tutorialCard: {
    width: 250,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  tutorialBadgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tutorialDuration: { fontSize: 12, fontWeight: "600", color: colors.teal },
  tutorialTitle: { fontSize: 15, fontWeight: "700", color: colors.graphite, lineHeight: 20 },
  tutorialDesc: { fontSize: 12, color: colors.graphiteLight, lineHeight: 17 },
  tutorialLink: { fontSize: 12, fontWeight: "700", color: colors.teal },

  // Toggle de busca regional
  regionalToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionalToggleText: { flex: 1, marginHorizontal: 8, fontSize: 13, fontWeight: "600", color: colors.graphite },

  // Tags de Exames
  examTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.lightSage,
  },
  examTagText: { fontSize: 11, fontWeight: "600", color: colors.tealDark },

  // FAQ
  faqCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  faqQuestion: { fontSize: 14, fontWeight: "700", color: colors.graphite, flex: 1 },
  faqAnswer: { fontSize: 13, lineHeight: 20, color: colors.graphiteLight },

  // Modais
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    maxHeight: "80%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  notifTitle: { fontSize: 14, fontWeight: "700", color: colors.graphite },
  notifText: { fontSize: 13, color: colors.graphiteLight, lineHeight: 18 },

  // Banner da Central de Vídeos & Auto-Cuidado
  videoBannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  videoCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  videoThumbnail: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.sand,
  },
  videoBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoAuthor: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.tealDark,
  },
  videoWatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.teal,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  videoWatchBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },

  // Remédios Banner
  medAddBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  medAddIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
  },
  medAddTitle: { fontSize: 15, fontWeight: "700", color: colors.graphite },
  medAddSubtitle: { fontSize: 12, color: colors.graphiteLight, marginTop: 2 },

  // Banner Exames Documentos
  examBannerCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.lightSage,
    borderWidth: 1,
    borderColor: colors.teal,
    gap: 12,
    marginBottom: 10,
  },
  examBannerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.teal,
  },
  examBannerTitle: { fontSize: 15, fontWeight: "700", color: colors.tealDark },
  examBannerDesc: { fontSize: 12, color: colors.graphite, lineHeight: 17 },
  examBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.teal,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  examBannerBtnText: { color: "white", fontSize: 14, fontWeight: "700" },
  itemExamActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: colors.lightSage,
    borderRadius: 10,
    marginVertical: 4,
  },
  itemExamActionText: { flex: 1, marginHorizontal: 8, fontSize: 12, fontWeight: "600", color: colors.tealDark },

  // Botão WhatsApp Oficial
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 6,
  },
  whatsappBtnText: { color: "white", fontSize: 15, fontWeight: "700" },

  // Rebooking Slots
  slotCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotTimeText: { fontSize: 14, fontWeight: "600", color: colors.graphite },
  slotBookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  slotBookBtnText: { color: "white", fontSize: 12, fontWeight: "700" },
});

