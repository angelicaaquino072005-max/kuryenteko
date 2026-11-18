"use client";

import { useSyncExternalStore } from "react";
import type { Reading, Settings } from "./types";

const KEY_SETTINGS = "kuryenteko:settings:v1";
const KEY_READINGS = "kuryenteko:readings:v1";

export const DEFAULT_SETTINGS: Settings = {
  household: "My household",
  meterType: "analog",
  rate: 13.19,
  fixed: 5.6,
  budget: 1500,
  billingDay: 18,
  reminder: "weekly",
  alertAt: 80,
  setupComplete: false,
};

interface State {
  ready: boolean;
  settings: Settings;
  readings: Reading[];
}

const SERVER_STATE: State = { ready: false, settings: DEFAULT_SETTINGS, readings: [] };
let state: State = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

const sortReadings = (list: Reading[]) =>
  [...list].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  let settings = DEFAULT_SETTINGS;
  let readings: Reading[] = [];
  try {
    const s = localStorage.getItem(KEY_SETTINGS);
    if (s) settings = { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
    const r = localStorage.getItem(KEY_READINGS);
    if (r) readings = sortReadings(JSON.parse(r));
  } catch {
    // corrupted storage: start fresh
  }
  state = { ready: true, settings, readings };
}

function persist() {
  try {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(state.settings));
  } catch {
    return false;
  }
  // Browser storage is small. If photos do not fit, drop the oldest photos first.
  let readings = state.readings;
  for (let i = 0; i < 200; i++) {
    try {
      localStorage.setItem(KEY_READINGS, JSON.stringify(readings));
      state = { ...state, readings };
      return true;
    } catch {
      const idx = readings.findIndex((r) => r.photo);
      if (idx === -1) return false;
      readings = readings.map((r, j) => (j === idx ? { ...r, photo: undefined } : r));
    }
  }
  return false;
}

function commit(next: Partial<State>) {
  state = { ...state, ...next, ready: true };
  const ok = persist();
  listeners.forEach((l) => l());
  return ok;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  load();
  return state;
}

function getServerSnapshot() {
  return SERVER_STATE;
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ---- actions ----

export function addReading(r: Omit<Reading, "id">) {
  return commit({ readings: sortReadings([...state.readings, { ...r, id: uid() }]) });
}

export function deleteReading(id: string) {
  commit({ readings: state.readings.filter((r) => r.id !== id) });
}

export function saveSetup(
  settings: Omit<Settings, "setupComplete">,
  start: { value: number; at: string },
) {
  const existing = state.readings.find((r) => r.starting);
  const readings = existing
    ? state.readings.map((r) => (r.starting ? { ...r, value: start.value, at: start.at } : r))
    : [
        ...state.readings,
        { id: uid(), at: start.at, value: start.value, source: "manual" as const, starting: true },
      ];
  commit({ settings: { ...settings, setupComplete: true }, readings: sortReadings(readings) });
}

export function loadDemoData(now = new Date()) {
  const increments = [0, 22, 26, 31, 24, 28, 25];
  const daysAgo = [24, 20, 16, 12, 8, 4, 0];
  let value = 11444;
  const readings: Reading[] = increments.map((inc, i) => {
    value += inc;
    const at = new Date(now);
    at.setDate(at.getDate() - daysAgo[i]);
    at.setHours(19, 30, 0, 0);
    return {
      id: `demo-${i}`,
      at: at.toISOString(),
      value,
      source: i % 2 === 0 ? "manual" : "scan",
      starting: i === 0 ? true : undefined,
    };
  });
  commit({ settings: { ...state.settings, setupComplete: true }, readings });
}

export function eraseAll() {
  try {
    localStorage.removeItem(KEY_SETTINGS);
    localStorage.removeItem(KEY_READINGS);
  } catch {
    // ignore
  }
  state = { ready: true, settings: DEFAULT_SETTINGS, readings: [] };
  listeners.forEach((l) => l());
}