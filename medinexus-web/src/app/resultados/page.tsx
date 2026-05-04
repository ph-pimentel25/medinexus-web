"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "../components/alert";
import { supabase } from "../lib/supabase";

type SearchPreference = {
  id: string;
  patient_id: string;
  specialty_id: string;
  preferred_start_date: string | null;
  preferred_end_date: string | null;
  max_radius_km: number | null;
  preferred_clinic_id: string | null;
  accepts_private_consultation: boolean | null;
  health_plan_operator: string | null;
  health_plan_product_name: string | null;
  health_plan_accommodation: string | null;
  health_plan_network: string | null;
  health_plan_segment: string | null;
};

type TimeWindow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
};

type ProfileRow = {
  latitude: number | null;
  longitude: number | null;
};

type SpecialtyRow = {
  id: string;
  name: string | null;
};

type RawDoctorSpecialty = {
  doctor_id: string;
  specialty_id: string;
  doctors:
    | {
        id: string;
        name: string | null;
        crm: string | null;
        crm_state: string | null;
        average_consultation_minutes: number | null;
        accepts_private_consultation: boolean | null;
        private_price_cents: number | null;
        clinic_id: string | null;
        clinics:
          | {
              id: string;
              trade_name: string | null;
              city: string | null;
              state: string | null;
              address_city: string | null;
              address_state: string | null;
              address_neighborhood: string | null;
              latitude: number | null;
              longitude: number | null;
              accepts_private_consultation: boolean | null;
              base_private_price_cents: number | null;
            }
          | {
              id: string;
              trade_name: string | null;
              city: string | null;
              state: string | null;
              address_city: string | null;
              address_state: string | null;
              address_neighborhood: string | null;
              latitude: number | null;
              longitude: number | null;
              accepts_private_consultation: boolean | null;
              base_private_price_cents: number | null;
            }[]
          | null;
      }
    | {
        id: string;
        name: string | null;
        crm: string | null;
        crm_state: string | null;
        average_consultation_minutes: number | null;
        accepts_private_consultation: boolean | null;
        private_price_cents: number | null;
        clinic_id: string | null;
        clinics:
          | {
              id: string;
              trade_name: string | null;
              city: string | null;
              state: string | null;
              address_city: string | null;
              address_state: string | null;
              address_neighborhood: string | null;
              latitude: number | null;
              longitude: number | null;
              accepts_private_consultation: boolean | null;
              base_private_price_cents: number | null;
            }
          | {
              id: string;
              trade_name: string | null;
              city: string | null;
              state: string | null;
              address_city: string | null;
              address_state: string | null;
              address_neighborhood: string | null;
              latitude: number | null;
              longitude: number | null;
              accepts_private_consultation: boolean | null;
              base_private_price_cents: number | null;
            }[]
          | null;
      }[]
    | null;
};

type AppointmentRow = {
  doctor_id: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
  requested_start_at: string | null;
  requested_end_at: string | null;
  status: string | null;
};

type DoctorCandidate = {
  doctorId: string;
  doctorName: string;
  crm: string | null;
  crmState: string | null;
  clinicId: string;
  clinicName: string;
  clinicCity: string;
  clinicState: string;
  clinicNeighborhood: string | null;
  distanceKm: number | null;
  durationMinutes: number;
  appointmentMode: "health_plan" | "private";
  privatePriceCents: number | null;
  suggestedStartAt: string | null;
  suggestedEndAt: string | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "Horário a definir";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatMoney(cents: number | null) {
  if (!cents) return "Valor não informado";

  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function calculateDistanceKm(
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null
) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return null;
  }

  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((radius * c).toFixed(2));
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dateOnlyIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function makeDateTime(dateIso: string, time: string) {
  return new Date(`${dateIso}T${time}:00`);
}

function hasOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && endA > startB;
}

function findSuggestedSlot(params: {
  windows: TimeWindow[];
  appointments: AppointmentRow[];
  doctorId: string;
  durationMinutes: number;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = params.preferredStartDate
    ? new Date(`${params.preferredStartDate}T00:00:00`)
    : today;

  const endDate = params.preferredEndDate
    ? new Date(`${params.preferredEndDate}T00:00:00`)
    : new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);

  const doctorAppointments = params.appointments.filter(
    (item) =>
      item.doctor_id === params.doctorId &&
      ["pending", "confirmed"].includes(String(item.status || "")) &&
      (item.confirmed_start_at || item.requested_start_at)
  );

  for (
    let cursor = new Date(startDate);
    cursor <= endDate;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const weekday = cursor.getDay();
    const matchingWindows = params.windows.filter(
      (window) => Number(window.weekday) === weekday
    );

    for (const window of matchingWindows) {
      const windowStart = timeToMinutes(window.start_time.slice(0, 5));
      const windowEnd = timeToMinutes(window.end_time.slice(0, 5));

      for (
        let startMinutes = windowStart;
        startMinutes + params.durationMinutes <= windowEnd;
        startMinutes += params.durationMinutes
      ) {
        const dateIso = dateOnlyIso(cursor);
        const startTime = minutesToTime(startMinutes);
        const endTime = minutesToTime(startMinutes + params.durationMinutes);

        const slotStart = makeDateTime(dateIso, startTime);
        const slotEnd = makeDateTime(dateIso, endTime);

        const isBusy = doctorAppointments.some((appointment) => {
          const busyStartRaw =
            appointment.confirmed_start_at || appointment.requested_start_at;
          const busyEndRaw =
            appointment.confirmed_end_at || appointment.requested_end_at;

          if (!busyStartRaw || !busyEndRaw) return false;

          const busyStart = new Date(busyStartRaw);
          const busyEnd = new Date(busyEndRaw);

          return hasOverlap(slotStart, slotEnd, busyStart, busyEnd);
        });

        if (!isBusy) {
          return {
            startAt: slotStart.toISOString(),
            endAt: slotEnd.toISOString(),
          };
        }
      }
    }
  }

  return {
    startAt: null,
    endAt: null,
  };
}

function ResultadosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchId = searchParams.get("searchId");

  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [searchPreference, setSearchPreference] =
    useState<SearchPreference | null>(null);
  const [specialty, setSpecialty] = useState<SpecialtyRow | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [candidates, setCandidates] = useState<DoctorCandidate[]>([]);

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchId]);

  async function loadResults() {
    setLoading(true);
    setMessage("");

    if (!searchId) {
      setMessage("Busca não encontrada.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para ver os resultados.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const { data: searchData, error: searchError } = await supabase
      .from("patient_search_preferences")
      .select(`
        id,
        patient_id,
        specialty_id,
        preferred_start_date,
        preferred_end_date,
        max_radius_km,
        preferred_clinic_id,
        accepts_private_consultation,
        health_plan_operator,
        health_plan_product_name,
        health_plan_accommodation,
        health_plan_network,
        health_plan_segment
      `)
      .eq("id", searchId)
      .eq("patient_id", user.id)
      .maybeSingle<SearchPreference>();

    if (searchError || !searchData) {
      setMessage(
        `Erro ao carregar busca: ${searchError?.message || "busca não encontrada"}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    const [
      windowsResponse,
      profileResponse,
      specialtyResponse,
      doctorSpecialtiesResponse,
      appointmentsResponse,
    ] = await Promise.all([
      supabase
        .from("patient_search_time_windows")
        .select("id, weekday, start_time, end_time")
        .eq("search_preference_id", searchData.id),

      supabase
        .from("profiles")
        .select("latitude, longitude")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>(),

      supabase
        .from("specialties")
        .select("id, name")
        .eq("id", searchData.specialty_id)
        .maybeSingle<SpecialtyRow>(),

      supabase
        .from("doctor_specialties")
        .select(`
          doctor_id,
          specialty_id,
          doctors (
            id,
            name,
            crm,
            crm_state,
            average_consultation_minutes,
            accepts_private_consultation,
            private_price_cents,
            clinic_id,
            clinics (
              id,
              trade_name,
              city,
              state,
              address_city,
              address_state,
              address_neighborhood,
              latitude,
              longitude,
              accepts_private_consultation,
              base_private_price_cents
            )
          )
        `)
        .eq("specialty_id", searchData.specialty_id),

      supabase
        .from("appointments")
        .select(`
          doctor_id,
          confirmed_start_at,
          confirmed_end_at,
          requested_start_at,
          requested_end_at,
          status
        `)
        .in("status", ["pending", "confirmed"]),
    ]);

    if (windowsResponse.error) {
      setMessage(`Erro ao carregar horários: ${windowsResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (profileResponse.error) {
      setMessage(`Erro ao carregar localização: ${profileResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (specialtyResponse.error) {
      setMessage(`Erro ao carregar especialidade: ${specialtyResponse.error.message}`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (doctorSpecialtiesResponse.error) {
      setMessage(
        `Erro ao buscar médicos compatíveis: ${doctorSpecialtiesResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (appointmentsResponse.error) {
      setMessage(
        `Erro ao carregar agenda dos médicos: ${appointmentsResponse.error.message}`
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    const loadedWindows = (windowsResponse.data || []) as TimeWindow[];
    const loadedProfile = profileResponse.data || null;
    const loadedAppointments = (appointmentsResponse.data ||
      []) as AppointmentRow[];

    const appointmentMode: "health_plan" | "private" =
      searchData.accepts_private_consultation ? "private" : "health_plan";

    const rawRows = (doctorSpecialtiesResponse.data ||
      []) as RawDoctorSpecialty[];

    const normalizedCandidates = rawRows
      .map((row) => {
        const doctor = pickOne(row.doctors);
        const clinic = pickOne(doctor?.clinics);

        if (!doctor || !clinic || !doctor.id || !clinic.id) return null;

        if (searchData.preferred_clinic_id && clinic.id !== searchData.preferred_clinic_id) {
          return null;
        }

        if (appointmentMode === "private") {
          const doctorAcceptsPrivate =
            doctor.accepts_private_consultation !== false;
          const clinicAcceptsPrivate =
            clinic.accepts_private_consultation !== false;

          if (!doctorAcceptsPrivate && !clinicAcceptsPrivate) {
            return null;
          }
        }

        const distanceKm = calculateDistanceKm(
          loadedProfile?.latitude ?? null,
          loadedProfile?.longitude ?? null,
          clinic.latitude ?? null,
          clinic.longitude ?? null
        );

        if (
          !searchData.preferred_clinic_id &&
          searchData.max_radius_km &&
          distanceKm !== null &&
          distanceKm > searchData.max_radius_km
        ) {
          return null;
        }

        if (
          !searchData.preferred_clinic_id &&
          searchData.max_radius_km &&
          distanceKm === null
        ) {
          return null;
        }

        const durationMinutes =
          doctor.average_consultation_minutes && doctor.average_consultation_minutes > 0
            ? doctor.average_consultation_minutes
            : 20;

        const slot = findSuggestedSlot({
          windows: loadedWindows,
          appointments: loadedAppointments,
          doctorId: doctor.id,
          durationMinutes,
          preferredStartDate: searchData.preferred_start_date,
          preferredEndDate: searchData.preferred_end_date,
        });

        if (!slot.startAt || !slot.endAt) return null;

        const privatePrice =
          doctor.private_price_cents || clinic.base_private_price_cents || null;

        const candidate: DoctorCandidate = {
          doctorId: doctor.id,
          doctorName: doctor.name || "Médico não informado",
          crm: doctor.crm,
          crmState: doctor.crm_state,
          clinicId: clinic.id,
          clinicName: clinic.trade_name || "Clínica não informada",
          clinicCity: clinic.address_city || clinic.city || "Cidade não informada",
          clinicState: clinic.address_state || clinic.state || "UF",
          clinicNeighborhood: clinic.address_neighborhood,
          distanceKm,
          durationMinutes,
          appointmentMode,
          privatePriceCents: appointmentMode === "private" ? privatePrice : null,
          suggestedStartAt: slot.startAt,
          suggestedEndAt: slot.endAt,
        };

        return candidate;
      })
      .filter(Boolean) as DoctorCandidate[];

    const sortedCandidates = normalizedCandidates.sort((a, b) => {
      const distanceA = a.distanceKm ?? 99999;
      const distanceB = b.distanceKm ?? 99999;

      if (distanceA !== distanceB) return distanceA - distanceB;

      const timeA = a.suggestedStartAt
        ? new Date(a.suggestedStartAt).getTime()
        : 9999999999999;
      const timeB = b.suggestedStartAt
        ? new Date(b.suggestedStartAt).getTime()
        : 9999999999999;

      return timeA - timeB;
    });

    setSearchPreference(searchData);
setWindows(loadedWindows);
setProfile(loadedProfile);
setSpecialty(specialtyResponse.data || null);
setCandidates(sortedCandidates);
setLoading(false);
  }

  async function handleRequestAppointment(candidate: DoctorCandidate) {
    if (!searchPreference) return;

    setRequestingId(`${candidate.doctorId}-${candidate.clinicId}`);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Você precisa estar logado para solicitar consulta.");
      setMessageType("error");
      setRequestingId(null);
      return;
    }

    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("patient_id", user.id)
      .eq("doctor_id", candidate.doctorId)
      .eq("clinic_id", candidate.clinicId)
      .eq("specialty_id", searchPreference.specialty_id)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (existingAppointment?.id) {
      setMessage(
        "Você já possui uma solicitação ativa para este médico nesta especialidade."
      );
      setMessageType("info");
      setRequestingId(null);
      return;
    }

    const { error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      clinic_id: candidate.clinicId,
      doctor_id: candidate.doctorId,
      specialty_id: searchPreference.specialty_id,
      requested_start_at: candidate.suggestedStartAt,
      requested_end_at: candidate.suggestedEndAt,
      status: "pending",
      appointment_mode: candidate.appointmentMode,
      auto_suggested: true,
      distance_km: candidate.distanceKm,
      appointment_duration_minutes: candidate.durationMinutes,
    });

    if (error) {
      setMessage(`Erro ao solicitar a consulta: ${error.message}`);
      setMessageType("error");
      setRequestingId(null);
      return;
    }

    setMessage("Solicitação enviada com sucesso. Redirecionando...");
    setMessageType("success");

    setTimeout(() => {
      router.push("/solicitacoes");
    }, 900);
  }

  const subtitle = useMemo(() => {
    if (!searchPreference) return "";

    if (searchPreference.preferred_clinic_id) {
      return "Resultados restritos Ã  clínica selecionada.";
    }

    return `Mostrando opções dentro de até ${
      searchPreference.max_radius_km || 10
    } km da sua localização.`;
  }, [searchPreference]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Carregando resultados...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#EAF1F0_0,#F8FAFC_34%,#FFFFFF_100%)]">
      <section className="app-shell py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1B4B58]">
              Resultados
            </p>
            <h1 className="mt-3 app-section-title">
              Opções compatíveis com sua busca
            </h1>
            <p className="app-section-subtitle">
              {subtitle}
            </p>

            {specialty?.name && (
              <p className="mt-3 inline-flex rounded-full bg-[#EAF1F0] px-4 py-2 text-sm font-bold text-[#1B4B58]">
                {specialty.name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/busca" className="app-button-secondary text-center">
              Nova busca
            </Link>
            <Link href="/dashboard" className="app-button-secondary text-center">
              Dashboard
            </Link>
          </div>
        </div>

        {message && (
          <div className="mb-6">
            <Alert variant={messageType}>{message}</Alert>
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="app-card p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Nenhuma opção encontrada
            </h2>
            <p className="mt-3 text-slate-600">
              Não encontramos médicos compatíveis com os filtros atuais. Tente
              aumentar o raio, selecionar consulta particular ou escolher outra
              faixa de horário.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/busca" className="app-button-primary text-center">
                Ajustar busca
              </Link>
              <Link href="/clinicas" className="app-button-secondary text-center">
                Ver clínicas
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {candidates.map((candidate, index) => {
              const requesting =
                requestingId === `${candidate.doctorId}-${candidate.clinicId}`;

              return (
                <article key={`${candidate.doctorId}-${candidate.clinicId}`} className="app-card p-8">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        {index === 0 && (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200">
                            Melhor encaixe
                          </span>
                        )}

                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-200">
                          {candidate.appointmentMode === "private"
                            ? "Particular"
                            : "Plano de saúde"}
                        </span>

                        {candidate.distanceKm !== null && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-600 ring-1 ring-slate-200">
                            {candidate.distanceKm} km
                          </span>
                        )}
                      </div>

                      <h2 className="text-3xl font-black text-slate-950">
                        {candidate.clinicName}
                      </h2>

                      <p className="mt-2 text-slate-600">
                        {candidate.clinicNeighborhood
                          ? `${candidate.clinicNeighborhood} â€¢ `
                          : ""}
                        {candidate.clinicCity} / {candidate.clinicState}
                      </p>

                      <div className="mt-5 rounded-3xl bg-slate-50 p-5">
                        <p className="text-sm font-semibold text-slate-500">
                          Médico
                        </p>
                        <p className="mt-2 text-xl font-black text-slate-950">
                          {candidate.doctorName}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          CRM {candidate.crm || "não informado"}
                          {candidate.crmState ? ` / ${candidate.crmState}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:min-w-[320px]">
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#1B4B58]">
                        Horário sugerido
                      </p>

                      <p className="mt-3 text-2xl font-black text-slate-950">
                        {formatDateTime(candidate.suggestedStartAt)}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        Duração estimada: {candidate.durationMinutes} minutos
                      </p>

                      {candidate.appointmentMode === "private" && (
                        <p className="mt-2 text-sm font-semibold text-[#594E86]">
                          Particular: {formatMoney(candidate.privatePriceCents)}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRequestAppointment(candidate)}
                        disabled={requesting}
                        className="mt-5 w-full rounded-2xl bg-[#1B4B58] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#163F4A] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {requesting ? "Solicitando..." : "Solicitar consulta"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function ResultadosPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-600">Carregando resultados...</p>
        </main>
      }
    >
      <ResultadosPageContent />
    </Suspense>
  );
}


