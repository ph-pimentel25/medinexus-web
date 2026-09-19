type TimeWindow = { weekday: number; start_time: string; end_time: string };
export type AvailabilityWindow = { doctor_id: string; weekday: number | null; day_of_week: number | null; start_time: string; end_time: string; is_active: boolean };
type AppointmentRow = { doctor_id: string | null; status: string | null; requested_start_at: string | null; requested_end_at: string | null; confirmed_start_at: string | null; confirmed_end_at: string | null };

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dateOnlyIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function makeDateTime(dateIso: string, time: string) {
  return new Date(`${dateIso}T${time}:00`);
}

function hasOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && endA > startB;
}

export function findSuggestedSlot(params: {
  windows: TimeWindow[];
  availability: AvailabilityWindow[];
  now?: Date;
  appointments: AppointmentRow[];
  doctorId: string;
  durationMinutes: number;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
}) {
  if (!Number.isFinite(params.durationMinutes) || params.durationMinutes <= 0) return { startAt: null, endAt: null };
  const now = params.now || new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const startDate = params.preferredStartDate
    ? new Date(`${params.preferredStartDate}T00:00:00`)
    : today;
  if (startDate < today) startDate.setTime(today.getTime());

  const endDate = params.preferredEndDate
    ? new Date(`${params.preferredEndDate}T00:00:00`)
    : new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);

  const doctorAppointments = params.appointments.filter(
    (item) =>
      item.doctor_id === params.doctorId &&
      ["pending", "confirmed"].includes(String(item.status || "")) &&
      (item.confirmed_start_at || item.requested_start_at)
  );

  for (
    let cursor = new Date(startDate);
    cursor <= endDate;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const weekday = cursor.getDay();
    const matchingWindows = params.windows.filter(window => Number(window.weekday) === weekday).flatMap(window =>
      params.availability.filter(available => available.is_active && (available.weekday ?? available.day_of_week) === weekday).map(available => ({
        ...window,
        start_time: window.start_time > available.start_time ? window.start_time : available.start_time,
        end_time: window.end_time < available.end_time ? window.end_time : available.end_time,
      }))
    ).filter(window => window.start_time < window.end_time).sort((a, b) => a.start_time.localeCompare(b.start_time));

    for (const window of matchingWindows) {
      const windowStart = timeToMinutes(window.start_time.slice(0, 5));
      const windowEnd = timeToMinutes(window.end_time.slice(0, 5));

      for (
        let startMinutes = windowStart;
        startMinutes + params.durationMinutes <= windowEnd;
        startMinutes += params.durationMinutes
      ) {
        const dateIso = dateOnlyIso(cursor);
        const startTime = minutesToTime(startMinutes);
        const endTime = minutesToTime(startMinutes + params.durationMinutes);

        const slotStart = makeDateTime(dateIso, startTime);
        const slotEnd = makeDateTime(dateIso, endTime);

        if (slotStart <= now) continue;

        const isBusy = doctorAppointments.some((appointment) => {
          const busyStartRaw =
            appointment.confirmed_start_at || appointment.requested_start_at;
          const busyEndRaw =
            appointment.confirmed_end_at || appointment.requested_end_at;

          if (!busyStartRaw || !busyEndRaw) return false;

          const busyStart = new Date(busyStartRaw);
          const busyEnd = new Date(busyEndRaw);

          return hasOverlap(slotStart, slotEnd, busyStart, busyEnd);
        });

        if (!isBusy) {
          return {
            startAt: slotStart.toISOString(),
            endAt: slotEnd.toISOString(),
          };
        }
      }
    }
  }

  return {
    startAt: null,
    endAt: null,
  };
}

