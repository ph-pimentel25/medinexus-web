import { colors, shadows } from "./theme";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import { appUrl, supabase } from "./supabase";
import { Button, ui } from "./ui";

export default function AuthScreen({ onCreated, openWeb }: { onCreated: () => void; openWeb: (url: string) => void }) {
  const [registering, setRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage("Informe um e-mail válido.");
      setIsError(true);
      return;
    }
    if (!password || (registering && password.length < 8)) {
      setMessage("Use uma senha com pelo menos 8 caracteres para sua segurança.");
      setIsError(true);
      return;
    }
    if (registering && fullName.trim().length < 2) {
      setMessage("Informe seu nome completo para o cadastro.");
      setIsError(true);
      return;
    }

    setBusy(true);
    setMessage("");
    setIsError(false);

    try {
      if (registering) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: appUrl + "/login",
            data: {
              full_name: fullName.trim(),
              role: "patient",
              medinexus_registration: { version: 1, accountType: "patient", fullName: fullName.trim() },
            },
          },
        });
        if (error) {
          throw new Error(
            error.status === 429
              ? "Muitas tentativas em pouco tempo. Aguarde alguns minutos."
              : error.message || "Não foi possível criar a conta. Confira seus dados."
          );
        }
        setPassword("");
        if (data.session) {
          onCreated();
        } else {
          setRegistering(false);
          setIsError(false);
          setMessage("Conta criada com sucesso! Confira seu e-mail para confirmar seu acesso antes de entrar.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) {
          throw new Error("E-mail ou senha incorretos, ou confirmação pendente no seu e-mail.");
        }
        setPassword("");
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Sem conexão de internet no momento. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.sand }}>
      <ScrollView
        contentContainerStyle={authStyles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={authStyles.brandContainer}>
          <Image source={require("../assets/medinexus.png")} style={authStyles.logo} resizeMode="contain" />
          <Text style={authStyles.eyebrow}>MEDINEXUS</Text>
          <Text style={authStyles.heading}>{registering ? "Crie sua conta de paciente" : "Seu cuidado, sempre conectado"}</Text>
          <Text style={authStyles.subheading}>
            {registering
              ? "Cadastre-se para agendar consultas, acessar documentos e encontrar profissionais na sua região."
              : "Acesse suas consultas, receitas digitais e agendamentos em um só lugar."}
          </Text>
        </View>

        <View style={[authStyles.card, shadows.md]}>
          {registering && (
            <View style={authStyles.field}>
              <Text style={ui.label}>Nome completo</Text>
              <View style={authStyles.inputContainer}>
                <User size={18} color={colors.muted} style={authStyles.inputIcon} />
                <TextInput
                  accessibilityLabel="Nome completo"
                  placeholder="Ex: Maria de Souza"
                  placeholderTextColor="#9CA3AF"
                  autoComplete="name"
                  editable={!busy}
                  style={authStyles.inputWithIcon}
                  value={fullName}
                  onChangeText={setFullName}
                  maxLength={160}
                />
              </View>
            </View>
          )}

          <View style={authStyles.field}>
            <Text style={ui.label}>E-mail</Text>
            <View style={authStyles.inputContainer}>
              <Mail size={18} color={colors.muted} style={authStyles.inputIcon} />
              <TextInput
                accessibilityLabel="E-mail"
                placeholder="seu.email@exemplo.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!busy}
                style={authStyles.inputWithIcon}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={authStyles.field}>
            <Text style={ui.label}>Senha</Text>
            <View style={authStyles.inputContainer}>
              <Lock size={18} color={colors.muted} style={authStyles.inputIcon} />
              <TextInput
                accessibilityLabel="Senha"
                placeholder={registering ? "Mínimo de 8 caracteres" : "Sua senha segura"}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoComplete={registering ? "new-password" : "current-password"}
                editable={!busy}
                style={[authStyles.inputWithIcon, { paddingRight: 44 }]}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Ocultar senha" : "Exibir senha"}
                onPress={() => setShowPassword(!showPassword)}
                style={authStyles.eyeButton}
              >
                {showPassword ? <EyeOff size={19} color={colors.teal} /> : <Eye size={19} color={colors.muted} />}
              </Pressable>
            </View>
          </View>

          {!!message && (
            <View style={[authStyles.alertBox, { backgroundColor: isError ? colors.dangerBg : colors.lightSage }]}>
              <Text style={[authStyles.alertText, { color: isError ? colors.danger : colors.tealDark }]}>
                {message}
              </Text>
            </View>
          )}

          <Button
            title={registering ? "Criar meu cadastro" : "Acessar minha conta"}
            loading={busy}
            disabled={busy}
            onPress={() => void submit()}
          />

          <Button
            secondary
            title={registering ? "Já possuo uma conta" : "Não tem conta? Cadastre-se"}
            disabled={busy}
            onPress={() => {
              setRegistering(!registering);
              setMessage("");
              setPassword("");
            }}
          />

          {!registering && (
            <Pressable
              accessibilityRole="button"
              onPress={() => openWeb(appUrl + "/recuperar-conta")}
              style={authStyles.linkButton}
            >
              <Text style={authStyles.linkText}>Esqueceu sua senha?</Text>
            </Pressable>
          )}

          {registering && (
            <Pressable
              accessibilityRole="button"
              onPress={() => openWeb(appUrl + "/cadastro")}
              style={authStyles.linkButton}
            >
              <Text style={authStyles.linkText}>É médico ou clínica? Cadastre-se na web</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const authStyles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 18,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 12,
  },
  eyebrow: {
    color: colors.teal,
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  heading: {
    color: colors.graphite,
    fontWeight: "700",
    fontSize: 26,
    lineHeight: 32,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 320,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: {
    gap: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
  },
  inputIcon: {
    marginLeft: 14,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.graphite,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    padding: 6,
  },
  alertBox: {
    padding: 14,
    borderRadius: 12,
    marginTop: 2,
  },
  alertText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    color: colors.teal,
    fontSize: 14,
    fontWeight: "600",
  },
});
