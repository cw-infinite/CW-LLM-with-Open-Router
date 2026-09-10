import { useEffect } from "react";
import { useSettingsStore } from "../store/useSettingsStore";

/** Applies the current theme mode + accent color to <html> as CSS state. */
export function useAppliedTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const accent = useSettingsStore((s) => s.accent);

  useEffect(() => {
    const root = document.documentElement;

    const applyResolvedTheme = () => {
      const resolved =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      root.setAttribute("data-theme", resolved);
    };

    applyResolvedTheme();

    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", applyResolvedTheme);
    return () => mq.removeEventListener("change", applyResolvedTheme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent-h", String(accent.h));
    root.style.setProperty("--accent-s", `${accent.s}%`);
  }, [accent]);
}
