"use client";
import { useEffect } from "react";

export type ThemePref = "light" | "dark" | "system";
export const THEME_KEY = "waypoint-theme";

export function applyTheme(theme: "light" | "dark") {
  if (theme === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

export function getStoredThemePref(): ThemePref {
  try {
    return (localStorage.getItem(THEME_KEY) as ThemePref) ?? "light";
  } catch {
    return "light";
  }
}

export function setStoredThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch { /* ignore */ }
}

export function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref === "system") return "light";
  return pref;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const pref = getStoredThemePref();
    applyTheme(resolveTheme(pref));
  }, []);
  return <>{children}</>;
}
