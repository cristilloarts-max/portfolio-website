/* Which five question IDs run on each day (plan Section 7).
   Day number = days since LAUNCH + 1, counted in Toronto time. */
export const LAUNCH = "2026-11-05";
export const TIMEZONE = "America/Toronto";

export const SCHEDULE = {
  1: [70, 23, 12, 28, 14],   2: [75, 21, 96, 55, 10],   3: [19, 89, 58, 8, 1],
  4: [67, 33, 100, 26, 2],   5: [52, 92, 78, 46, 83],   6: [18, 63, 20, 13, 80],
  7: [5, 29, 44, 87, 38],    8: [25, 59, 39, 30, 32],   9: [60, 84, 31, 49, 37],
  10: [76, 7, 27, 81, 91],   11: [95, 56, 24, 65, 77],  12: [79, 69, 41, 54, 82],
  13: [88, 15, 97, 61, 45],  14: [42, 34, 99, 3, 66],   15: [72, 22, 35, 48, 51],
  16: [94, 86, 47, 73, 4],   17: [17, 50, 93, 57, 68],  18: [90, 62, 53, 36, 74],
  19: [71, 9, 6, 43, 40],    20: [16, 98, 85, 11, 64],
};
export const DAYS = Object.keys(SCHEDULE).length;

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

export function torontoNow(now = new Date()) {
  const p = {};
  for (const x of fmt.formatToParts(now)) p[x.type] = x.value;
  return { date: `${p.year}-${p.month}-${p.day}`, secs: (+p.hour % 24) * 3600 + (+p.minute) * 60 + (+p.second) };
}

const utcOf = d => { const [y, m, dd] = d.split("-").map(Number); return Date.UTC(y, m - 1, dd); };

export function dayNumber(now = new Date()) {
  return Math.round((utcOf(torontoNow(now).date) - utcOf(LAUNCH)) / 864e5) + 1;
}

export function dateOfDay(day) {
  return new Date(utcOf(LAUNCH) + (day - 1) * 864e5).toISOString().slice(0, 10);
}
