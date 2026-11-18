import type { Interval } from "@/lib/stats";
import { fmtKwh, fmtShort } from "@/lib/format";

export function UsageChart({ data }: { data: Interval[] }) {
  const bars = data.slice(-10);
  const max = Math.max(...bars.map((b) => b.perDay), 1);
  const top = Math.ceil(max / 2) * 2;
  const label = bars
    .map((b) => `${fmtShort(b.to.at)}: ${fmtKwh(b.perDay)} kilowatt-hours per day`)
    .join("; ");

  return (
    <div role="img" aria-label={`Daily average usage between readings. ${label}`}>
      <div className="flex gap-3">
        <div className="flex h-44 flex-col justify-between text-xs text-mute" aria-hidden>
          <span>{top}</span>
          <span>{top / 2}</span>
          <span>0</span>
        </div>
        <div className="relative h-44 flex-1 border-b border-line">
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" aria-hidden />
          <div className="relative flex h-full items-end gap-2">
            {bars.map((b) => (
              <div key={b.to.id} className="flex h-full flex-1 flex-col justify-end" title={`${fmtShort(b.to.at)}: ${fmtKwh(b.perDay)} kWh/day`}>
                <span className="mb-1 text-center text-xs font-medium text-ink">{fmtKwh(b.perDay)}</span>
                <div className="w-full rounded-t-md bg-olive/80" style={{ height: `${(b.perDay / top) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ml-8 mt-2 flex gap-2 text-center text-xs text-mute" aria-hidden>
        {bars.map((b) => (
          <span key={b.to.id} className="flex-1 truncate">
            {fmtShort(b.to.at)}
          </span>
        ))}
      </div>
    </div>
  );
}