"use client";

import { useState } from "react";
import { Camera, ImageIcon, NotebookPen, Trash2 } from "lucide-react";
import { ActionButtons, PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import { useUI } from "@/components/ui-context";
import { deleteReading, useStore } from "@/lib/store";
import { fmtDate, fmtKwh, fmtReading, fmtTime } from "@/lib/format";
import type { Reading } from "@/lib/types";

type Filter = "all" | "scan" | "manual";

export default function History() {
  const { ready } = useStore();
  if (!ready) return <div className="h-96 animate-pulse rounded-3xl bg-line/60" aria-label="Loading" />;
  return <HistoryView />;
}

function HistoryView() {
  const { readings } = useStore();
  const { openManual, openScan } = useUI();
  const [filter, setFilter] = useState<Filter>("all");
  const [photo, setPhoto] = useState<Reading | null>(null);

  const withPhotos = readings.filter((r) => r.photo).length;
  const first = readings[0];
  const last = readings[readings.length - 1];
  const spanDays = first && last ? (new Date(last.at).getTime() - new Date(first.at).getTime()) / 86_400_000 : 0;
  const avgDaily = spanDays >= 1 ? (last.value - first.value) / spanDays : null;

  const rows = [...readings]
    .map((r, i) => ({ r, used: i > 0 ? r.value - readings[i - 1].value : null }))
    .reverse()
    .filter(({ r }) => filter === "all" || r.source === filter);

  return (
    <>
      <PageHeader
        subtitle="Reading log"
        title="Reading history"
        actions={<ActionButtons onManual={openManual} onScan={openScan} scanLabel="New scan" />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total readings" value={String(readings.length)} note="records on this device" />
        <Stat label="With meter photos" value={String(withPhotos)} note="saved as proof" />
        <Stat
          label="Average daily usage"
          value={avgDaily === null ? "—" : fmtKwh(avgDaily)}
          note={avgDaily === null ? "needs two readings a day apart" : "kWh per day, all readings"}
        />
      </div>

      <section className="rounded-3xl border border-line bg-card">
        <div className="flex gap-1 border-b border-line p-4" role="tablist" aria-label="Filter readings">
          {(
            [
              ["all", "All"],
              ["scan", "Camera scan"],
              ["manual", "Manual"],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                filter === key ? "bg-ink text-white" : "text-mute hover:bg-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-mute">
            {readings.length === 0
              ? "No readings yet. Finish Setup, then scan your meter or enter a reading."
              : "No readings match this filter."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map(({ r, used }) => (
              <li key={r.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-4 sm:grid-cols-[1.2fr_1fr_1fr_1.2fr_auto] sm:px-6">
                <div>
                  <p className="font-semibold">{fmtDate(r.at)}</p>
                  <p className="text-xs text-mute">{fmtTime(r.at)}</p>
                </div>
                <p className="text-right font-semibold sm:text-left">
                  {fmtReading(r.value)} <span className="text-xs font-normal text-mute">kWh</span>
                </p>
                <p className="text-sm text-olive">{r.starting ? "Starting reading" : used !== null ? `+${fmtKwh(used)} kWh` : "—"}</p>
                <p className="flex items-center gap-2 text-sm text-mute">
                  {r.source === "scan" ? <Camera className="size-4" /> : <NotebookPen className="size-4" />}
                  {r.source === "scan" ? "Camera scan" : "Manual input"}
                  {r.photo && <span className="rounded-full bg-lime-soft px-2 py-0.5 text-xs text-olive">Photo saved</span>}
                </p>
                <div className="col-span-2 flex justify-end gap-2 sm:col-span-1">
                  {r.photo && (
                    <button
                      onClick={() => setPhoto(r)}
                      aria-label={`View photo for ${fmtDate(r.at)}`}
                      className="grid size-9 place-items-center rounded-lg border border-line hover:bg-cream"
                    >
                      <ImageIcon className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Delete the ${fmtReading(r.value)} kWh reading from ${fmtDate(r.at)}?`)) deleteReading(r.id);
                    }}
                    aria-label={`Delete reading from ${fmtDate(r.at)}`}
                    className="grid size-9 place-items-center rounded-lg border border-line text-danger hover:bg-danger-soft"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {photo?.photo && (
        <Modal title={`${fmtReading(photo.value)} kWh`} subtitle={`Meter photo · ${fmtDate(photo.at)}`} onClose={() => setPhoto(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.photo} alt="Saved meter photo" className="w-full rounded-2xl bg-ink object-contain" />
        </Modal>
      )}
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-3xl border border-line bg-card p-6">
      <p className="text-sm text-mute">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-mute">{note}</p>
    </div>
  );
}