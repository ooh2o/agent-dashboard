'use client';

import { ThemeProvider } from './theme-provider';
import { AccessibilityProvider } from './accessibility-provider';
import type { AccentColor, ThemeMode } from './theme-provider';
import type { CommandItem } from './command-palette';

interface ProvidersProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  defaultAccent?: AccentColor;
  additionalCommands?: CommandItem[];
  onOpenApp?: (appId: string) => void;
}

export function Providers({
  children,
  defaultMode = 'dark',
  defaultAccent = 'blue',
  additionalCommands,
  onOpenApp,
}: ProvidersProps) {
  return (
    <ThemeProvider defaultMode={defaultMode} defaultAccent={defaultAccent}>
      <AccessibilityProvider
        additionalCommands={additionalCommands}
        onOpenApp={onOpenApp}
      >
        {children}
      </AccessibilityProvider>
    </ThemeProvider>
  );
}
