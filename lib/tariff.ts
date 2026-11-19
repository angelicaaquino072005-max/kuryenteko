import type { ChargeLine } from "./types";

// Lines from two ZAMECO II billing invoices (Sept 18 - Oct 19, 2026):
//   2 kWh  -> ₱31.98 (with a ₱1.22 surcharge)    34 kWh -> ₱432.11
// Rates change from month to month, so update them from each new bill.
export const ZAMECO_VAT_RATE = 12;

export const ZAMECO_LINES: ChargeLine[] = [
  { id: "gen", label: "Generation System Charge", kind: "perKwh", amount: 7.1007 },
  { id: "trans", label: "Transmission System Charge", kind: "perKwh", amount: 0.6256 },
  { id: "trans2", label: "Transmission Charge (second line)", kind: "perKwh", amount: 0.6285 },
  { id: "sysloss", label: "System Loss Charge", kind: "perKwh", amount: 0.8488 },
  { id: "dist", label: "Distribution System Charge", kind: "perKwh", amount: 0.5143, vat: true },
  { id: "supply", label: "Supply System Charge", kind: "perKwh", amount: 0.5828, vat: true },
  { id: "meter", label: "Metering System Charge", kind: "perKwh", amount: 0.3669, vat: true },
  { id: "retail", label: "Retail Customer Charge", kind: "fixed", amount: 5, vat: true },
  { id: "surcharge", label: "Surcharge (only if your bill has one)", kind: "fixed", amount: 0, vat: true },
  { id: "mec", label: "Missionary Electrification Charge", kind: "perKwh", amount: 0.2662 },
  { id: "env", label: "Environmental Charge", kind: "perKwh", amount: 0.0025 },
  { id: "npcsd", label: "NPC Stranded Debt", kind: "perKwh", amount: 0.0428 },
  { id: "ucme", label: "UCME - REDCI", kind: "perKwh", amount: 0.0101 },
  { id: "fit", label: "Feed-in Tariff Allowance", kind: "perKwh", amount: 0.3359 },
  { id: "genvat", label: "Generation Value Added Tax", kind: "perKwh", amount: 0.6143 },
  { id: "transvat", label: "Transmission Value Added Tax", kind: "perKwh", amount: 0.1298 },
  { id: "rfsc", label: "RFSC", kind: "perKwh", amount: 0.2508, vat: true },
  { id: "lifeline", label: "Lifeline Rate (as printed)", kind: "perKwh", amount: 0.01 },
  { id: "src", label: "Sr. Citizen (as printed)", kind: "perKwh", amount: 0.0004 },
  { id: "rec", label: "Renewal Energy Certificate", kind: "perKwh", amount: 0.0106 },
];