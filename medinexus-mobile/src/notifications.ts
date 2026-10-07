import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configura o comportamento ao receber notificações com o app em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationStatus {
  granted: boolean;
  canAskAgain: boolean;
}

/**
 * Solicita ou verifica permissão para notificações push e locais.
 */
export async function requestNotificationPermission(): Promise<NotificationStatus> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Lembretes MediNexus",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#164957",
      });
    }

    return {
      granted: finalStatus === "granted",
      canAskAgain: true,
    };
  } catch {
    return {
      granted: false,
      canAskAgain: false,
    };
  }
}

/**
 * Agenda um lembrete diário para tomar medicamento no horário determinado (HH:mm).
 */
export async function scheduleMedicationReminder(
  medicationName: string,
  timeHHMM: string
): Promise<string | null> {
  try {
    const permission = await requestNotificationPermission();
    if (!permission.granted) return null;

    const [hoursStr, minutesStr] = timeHHMM.split(":");
    const hour = parseInt(hoursStr, 10) || 8;
    const minute = parseInt(minutesStr, 10) || 0;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "💊 Hora do seu medicamento",
        body: `Está na hora de tomar: ${medicationName}. Mantenha seu tratamento em dia.`,
        sound: true,
        data: { type: "medication", name: medicationName, time: timeHHMM },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return id;
  } catch (err) {
    console.warn("Erro ao agendar lembrete de remédio:", err);
    return null;
  }
}

/**
 * Agenda um lembrete de consulta para 15 minutos antes do início previsto.
 */
export async function scheduleAppointmentReminder(
  doctorOrClinic: string,
  startAt: string | Date
): Promise<string | null> {
  try {
    const permission = await requestNotificationPermission();
    if (!permission.granted) return null;

    const appointmentDate = new Date(startAt);
    const fifteenMinutesBefore = new Date(appointmentDate.getTime() - 15 * 60 * 1000);

    if (fifteenMinutesBefore.getTime() <= Date.now()) {
      // Se a consulta for em menos de 15 minutos, envia notificação imediata
      return await sendImmediateNotification(
        "🗓️ Sua consulta está próxima",
        `Seu atendimento com ${doctorOrClinic} começa em instantes!`
      );
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🗓️ Sua consulta começa em 15 minutos",
        body: `Seu atendimento com ${doctorOrClinic} inicia às ${appointmentDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Prepare-se!`,
        sound: true,
        data: { type: "appointment", target: doctorOrClinic },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fifteenMinutesBefore,
      },
    });

    return id;
  } catch (err) {
    console.warn("Erro ao agendar lembrete de consulta:", err);
    return null;
  }
}

/**
 * Envia uma notificação local imediata para teste ou confirmação.
 */
export async function sendImmediateNotification(title: string, body: string): Promise<string | null> {
  try {
    const permission = await requestNotificationPermission();
    if (!permission.granted) return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // dispara imediatamente
    });
  } catch {
    return null;
  }
}
