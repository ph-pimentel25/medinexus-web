import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BIOMETRIC_EMAIL_KEY = "medinexus_bio_email";
const BIOMETRIC_ENABLED_KEY = "medinexus_bio_enabled";

export interface BiometricCapability {
  available: boolean;
  enrolled: boolean;
  biometryType: "FaceID" | "TouchID" | "Biometria" | "Biometria Facial" | "Nenhuma";
  label: string;
}

/**
 * Detecta se o dispositivo possui hardware biométrico configurado e ativo.
 */
export async function checkBiometrics(): Promise<BiometricCapability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometryType: BiometricCapability["biometryType"] = "Biometria";
    let label = "Biometria";

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometryType = Platform.OS === "ios" ? "FaceID" : "Biometria Facial";
      label = Platform.OS === "ios" ? "Face ID" : "Reconhecimento Facial";
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometryType = Platform.OS === "ios" ? "TouchID" : "Biometria";
      label = Platform.OS === "ios" ? "Touch ID" : "Impressão Digital";
    }

    return {
      available: hasHardware && isEnrolled,
      enrolled: isEnrolled,
      biometryType,
      label,
    };
  } catch {
    return {
      available: false,
      enrolled: false,
      biometryType: "Nenhuma",
      label: "Biometria",
    };
  }
}

/**
 * Solicita autenticação biométrica com mensagem personalizada.
 */
export async function authenticateWithBiometrics(promptMessage: string = "Confirme sua identidade"): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Cancelar",
      fallbackLabel: "Usar senha",
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error === "user_cancel" ? "Autenticação cancelada pelo usuário." : "Falha na verificação biométrica.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro desconhecido na biometria.",
    };
  }
}

/**
 * Ativa o login biométrico salvando o e-mail no SecureStore.
 */
export async function enableBiometricLogin(email: string): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
}

/**
 * Desativa o login biométrico.
 */
export async function disableBiometricLogin(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

/**
 * Verifica se o usuário habilitou o login biométrico neste dispositivo.
 */
export async function getBiometricLoginEmail(): Promise<string | null> {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    if (enabled !== "true") return null;
    return await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
  } catch {
    return null;
  }
}
