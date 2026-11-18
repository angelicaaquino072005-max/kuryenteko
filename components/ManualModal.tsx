"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "./Modal";
import { Notice } from "./Notice";
import { addReading, useStore } from "@/lib/store";
import { checkReading } from "@/lib/validate";
import { fmtDate, fmtReading, parseNum, toLocalInput } from "@/lib/format";

export function ManualModal({ onClose }: { onClose: () => void }) {
  const { readings, settings } = useStore();
  const [text, setText] = useState("");
  const [when, setWhen] = useState(() => toLocalInput(new Date()));

  const value = parseNum(text);
  const iso = useMemo(() => {
    const d = new Date(when);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [when]);
  const check = useMemo(() => checkReading(readings, iso, value), [readings, iso, value]);
  const touched = text.trim() !== "";

  function save() {
    if (check.level === "error" || !iso) return;
    addReading({ at: iso, value, source: "manual" });
    onClose();
  }

  return (
    <Modal title="Enter meter reading" subtitle="Manual input" onClose={onClose}>
      <p className="mb-5 text-sm text-mute">
        Use this when the camera is unavailable or you want to log a reading yourself.
        {settings.meterType === "analog" && " Read the dials from left to right and skip any decimal dial."}
      </p>

      <label className="block">
        <span className="text-sm font-medium">Current reading</span>
        <div className="mt-1 flex items-baseline gap-3 border-b-2 border-lime pb-1">
          <input
            autoFocus
            inputMode="decimal"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. 11444"
            className="w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-mute/40"
          />
          <span className="text-mute">kWh</span>
        </div>
      </label>

      <label className="mt-5 block">
        <span className="text-sm font-medium">Date and time of reading</span>
        <input
          type="datetime-local"
          value={when}
          max={toLocalInput(new Date())}
          onChange={(e) => setWhen(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
        />
      </label>

      <dl className="mt-5 divide-y divide-line border-y border-line text-sm">
        <div className="flex justify-between py-3">
          <dt className="text-mute">Previous reading</dt>
          <dd className="font-medium">
            {check.previous ? `${fmtReading(check.previous.value)} kWh · ${fmtDate(check.previous.at)}` : "None yet"}
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-mute">Usage since then</dt>
          <dd className="font-medium">{check.consumption !== null ? `+${check.consumption} kWh` : "—"}</dd>
        </div>
      </dl>

      {touched && (
        <div className="mt-4">
          <Notice level={check.level}>{check.message}</Notice>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="rounded-xl border border-line bg-white px-5 py-3 font-medium hover:bg-cream">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!touched || check.level === "error"}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 font-semibold text-white hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="size-5" /> Save reading
        </button>
      </div>
    </Modal>
  );
}