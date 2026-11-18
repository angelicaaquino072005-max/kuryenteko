"use client";

import { useState, type ReactNode } from "react";
import { Bell, CircleCheck, Gauge, Info, ScanLine, Wallet } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Notice } from "@/components/Notice";
import { eraseAll, loadDemoData, saveSetup, useStore } from "@/lib/store";
import { fmtPeso, parseNum, toLocalInput } from "@/lib/format";
import type { MeterType, ReminderPlan } from "@/lib/types";

export default function Setup() {
  const { ready } = useStore();
  if (!ready) return <div className="h-96 animate-pulse rounded-3xl bg-line/60" aria-label="Loading" />;
  return <SetupForm />;
}

function SetupForm() {
  const { settings, readings } = useStore();
  const starting = readings.find((r) => r.starting);
  const others = readings.filter((r) => !r.starting);

  const [household, setHousehold] = useState(settings.household);
  const [meterType, setMeterType] = useState<MeterType>(settings.meterType);
  const [startText, setStartText] = useState(starting ? String(starting.value) : "");
  const [startAt, setStartAt] = useState(() => toLocalInput(starting ? new Date(starting.at) : new Date()));
  const [rate, setRate] = useState(String(settings.rate));
  const [fixed, setFixed] = useState(String(settings.fixed));
  const [budget, setBudget] = useState(String(settings.budget));
  const [billingDay, setBillingDay] = useState(String(settings.billingDay));
  const [reminder, setReminder] = useState<ReminderPlan>(settings.reminder);
  const [alertAt, setAlertAt] = useState(String(settings.alertAt));
  const [message, setMessage] = useState<{ level: "ok" | "error"; text: string } | null>(null);

  function onSave() {
    const startValue = parseNum(startText);
    const r = parseNum(rate);
    const f = parseNum(fixed);
    const b = parseNum(budget);
    const a = parseNum(alertAt);
    const startDate = new Date(startAt);

    if (!Number.isFinite(startValue) || startValue < 0) return fail("Enter the reading on your meter today as the starting reading.");
    if (Number.isNaN(startDate.getTime())) return fail("Choose a valid date for the starting reading.");
    if (!Number.isFinite(r) || r <= 0) return fail("Enter your rate per kWh, for example 13.19.");
    if (!Number.isFinite(f) || f < 0) return fail("Enter your fixed charges. Use 0 if you have none.");
    if (!Number.isFinite(b) || b <= 0) return fail("Enter a monthly budget greater than zero.");
    if (!Number.isFinite(a) || a < 1 || a > 100) return fail("Alert level must be between 1 and 100 percent.");
    if (others.length > 0) {
      const earliest = others[0];
      if (startDate.getTime() > new Date(earliest.at).getTime() || startValue > earliest.value) {
        return fail("The starting reading must be earlier and not higher than your other readings. Delete those first, or fix the numbers.");
      }
    }

    saveSetup(
      {
        household: household.trim() || "My household",
        meterType,
        rate: r,
        fixed: f,
        budget: b,
        billingDay: Number(billingDay),
        reminder,
        alertAt: a,
      },
      { value: startValue, at: startDate.toISOString() },
    );
    setMessage({ level: "ok", text: "Setup saved." });
  }

  function fail(text: string) {
    setMessage({ level: "error", text });
  }

  return (
    <>
      <PageHeader
        subtitle="Home setup"
        title="Set up your home"
        actions={
          settings.setupComplete ? (
            <span className="flex items-center gap-2 rounded-full bg-lime-soft px-4 py-2 text-sm font-medium text-olive">
              <CircleCheck className="size-4" /> Setup complete
            </span>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card icon={<Gauge className="size-5" />} title="Meter details" hint="Tell us which meter you use.">
          <Field label="Household name">
            <input value={household} onChange={(e) => setHousehold(e.target.value)} className={inputCls} />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium">Meter type</p>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Meter type">
              {(["digital", "analog"] as MeterType[]).map((t) => (
                <button
                  key={t}
                  role="radio"
                  aria-checked={meterType === t}
                  onClick={() => setMeterType(t)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium ${
                    meterType === t ? "border-lime bg-lime-soft text-olive" : "border-line bg-white text-mute hover:bg-cream"
                  }`}
                >
                  {t === "digital" ? <ScanLine className="size-4" /> : <Gauge className="size-4" />}
                  {t === "digital" ? "Digital" : "Analog"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-mute">
              {meterType === "analog" ? "Dials you read left to right." : "A screen that shows the kWh number."}
            </p>
          </div>

          <Field label="Starting reading (kWh)" hint="The number on your meter right now, or on your last bill's “present” line.">
            <input inputMode="decimal" value={startText} onChange={(e) => setStartText(e.target.value)} placeholder="e.g. 11444" className={inputCls} />
          </Field>
          <Field label="Date of that reading">
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
          </Field>
        </Card>

        <Card icon={<Wallet className="size-5" />} title="Rate and budget" hint="Used to estimate your bill.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rate per kWh (₱)">
              <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Fixed charges per bill (₱)">
              <input inputMode="decimal" value={fixed} onChange={(e) => setFixed(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <p className="flex gap-2 rounded-xl bg-cream px-4 py-3 text-sm text-mute">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Defaults come from one ZAMECO II bill. To match yours: fixed charges are the flat lines such as the
              retail customer charge plus its VAT. Rate = (total due − fixed) ÷ kWh used. Estimates may differ from
              your real bill.
            </span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monthly budget (₱)">
              <input inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Billing cycle starts on day">
              <select value={billingDay} onChange={(e) => setBillingDay(e.target.value)} className={inputCls}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card icon={<Bell className="size-5" />} title="Alerts and reminders" hint="Stay on top of scans and spending.">
          <Field label="Scan schedule">
            <select value={reminder} onChange={(e) => setReminder(e.target.value as ReminderPlan)} className={inputCls}>
              <option value="weekly">Every week</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="off">Off</option>
            </select>
          </Field>
          <Field label="Warn me when I reach (% of budget)">
            <input inputMode="numeric" value={alertAt} onChange={(e) => setAlertAt(e.target.value)} className={inputCls} />
          </Field>
          <p className="text-sm text-mute">Warnings show on your dashboard. Push notifications are not available yet.</p>
        </Card>

        <section className="rounded-3xl border border-line bg-card p-6">
          <h2 className="text-lg font-semibold">Your data</h2>
          <p className="mt-2 text-sm text-mute">
            Readings and settings are saved in this browser on this device. Clearing browser data erases them. Meter
            photos stay here too. When automatic reading is added, the photo will be sent to an AI service to read it.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (readings.length === 0 || confirm("Replace your readings with demo data?")) loadDemoData();
              }}
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-cream"
            >
              Load demo data
            </button>
            <button
              onClick={() => {
                if (confirm("Erase all readings and settings on this device?")) eraseAll();
              }}
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft"
            >
              Erase all data
            </button>
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button onClick={onSave} className="rounded-xl bg-ink px-8 py-3.5 font-semibold text-white hover:bg-ink-soft">
          Save setup
        </button>
        {message && <Notice level={message.level}>{message.text}</Notice>}
        <p className="text-sm text-mute">
          Example: 2 kWh would be estimated at {fmtPeso(2 * (parseNum(rate) || 0) + (parseNum(fixed) || 0))}.
        </p>
      </div>
    </>
  );
}

const inputCls = "w-full rounded-xl border border-line bg-white px-3 py-2.5";

function Card({ icon, title, hint, children }: { icon: ReactNode; title: string; hint: string; children: ReactNode }) {
  return (
    <section className="space-y-5 rounded-3xl border border-line bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-lime-soft text-olive">{icon}</span>
        <div>
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <p className="text-sm text-mute">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <span className="mt-1 block">{children}</span>
      {hint && <span className="mt-1 block text-sm text-mute">{hint}</span>}
    </label>
  );
}