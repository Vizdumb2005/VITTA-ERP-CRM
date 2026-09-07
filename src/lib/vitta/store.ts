"use client";

import { create } from "zustand";
import { APPS } from "./apps";

interface VittaState {
  /** active app id, null = home / app launcher */
  activeApp: string | null;
  openApp: (id: string) => void;
  goHome: () => void;
}

const VALID_IDS = new Set(APPS.map((a) => a.id));

function appFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const m = /^#\/([a-z]+)$/i.exec(window.location.hash);
  const id = m?.[1] ?? null;
  return id && VALID_IDS.has(id) ? id : null;
}

function setHash(id: string | null) {
  if (typeof window === "undefined") return;
  const next = id ? `#/${id}` : "#/";
  if (window.location.hash !== next) {
    window.history.pushState(null, "", next);
  }
}

/**
 * VITTA shell state. The active app is mirrored to the URL hash (#/crm)
 * so refresh and browser back/forward keep their place — without creating
 * additional page routes.
 */
export const useVitta = create<VittaState>((set) => ({
  activeApp: appFromHash(),
  openApp: (id) => {
    setHash(id);
    set({ activeApp: id });
  },
  goHome: () => {
    setHash(null);
    set({ activeApp: null });
  },
}));

/** Listen to browser back/forward and sync shell state. Call once on mount. */
export function bindHashNavigation() {
  if (typeof window === "undefined") return () => {};
  const onPop = () => {
    useVitta.setState({ activeApp: appFromHash() });
  };
  window.addEventListener("popstate", onPop);
  return () => window.removeEventListener("popstate", onPop);
}
