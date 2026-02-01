export { OSShell } from './os-shell';
export { Desktop } from './desktop';
export { Dock } from './dock';
export { MenuBar } from './menu-bar';
export { Spotlight } from './spotlight';
export { Window } from './window';
export * from './types';

// Keyboard & Accessibility
export {
  CommandPalette,
  useDefaultCommands,
  ShortcutHint,
  type CommandItem,
} from './command-palette';

export { ShortcutsPanel } from './shortcuts-panel';

export {
  AccessibilityProvider,
  useAccessibility,
  type AccessibilityProviderProps,
} from './accessibility-provider';

export { Providers } from './providers';
