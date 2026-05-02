"use client";
import { useEffect } from "react";

export function applyTheme(theme: "light" | "dark") {
  if (theme === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

export function getStoredTheme(): "light" | "dark" | null {
  try {
    return localStorage.getItem("waypoint-theme") as "light" | "dark" | null;
  } catch {
    return null;
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = getStoredTheme();
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(stored ?? preferred);
  }, []);
  return <>{children}</>;
}
