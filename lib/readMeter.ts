import type { MeterType } from "./types";

export interface ReadResult {
  digits: (number | null)[]; // analog: one entry per dial, left to right
  reading: number | null;
  uncertain: number[]; // 0-based positions the AI was not sure about
  confidence: "high" | "medium" | "low";
  note: string;
}

export async function readMeter(image: string, meterType: MeterType, dials: number): Promise<ReadResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40_000);
  try {
    const res = await fetch("/api/read-meter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, meterType, dials }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : "Could not read the meter.");
    }
    return data as ReadResult;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw new Error("Reading took too long.");
    if (e instanceof TypeError) throw new Error("No internet connection.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}