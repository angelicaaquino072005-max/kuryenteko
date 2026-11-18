import { estimateBill } from "@/lib/billing.mjs";
import type { Reading, Settings } from "./types";

const DAY = 86_400_000;

export function cycleBounds(now: Date, billingDay: number) {
  const make = (y: number, m: number) => {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(billingDay, daysInMonth));
  };
  let start = make(now.getFullYear(), now.getMonth());
  if (start > now) start = make(now.getFullYear(), now.getMonth() - 1);
  const end = make(start.getFullYear(), start.getMonth() + 1);
  return { start, end, days: Math.round((end.getTime() - start.getTime()) / DAY) };
}

export interface Interval {
  from: Reading;
  to: Reading;
  kwh: number;
  days: number; // at least 1, used for the daily average
  realDays: number; // actual time between the two readings
  perDay: number;
}

export function intervals(readings: Reading[]): Interval[] {
  const out: Interval[] = [];
  for (let i = 1; i < readings.length; i++) {
    const from = readings[i - 1];
    const to = readings[i];
    const kwh = Math.max(0, to.value - from.value);
    const realDays = (new Date(to.at).getTime() - new Date(from.at).getTime()) / DAY;
    const days = Math.max(realDays, 1);
    out.push({ from, to, kwh, days, realDays, perDay: kwh / days });
  }
  return out;
}

export function cycleSummary(readings: Reading[], settings: Settings, now: Date) {
  const cycle = cycleBounds(now, settings.billingDay);
  const latest = readings.length ? readings[readings.length - 1] : null;
  const empty = {
    cycle,
    latest,
    baseline: null as Reading | null,
    hasUsage: false,
    canProject: false,
    kwh: 0,
    perDay: 0,
    projectedKwh: 0,
    billToDate: 0,
    projectedBill: 0,
  };
  if (!latest) return empty;

  let baseline: Reading | null = null;
  for (const r of readings) {
    if (new Date(r.at) <= cycle.start) baseline = r;
  }
  if (!baseline) baseline = readings[0];

  const elapsedDays = (new Date(latest.at).getTime() - new Date(baseline.at).getTime()) / DAY;
  if (latest.id === baseline.id || elapsedDays <= 0) return { ...empty, baseline };

  const kwh = Math.max(0, latest.value - baseline.value);
  // A forecast from less than 3 days of readings is mostly noise, so do not show one.
  const canProject = elapsedDays >= 3;
  const perDay = kwh / Math.max(elapsedDays, 1);
  const projectedKwh = canProject ? perDay * cycle.days : 0;
  return {
    cycle,
    latest,
    baseline,
    hasUsage: true,
    canProject,
    kwh,
    perDay,
    projectedKwh,
    billToDate: estimateBill(kwh, settings.rate, settings.fixed) as number,
    projectedBill: canProject ? (estimateBill(projectedKwh, settings.rate, settings.fixed) as number) : 0,
  };
}