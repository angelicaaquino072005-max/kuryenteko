import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {subtitle && <p className="text-sm text-mute">{subtitle}</p>}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}

export function ActionButtons({
  onManual,
  onScan,
  scanLabel = "Scan meter",
}: {
  onManual: () => void;
  onScan: () => void;
  scanLabel?: string;
}) {
  return (
    <>
      <button
        onClick={onManual}
        className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-cream"
      >
        Manual input
      </button>
      <button
        onClick={onScan}
        className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
      >
        {scanLabel}
      </button>
    </>
  );
}