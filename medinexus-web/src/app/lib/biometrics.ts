/**
 * Utilitário de autenticação e assinatura biométrica no navegador (WebAuthn / Passkeys / Windows Hello / Touch ID).
 */

export interface WebBiometricsStatus {
  supported: boolean;
  platformAuthenticator: boolean;
  label: string;
}

export async function checkWebBiometrics(): Promise<WebBiometricsStatus> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return {
      supported: false,
      platformAuthenticator: false,
      label: "Não suportado",
    };
  }

  try {
    const platformAuth =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      supported: true,
      platformAuthenticator: platformAuth,
      label: platformAuth ? "Biometria do Dispositivo (Windows Hello / Touch ID / Face ID)" : "Chave de Segurança FIDO2",
    };
  } catch {
    return {
      supported: false,
      platformAuthenticator: false,
      label: "Não suportado",
    };
  }
}

/**
 * Autentica o usuário com biometria no navegador para confirmar identidade ou assinar documentos clínicos.
 */
export async function authenticateWebBiometrics(
  actionPrompt: string = "Confirme sua identidade via biometria"
): Promise<{ success: boolean; signatureToken?: string; error?: string }> {
  void actionPrompt;
  if (typeof window === "undefined") {
    return { success: false, error: "Ambiente não suporta biometria." };
  }

  const bio = await checkWebBiometrics();
  if (!bio.supported) {
    // Falha fechada: sem autenticador, nunca aprovar.
    return { success: false, error: "Este dispositivo não possui biometria compatível." };
  }

  // Passkey/WebAuthn exige credencial cadastrada e validação do desafio no servidor.
  // Enquanto isso não existir, NÃO emitimos token: um token gerado no navegador não prova nada
  // e permitiria forjar assinatura de receitas e atestados.
  return {
    success: false,
    error: "Assinatura biométrica na web requer cadastro de passkey (em implantação). Use o app no celular.",
  };
}
