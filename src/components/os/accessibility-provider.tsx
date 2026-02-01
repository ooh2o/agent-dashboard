'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { KeyboardShortcutProvider, useKeyboardShortcuts, MOD_KEY } from '@/hooks/use-keyboard-shortcuts';
import { FocusManagerProvider, useFocusManager, useLiveRegion, SkipLink } from '@/hooks/use-focus-manager';
import { CommandPalette, useDefaultCommands, CommandItem } from './command-palette';
import { ShortcutsPanel } from './shortcuts-panel';
import { useTheme } from './theme-provider';

interface AccessibilityContextValue {
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  isCommandPaletteOpen: boolean;
  openShortcutsPanel: () => void;
  closeShortcutsPanel: () => void;
  isShortcutsPanelOpen: boolean;
  announce: (message: string) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

interface AccessibilityProviderInnerProps {
  children: React.ReactNode;
  additionalCommands?: CommandItem[];
  onOpenApp?: (appId: string) => void;
}

function AccessibilityProviderInner({
  children,
  additionalCommands = [],
  onOpenApp,
}: AccessibilityProviderInnerProps) {
  const { toggleMode: onToggleTheme } = useTheme();
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isShortcutsPanelOpen, setShortcutsPanelOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const { announce, LiveRegion } = useLiveRegion();
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const { focusNextWindow, focusPrevWindow } = useFocusManager();

  // Detect system preference for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply reduced motion class to document
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  }, [reducedMotion]);

  // Apply high contrast class to document
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
    announce('Command palette opened');
  }, [announce]);

  const closeCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const openShortcutsPanel = useCallback(() => {
    setShortcutsPanelOpen(true);
    announce('Keyboard shortcuts panel opened');
  }, [announce]);

  const closeShortcutsPanel = useCallback(() => {
    setShortcutsPanelOpen(false);
  }, []);

  // Register global shortcuts
  useEffect(() => {
    // Command palette (Cmd/Ctrl + K)
    registerShortcut({
      id: 'global-command-palette',
      keys: [MOD_KEY, 'k'],
      label: 'Open Command Palette',
      description: 'Search and execute commands',
      category: 'Navigation',
      action: openCommandPalette,
      global: true,
    });

    // Close window (Cmd/Ctrl + W)
    registerShortcut({
      id: 'global-close-window',
      keys: [MOD_KEY, 'w'],
      label: 'Close Window',
      description: 'Close the focused window',
      category: 'Navigation',
      action: () => {
        // This would be connected to the window manager
        announce('Window closed');
      },
      global: true,
    });

    // Keyboard shortcuts help (Cmd/Ctrl + /)
    registerShortcut({
      id: 'global-show-shortcuts',
      keys: [MOD_KEY, '/'],
      label: 'Show Keyboard Shortcuts',
      description: 'View all available shortcuts',
      category: 'Help',
      action: openShortcutsPanel,
      global: true,
    });

    // Cycle windows (Cmd/Ctrl + `)
    registerShortcut({
      id: 'global-cycle-windows',
      keys: [MOD_KEY, '`'],
      label: 'Cycle Windows',
      description: 'Switch to next window',
      category: 'Navigation',
      action: focusNextWindow,
      global: true,
    });

    // Cycle windows reverse (Cmd/Ctrl + Shift + `)
    registerShortcut({
      id: 'global-cycle-windows-reverse',
      keys: [MOD_KEY, 'Shift', '`'],
      label: 'Cycle Windows (Reverse)',
      description: 'Switch to previous window',
      category: 'Navigation',
      action: focusPrevWindow,
      global: true,
    });

    // Close with Escape
    registerShortcut({
      id: 'global-escape',
      keys: ['Escape'],
      label: 'Close',
      description: 'Close dialog or panel',
      category: 'Navigation',
      action: () => {
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else if (isShortcutsPanelOpen) {
          closeShortcutsPanel();
        }
      },
      global: true,
    });

    return () => {
      unregisterShortcut('global-command-palette');
      unregisterShortcut('global-close-window');
      unregisterShortcut('global-show-shortcuts');
      unregisterShortcut('global-cycle-windows');
      unregisterShortcut('global-cycle-windows-reverse');
      unregisterShortcut('global-escape');
    };
  }, [
    registerShortcut,
    unregisterShortcut,
    openCommandPalette,
    openShortcutsPanel,
    closeCommandPalette,
    closeShortcutsPanel,
    focusNextWindow,
    focusPrevWindow,
    isCommandPaletteOpen,
    isShortcutsPanelOpen,
    announce,
  ]);

  // Default commands for the command palette
  const defaultCommands = useDefaultCommands({
    openApp: onOpenApp,
    toggleTheme: onToggleTheme,
    showShortcuts: openShortcutsPanel,
  });

  const allCommands = useMemo(() => [
    ...defaultCommands,
    ...additionalCommands,
  ], [defaultCommands, additionalCommands]);

  const value = useMemo(() => ({
    openCommandPalette,
    closeCommandPalette,
    isCommandPaletteOpen,
    openShortcutsPanel,
    closeShortcutsPanel,
    isShortcutsPanelOpen,
    announce,
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast,
  }), [
    openCommandPalette,
    closeCommandPalette,
    isCommandPaletteOpen,
    openShortcutsPanel,
    closeShortcutsPanel,
    isShortcutsPanelOpen,
    announce,
    reducedMotion,
    highContrast,
  ]);

  return (
    <AccessibilityContext.Provider value={value}>
      {/* Skip links for keyboard users */}
      <SkipLink targetId="main-content">Skip to main content</SkipLink>

      {/* Live region for announcements */}
      <LiveRegion />

      {/* Main content */}
      {children}

      {/* Command palette overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        commands={allCommands}
      />

      {/* Shortcuts panel overlay */}
      <ShortcutsPanel
        isOpen={isShortcutsPanelOpen}
        onClose={closeShortcutsPanel}
      />
    </AccessibilityContext.Provider>
  );
}

export interface AccessibilityProviderProps {
  children: React.ReactNode;
  additionalCommands?: CommandItem[];
  onOpenApp?: (appId: string) => void;
}

export function AccessibilityProvider(props: AccessibilityProviderProps) {
  return (
    <KeyboardShortcutProvider>
      <FocusManagerProvider>
        <AccessibilityProviderInner {...props} />
      </FocusManagerProvider>
    </KeyboardShortcutProvider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
