import type { Service } from "@/lib/types";

export const serviceDayOptions = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
] as const;

export type ServiceDay = (typeof serviceDayOptions)[number]["value"];

export const defaultServiceDays: ServiceDay[] = ["mon", "tue", "wed", "thu", "fri", "sat"];
export const defaultServiceFrom = "09:00";
export const defaultServiceTo = "18:00";

export function normalizeServiceDays(value: unknown): ServiceDay[] {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value.split(",");
    }
  }
  if (!Array.isArray(parsed)) return [];
  const list = parsed as unknown[];
  const valid = serviceDayOptions.map((day) => day.value);
  return [...new Set(list.map((item) => String(item).toLowerCase()).filter((item) => valid.includes(item as ServiceDay)))] as ServiceDay[];
}

export function normalizeServiceImages(value: unknown): string[] {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value.split(/\r?\n|,/);
    }
  }
  if (!Array.isArray(parsed)) return [];
  return (parsed as unknown[]).map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
}

export function serviceDays(service: Pick<Service, "available_days">): ServiceDay[] {
  const days = normalizeServiceDays(service.available_days);
  return days.length ? days : defaultServiceDays;
}

export function serviceWindow(
  service: Pick<Service, "available_from" | "available_to">
): { from: string; to: string } {
  const from = /^\d{2}:\d{2}$/.test(service.available_from ?? "")
    ? service.available_from!
    : defaultServiceFrom;
  const to = /^\d{2}:\d{2}$/.test(service.available_to ?? "")
    ? service.available_to!
    : defaultServiceTo;
  return { from, to };
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
}

export function formatServiceTime(value: string) {
  const minutes = timeToMinutes(value);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatServiceDays(days: ServiceDay[]) {
  if (days.length === 7) return "Every day";
  const indexes = serviceDayOptions
    .map((day, index) => ({ ...day, index }))
    .filter((day) => days.includes(day.value))
    .map((day) => day.index);
  if (!indexes.length) return "No days selected";

  const runs: number[][] = [];
  indexes.forEach((index) => {
    const current = runs[runs.length - 1];
    if (current && index === current[current.length - 1] + 1) current.push(index);
    else runs.push([index]);
  });

  return runs
    .map((run) => {
      if (run.length >= 3) {
        return `${serviceDayOptions[run[0]].label}–${serviceDayOptions[run[run.length - 1]].label}`;
      }
      return run.map((index) => serviceDayOptions[index].label).join(", ");
    })
    .join(", ");
}

export function serviceAvailabilityLabel(
  service: Pick<Service, "available_days" | "available_from" | "available_to">
) {
  const window = serviceWindow(service);
  return `${formatServiceDays(serviceDays(service))} · ${formatServiceTime(
    window.from
  )}–${formatServiceTime(window.to)}`;
}

function dateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: timezone,
  }).formatToParts(date);
  const weekday = (parts.find((part) => part.type === "weekday")?.value ?? "Mon")
    .toLowerCase()
    .slice(0, 3);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return { weekday, minutes: hour * 60 + minute };
}

export function isServiceAvailableAt(
  service: Pick<Service, "available_days" | "available_from" | "available_to">,
  start: Date,
  end: Date,
  timezone = "Asia/Manila"
) {
  const days = serviceDays(service);
  const window = serviceWindow(service);
  const startParts = dateParts(start, timezone);
  const endParts = dateParts(end, timezone);
  return (
    days.includes(startParts.weekday as ServiceDay) &&
    startParts.minutes >= timeToMinutes(window.from) &&
    endParts.minutes <= timeToMinutes(window.to)
  );
}

export function isServiceAvailableOnDate(
  service: Pick<Service, "available_days">,
  date: string,
  timezone = "Asia/Manila"
) {
  const days = serviceDays(service);
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  const weekday = dateParts(parsed, timezone).weekday as ServiceDay;
  return days.includes(weekday);
}
