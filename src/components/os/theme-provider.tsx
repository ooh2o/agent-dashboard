"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// Theme modes
export type ThemeMode = "dark" | "light" | "system";

// Accent colors
export type AccentColor = "blue" | "purple" | "green" | "orange" | "pink";

// Theme context type
interface ThemeContextType {
  mode: ThemeMode;
  accent: AccentColor;
  resolvedTheme: "dark" | "light";
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage keys
const THEME_MODE_KEY = "openclaw-theme-mode";
const ACCENT_COLOR_KEY = "openclaw-accent-color";

// Get system theme preference
function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Enable smooth transitions temporarily
function enableTransitions() {
  const html = document.documentElement;
  html.classList.add("theme-transitioning");
  setTimeout(() => {
    html.classList.remove("theme-transitioning");
  }, 200);
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  defaultAccent?: AccentColor;
}

export function ThemeProvider({
  children,
  defaultMode = "dark",
  defaultAccent = "blue",
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [accent, setAccentState] = useState<AccentColor>(defaultAccent);
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage and system preference
  useEffect(() => {
    const storedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
    const storedAccent = localStorage.getItem(
      ACCENT_COLOR_KEY
    ) as AccentColor | null;

    if (storedMode) setModeState(storedMode);
    if (storedAccent) setAccentState(storedAccent);

    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    const resolved = mode === "system" ? getSystemTheme() : mode;

    enableTransitions();

    // Remove all theme classes
    html.classList.remove("dark", "light");
    // Add current theme class
    html.classList.add(resolved);

    setResolvedTheme(resolved);
  }, [mode, mounted]);

  // Apply accent color to document
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;

    enableTransitions();

    // Remove all accent classes
    html.classList.remove(
      "accent-blue",
      "accent-purple",
      "accent-green",
      "accent-orange",
      "accent-pink"
    );
    // Add current accent class
    html.classList.add(`accent-${accent}`);
  }, [accent, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      const html = document.documentElement;
      const resolved = getSystemTheme();

      enableTransitions();

      html.classList.remove("dark", "light");
      html.classList.add(resolved);
      setResolvedTheme(resolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  // Set mode with persistence
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
  }, []);

  // Set accent with persistence
  const setAccent = useCallback((newAccent: AccentColor) => {
    setAccentState(newAccent);
    localStorage.setItem(ACCENT_COLOR_KEY, newAccent);
  }, []);

  // Toggle between dark and light (skips system)
  const toggleMode = useCallback(() => {
    const newMode = resolvedTheme === "dark" ? "light" : "dark";
    setMode(newMode);
  }, [resolvedTheme, setMode]);

  const value: ThemeContextType = {
    mode,
    accent,
    resolvedTheme,
    setMode,
    setAccent,
    toggleMode,
  };

  // Prevent flash of incorrect theme
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// ============================================
// Theme Toggle Component
// ============================================

import { Sun, Moon, Monitor } from "lucide-react";

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "segmented";
  className?: string;
}

export function ThemeToggle({
  showLabel = false,
  size = "md",
  variant = "icon",
  className = "",
}: ThemeToggleProps) {
  const { mode, setMode, toggleMode, resolvedTheme } = useTheme();

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--os-bg-surface)] border border-[var(--os-border-subtle)] ${className}`}
      >
        {(["light", "system", "dark"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`
              flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
              transition-all duration-150
              ${
                mode === m
                  ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)]"
                  : "text-[var(--os-fg-secondary)] hover:text-[var(--os-fg-primary)] hover:bg-[var(--os-interactive-hover)]"
              }
            `}
            title={`${m.charAt(0).toUpperCase() + m.slice(1)} mode`}
          >
            {m === "light" && <Sun size={14} />}
            {m === "system" && <Monitor size={14} />}
            {m === "dark" && <Moon size={14} />}
            {showLabel && (
              <span>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Icon button variant (default)
  return (
    <button
      onClick={toggleMode}
      className={`
        inline-flex items-center justify-center rounded-lg
        ${sizeClasses[size]}
        bg-[var(--os-bg-surface)] border border-[var(--os-border-subtle)]
        text-[var(--os-fg-secondary)] hover:text-[var(--os-fg-primary)]
        hover:bg-[var(--os-interactive-hover)]
        transition-all duration-150
        ${className}
      `}
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="relative">
        <Sun
          size={iconSizes[size]}
          className={`absolute inset-0 transition-all duration-200 ${
            resolvedTheme === "dark"
              ? "opacity-0 rotate-90 scale-0"
              : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <Moon
          size={iconSizes[size]}
          className={`transition-all duration-200 ${
            resolvedTheme === "dark"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  );
}

// ============================================
// Accent Color Picker Component
// ============================================

interface AccentPickerProps {
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ACCENT_COLORS: { value: AccentColor; label: string; color: string }[] = [
  { value: "blue", label: "Blue", color: "oklch(0.60 0.200 220)" },
  { value: "purple", label: "Purple", color: "oklch(0.60 0.200 280)" },
  { value: "green", label: "Green", color: "oklch(0.65 0.180 145)" },
  { value: "orange", label: "Orange", color: "oklch(0.72 0.180 40)" },
  { value: "pink", label: "Pink", color: "oklch(0.68 0.200 340)" },
];

export function AccentPicker({
  showLabel = true,
  size = "md",
  className = "",
}: AccentPickerProps) {
  const { accent, setAccent } = useTheme();

  const dotSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const ringOffset = {
    sm: "ring-offset-1",
    md: "ring-offset-2",
    lg: "ring-offset-2",
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-[var(--os-fg-secondary)]">
          Accent color
        </span>
      )}
      <div className="flex items-center gap-2">
        {ACCENT_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => setAccent(color.value)}
            className={`
              ${dotSizes[size]} rounded-full transition-all duration-150
              ${ringOffset[size]} ring-offset-[var(--os-bg-surface)]
              ${
                accent === color.value
                  ? "ring-2 ring-[var(--os-fg-primary)] scale-110"
                  : "hover:scale-110"
              }
            `}
            style={{ backgroundColor: color.color }}
            title={color.label}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Theme Panel Component (combines toggle + accent)
// ============================================

interface ThemePanelProps {
  className?: string;
}

export function ThemePanel({ className = "" }: ThemePanelProps) {
  const { mode, resolvedTheme } = useTheme();

  return (
    <div
      className={`p-4 rounded-xl bg-[var(--os-bg-surface)] border border-[var(--os-border-subtle)] ${className}`}
    >
      <div className="space-y-4">
        {/* Theme mode */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-[var(--os-fg-secondary)]">
            Appearance
          </span>
          <ThemeToggle variant="segmented" showLabel />
        </div>

        {/* Accent color */}
        <AccentPicker />

        {/* Current theme info */}
        <div className="pt-2 border-t border-[var(--os-border-subtle)]">
          <p className="text-xs text-[var(--os-fg-muted)]">
            Mode: {mode}
            {mode === "system" && ` (${resolvedTheme})`}
          </p>
        </div>
      </div>
    </div>
  );
}
