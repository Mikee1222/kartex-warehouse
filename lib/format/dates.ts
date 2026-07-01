const TZ = "Europe/Athens";

const DAY_NAMES_LONG = [
  "Κυριακή",
  "Δευτέρα",
  "Τρίτη",
  "Τετάρτη",
  "Πέμπτη",
  "Παρασκευή",
  "Σάββατο",
] as const;

const DAY_NAMES_SHORT = ["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ"] as const;

const MONTH_NAMES = [
  "Ιανουαρίου",
  "Φεβρουαρίου",
  "Μαρτίου",
  "Απριλίου",
  "Μαΐου",
  "Ιουνίου",
  "Ιουλίου",
  "Αυγούστου",
  "Σεπτεμβρίου",
  "Οκτωβρίου",
  "Νοεμβρίου",
  "Δεκεμβρίου",
] as const;

function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateOnlyISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayISO(): string {
  return toDateOnlyISO(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseDateOnly(iso);
  d.setDate(d.getDate() + days);
  return toDateOnlyISO(d);
}

export function getWeekRangeISO(anchorISO: string): { start: string; end: string } {
  const d = parseDateOnly(anchorISO);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateOnlyISO(monday), end: toDateOnlyISO(sunday) };
}

export function getWeekDays(anchorISO: string): string[] {
  const { start } = getWeekRangeISO(anchorISO);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
}

export function formatScheduleHeaderDate(iso: string): string {
  const d = parseDateOnly(iso);
  return new Intl.DateTimeFormat("el-GR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDayDivider(iso: string): string {
  const d = parseDateOnly(iso);
  const dayName = DAY_NAMES_LONG[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  return `${dayName} ${day} ${month}`;
}

export function formatDayShort(iso: string): string {
  const d = parseDateOnly(iso);
  return DAY_NAMES_SHORT[d.getDay()];
}

export function formatDayNumber(iso: string): string {
  return String(parseDateOnly(iso).getDate());
}

export function daysFromToday(iso: string): number {
  const today = parseDateOnly(getTodayISO());
  const target = parseDateOnly(iso);
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function formatDaysRemainingBadge(iso: string): string {
  const diff = daysFromToday(iso);
  if (diff === 0) return "Σήμερα";
  if (diff === 1) return "Αύριο";
  if (diff > 1) return `Σε ${diff} μέρες`;
  if (diff === -1) return "Χθες";
  return `${Math.abs(diff)} μέρες πριν`;
}

export function isSameDayISO(a: string | null | undefined, b: string): boolean {
  return Boolean(a && a === b);
}
