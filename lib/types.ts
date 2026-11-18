export type MeterType = "digital" | "analog";
export type ReminderPlan = "off" | "weekly" | "biweekly";

export interface Settings {
  household: string;
  meterType: MeterType;
  rate: number; // ₱ per kWh, all-in
  fixed: number; // ₱ fixed charges per bill
  budget: number; // ₱ per billing cycle
  billingDay: number; // 1-31
  reminder: ReminderPlan;
  alertAt: number; // percent of budget
  setupComplete: boolean;
}

export interface Reading {
  id: string;
  at: string; // ISO date-time
  value: number; // kWh on the meter
  source: "scan" | "manual";
  starting?: boolean;
  photo?: string; // small JPEG data URL
}