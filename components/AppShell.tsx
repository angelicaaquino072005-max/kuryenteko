"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { History, LayoutDashboard, Lightbulb, ScanLine, SlidersHorizontal, Zap } from "lucide-react";
import { UIContext } from "./ui-context";
import { ScanModal } from "./ScanModal";
import { ManualModal } from "./ManualModal";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/setup", label: "Setup", icon: SlidersHorizontal },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl bg-lime text-ink">
        <Zap className="size-5" fill="currentColor" />
      </div>
      <div className="leading-tight">
        <p className="font-semibold">KuryenteKo</p>
        <p className="text-xs text-mute">Energy tracker</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, settings } = useStore();
  const [modal, setModal] = useState<"scan" | "manual" | null>(null);
  const close = useCallback(() => setModal(null), []);
  const ui = useMemo(
    () => ({ openScan: () => setModal("scan"), openManual: () => setModal("manual") }),
    [],
  );

  const initial = (ready ? settings.household : "K").trim().charAt(0).toUpperCase() || "K";

  return (
    <UIContext.Provider value={ui}>
      <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-card p-5 lg:flex">
          <Logo />

          <Link
            href="/setup"
            className="mt-8 flex items-center gap-3 rounded-2xl border border-line bg-white p-3 hover:bg-cream"
          >
            <span className="grid size-9 place-items-center rounded-full bg-ink text-sm font-semibold text-lime">
              {initial}
            </span>
            <span className="min-w-0 text-sm leading-tight">
              <span className="block truncate font-semibold">{ready ? settings.household : "Your household"}</span>
              <span className="text-xs text-mute">
                One meter · {ready && settings.meterType === "digital" ? "Digital" : "Analog"}
              </span>
            </span>
          </Link>

          <nav className="mt-6 space-y-1" aria-label="Main">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                    active ? "bg-ink text-white" : "text-mute hover:bg-cream hover:text-ink"
                  }`}
                >
                  <Icon className={`size-5 ${active ? "text-lime" : ""}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex gap-3 rounded-2xl bg-lime-soft p-4 text-sm text-olive">
            <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              <strong>Save energy.</strong> Turn off standby appliances when not in use.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-cream/90 px-4 py-3 backdrop-blur sm:px-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={ui.openScan}
                className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
              >
                <ScanLine className="size-4" /> Scan meter
              </button>
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-full bg-ink text-sm font-semibold text-lime"
              >
                {initial}
              </span>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-8 lg:pb-10">{children}</main>
        </div>

        {/* Bottom navigation (mobile) */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-medium ${
                  active ? "text-ink" : "text-mute"
                }`}
              >
                <span className={`grid h-7 w-14 place-items-center rounded-full ${active ? "bg-lime" : ""}`}>
                  <Icon className="size-5" />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {modal === "scan" && <ScanModal onClose={close} />}
      {modal === "manual" && <ManualModal onClose={close} />}
    </UIContext.Provider>
  );
}