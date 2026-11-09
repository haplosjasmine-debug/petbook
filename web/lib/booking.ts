import { randomBytes } from "crypto";
import { appConfig } from "@/lib/config";
import { listItems } from "@/lib/directus";
import type { Appointment } from "@/lib/types";

export type TimeSlot = {
  value: string;
  label: string;
  available: boolean;
};

export function makeQrCode() {
  return `PB-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function roundToStep(date: Date, stepMinutes = 30) {
  const step = stepMinutes * 60_000;
  return new Date(Math.ceil(date.getTime() / step) * step);
}

export function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && endA > startB;
}

export function humanSlot(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export async function buildSlots(options: {
  shopId: number;
  staffId?: number | null;
  date: string;
  durationMin: number;
  opensAt?: string;
  closesAt?: string;
  stepMin?: number;
}) {
  const {
    shopId,
    staffId,
    date,
    durationMin,
    opensAt = "09:00",
    closesAt = "18:00",
    stepMin = 30,
  } = options;

  const [openHour, openMinute] = opensAt.split(":").map(Number);
  const [closeHour, closeMinute] = closesAt.split(":").map(Number);
  const dayStart = new Date(`${date}T00:00:00+08:00`);
  dayStart.setHours(openHour, openMinute, 0, 0);
  const dayEnd = new Date(`${date}T00:00:00+08:00`);
  dayEnd.setHours(closeHour, closeMinute, 0, 0);

  if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) {
    return [];
  }

  const from = new Date(dayStart.getTime() - 24 * 60 * 60_000).toISOString();
  const to = new Date(dayEnd.getTime() + 24 * 60 * 60_000).toISOString();
  const staffFilter = staffId ? `&filter[staff][_eq]=${staffId}` : "";
  const booked = await listItems<Appointment>(
    "appointments",
    `filter[shop][_eq]=${shopId}${staffFilter}&filter[status][_nin]=cancelled,no_show&filter[start_at][_gte]=${encodeURIComponent(
      from
    )}&filter[start_at][_lte]=${encodeURIComponent(to)}&limit=200&fields=id,start_at,end_at,staff,status`
  );

  const busy = booked.map((appointment) => ({
    start: new Date(appointment.start_at),
    end: new Date(appointment.end_at),
  }));

  const now = new Date();
  const slots: TimeSlot[] = [];
  for (
    let cursor = new Date(dayStart);
    cursor < dayEnd;
    cursor = addMinutes(cursor, stepMin)
  ) {
    const end = addMinutes(cursor, durationMin);
    if (cursor <= now) continue;
    if (end > dayEnd) continue;

    const available = staffId
      ? !busy.some((range) => overlaps(cursor, end, range.start, range.end))
      : true;

    slots.push({
      value: cursor.toISOString(),
      label: humanSlot(cursor),
      available,
    });
  }

  return slots;
}

export function bookingReminderAt(startAt: string) {
  return new Date(new Date(startAt).getTime() - 24 * 60 * 60_000);
}

export function followUpAt(startAt: string) {
  return new Date(new Date(startAt).getTime() + 3 * 24 * 60 * 60_000);
}

export function bookingWindowLabel(startAt: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: appConfig.timezone,
  }).format(new Date(startAt));
}
