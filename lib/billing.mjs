import test from "node:test";
import assert from "node:assert/strict";
import { computeConsumption, estimateBill, computeItemized, calibrateSimple } from "../lib/billing.mjs";

// Lines from the ZAMECO II bills of Sept 18 - Oct 19, 2026.
const L = (label, kind, amount, vat = false) => ({ id: label, label, kind, amount, vat });
const ZAMECO = [
  L("Generation", "perKwh", 7.1007),
  L("Transmission", "perKwh", 0.6256),
  L("Transmission 2", "perKwh", 0.6285),
  L("System Loss", "perKwh", 0.8488),
  L("Distribution", "perKwh", 0.5143, true),
  L("Supply", "perKwh", 0.5828, true),
  L("Metering", "perKwh", 0.3669, true),
  L("Retail Customer", "fixed", 5, true),
  L("Surcharge", "fixed", 0, true),
  L("Missionary Electrification", "perKwh", 0.2662),
  L("Environmental", "perKwh", 0.0025),
  L("NPC Stranded Debt", "perKwh", 0.0428),
  L("UCME-REDCI", "perKwh", 0.0101),
  L("Feed-in Tariff", "perKwh", 0.3359),
  L("Generation VAT", "perKwh", 0.6143),
  L("Transmission VAT", "perKwh", 0.1298),
  L("RFSC", "perKwh", 0.2508, true),
  L("Lifeline", "perKwh", 0.01),
  L("Sr. Citizen", "perKwh", 0.0004),
  L("Renewal Energy Cert", "perKwh", 0.0106),
];
const withSurcharge = (amount) => ZAMECO.map((l) => (l.label === "Surcharge" ? { ...l, amount } : l));

test("meter 1223 -> 1257 = 34 kWh", () => {
  assert.equal(computeConsumption(1223, 1257), 34);
});

test("reading lower than the previous one is rejected", () => {
  assert.throws(() => computeConsumption(100, 90));
});

test("real bill #2: 34 kWh = ₱432.11", () => {
  assert.equal(computeItemized(34, ZAMECO, 12).total, 432.11);
});

test("real bill #2: distribution VAT = ₱7.59", () => {
  assert.equal(computeItemized(34, ZAMECO, 12).vat, 7.59);
});

test("real bill #1: 2 kWh with a ₱1.22 surcharge = ₱31.98", () => {
  const r = computeItemized(2, withSurcharge(1.22), 12);
  assert.equal(r.total, 31.98);
  assert.equal(r.vat, 1.15);
});

test("each line is cut down, not rounded", () => {
  const r = computeItemized(34, [L("System loss", "perKwh", 0.8488)], 12);
  assert.equal(r.total, 28.85); // 28.8592 -> 28.85
});

test("0 kWh leaves only the fixed part (₱5.00 + 12% VAT)", () => {
  assert.equal(computeItemized(0, ZAMECO, 12).total, 5.6);
});

test("simple model with calibrated values is close to the 34 kWh bill", () => {
  const bill = estimateBill(34, 12.54, 5.6);
  assert.ok(Math.abs(bill - 432.11) < 1, `got ${bill}`);
});

test("calibrate: one bill, fixed charge assumed", () => {
  assert.deepEqual(calibrateSimple({ kwh: 34, total: 432.11 }, null, 5.6), { rate: 12.5444, fixed: 5.6 });
});

test("calibrate: two bills solve rate and fixed", () => {
  const r = calibrateSimple({ kwh: 10, total: 100 }, { kwh: 110, total: 1100 }, 0);
  assert.deepEqual(r, { rate: 10, fixed: 0 });
});

test("calibrate: two bills with the same kWh give null", () => {
  assert.equal(calibrateSimple({ kwh: 10, total: 100 }, { kwh: 10, total: 120 }, 0), null);
});