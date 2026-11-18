import { CircleCheck, TriangleAlert, OctagonAlert } from "lucide-react";

export function Notice({ level, children }: { level: "ok" | "warn" | "error"; children: React.ReactNode }) {
  const styles = {
    ok: "bg-lime-soft text-olive",
    warn: "bg-warn-soft text-warn",
    error: "bg-danger-soft text-danger",
  }[level];
  const Icon = level === "ok" ? CircleCheck : level === "warn" ? TriangleAlert : OctagonAlert;
  return (
    <p role={level === "ok" ? undefined : "alert"} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}