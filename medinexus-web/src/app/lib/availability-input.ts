// Mirror the existing RPC's calendar rules, using its Brasilia timezone.
export type SearchWindow = { weekday: string; startTime: string; endTime: string };
export function brazilToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(key => parts.find(p => p.type === key)!.value).join("-");
}
const dayMs = 86400000;
function calendarDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const ms = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? ms : NaN;
}
export function availabilityInputError(start: string, end: string, windows: SearchWindow[], now = new Date()) {
  const today = calendarDay(brazilToday(now));
  const first = start ? calendarDay(start) : today;
  const last = end ? calendarDay(end) : first + 20 * dayMs;
  if (!Number.isFinite(first) || !Number.isFinite(last)) return "Confira as datas informadas.";
  if (first < today || last < today) return "Escolha datas a partir de hoje.";
  if (last < first) return "A data final deve ser igual ou posterior à data inicial.";
  if (last - first > 90 * dayMs || first - today > 365 * dayMs) return "Escolha um período de até 90 dias, começando nos próximos 365 dias.";
  if (!windows.length || windows.some(w => !/^[0-6]$/.test(w.weekday) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(w.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(w.endTime) || w.startTime >= w.endTime)) return "Confira todas as faixas: o horário final deve ser posterior ao inicial.";
  const weekdays = new Set(windows.map(w => Number(w.weekday)));
  for (let day = first; day <= last; day += dayMs) if (weekdays.has(new Date(day).getUTCDay())) return null;
  return "Os dias da semana escolhidos não ocorrem entre essas datas. Ajuste o período ou o dia da semana.";
}
