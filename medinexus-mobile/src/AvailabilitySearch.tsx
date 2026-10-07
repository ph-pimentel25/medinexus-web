import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  MapPin,
  RotateCcw,
  Search,
  Stethoscope,
  X,
  Check,
} from "lucide-react-native";
import { supabase } from "./supabase";
import { Button, Toggle, ui } from "./ui";
import { colors, shadows } from "./theme";
import { TIME_SLOTS_15MIN } from "./address";

export type Match = {
  doctor_id: string;
  doctor_name: string;
  photo_path: string;
  clinic_name: string;
  start_at: string;
  match_kind: string;
  appointment_mode: string;
  coverage: string;
  private_price_cents: number | null;
};

export type RecentDoctor = {
  id: string;
  name: string;
  photoPath?: string | null;
  clinicName?: string;
  clinicId?: string;
  specialtyName?: string;
  specialtyId?: string;
};

const weekdays = [
  { id: 0, label: "Dom" },
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
];

function formatDateDisplay(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "Selecione a data";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const when = (date: string) =>
  new Date(date).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

export default function AvailabilitySearch({
  userId,
  onBooked,
  recentDoctors = [],
  onSearchByRegion,
  onRebookDoctor,
}: {
  userId: string;
  onBooked: () => void;
  recentDoctors?: RecentDoctor[];
  onSearchByRegion?: (specialtyQuery?: string) => void;
  onRebookDoctor?: (doc: RecentDoctor) => void;
}) {
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);
  const [specialty, setSpecialty] = useState("");
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  // Dates default: today to +14 days
  const today = new Date();
  const future = new Date(Date.now() + 14 * 86400000);
  const [start, setStart] = useState(toIsoDate(today));
  const [end, setEnd] = useState(toIsoDate(future));
  const [datePickerTarget, setDatePickerTarget] = useState<"start" | "end" | null>(null);
  const [datePickerValue, setDatePickerValue] = useState<Date>(today);

  // Times default: 08:00 to 18:00 using 15-min intervals
  const [from, setFrom] = useState("08:00");
  const [until, setUntil] = useState("18:00");
  const [timePickerTarget, setTimePickerTarget] = useState<"from" | "until" | null>(null);

  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [radius, setRadius] = useState("50");
  const [privateMode, setPrivateMode] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [searchPrivate, setSearchPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState<Record<string, { nearby?: boolean; private?: boolean }>>({});

  useEffect(() => {
    let alive = true;
    void supabase
      .from("specialties")
      .select("id,name")
      .order("name")
      .then(r => {
        if (alive) {
          setSpecialties(r.data || []);
          if (r.error) setMessage("Não foi possível carregar as especialidades.");
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const selectedSpecialtyObj = specialties.find(s => s.id === specialty);

  function openDatePicker(target: "start" | "end") {
    const current = target === "start" ? start : end;
    if (/^\d{4}-\d{2}-\d{2}$/.test(current)) {
      const [y, m, d] = current.split("-").map(Number);
      setDatePickerValue(new Date(y, m - 1, d));
    } else {
      setDatePickerValue(new Date());
    }
    setDatePickerTarget(target);
  }

  function handleDateChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") {
      setDatePickerTarget(null);
    }
    if (event.type === "set" && selected && datePickerTarget) {
      const iso = toIsoDate(selected);
      if (datePickerTarget === "start") setStart(iso);
      else setEnd(iso);
    }
  }

  async function search() {
    setBusy(true);
    setMessage("");
    setMatches([]);
    setSearchId("");
    setAccepted({});
    setHasSearched(true);
    try {
      if (!specialty) throw new Error("Por favor, selecione a especialidade médica.");
      if (!days.length) throw new Error("Selecione pelo menos um dia da semana que você pode ir.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
        throw new Error("Selecione as datas de início e fim no calendário.");
      }
      if (start > end) {
        throw new Error("A data inicial não pode ser posterior à data final.");
      }
      if (from >= until) {
        throw new Error("O horário de início deve ser anterior ao horário final.");
      }
      if (!Number.isInteger(Number(radius)) || Number(radius) < 1 || Number(radius) > 500) {
        throw new Error("O raio de busca deve ser entre 1 e 500 km.");
      }

      const pref = await supabase
        .from("patient_search_preferences")
        .insert({
          patient_id: userId,
          specialty_id: specialty,
          preferred_start_date: start,
          preferred_end_date: end,
          max_radius_km: Number(radius),
          accepts_private_consultation: privateMode,
        })
        .select("id")
        .single();
      if (pref.error) throw new Error("Não foi possível salvar sua disponibilidade. Confira as datas.");

      const windows = await supabase.from("patient_search_time_windows").insert(
        days.map(weekday => ({
          search_preference_id: pref.data.id,
          weekday,
          start_time: from,
          end_time: until,
        }))
      );
      if (windows.error) throw new Error("Não foi possível salvar os horários.");

      const result = await supabase.rpc("match_patient_availability", { p_search_id: pref.data.id });
      if (result.error) throw new Error(result.error.message);

      setSearchId(pref.data.id);
      setSearchPrivate(privateMode);
      setMatches(result.data || []);
      if (!result.data?.length) {
        setMessage("Nenhum horário encontrado que coincida exatamente com seus dias e horários.");
      } else if (!result.data.some((m: Match) => m.match_kind === "exact")) {
        setMessage("Não há disponibilidade exata nesse período. Estas são as opções mais próximas; confirme se pode comparecer.");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Busca indisponível.");
    } finally {
      setBusy(false);
    }
  }

  async function book(m: Match) {
    setBusy(true);
    const r = await supabase.rpc("request_matched_appointment", {
      p_search_id: searchId,
      p_doctor_id: m.doctor_id,
      p_start_at: m.start_at,
      p_accept_nearby: accepted[m.doctor_id]?.nearby === true,
      p_accept_private: accepted[m.doctor_id]?.private === true,
    });
    if (r.error) {
      setMessage(r.error.message);
    } else {
      setMatches([]);
      onBooked();
    }
    setBusy(false);
  }

  const filteredSpecialties = specialties.filter(s =>
    s.name.toLowerCase().includes(specialtyFilter.toLowerCase())
  );

  return (
    <View style={{ gap: 16 }}>
      {/* Reagendamento / Últimos Médicos Atendidos */}
      {recentDoctors.length > 0 && (
        <View style={[styles.card, shadows.sm]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <RotateCcw size={18} color={colors.teal} />
            <Text style={styles.cardSectionTitle}>Últimos médicos atendidos</Text>
          </View>
          <Text style={[ui.copy, { fontSize: 13 }]}>
            Deseja remarcar com seu médico de costume?
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 4 }}>
            {recentDoctors.map(doc => (
              <Pressable
                key={doc.id}
                onPress={() => {
                  if (onRebookDoctor) {
                    onRebookDoctor(doc);
                  } else if (doc.specialtyId) {
                    setSpecialty(doc.specialtyId);
                  }
                }}
                style={[styles.recentDocChip, shadows.sm]}
              >
                {doc.photoPath ? (
                  <Image
                    source={{ uri: supabase.storage.from("doctor-photos").getPublicUrl(doc.photoPath).data.publicUrl }}
                    style={{ width: 36, height: 36, borderRadius: 18 }}
                  />
                ) : (
                  <View style={styles.recentDocAvatar}>
                    <Stethoscope size={18} color={colors.teal} />
                  </View>
                )}
                <View>
                  <Text style={styles.recentDocName} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={styles.recentDocSpecialty} numberOfLines={1}>
                    {doc.specialtyName || "Profissional"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Título Principal */}
      <View style={{ gap: 4 }}>
        <Text style={styles.heading}>Quando você pode ir à consulta?</Text>
        <Text style={ui.copy}>
          Informe seus dias e horários livres. Vamos encontrar os melhores encaixes automaticamente.
        </Text>
      </View>

      {/* 1. Seleção de Especialidade via Dropdown */}
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Especialidade médica *</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Selecionar especialidade"
          onPress={() => setShowSpecialtyModal(true)}
          style={[styles.dropdownTrigger, shadows.sm]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <Stethoscope size={20} color={selectedSpecialtyObj ? colors.teal : colors.graphiteLight} />
            <Text style={[styles.dropdownText, !selectedSpecialtyObj && { color: colors.muted }]}>
              {selectedSpecialtyObj ? selectedSpecialtyObj.name : "Toque para selecionar a especialidade"}
            </Text>
          </View>
          <ChevronDown size={20} color={colors.graphiteLight} />
        </Pressable>
      </View>

      {/* 2. Seleção de Datas com Calendário Nativo */}
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Período de disponibilidade</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.subLabel}>A partir do dia:</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => openDatePicker("start")}
              style={[styles.dateButton, shadows.sm]}
            >
              <CalendarDays size={18} color={colors.teal} />
              <Text style={styles.dateText}>{formatDateDisplay(start)}</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.subLabel}>Até o dia:</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => openDatePicker("end")}
              style={[styles.dateButton, shadows.sm]}
            >
              <CalendarDays size={18} color={colors.teal} />
              <Text style={styles.dateText}>{formatDateDisplay(end)}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 3. Seleção de Horários (15 em 15 minutos em 24h) */}
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Horário que você pode comparecer</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.subLabel}>A partir das:</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTimePickerTarget("from")}
              style={[styles.dateButton, shadows.sm]}
            >
              <Clock size={18} color={colors.teal} />
              <Text style={styles.dateText}>{from}</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.subLabel}>Até as:</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTimePickerTarget("until")}
              style={[styles.dateButton, shadows.sm]}
            >
              <Clock size={18} color={colors.teal} />
              <Text style={styles.dateText}>{until}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 4. Dias da Semana */}
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Dias da semana preferidos</Text>
        <View style={styles.weekdaysRow}>
          {weekdays.map(w => {
            const active = days.includes(w.id);
            return (
              <Pressable
                key={w.id}
                onPress={() =>
                  setDays(old => (active ? old.filter(d => d !== w.id) : [...old, w.id]))
                }
                style={[styles.weekdayChip, active && styles.weekdayChipActive]}
              >
                <Text style={[styles.weekdayChipText, active && styles.weekdayChipTextActive]}>
                  {w.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 5. Raio de Busca & Convênio */}
      <View style={{ gap: 8 }}>
        <View>
          <Text style={styles.label}>Raio máximo de busca (km)</Text>
          <TextInput
            accessibilityLabel="Raio de busca em quilômetros"
            style={ui.input}
            value={radius}
            onChangeText={setRadius}
            editable={!busy}
            keyboardType="numeric"
            maxLength={3}
            placeholder="50"
          />
        </View>
        <Toggle
          label="Buscar consulta particular (desative para usar meu convênio)"
          value={privateMode}
          disabled={busy}
          onChange={setPrivateMode}
        />
      </View>

      {/* Botão de Encontrar Encaixes */}
      <Button
        title={busy ? "Consultando agendas…" : "Encontrar encaixes na rede"}
        disabled={busy}
        onPress={() => void search()}
      />

      {/* Alerta / Mensagem */}
      {!!message && (
        <View style={[styles.alertBox, shadows.sm]}>
          <Text accessibilityRole="alert" style={styles.alertText}>
            {message}
          </Text>
        </View>
      )}

      {/* Opção Condicional: Buscar por Região se não encontrar horários ou sob demanda */}
      {hasSearched && matches.length === 0 && onSearchByRegion && (
        <View style={[styles.fallbackCard, shadows.sm]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MapPin size={22} color={colors.teal} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fallbackTitle}>Deseja buscar pela região em vez do horário?</Text>
              <Text style={ui.copy}>
                Veja todos os médicos disponíveis na sua cidade e consulte suas agendas completas.
              </Text>
            </View>
          </View>
          <Button
            secondary
            title="Buscar profissionais por região e mapa"
            icon={Search}
            onPress={() => onSearchByRegion(selectedSpecialtyObj?.name)}
          />
        </View>
      )}

      {/* Lista de Resultados Encontrados */}
      {matches.map(m => {
        const alternative = m.match_kind !== "exact";
        const fallback = m.appointment_mode === "private" && !searchPrivate;
        const a = accepted[m.doctor_id] || {};
        return (
          <View key={m.doctor_id} style={[styles.matchCard, shadows.md]}>
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <Image
                accessibilityLabel={`Foto de ${m.doctor_name}`}
                source={{
                  uri: supabase.storage.from("doctor-photos").getPublicUrl(m.photo_path).data.publicUrl,
                }}
                style={{ width: 64, height: 64, borderRadius: 18 }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.cardTitle}>{m.doctor_name}</Text>
                <Text style={ui.copy}>{m.clinic_name}</Text>
                <Text style={[ui.copy, { fontWeight: "700", color: colors.teal }]}>{when(m.start_at)}</Text>
              </View>
            </View>

            <View style={styles.matchBadgeRow}>
              <Text style={styles.badgeText}>
                {alternative ? "Alternativa próxima" : "Dentro da sua disponibilidade"}
              </Text>
              <Text style={[styles.badgeText, { color: colors.graphite }]}>
                {m.appointment_mode === "private"
                  ? `Particular · ${
                      m.private_price_cents ? `R$ ${(m.private_price_cents / 100).toFixed(2)}` : "valor a confirmar"
                    }`
                  : m.coverage === "confirmation_required"
                  ? "Convênio: confirmação necessária"
                  : "Plano aceito"}
              </Text>
            </View>

            {alternative && (
              <Toggle
                label="Posso comparecer neste horário alternativo"
                value={a.nearby === true}
                onChange={v =>
                  setAccepted(old => ({ ...old, [m.doctor_id]: { ...old[m.doctor_id], nearby: v } }))
                }
              />
            )}

            {fallback && (
              <Toggle
                label="Aceito atendimento particular, pois meu plano não consta como aceito"
                value={a.private === true}
                onChange={v =>
                  setAccepted(old => ({ ...old, [m.doctor_id]: { ...old[m.doctor_id], private: v } }))
                }
              />
            )}

            <Button
              title="Solicitar este horário"
              disabled={busy || (alternative && !a.nearby) || (fallback && !a.private)}
              onPress={() => void book(m)}
            />
          </View>
        );
      })}

      {/* Modal Dropdown para Escolher Especialidade */}
      <Modal visible={showSpecialtyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Stethoscope size={22} color={colors.teal} />
                <Text style={styles.modalHeading}>Especialidade Médica</Text>
              </View>
              <Pressable onPress={() => setShowSpecialtyModal(false)} style={styles.closeBtn}>
                <X size={20} color={colors.graphite} />
              </Pressable>
            </View>

            {/* Campo de Busca Rápida de Especialidade */}
            <View style={styles.searchBox}>
              <Search size={18} color={colors.muted} />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: colors.graphite }}
                placeholder="Buscar especialidade (ex: Cardiologia)..."
                placeholderTextColor="#9CA3AF"
                value={specialtyFilter}
                onChangeText={setSpecialtyFilter}
                autoCorrect={false}
              />
              {specialtyFilter.length > 0 && (
                <Pressable onPress={() => setSpecialtyFilter("")}>
                  <X size={16} color={colors.muted} />
                </Pressable>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingVertical: 8 }}>
              {filteredSpecialties.map(s => {
                const isSelected = specialty === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      setSpecialty(s.id);
                      setShowSpecialtyModal(false);
                      setSpecialtyFilter("");
                    }}
                    style={[styles.specialtyOption, isSelected && styles.specialtyOptionSelected]}
                  >
                    <Text style={[styles.specialtyOptionText, isSelected && styles.specialtyOptionTextSelected]}>
                      {s.name}
                    </Text>
                    {isSelected && <Check size={18} color={colors.teal} />}
                  </Pressable>
                );
              })}
              {filteredSpecialties.length === 0 && (
                <Text style={[ui.copy, { textAlign: "center", paddingVertical: 20 }]}>
                  Nenhuma especialidade encontrada para &ldquo;{specialtyFilter}&rdquo;.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal / Pickers de Horários (15 em 15 minutos) */}
      <Modal visible={timePickerTarget !== null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, shadows.lg, { maxHeight: "60%" }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Clock size={20} color={colors.teal} />
                <Text style={styles.modalHeading}>
                  {timePickerTarget === "from" ? "Posso ir a partir de:" : "Posso ficar até:"}
                </Text>
              </View>
              <Pressable onPress={() => setTimePickerTarget(null)} style={styles.closeBtn}>
                <X size={20} color={colors.graphite} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timeGrid}>
              {TIME_SLOTS_15MIN.map(slot => {
                const currentVal = timePickerTarget === "from" ? from : until;
                const isSelected = currentVal === slot;
                return (
                  <Pressable
                    key={slot}
                    onPress={() => {
                      if (timePickerTarget === "from") setFrom(slot);
                      else setUntil(slot);
                      setTimePickerTarget(null);
                    }}
                    style={[styles.timeSlotChip, isSelected && styles.timeSlotChipActive]}
                  >
                    <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextActive]}>
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DateTimePicker Modal para iOS */}
      {Platform.OS === "ios" && datePickerTarget !== null && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, shadows.lg]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeading}>
                  {datePickerTarget === "start" ? "Data inicial" : "Data final"}
                </Text>
                <Pressable onPress={() => setDatePickerTarget(null)} style={styles.closeBtn}>
                  <X size={20} color={colors.graphite} />
                </Pressable>
              </View>
              <DateTimePicker
                value={datePickerValue}
                mode="date"
                display="inline"
                locale="pt-BR"
                onChange={handleDateChange}
              />
              <Button title="Confirmar data" onPress={() => setDatePickerTarget(null)} />
            </View>
          </View>
        </Modal>
      )}

      {/* DateTimePicker nativo no Android */}
      {Platform.OS === "android" && datePickerTarget !== null && (
        <DateTimePicker
          value={datePickerValue}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: "700", color: colors.graphite, letterSpacing: -0.3 },
  cardSectionTitle: { fontSize: 15, fontWeight: "700", color: colors.graphite },
  label: { fontSize: 13, fontWeight: "600", color: colors.graphite },
  subLabel: { fontSize: 12, fontWeight: "500", color: colors.graphiteLight },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.graphite },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: { fontSize: 15, fontWeight: "600", color: colors.graphite },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateText: { fontSize: 14, fontWeight: "600", color: colors.graphite },
  weekdaysRow: { flexDirection: "row", gap: 6, justifyContent: "space-between" },
  weekdayChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekdayChipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  weekdayChipText: { fontSize: 12, fontWeight: "600", color: colors.graphite },
  weekdayChipTextActive: { color: "white" },
  recentDocChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 160,
  },
  recentDocAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
  },
  recentDocName: { fontSize: 13, fontWeight: "700", color: colors.graphite },
  recentDocSpecialty: { fontSize: 11, color: colors.teal, fontWeight: "500" },
  matchCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  matchBadgeRow: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.lightSage,
    gap: 4,
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: colors.tealDark },
  alertBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.lightSage,
  },
  alertText: { color: colors.tealDark, fontSize: 14, fontWeight: "500" },
  fallbackCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.lightTeal,
    borderWidth: 1,
    borderColor: colors.teal,
    gap: 12,
  },
  fallbackTitle: { fontSize: 15, fontWeight: "700", color: colors.tealDark },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeading: { fontSize: 18, fontWeight: "700", color: colors.graphite },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.sand,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  specialtyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  specialtyOptionSelected: {
    backgroundColor: colors.lightSage,
  },
  specialtyOptionText: { fontSize: 15, color: colors.graphite, fontWeight: "500" },
  specialtyOptionTextSelected: { color: colors.teal, fontWeight: "700" },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 8,
  },
  timeSlotChip: {
    flexBasis: "22%",
    flexGrow: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeSlotChipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  timeSlotText: { fontSize: 13, fontWeight: "600", color: colors.graphite },
  timeSlotTextActive: { color: "white" },
});
