import { colors } from "./theme";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as Location from "expo-location";
import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";
import { brazilState, validBirthDate, validCpf } from "./address";
import { Button, Toggle, ui } from "./ui";

type Form = typeof empty;
const empty = { full_name: "", phone: "", cpf: "", birth_date: "", address_zipcode: "", address_street: "", address_number: "", address_complement: "", address_neighborhood: "", address_city: "", address_state: "" };
const fields: [keyof Form, string, string?][] = [
  ["full_name", "Nome completo"], ["phone", "Celular com DDD"], ["cpf", "CPF"], ["birth_date", "Nascimento", "AAAA-MM-DD"],
  ["address_zipcode", "CEP"], ["address_street", "Rua ou avenida"], ["address_number", "Número"],
  ["address_complement", "Complemento (opcional)"], ["address_neighborhood", "Bairro"], ["address_city", "Cidade"], ["address_state", "UF", "Ex.: RJ"],
];
export default function PatientProfile({ userId, email, onSaved, openPlans }: {
  userId: string; email: string; onSaved: () => Promise<void>; openPlans: () => void;
}) {
  const [form, setForm] = useState<Form>(empty);
  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  const [busy, setBusy] = useState(true), [ready, setReady] = useState(false), [message, setMessage] = useState("");
  const [avatar, setAvatar] = useState(""), [avatarPath, setAvatarPath] = useState("");
  const [emailConsent, setEmailConsent] = useState(false), [whatsappConsent, setWhatsappConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false), [privateCare, setPrivateCare] = useState(false), [hasPlan, setHasPlan] = useState(false);
  const load = useCallback(async () => {
    setBusy(true); setReady(false); setMessage("");
    try {
      const [profile, patient, prefs] = await Promise.all([
        supabase.from("profiles").select("full_name,phone,cpf,address_zipcode,address_street,address_number,address_complement,address_neighborhood,address_city,address_state,latitude,longitude,data_usage_consent").eq("id", userId).single(),
        supabase.from("patients").select("birth_date,cpf,accepts_private_consultation,health_plan_operator,health_plan_product_name,health_plan_card_number").eq("id", userId).single(),
        supabase.from("patient_preferences").select("avatar_path,email_consent,whatsapp_consent").eq("patient_id", userId).maybeSingle(),
      ]);
      if (profile.error || patient.error || prefs.error) throw new Error("Não foi possível abrir seu perfil. Tente novamente.");
      const data = { ...profile.data, birth_date: patient.data.birth_date, cpf: profile.data.cpf || patient.data.cpf };
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
      setReady(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Perfil indisponível."); }
    finally { setBusy(false); }
  }, [userId]);
  useEffect(() => { void load(); }, [load]);
  function change(key: keyof Form, value: string) {
    setForm(previous => ({ ...previous, [key]: value }));
    if (key.startsWith("address_")) setCoordinates({ latitude: null, longitude: null });
  }
  async function lookupZip() {
    const zip = form.address_zipcode.replace(/\D/g, "");
    if (zip.length !== 8) { setMessage("Informe os oito dígitos do CEP."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Consulta de CEP indisponível.");
      const data = await response.json();
      if (data.erro) throw new Error("CEP não encontrado. Confira o número ou preencha manualmente.");
      setCoordinates({ latitude: null, longitude: null });
      setForm(previous => ({ ...previous, address_zipcode: zip, address_street: data.logradouro || "", address_neighborhood: data.bairro || "", address_city: data.localidade || "", address_state: brazilState(data.uf), address_number: "", address_complement: "" }));
      setMessage("Endereço localizado. Informe o número e confira os dados antes de salvar.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Preencha o endereço manualmente."); }
    finally { setBusy(false); }
  }
  async function locate() {
    setBusy(true); setMessage("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("Você pode usar o CEP ou preencher seu endereço sem permitir o GPS.");
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("GPS demorou a responder. Tente em um local aberto ou use o CEP.")), 20000)),
      ]);
      const [address] = await Location.reverseGeocodeAsync(position.coords);
      if (!address || address.isoCountryCode?.toUpperCase() !== "BR") throw new Error("Não foi possível identificar um endereço no Brasil. Use o CEP.");
      setForm(previous => ({ ...previous, address_street: address.street || "", address_number: address.streetNumber || "", address_complement: "", address_neighborhood: address.district || "", address_city: address.city || address.subregion || "", address_state: brazilState(address.region), address_zipcode: (address.postalCode || "").replace(/\D/g, "") }));
      setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setMessage(`Endereço preenchido pelo GPS${position.coords.accuracy != null ? ` (margem aproximada de ${Math.round(position.coords.accuracy)} m)` : ""}. Confira se este é seu endereço residencial antes de salvar.`);
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
    if (!/^(?:55)?\d{10,11}$/.test(phone)) { setMessage("Informe um telefone brasileiro com DDD."); return; }
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
      await onSaved(); setMessage("Dados pessoais e endereço atualizados.");
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
      await onSaved(); setMessage("Sua foto foi atualizada.");
    } catch (error) {
      if (newPath && !committed) await supabase.storage.from("patient-avatars").remove([newPath]);
      setMessage(committed ? "Foto salva. Atualize a tela para recarregar." : error instanceof Error ? error.message : "Não foi possível atualizar a foto.");
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
    } catch { setMessage("Não foi possível concluir a remoção. Atualize a tela e tente novamente."); }
    finally { setBusy(false); }
  }
  async function savePreferences() {
    setBusy(true); setMessage("");
    try {
      const saved = await supabase.from("patient_preferences").upsert({ patient_id: userId, email_consent: emailConsent, whatsapp_consent: whatsappConsent, consent_updated_at: new Date().toISOString() }, { onConflict: "patient_id" });
      if (saved.error) throw saved.error;
      setMessage("Preferências salvas. Os avisos serão enviados quando os canais estiverem ativados.");
    } catch { setMessage("Não foi possível salvar suas preferências."); }
    finally { setBusy(false); }
  }
  if (!ready) return <View style={ui.panel}>{busy ? <ActivityIndicator color={colors.teal} /> : <><Text style={ui.message}>{message}</Text><Button title="Tentar novamente" onPress={() => void load()} /></>}</View>;
  return <>
    <View style={ui.panel}><Text style={ui.heading}>Seu perfil, do seu jeito</Text>
      {!!avatar && <Image source={{ uri: avatar }} accessibilityLabel="Sua foto de perfil" style={{ width: 96, height: 96, borderRadius: 48, alignSelf: "center" }} />}
      <Text style={ui.copy}>{email}</Text>
      <Button title="Escolher foto" secondary disabled={busy} onPress={() => void choosePhoto()} />
      {!!avatarPath && <Button title="Remover foto" secondary disabled={busy} onPress={() => void removePhoto()} />}
    </View>
    {!!message && <Text accessibilityRole="alert" style={ui.message}>{message}</Text>}
    <View style={ui.panel}><Text style={ui.heading}>Dados pessoais e endereço</Text>
      {fields.map(([key, label, placeholder]) => <View key={key}><Text style={ui.label}>{label}</Text>
        <TextInput accessibilityLabel={label} editable={!busy} style={ui.input} value={form[key]} placeholder={placeholder || label}
          autoCapitalize={key === "address_state" ? "characters" : "words"} maxLength={key === "address_state" ? 2 : key === "birth_date" ? 10 : 160}
          keyboardType={["phone", "cpf", "address_zipcode"].includes(key) ? "phone-pad" : "default"} onChangeText={value => change(key, value)} />
        {key === "address_zipcode" && <><Button title="Preencher pelo CEP" secondary disabled={busy} onPress={() => void lookupZip()} /><Button title="Usar minha localização atual" secondary disabled={busy} onPress={() => void locate()} /></>}
      </View>)}
      <Toggle label="Aceito atendimento particular" value={privateCare} disabled={busy} onChange={setPrivateCare} />
      <Button title="Gerenciar meu convênio" secondary onPress={openPlans} />
      <Toggle label="Autorizo o uso dos meus dados para cadastro e organização dos atendimentos" value={dataConsent} disabled={busy} onChange={setDataConsent} />
      <Button title={busy ? "Aguarde…" : "Salvar dados e endereço"} disabled={busy} onPress={() => void save()} />
    </View>
    <View style={ui.panel}><Text style={ui.heading}>Confirmações e lembretes</Text>
      <Text style={ui.copy}>Escolha onde deseja receber avisos. Você pode desativar a qualquer momento.</Text>
      <Toggle label="Autorizo avisos pelo WhatsApp cadastrado" value={whatsappConsent} disabled={busy} onChange={setWhatsappConsent} />
      <Toggle label="Autorizo avisos por e-mail" value={emailConsent} disabled={busy} onChange={setEmailConsent} />
      <Button title="Salvar preferências" secondary disabled={busy} onPress={() => void savePreferences()} />
    </View>
  </>;
}
