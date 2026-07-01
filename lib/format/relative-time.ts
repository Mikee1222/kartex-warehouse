const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTimeEl(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < MINUTE) return "τώρα";
  if (diffSec < HOUR) {
    const m = Math.floor(diffSec / MINUTE);
    return m === 1 ? "1 λεπτό πριν" : `${m} λεπτά πριν`;
  }
  if (diffSec < DAY) {
    const h = Math.floor(diffSec / HOUR);
    return h === 1 ? "1 ώρα πριν" : `${h} ώρες πριν`;
  }
  const d = Math.floor(diffSec / DAY);
  return d === 1 ? "1 ημέρα πριν" : `${d} ημέρες πριν`;
}
