"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, ChevronRight, Gauge, Wallet } from "lucide-react";
import { ActionButtons, PageHeader } from "@/components/PageHeader";
import { UsageChart } from "@/components/UsageChart";
import { useUI } from "@/components/ui-context";
import { useStore } from "@/lib/store";
import { cycleSummary, intervals } from "@/lib/stats";
import { fmtDate, fmtKwh, fmtLong, fmtMonth, fmtPeso, fmtReading, fmtShort, fmtTime, greeting } from "@/lib/format";

export default function Dashboard() {
  const { ready } = useStore();
  if (!ready) return <div className="h-96 animate-pulse rounded-3xl bg-line/60" aria-label="Loading" />;
  return <DashboardView />;
}

function DashboardView() {
  const { settings, readings } = useStore();
  const { openManual, openScan } = useUI();
  const [now] = useState(() => new Date());

  const s = useMemo(() => cycleSummary(readings, settings, now), [readings, settings, now]);
 const series = useMemo(() => intervals(readings).filter((i) => i.realDays >= 1), [readings]);
  const recent = [...readings].reverse().slice(0, 4);

  const pct = settings.budget > 0 ? Math.round((s.billToDate / settings.budget) * 100) : 0;
  const budgetState = pct >= 100 ? "Over budget" : pct >= settings.alertAt ? "Near your limit" : "Within budget";
  const budgetNote =
    pct >= 100
      ? "Your estimated bill has passed your budget for this cycle."
      : pct >= settings.alertAt
        ? "You have passed your alert level. Consider cutting back before the cycle ends."
        : "There is still time to adjust before the billing cycle ends.";

  const reminderDays = settings.reminder === "weekly" ? 7 : settings.reminder === "biweekly" ? 14 : 0;
  const nextScan = s.latest && reminderDays ? new Date(new Date(s.latest.at).getTime() + reminderDays * 86_400_000) : null;
  const cycleLastDay = new Date(s.cycle.end.getTime() - 86_400_000);

  return (
    <>
      <PageHeader
        subtitle={fmtLong(now)}
        title={`${greeting(now.getHours())}.`}
        actions={<ActionButtons onManual={openManual} onScan={openScan} />}
      />

      {!settings.setupComplete && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-lime-soft p-6">
          <div>
            <h2 className="text-lg font-semibold">Set up your home first</h2>
            <p className="mt-1 max-w-xl text-sm text-olive">
              Tell KuryenteKo your meter type, starting reading, rate and budget. It takes about a minute and makes
              your bill estimate accurate.
            </p>
          </div>
          <Link href="/setup" className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink-soft">
            Start setup
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Usage hero */}
        <section className="rounded-3xl bg-ink p-6 text-white sm:p-8 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/70">{fmtMonth(s.cycle.start)} billing cycle</p>
              <h2 className="mt-1 text-xl font-light">Usage this cycle</h2>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-lime">
              {fmtPeso(settings.rate)} per kWh + {fmtPeso(settings.fixed)} fixed
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm text-white/70">Consumption so far</p>
              {s.hasUsage ? (
                <p className="text-6xl font-semibold tracking-tight">
                  {fmtKwh(s.kwh)}
                  <span className="ml-2 text-xl font-normal text-white/60">kWh</span>
                </p>
              ) : (
                <p className="mt-2 max-w-xs text-lg text-white/80">
                  {s.latest
                    ? "Add another reading to see how much you have used."
                    : "No readings yet. Scan your meter to begin."}
                </p>
              )}
            </div>
            {s.latest && (
              <div className="grid size-32 place-items-center rounded-full border border-dashed border-white/30 text-center">
                <div>
                  <p className="text-xs text-white/70">Meter now</p>
                  <p className="text-2xl font-semibold text-lime">{fmtReading(s.latest.value)}</p>
                  <p className="text-xs text-white/70">kWh</p>
                </div>
              </div>
            )}
          </div>

          <dl className="mt-8 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-white/70">Estimated bill so far</dt>
              <dd className="mt-1 text-lg font-semibold">{s.hasUsage ? fmtPeso(s.billToDate) : "—"}</dd>
            </div>
            <div>
              <dt className="text-white/70">Projected by {fmtShort(cycleLastDay)}{!s.canProject && s.hasUsage ? " (needs 3+ days)" : ""}</dt>
              <dd className="mt-1 text-lg font-semibold">{s.canProject ? fmtPeso(s.projectedBill) : "—"}</dd>
            </div>
            <div>
              <dt className="text-white/70">Last reading</dt>
              <dd className="mt-1 text-lg font-semibold">
                {s.latest ? `${fmtShort(s.latest.at)} · ${fmtTime(s.latest.at)}` : "—"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Budget */}
        <section className="rounded-3xl border border-line bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-mute">Budget</p>
              <h2 className="mt-1 text-xl font-semibold">{s.hasUsage ? budgetState : "Not enough data yet"}</h2>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-lime-soft text-olive">
              <Wallet className="size-5" />
            </span>
          </div>
          <p className="mt-6 text-4xl font-semibold tracking-tight">
            {fmtPeso(s.billToDate)}
            <span className="ml-1 text-base font-normal text-mute">/ {fmtPeso(settings.budget)}</span>
          </p>
          <p className="mt-1 text-sm text-mute">Estimated bill so far</p>
          <div
            role="progressbar"
            aria-valuenow={Math.min(pct, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Share of monthly budget used"
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-line"
          >
            <div
              className={`h-full rounded-full ${pct >= 100 ? "bg-danger" : pct >= settings.alertAt ? "bg-warn" : "bg-lime"}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-mute">
            <span>{pct}% of monthly budget</span>
            <span>Alert at {settings.alertAt}%</span>
          </div>
          {s.hasUsage && <p className="mt-4 rounded-xl bg-lime-soft px-4 py-3 text-sm text-olive">{budgetNote}</p>}
          <Link href="/setup" className="mt-4 inline-block text-sm font-semibold text-olive hover:underline">
            Adjust budget
          </Link>
        </section>

        {/* Chart */}
        <section className="rounded-3xl border border-line bg-card p-6 lg:col-span-2">
          <p className="text-sm text-mute">Consumption trend</p>
          <h2 className="mt-1 text-xl font-semibold">Daily average between readings</h2>
          <p className="mb-5 mt-1 text-sm text-mute">
            kWh per day, worked out from the change between two readings.
          </p>
          {series.length > 0 ? (
            <UsageChart data={series} />
          ) : (
            <div className="grid h-44 place-items-center rounded-2xl bg-cream text-center text-sm text-mute">
              <p className="max-w-xs">Your chart appears after your second reading.</p>
            </div>
          )}
        </section>

        {/* Recent readings */}
        <section className="rounded-3xl border border-line bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-mute">Latest</p>
              <h2 className="mt-1 text-xl font-semibold">Recent readings</h2>
            </div>
            <Link href="/history" aria-label="View all readings" className="grid size-9 place-items-center rounded-full border border-line hover:bg-cream">
              <ChevronRight className="size-5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-mute">No readings yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recent.map((r) => {
                const idx = readings.findIndex((x) => x.id === r.id);
                const prev = idx > 0 ? readings[idx - 1] : null;
                return (
                  <li key={r.id} className="flex items-center gap-3 py-3">
                    <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-cream py-1 text-center text-xs leading-tight text-mute">
                      <strong className="text-base text-ink">{new Date(r.at).getDate()}</strong>
                      {fmtShort(r.at).split(" ")[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{fmtReading(r.value)} kWh</p>
                      <p className="truncate text-xs text-mute">
                        {r.starting ? "Starting reading" : r.source === "scan" ? "Camera scan" : "Manual input"}
                        {r.photo ? " · Photo saved" : ""}
                      </p>
                    </div>
                    {prev && <span className="text-sm font-semibold text-olive">+{fmtKwh(r.value - prev.value)}</span>}
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/history" className="mt-2 inline-block text-sm font-semibold text-olive hover:underline">
            View all readings
          </Link>
        </section>

        {/* Next scan */}
        <section className="flex items-center gap-4 rounded-3xl border border-line bg-card p-6 lg:col-span-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lime-soft text-olive">
            <CalendarClock className="size-6" />
          </span>
          <div>
            <h2 className="font-semibold">Next scan</h2>
            <p className="text-sm text-mute">
              {nextScan
                ? nextScan.getTime() < now.getTime()
                  ? `A new reading was due on ${fmtDate(nextScan)}. Scan your meter to keep estimates accurate.`
                  : `Scan again by ${fmtDate(nextScan)}. A reading each ${settings.reminder === "weekly" ? "week" : "two weeks"} keeps your estimate close.`
                : reminderDays
                  ? "Add your first reading to start your schedule."
                  : "Scan reminders are off. You can turn them on in Setup."}
            </p>
          </div>
          <Gauge className="ml-auto hidden size-6 text-line sm:block" aria-hidden />
        </section>
      </div>
    </>
  );
}