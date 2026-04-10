"use client";

import { Palette } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeOption = {
  value: string;
  label: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { value: "hillwalk", label: "Hillwalk" },
  { value: "light", label: "Light" },
  { value: "autumn", label: "Autumn" },
  { value: "forest", label: "Forest" },
  { value: "corporate", label: "Corporate" },
  { value: "dim", label: "Dim" },
];

const STORAGE_KEY = "theme-choice";

export function ThemeFloatingMenu() {
  const [activeTheme, setActiveTheme] = useState("hillwalk");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const htmlTheme = document.documentElement.getAttribute("data-theme");
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);

    const initialTheme = storedTheme || htmlTheme || "hillwalk";
    setActiveTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  function handleThemeChange(nextTheme: string) {
    setActiveTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
        right: 12,
        zIndex: 2147483647,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      <button
        aria-label="Apri menu temi"
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.35)",
          background: "#1f4f3f",
          color: "#ffffff",
          padding: "10px 14px",
          fontSize: 14,
          fontWeight: 700,
          boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          cursor: "pointer",
        }}
      >
        <Palette size={16} />
        Tema
      </button>

      {open ? (
        <div
          style={{
            width: 260,
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "rgba(255,255,255,0.96)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
            padding: 8,
            backdropFilter: "blur(8px)",
          }}
        >
          <p
            style={{
              padding: "6px 8px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              opacity: 0.65,
            }}
          >
            Scegli tema
          </p>

          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 4,
            }}
          >
            {THEME_OPTIONS.map((theme) => {
              const isActive = activeTheme === theme.value;

              return (
                <li key={theme.value}>
                  <button
                    type="button"
                    onClick={() => {
                      handleThemeChange(theme.value);
                      setOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: isActive
                        ? "rgba(31,79,63,0.12)"
                        : "transparent",
                      color: "#1f2a26",
                      padding: "8px 10px",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    <span>{theme.label}</span>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: isActive ? "#1f4f3f" : "#c9c9c9",
                      }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
