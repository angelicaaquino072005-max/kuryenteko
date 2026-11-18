import { fmtDate, fmtKwh, fmtPeso, fmtReading } from "@/lib/format";
import { cycleSummary } from "@/lib/stats";
import type { Check } from "@/lib/validate";
import type { Reading, Settings } from "@/lib/types";

// Shows what a reading means: kWh used and the cost in pesos.
export function UsagePreview({
  readings,
  settings,
  at,
  value,
  check,
}: {
  readings: Reading[];
  settings: Settings;
  at: string;
  value: number;
  check: Check;
}) {
  const valid = Number.isFinite(value) && check.level !== "error" && !Number.isNaN(new Date(at).getTime());
  const kwh = valid ? check.consumption : null;

  let cycle = null;
  if (valid) {
    const withNew: Reading[] = [...readings, { id: "preview", at, value, source: "manual" as const }].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
    );
    cycle = cycleSummary(withNew, settings, new Date(at));
  }

  return (
    <div className="mt-5 rounded-2xl bg-lime-soft p-4">
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-olive">Previous reading</dt>
          <dd className="text-right font-medium text-ink">
            {check.previous ? `${fmtReading(check.previous.value)} kWh · ${fmtDate(check.previous.at)}` : "None yet"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-olive">Electricity used</dt>
          <dd className="text-right text-lg font-semibold text-ink">{kwh !== null ? `${fmtKwh(kwh)} kWh` : "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-olive">Cost of that usage</dt>
          <dd className="text-right text-lg font-semibold text-ink">
            {kwh !== null ? fmtPeso(kwh * settings.rate) : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-olive/20 pt-3">
          <dt className="text-olive">Estimated bill this cycle so far</dt>
          <dd className="text-right text-lg font-semibold text-ink">
            {cycle && cycle.hasUsage ? fmtPeso(cycle.billToDate) : "—"}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-olive">
        Estimate: {fmtPeso(settings.rate)} per kWh, plus {fmtPeso(settings.fixed)} fixed charges once per bill. Your real
        bill may differ. Change the rate in Setup.
      </p>
    </div>
  );
}