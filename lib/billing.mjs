// ₱/kWh (all-in) at fixed na singil kada cycle, tantiya mula sa ZAMECO II bill
export const DEFAULT_RATE = 13.19;
export const DEFAULT_FIXED = 5.6; // ₱5.00 Retail Customer Charge + 12% VAT

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeConsumption(previous, current) {
  const diff = round2(current - previous);
  if (diff < 0) {
    throw new Error("Mas mababa ang bagong reading kaysa sa nakaraan");
  }
  return diff;
}

export function estimateBill(kwh, rate = DEFAULT_RATE, fixed = DEFAULT_FIXED) {
  return round2(kwh * rate + fixed);
}