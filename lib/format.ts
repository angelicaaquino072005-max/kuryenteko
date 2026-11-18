const dateFmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" });
const longFmt = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const monthFmt = new Intl.DateTimeFormat("en-PH", { month: "long" });

export const fmtDate = (d: Date | string) => dateFmt.format(new Date(d));
export const fmtShort = (d: Date | string) => shortFmt.format(new Date(d));
export const fmtTime = (d: Date | string) => timeFmt.format(new Date(d));
export const fmtLong = (d: Date | string) => longFmt.format(new Date(d));
export const fmtMonth = (d: Date | string) => monthFmt.format(new Date(d));

export const fmtKwh = (n: number) => n.toLocaleString("en-PH", { maximumFractionDigits: 1 });
export const fmtReading = (n: number) => n.toLocaleString("en-PH", { maximumFractionDigits: 1 });
export const fmtPeso = (n: number) =>
  "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function parseNum(s: string) {
  const t = s.replace(/,/g, "").trim();
  if (t === "") return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}