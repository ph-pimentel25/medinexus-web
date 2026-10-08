// Regras de acesso à sala de telemedicina. Funções puras, sem I/O.

export const JOIN_EARLY_MS = 15 * 60 * 1000;
export const JOIN_LATE_MS = 60 * 60 * 1000;

export type TelemedicineAppointment = {
  status: string | null;
  confirmed_start_at: string | null;
  confirmed_end_at: string | null;
};

export type AccessDecision =
  | { ok: true }
  | { ok: false; reason: "not_confirmed" | "no_schedule" | "too_early" | "too_late" };

export function checkJoinWindow(
  appointment: TelemedicineAppointment,
  now: Date = new Date()
): AccessDecision {
  if (appointment.status !== "confirmed") return { ok: false, reason: "not_confirmed" };
  if (!appointment.confirmed_start_at) return { ok: false, reason: "no_schedule" };
  const start = new Date(appointment.confirmed_start_at).getTime();
  if (Number.isNaN(start)) return { ok: false, reason: "no_schedule" };
  const endRaw = appointment.confirmed_end_at ? new Date(appointment.confirmed_end_at).getTime() : NaN;
  const end = Number.isNaN(endRaw) ? start : endRaw;
  const t = now.getTime();
  if (t < start - JOIN_EARLY_MS) return { ok: false, reason: "too_early" };
  if (t > end + JOIN_LATE_MS) return { ok: false, reason: "too_late" };
  return { ok: true };
}

export function roomNameFor(appointmentId: string): string {
  return `mn-${appointmentId}`;
}

export const ACCESS_MESSAGES: Record<string, string> = {
  not_confirmed: "A consulta ainda não foi confirmada.",
  no_schedule: "A consulta ainda não tem horário confirmado.",
  too_early: "A sala abre 15 minutos antes do horário da consulta.",
  too_late: "O horário desta consulta já passou.",
};
