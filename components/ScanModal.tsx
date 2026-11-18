"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { Notice } from "./Notice";
import { CameraCapture } from "./CameraCapture";
import { UsagePreview } from "./UsagePreview";
import { addReading, useStore } from "@/lib/store";
import { checkReading } from "@/lib/validate";
import { prepareImages } from "@/lib/image";
import { fmtReading, parseNum } from "@/lib/format";

const DIALS = 5;
type Phase = "camera" | "processing" | "review";

export function ScanModal({ onClose }: { onClose: () => void }) {
  const { readings, settings } = useStore();
  const isAnalog = settings.meterType === "analog";

  const [phase, setPhase] = useState<Phase>("camera");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(DIALS).fill(""));
  const [at, setAt] = useState(() => new Date().toISOString());
  const dialRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleBlob(blob: Blob) {
    setError("");
    setPhase("processing");
    try {
      const images = await prepareImages(blob);
      setPhoto(images.store);
      setAt(new Date().toISOString());
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this photo.");
      setPhase("camera");
    }
  }

  function retake() {
    setPhoto(null);
    setText("");
    setDigits(Array(DIALS).fill(""));
    setPhase("camera");
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

  if (phase === "camera") {
    return (
      <Modal title="Photograph your meter" subtitle="Meter scan" onClose={onClose}>
        <CameraCapture meterType={settings.meterType} dials={DIALS} onBlob={handleBlob} />
        {error && (
          <div className="mt-4">
            <Notice level="error">{error}</Notice>
          </div>
        )}
      </Modal>
    );
  }

  if (phase === "processing") {
    return (
      <Modal title="Saving photo" subtitle="Meter scan" onClose={onClose}>
        <div className="grid place-items-center gap-3 py-12 text-center">
          <Loader2 className="size-9 animate-spin text-olive" aria-hidden />
          <p className="text-sm text-mute">One moment…</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Enter the reading you see" subtitle="Meter scan" onClose={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo ?? ""} alt="Your meter photo" className="max-h-64 w-full rounded-2xl bg-ink object-contain" />

      {isAnalog ? (
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Type each dial, left to right</legend>
          <p className="mt-1 text-sm text-mute">
            If a pointer is between two numbers, use the lower one. Skip any red dial.
          </p>
          <div className="mt-3 flex gap-2">
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

      <UsagePreview readings={readings} settings={settings} at={at} value={value} check={check} />

      {touched && (
        <div className="mt-4">
          <Notice level={check.level}>{check.message}</Notice>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={retake} className="rounded-xl border border-line bg-white px-5 py-3 font-medium hover:bg-cream">
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