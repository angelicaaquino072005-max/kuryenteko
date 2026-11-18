"use client";

import { createContext, useContext } from "react";

export const UIContext = createContext<{ openScan: () => void; openManual: () => void }>({
  openScan: () => {},
  openManual: () => {},
});

export const useUI = () => useContext(UIContext);