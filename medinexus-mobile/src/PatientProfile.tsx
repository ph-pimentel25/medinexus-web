import { colors, shadows } from "./theme";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as Location from "expo-location";
import { decode } from "base64-arraybuffer";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Camera, MapPin, User, Bell, Trash2, ShieldAlert, CalendarDays } from "lucide-react-native";
import { supabase } from "./supabase";
import { brazilState, formatCpf, formatPhone, validBirthDate, validCpf } from "./address";
import { Button, Toggle, ui } from "./ui";

type Form = typeof empty;
const empty = { full_name: "", phone: "", cpf: "", birth_date: "", address_zipcode: "", address_street: "", address_number: "", address_complement: "", address_neighborhood: "", address_city: "", address_state: "" };
const fields: [keyof Form, string, string?][] = [
  ["full_name", "Nome completo"], ["phone", "Celular com DDD"], ["cpf", "CPF"], ["birth_date", "Nascimento", "AAAA-MM-DD"],
  ["address_zipcode", "CEP"], ["address_street", "Rua ou avenida"], ["address_number", "Número"],
  ["address_complement", "Complemento (opcional)"], ["address_neighborhood", "Bairro"], ["address_city", "Cidade"], ["address_state", "UF", "Ex.: RJ"],
];

function formatBrazilianDate(isoDate: string) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export default function PatientProfile({ userId, email, onSaved, openPlans, isNewPatient }: {
  userId: string; email: string; onSaved: () => Promise<void>; openPlans: () => void; isNewPatient?: boolean;
}) {
  const [form, setForm] = useState<Form>(empty);
  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  const [busy, setBusy] = useState(true), [ready, setReady] = useState(false), [message, setMessage] = useState("");
  const [avatar, setAvatar] = useState(""), [avatarPath, setAvatarPath] = useState("");
  const [emailConsent, setEmailConsent] = useState(false), [whatsappConsent, setWhatsappConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false), [privateCare, setPrivateCare] = useState(false), [hasPlan, setHasPlan] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState<Date>(new Date(1995, 0, 1));

  const load = useCallback(async () => {
    setBusy(true); setReady(false); setMessage("");
    try {
      const [profile, patient, prefs] = await Promise.all([
        supabase.from("profiles").select("full_name,phone,cpf,address_zipcode,address_street,address_number,address_complement,address_neighborhood,address_city,address_state,latitude,longitude,data_usage_consent").eq("id", userId).single(),
        supabase.from("patients").select("birth_date,cpf,accepts_private_consultation,health_plan_operator,health_plan_product_name,health_plan_card_number").eq("id", userId).single(),
        supabase.from("patient_preferences").select("avatar_path,email_consent,whatsapp_consent").eq("patient_id", userId).maybeSingle(),
      ]);
      if (profile.error || patient.error || prefs.error) throw new Error("Não foi possível abrir seu perfil. Tente novamente.");
      const rawCpf = profile.data.cpf || patient.data.cpf || "";
      const rawPhone = profile.data.phone || "";
      const rawZip = profile.data.address_zipcode || "";
      const data = {
        ...profile.data,
        birth_date: patient.data.birth_date,
        cpf: formatCpf(rawCpf),
        phone: formatPhone(rawPhone),
        address_zipcode: rawZip.length === 8 ? `${rawZip.slice(0, 5)}-${rawZip.slice(5)}` : rawZip,
      };
      setForm(Object.fromEntries(Object.keys(empty).map(key => [key, String(data[key as keyof typeof data] || "")])) as Form);
      setCoordinates({ latitude: profile.data.latitude, longitude: profile.data.longitude });
      setDataConsent(profile.data.data_usage_consent === true);
      setPrivateCare(patient.data.accepts_private_consultation === true);
      setHasPlan(Boolean(patient.data.health_plan_operator && patient.data.health_plan_product_name && patient.data.health_plan_card_number));
      setEmailConsent(prefs.data?.email_consent === true); setWhatsappConsent(prefs.data?.whatsapp_consent === true);
      setAvatarPath(prefs.data?.avatar_path || "");
      if (prefs.data?.avatar_path) {
        const signed = await supabase.storage.from("patient-avatars").createSignedUrl(prefs.data.avatar_path, 3600);
        setAvatar(signed.data?.signedUrl || "");
      }
      if (patient.data.birth_date && /^\d{4}-\d{2}-\d{2}$/.test(patient.data.birth_date)) {
        const [y, m, d] = patient.data.birth_date.split("-").map(Number);
        setDateValue(new Date(y, m - 1, d));
      }
      setReady(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Perfil indisponível."); }
    finally { setBusy(false); }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  function change(key: keyof Form, value: string) {
    let formatted = value;
    if (key === "cpf") formatted = formatCpf(value);
    else if (key === "phone") formatted = formatPhone(value);
    else if (key === "address_zipcode") {
      const raw = value.replace(/\D/g, "").slice(0, 8);
      formatted = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
    }
    setForm(previous => ({ ...previous, [key]: formatted }));
    if (key.startsWith("address_")) setCoordinates({ latitude: null, longitude: null });
  }

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate && event.type !== "dismissed") {
      setDateValue(selectedDate);
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      change("birth_date", `${y}-${m}-${d}`);
    }
  };

  async function lookupZip() {
    const zip = form.address_zipcode.replace(/\D/g, "");
    if (zip.length !== 8) { setMessage("Informe os 8 dígitos do CEP."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Consulta de CEP indisponível.");
      const data = await response.json();
      if (data.erro) throw new Error("CEP não encontrado. Confira o número ou preencha manualmente.");
      setCoordinates({ latitude: null, longitude: null });
      setForm(previous => ({
        ...previous,
        address_zipcode: `${zip.slice(0, 5)}-${zip.slice(5)}`,
        address_street: data.logradouro || "",
        address_neighborhood: data.bairro || "",
        address_city: data.localidade || "",
        address_state: brazilState(data.uf),
        address_number: "",
        address_complement: "",
      }));
      setMessage("Endereço preenchido pelo CEP. Informe o número residencial antes de salvar.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Preencha o endereço manualmente."); }
    finally { setBusy(false); }
  }

  async function locate() {
    setBusy(true); setMessage("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("Você pode usar o CEP ou preencher seu endereço sem permitir o GPS.");
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("GPS demorou a responder. Tente em um local aberto ou use o CEP.")), 20000)),
      ]);
      const [address] = await Location.reverseGeocodeAsync(position.coords);
      if (!address || address.isoCountryCode?.toUpperCase() !== "BR") throw new Error("Não foi possível identificar um endereço no Brasil. Use o CEP.");
      const zip = (address.postalCode || "").replace(/\D/g, "");
      setForm(previous => ({
        ...previous,
        address_street: address.street || "",
        address_number: address.streetNumber || "",
        address_complement: "",
        address_neighborhood: address.district || "",
        address_city: address.city || address.subregion || "",
        address_state: brazilState(address.region),
        address_zipcode: zip.length === 8 ? `${zip.slice(0, 5)}-${zip.slice(5)}` : zip,
      }));
      setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setMessage(`Endereço localizado com alta precisão${position.coords.accuracy != null ? ` (margem de ~${Math.round(position.coords.accuracy)} m)` : ""}. Confira se este é seu endereço residencial antes de salvar.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Localização indisponível."); }
    finally { setBusy(false); }
  }

  async function save() {
    const missing = fields.filter(([key]) => key !== "address_complement" && !form[key].trim()).map(([, label]) => label);
    if (missing.length) { setMessage("Preencha: " + missing.join(", ") + "."); return; }
    if (!validCpf(form.cpf)) { setMessage("Confira o CPF informado."); return; }
    if (!validBirthDate(form.birth_date)) { setMessage("Informe o nascimento como AAAA-MM-DD, com uma data válida."); return; }
    if (!brazilState(form.address_state) || form.address_zipcode.replace(/\D/g, "").length !== 8) { setMessage("Confira a UF e o CEP do endereço."); return; }
    const phone = form.phone.replace(/\D/g, "");
    if (!/^(?:55)?\d{10,11}$/.test(phone)) { setMessage("Informe um celular com DDD."); return; }
    if (!dataConsent) { setMessage("Leia e confirme a autorização de uso dos dados para concluir seu perfil."); return; }
    if (!privateCare && !hasPlan) { setMessage("Selecione atendimento particular ou cadastre seu convênio na plataforma web."); return; }
    setBusy(true); setMessage(""); let profileSaved = false;
    try {
      const { birth_date, ...profile } = form;
      const saved = await supabase.from("profiles").update({ ...Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, value.trim()])), phone, cpf: form.cpf.replace(/\D/g, ""), address_zipcode: form.address_zipcode.replace(/\D/g, ""), address_state: brazilState(form.address_state), address_country: "Brasil", ...coordinates, data_usage_consent: dataConsent, profile_completed: true }).eq("id", userId).select("id").single();
      if (saved.error) throw saved.error;
      profileSaved = true;
      const patient = await supabase.from("patients").update({ full_name: form.full_name.trim(), phone, cpf: form.cpf.replace(/\D/g, ""), birth_date, accepts_private_consultation: privateCare }).eq("id", userId).select("id").single();
      if (patient.error) throw patient.error;
      await onSaved(); setMessage("Dados pessoais e endereço atualizados com sucesso.");
    } catch { setMessage(profileSaved ? "O endereço foi salvo, mas os dados do paciente não foram concluídos. Toque em salvar novamente para finalizar." : "Não foi possível salvar o perfil. Verifique a conexão e tente novamente."); }
    finally { setBusy(false); }
  }

  async function choosePhoto() {
    setBusy(true); setMessage(""); let newPath = ""; let committed = false;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 1, exif: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      if ((asset.fileSize || 0) > 20 * 1024 * 1024) throw new Error("Escolha uma foto de até 20 MB.");
      const size = Math.min(asset.width, asset.height);
      if (!size) throw new Error("Não foi possível ler essa foto. Escolha outra imagem.");
      const context = ImageManipulator.manipulate(asset.uri);
      context.crop({ originX: Math.floor((asset.width - size) / 2), originY: Math.floor((asset.height - size) / 2), width: size, height: size }).resize({ width: 512, height: 512 });
      const image = await context.renderAsync();
      const jpeg = await image.saveAsync({ format: SaveFormat.JPEG, compress: .88, base64: true });
      if (!jpeg.base64) throw new Error("Não foi possível preparar a foto.");
      newPath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const uploaded = await supabase.storage.from("patient-avatars").upload(newPath, decode(jpeg.base64), { contentType: "image/jpeg" });
      if (uploaded.error) throw new Error("Não foi possível enviar a foto. Tente novamente.");
      const saved = await supabase.from("patient_preferences").upsert({ patient_id: userId, avatar_path: newPath }, { onConflict: "patient_id" });
      if (saved.error) throw new Error("Não foi possível vincular a foto ao seu perfil.");
      committed = true;
      const previous = avatarPath; setAvatarPath(newPath); setAvatar(jpeg.uri);
      if (previous) await supabase.storage.from("patient-avatars").remove([previous]);
      await onSaved(); setMessage("Sua foto de perfil foi atualizada.");
    } catch (error) {
      if (newPath && !committed) await supabase.storage.from("patient-avatars").remove([newPath]);
      setMessage(committed ? "Foto salva." : error instanceof Error ? error.message : "Não foi possível atualizar a foto.");
    } finally { setBusy(false); }
  }

  async function removePhoto() {
    setBusy(true); setMessage("");
    try {
      const saved = await supabase.from("patient_preferences").update({ avatar_path: null }).eq("patient_id", userId).select("patient_id").single();
      if (saved.error) throw saved.error;
      const previous = avatarPath; setAvatarPath(""); setAvatar("");
      await supabase.storage.from("patient-avatars").remove([previous]);
      await onSaved(); setMessage("Foto removida do perfil.");
    } catch { setMessage("Não foi possível concluir a remoção. Tente novamente."); }
    finally { setBusy(false); }
  }

  async function savePreferences() {
    setBusy(true); setMessage("");
    try {
      const saved = await supabase.from("patient_preferences").upsert({ patient_id: userId, email_consent: emailConsent, whatsapp_consent: whatsappConsent, consent_updated_at: new Date().toISOString() }, { onConflict: "patient_id" });
      if (saved.error) throw saved.error;
      setMessage("Preferências de notificação salvas com sucesso.");
    } catch { setMessage("Não foi possível salvar suas preferências."); }
    finally { setBusy(false); }
  }

  function requestAccountDeletion() {
    Alert.alert(
      "Excluir conta e dados",
      "De acordo com as diretrizes de privacidade e LGPD, sua conta de acesso será cancelada. Prontuários e prescrições médicas já emitidos são preservados pelo prazo legal de 20 anos (Resolução CFM 1.821/2007). Deseja prosseguir?",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Confirmar exclusão",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                // Limpar preferências e deslogar usuário
                await supabase.from("patient_preferences").delete().eq("patient_id", userId);
                await supabase.auth.signOut();
                Alert.alert("Solicitação registrada", "Sua sessão foi encerrada e seus dados foram desvinculados.");
              } catch {
                Alert.alert("Erro", "Não foi possível registrar a exclusão. Tente novamente.");
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ]
    );
  }

  if (!ready) {
    return (
      <View style={[ui.panel, shadows.sm]}>
        {busy ? <ActivityIndicator color={colors.teal} /> : (
          <>
            <Text style={ui.message}>{message}</Text>
            <Button title="Tentar novamente" onPress={() => void load()} />
          </>
        )}
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Card da Foto e Identificação */}
      <View style={[ui.panel, shadows.sm]}>
        <View style={profileStyles.avatarHeader}>
          <View style={profileStyles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} accessibilityLabel="Foto de perfil" style={profileStyles.avatarImage} />
            ) : (
              <View style={profileStyles.avatarPlaceholder}>
                <User size={38} color={colors.teal} />
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Alterar foto"
              onPress={() => void choosePhoto()}
              style={profileStyles.cameraButton}
            >
              <Camera size={16} color="white" />
            </Pressable>
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={ui.heading}>{form.full_name || "Seu perfil"}</Text>
            <Text style={ui.copy}>{email}</Text>
            {!!avatarPath && (
              <Pressable onPress={() => void removePhoto()} style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 13, color: colors.danger, fontWeight: "600" }}>Remover foto</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {!!message && (
        <View style={[ui.panel, { backgroundColor: colors.lightSage, borderColor: colors.sage, padding: 14 }]}>
          <Text accessibilityRole="alert" style={{ fontSize: 14, color: colors.tealDark, fontWeight: "500" }}>
            {message}
          </Text>
        </View>
      )}

      {/* Card dos Dados Pessoais */}
      <View style={[ui.panel, shadows.sm]}>
        <View style={profileStyles.sectionTitleRow}>
          <User size={20} color={colors.teal} />
          <Text style={ui.heading}>Dados pessoais</Text>
        </View>

        {fields.slice(0, 3).map(([key, label, placeholder]) => (
          <View key={key}>
            <Text style={ui.label}>{label}</Text>
            <TextInput
              accessibilityLabel={label}
              editable={!busy}
              style={ui.input}
              value={form[key]}
              placeholder={placeholder || label}
              placeholderTextColor="#9CA3AF"
              keyboardType={["phone", "cpf"].includes(key) ? "phone-pad" : "default"}
              onChangeText={value => change(key, value)}
            />
          </View>
        ))}

        {/* Data de Nascimento com Seletor Interativo de Calendário */}
        <View>
          <Text style={ui.label}>Data de nascimento</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Selecionar data de nascimento no calendário"
            disabled={busy}
            onPress={() => setShowDatePicker(true)}
            style={profileStyles.datePickerButton}
          >
            <CalendarDays size={18} color={colors.teal} />
            <Text style={[profileStyles.datePickerText, !form.birth_date && { color: "#9CA3AF" }]}>
              {form.birth_date ? formatBrazilianDate(form.birth_date) : "Toque para escolher no calendário"}
            </Text>
          </Pressable>
        </View>

        {showDatePicker && Platform.OS === "ios" && (
          <Modal transparent animationType="fade" visible={showDatePicker}>
            <View style={profileStyles.modalOverlay}>
              <View style={[profileStyles.modalContent, shadows.lg]}>
                <View style={profileStyles.modalHeader}>
                  <Text style={ui.heading}>Data de nascimento</Text>
                  <Pressable onPress={() => setShowDatePicker(false)} style={profileStyles.modalDoneButton}>
                    <Text style={profileStyles.modalDoneText}>Confirmar</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={onDateChange}
                  textColor={colors.graphite}
                  locale="pt-BR"
                />
              </View>
            </View>
          </Modal>
        )}

        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="default"
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={onDateChange}
          />
        )}
      </View>

      {/* Card do Endereço Residencial */}
      <View style={[ui.panel, shadows.sm]}>
        <View style={profileStyles.sectionTitleRow}>
          <MapPin size={20} color={colors.teal} />
          <Text style={ui.heading}>Endereço residencial</Text>
        </View>

        <View>
          <Text style={ui.label}>CEP</Text>
          <TextInput
            accessibilityLabel="CEP"
            editable={!busy}
            style={ui.input}
            value={form.address_zipcode}
            placeholder="00000-000"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={9}
            onChangeText={value => change("address_zipcode", value)}
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Button title="Buscar CEP" secondary disabled={busy} onPress={() => void lookupZip()} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Usar GPS" secondary disabled={busy} onPress={() => void locate()} />
            </View>
          </View>
        </View>

        {fields.slice(5).map(([key, label, placeholder]) => (
          <View key={key}>
            <Text style={ui.label}>{label}</Text>
            <TextInput
              accessibilityLabel={label}
              editable={!busy}
              style={ui.input}
              value={form[key]}
              placeholder={placeholder || label}
              placeholderTextColor="#9CA3AF"
              autoCapitalize={key === "address_state" ? "characters" : "words"}
              maxLength={key === "address_state" ? 2 : 160}
              onChangeText={value => change(key, value)}
            />
          </View>
        ))}

        <Toggle label="Aceito consultas particulares" value={privateCare} disabled={busy} onChange={setPrivateCare} />
        <Button title="Gerenciar convênios na web" secondary onPress={openPlans} />
        <Toggle
          label="Autorizo o uso dos meus dados para organização dos atendimentos"
          value={dataConsent}
          disabled={busy}
          onChange={setDataConsent}
        />

        <Button
          title={busy ? "Salvando..." : "Salvar dados e endereço"}
          disabled={busy}
          loading={busy}
          onPress={() => void save()}
        />
      </View>

      {/* Card de Notificações e Avisos */}
      <View style={[ui.panel, shadows.sm]}>
        <View style={profileStyles.sectionTitleRow}>
          <Bell size={20} color={colors.teal} />
          <Text style={ui.heading}>Lembretes e avisos</Text>
        </View>
        <Text style={ui.copy}>
          Receba lembretes de consultas marcadas diretamente no seu WhatsApp e e-mail.
        </Text>
        <Toggle
          label="Avisos pelo WhatsApp cadastrado"
          value={whatsappConsent}
          disabled={busy}
          onChange={setWhatsappConsent}
        />
        <Toggle
          label="Avisos por e-mail"
          value={emailConsent}
          disabled={busy}
          onChange={setEmailConsent}
        />
        <Button title="Salvar preferências de avisos" secondary disabled={busy} onPress={() => void savePreferences()} />
      </View>

      {/* Card de Privacidade e Exclusão de Conta (Obrigatório Apple/Google) */}
      <View style={[ui.panel, shadows.sm, { borderColor: "#F7C5C2" }]}>
        <View style={profileStyles.sectionTitleRow}>
          <ShieldAlert size={20} color={colors.danger} />
          <Text style={[ui.heading, { color: colors.danger }]}>Privacidade da conta</Text>
        </View>
        <Text style={ui.copy}>
          Você tem total controle sobre seus dados. Caso não queira mais utilizar a MediNexus, solicite a exclusão de sua conta.
        </Text>
        <Button
          danger
          title="Excluir minha conta e dados"
          icon={Trash2}
          disabled={busy}
          onPress={requestAccountDeletion}
        />
      </View>
    </View>
  );
}

const profileStyles = StyleSheet.create({
  avatarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lightSage,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  cameraButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.teal,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 15,
    backgroundColor: "white",
  },
  datePickerText: {
    fontSize: 15,
    color: colors.graphite,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalDoneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalDoneText: {
    color: colors.teal,
    fontWeight: "700",
    fontSize: 16,
  },
});
