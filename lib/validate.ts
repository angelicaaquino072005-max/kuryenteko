import type { Reading } from "./types";

const DAY = 86_400_000;
const MAX_KWH_PER_DAY = 60;

export interface Check {
  level: "ok" | "warn" | "error";
  message: string;
  previous: Reading | null;
  consumption: number | null;
}

export function checkReading(readings: Reading[], atISO: string, value: number): Check {
  if (!Number.isFinite(value)) {
    return { level: "error", message: "Enter the reading shown on your meter.", previous: null, consumption: null };
  }
  const at = new Date(atISO).getTime();
  if (!Number.isFinite(at)) {
    return { level: "error", message: "Choose a valid date and time.", previous: null, consumption: null };
  }

  let previous: Reading | null = null;
  let next: Reading | null = null;
  for (const r of readings) {
    const t = new Date(r.at).getTime();
    if (t <= at) previous = r;
    else if (!next) next = r;
  }

  if (!previous) {
    return { level: "ok", message: "This will be your first reading.", previous: null, consumption: null };
  }
  if (value < previous.value) {
    return {
      level: "error",
      message: `Lower than your previous reading (${previous.value.toLocaleString("en-PH")} kWh). Check each digit and the date.`,
      previous,
      consumption: null,
    };
  }
  if (next && value > next.value) {
    return {
      level: "error",
      message: `Higher than a later reading (${next.value.toLocaleString("en-PH")} kWh). Check the date.`,
      previous,
      consumption: null,
    };
  }

  const consumption = Math.round((value - previous.value) * 10) / 10;
  const days = Math.max((at - new Date(previous.at).getTime()) / DAY, 1);
  if (consumption / days > MAX_KWH_PER_DAY) {
    return {
      level: "warn",
      message: `That is a big jump: ${consumption} kWh in ${Math.round(days)} day${Math.round(days) === 1 ? "" : "s"}. Double-check the digits before saving.`,
      previous,
      consumption,
    };
  }
  return { level: "ok", message: "Looks normal compared with your previous reading.", previous, consumption };
}