"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Zap, ZapOff } from "lucide-react";
import type { MeterType } from "@/lib/types";

type TorchCaps = MediaTrackCapabilities & { torch?: boolean };

export function CameraCapture({
  meterType,
  dials,
  onBlob,
}: {
  meterType: MeterType;
  dials: number;
  onBlob: (blob: Blob) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [supported] = useState(
    () =>
      typeof navigator !== "undefined" &&
      typeof window !== "undefined" &&
      window.isSecureContext &&
      Boolean(navigator.mediaDevices?.getUserMedia),
  );
  const [state, setState] = useState<"starting" | "live" | "blocked">("starting");
  const [message, setMessage] = useState("");
  const [torchOk, setTorchOk] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as TorchCaps | undefined;
        setTorchOk(Boolean(caps?.torch));
        setState("live");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const name = e instanceof DOMException ? e.name : "";
        setMessage(
          name === "NotAllowedError"
            ? "Camera access is blocked. Allow the camera for this site in your browser settings, then try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : "The camera could not be started.",
        );
        setState("blocked");
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [supported]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => blob && onBlob(blob), "image/jpeg", 0.92);
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] } as unknown as MediaTrackConstraints);
      setTorchOn(!torchOn);
    } catch {
      setTorchOk(false);
    }
  }

  const fallback = !supported || state === "blocked";
  const hint =
    meterType === "analog"
      ? `Fit all ${dials} dials inside the frame`
      : "Fit the whole display inside the frame";

  return (
    <div>
      {!fallback && (
        <div className="relative overflow-hidden rounded-2xl bg-ink">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="block max-h-[56dvh] min-h-52 w-full object-contain"
          />
          {state === "live" && (
            <>
              <div className="pointer-events-none absolute inset-x-[8%] inset-y-[22%] rounded-xl border-2 border-lime/90 shadow-[0_0_0_9999px_rgba(20,33,43,0.35)]" />
              <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-sm font-medium text-white drop-shadow">
                {hint}
              </p>
            </>
          )}
          {state === "starting" && (
            <p className="absolute inset-0 grid place-items-center text-sm text-white/80">Starting camera…</p>
          )}
          {torchOk && state === "live" && (
            <button
              onClick={toggleTorch}
              aria-label={torchOn ? "Turn flash off" : "Turn flash on"}
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-ink/70 text-white"
            >
              {torchOn ? <Zap className="size-5 text-lime" /> : <ZapOff className="size-5" />}
            </button>
          )}
        </div>
      )}

      {fallback && (
        <div className="rounded-2xl bg-cream p-5 text-sm text-mute">
          <p className="font-medium text-ink">
            {supported ? "Live camera is not available." : "Live camera needs a secure (https) page."}
          </p>
          <p className="mt-1">
            {message || "Use your phone camera app or pick a photo instead."}
          </p>
        </div>
      )}

      <ul className="mt-4 space-y-1 text-sm text-mute">
        <li>• Hold the phone straight and avoid glare on the glass.</li>
        <li>• Make sure every digit is sharp. Use the flash if it is dark.</li>
      </ul>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {!fallback ? (
          <button
            onClick={capture}
            disabled={state !== "live"}
            className="flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 font-semibold text-white hover:bg-ink-soft disabled:opacity-40"
          >
            <Camera className="size-5" /> Capture
          </button>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 font-semibold text-white hover:bg-ink-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-olive">
            <Camera className="size-5" /> Take photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && onBlob(e.target.files[0])}
            />
          </label>
        )}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3.5 font-semibold hover:bg-cream has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-olive">
          <ImageUp className="size-5" /> Choose from gallery
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && onBlob(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
}