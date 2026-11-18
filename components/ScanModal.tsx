"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, Check, ImageUp, Info } from "lucide-react";
import { Modal } from "./Modal";
import { Notice } from "./Notice";
import { addReading, useStore } from "@/lib/store";
import { checkReading } from "@/lib/validate";
import { fileToSmallJpeg } from "@/lib/image";
import { fmtDate, fmtReading, parseNum } from "@/lib/format";

const DIALS = 5;

export function ScanModal({ onClose }: { onClose: () => void }) {
  const { readings, settings } = useStore();
  const isAnalog = settings.meterType === "analog";

  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(DIALS).fill(""));
  const [at] = useState(() => new Date().toISOString());
  const dialRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      setPhoto(await fileToSmallJpeg(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this photo.");
    } finally {
      setBusy(false);
    }
  }

  const value = isAnalog
    ? digits.every((d) => d !== "")
      ? Number(digits.join(""))
      : NaN
    : parseNum(text);
  const check = useMemo(() => checkReading(readings, at, value), [readings, at, value]);
  const touched = isAnalog ? digits.some((d) => d !== "") : text.trim() !== "";

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => prev.map((x, j) => (j === i ? d : x)));
    if (d && i < DIALS - 1) dialRefs.current[i + 1]?.focus();
  }

  function save() {
    if (check.level === "error" || !photo) return;
    addReading({ at, value, source: "scan", photo });
    onClose();
  }

  // ---- step 1: take or choose a photo ----
  if (!photo) {
    return (
      <Modal title="Photograph your meter" subtitle="Meter scan · step 1 of 2" onClose={onClose}>
        <ul className="mb-5 space-y-2 text-sm text-mute">
          <li>• {isAnalog ? `Fit all ${DIALS} dials in the photo.` : "Fit the whole display in the photo."}</li>
          <li>• Hold the phone straight in front of the meter.</li>
          <li>• Avoid glare on the glass. Step aside from direct light.</li>
          <li>• Make sure every digit is sharp and readable.</li>
        </ul>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 font-semibold text-white hover:bg-ink-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-olive">
            <Camera className="size-5" /> Take photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3.5 font-semibold hover:bg-cream has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-olive">
            <ImageUp className="size-5" /> Choose from gallery
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>

        {busy && <p className="mt-4 text-sm text-mute">Preparing photo…</p>}
        {error && (
          <div className="mt-4">
            <Notice level="error">{error}</Notice>
          </div>
        )}
      </Modal>
    );
  }

  // ---- step 2: confirm the reading ----
  return (
    <Modal title="Review your reading" subtitle="Meter scan · step 2 of 2" onClose={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="Your meter photo" className="max-h-64 w-full rounded-2xl bg-ink object-contain" />

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-cream px-4 py-3 text-sm text-mute">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Automatic reading is not on yet. Type what the photo shows so the reading is saved with its proof.
      </p>

      {isAnalog ? (
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Dial digits, left to right</legend>
          <div className="mt-2 flex gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  dialRefs.current[i] = el;
                }}
                value={d}
                inputMode="numeric"
                maxLength={1}
                aria-label={`Dial ${i + 1}`}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) dialRefs.current[i - 1]?.focus();
                }}
                onFocus={(e) => e.target.select()}
                className="h-16 w-full min-w-0 rounded-xl border border-line bg-white text-center text-3xl font-semibold"
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-mute">
            Reading: <strong className="text-ink">{Number.isFinite(value) ? fmtReading(value) : "—"} kWh</strong>
          </p>
        </fieldset>
      ) : (
        <label className="mt-5 block">
          <span className="text-sm font-medium">Reading on the display</span>
          <div className="mt-1 flex items-baseline gap-3 border-b-2 border-lime pb-1">
            <input
              inputMode="decimal"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. 1016.6"
              className="w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-mute/40"
            />
            <span className="text-mute">kWh</span>
          </div>
        </label>
      )}

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
        <button
          onClick={() => {
            setPhoto(null);
            setText("");
            setDigits(Array(DIALS).fill(""));
          }}
          className="rounded-xl border border-line bg-white px-5 py-3 font-medium hover:bg-cream"
        >
          Retake
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