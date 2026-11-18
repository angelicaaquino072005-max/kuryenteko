import type { Reading } from "./types";

export function downloadCsv(readings: Reading[]) {
  const rows: string[][] = [["date_time", "reading_kwh", "usage_kwh", "source", "has_photo"]];
  readings.forEach((r, i) => {
    rows.push([
      new Date(r.at).toISOString(),
      String(r.value),
      i > 0 ? String(Math.round((r.value - readings[i - 1].value) * 10) / 10) : "",
      r.starting ? "starting" : r.source,
      r.photo ? "yes" : "no",
    ]);
  });
  const csv = rows.map((r) => r.join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kuryenteko-readings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}