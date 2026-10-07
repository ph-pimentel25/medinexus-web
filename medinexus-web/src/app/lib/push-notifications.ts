/**
 * Utilitário de notificações Web Push e Alertas em segundo plano para o MediNexus.
 */

export interface WebPushPermissionStatus {
  supported: boolean;
  permission: NotificationPermission;
}

export function checkWebNotificationSupport(): WebPushPermissionStatus {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return {
      supported: false,
      permission: "denied",
    };
  }

  return {
    supported: true,
    permission: Notification.permission,
  };
}

export async function requestWebNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export function sendWebNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  if (Notification.permission !== "granted") {
    return null;
  }

  try {
    return new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  } catch (err) {
    console.warn("Erro ao exibir notificação web:", err);
    return null;
  }
}

/**
 * Agenda lembrete de remédio na web.
 */
export function scheduleWebMedicationReminder(
  medicationName: string,
  timeHHMM: string
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    sendWebNotification("💊 Hora do seu remédio", {
      body: `Horário previsto: ${timeHHMM}. Lembre-se de tomar ${medicationName}.`,
    });
  }
}

/**
 * Agenda lembrete de consulta na web.
 */
export function scheduleWebAppointmentReminder(
  doctorName: string,
  appointmentDate: string
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    sendWebNotification("🗓️ Consulta MediNexus", {
      body: `Sua consulta com ${doctorName} está confirmada para ${new Date(
        appointmentDate
      ).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`,
    });
  }
}
