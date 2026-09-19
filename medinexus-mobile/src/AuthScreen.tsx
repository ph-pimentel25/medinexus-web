import { colors } from "./theme";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from "react-native";
import { appUrl, supabase } from "./supabase";
import { Button, ui } from "./ui";

export default function AuthScreen({ onCreated, openWeb }: { onCreated: () => void; openWeb: (url: string) => void }) {
  const [registering, setRegistering] = useState(false), [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { setMessage("Informe um e-mail válido."); return; }
    if (!password || (registering && password.length < 8)) { setMessage("Use uma senha com pelo menos oito caracteres para criar sua conta."); return; }
    if (registering && fullName.trim().length < 2) { setMessage("Informe seu nome completo."); return; }
    setBusy(true); setMessage("");
    try {
      if (registering) {
        const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password, options: {
          emailRedirectTo: appUrl + "/login",
          data: { full_name: fullName.trim(), role: "patient", medinexus_registration: { version: 1, accountType: "patient", fullName: fullName.trim() } },
        } });
        if (error) throw new Error(error.status === 429 ? "Aguarde alguns minutos antes de tentar novamente." : "Não foi possível criar a conta. Confira os dados; se já tiver cadastro, entre com sua senha.");
        setPassword("");
        if (data.session) onCreated();
        else { setRegistering(false); setMessage("Confira seu e-mail para confirmar a conta. Depois, volte ao aplicativo e entre para adicionar sua foto e completar o perfil. Se já tiver cadastro, use sua senha atual."); }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw new Error("E-mail ou senha incorretos, ou conta ainda não confirmada.");
        setPassword("");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sem conexão. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 28, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Image source={require("../assets/medinexus.png")} style={{ width: 80, height: 80, borderRadius: 20 }} />
      <Text style={{ color: colors.teal, letterSpacing: 2, fontSize: 11, fontWeight: "700" }}>SAÚDE CONECTADA</Text>
      <Text style={{ color: colors.graphite, fontWeight: "700", fontSize: 34, lineHeight: 40 }}>{registering ? "Seu cuidado começa aqui." : "Seu cuidado, sempre por perto."}</Text>
      <Text style={ui.copy}>{registering ? "Crie sua conta de paciente. Após confirmar o e-mail, personalize seu perfil com foto e endereço." : "Acesse consultas, documentos e profissionais em um só lugar."}</Text>
      {registering && <TextInput accessibilityLabel="Nome completo" placeholder="Seu nome completo" autoComplete="name" editable={!busy} style={ui.input} value={fullName} onChangeText={setFullName} maxLength={160} />}
      <TextInput accessibilityLabel="E-mail" placeholder="Seu e-mail" autoCapitalize="none" keyboardType="email-address" autoComplete="email" editable={!busy} style={ui.input} value={email} onChangeText={setEmail} />
      <TextInput accessibilityLabel="Senha" placeholder={registering ? "Crie uma senha (mínimo 8 caracteres)" : "Sua senha"} secureTextEntry autoComplete={registering ? "new-password" : "current-password"} editable={!busy} style={ui.input} value={password} onChangeText={setPassword} />
      {!!message && <Text accessibilityRole="alert" style={ui.message}>{message}</Text>}
      <Button title={busy ? "Aguarde…" : registering ? "Criar minha conta" : "Entrar na minha conta"} disabled={busy} onPress={() => void submit()} />
      <Button secondary title={registering ? "Já tenho uma conta" : "Criar meu cadastro"} disabled={busy} onPress={() => { setRegistering(!registering); setMessage(""); setPassword(""); }} />
      {!registering && <Button secondary title="Esqueci minha senha" onPress={()=>openWeb(appUrl+"/recuperar-conta")}/>}
      {registering && <Button secondary title="Cadastrar médico ou clínica" onPress={() => openWeb(appUrl + "/cadastro")} />}
    </ScrollView>
  </KeyboardAvoidingView>;
}
