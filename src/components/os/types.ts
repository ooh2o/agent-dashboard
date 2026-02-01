export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  component?: React.ComponentType;
  shortcut?: string;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
  previousState?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WindowManagerState {
  windows: WindowState[];
  activeWindowId: string | null;
  nextZIndex: number;

  // Actions
  openWindow: (appId: string, title: string, options?: Partial<WindowState>) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  getWindowsByApp: (appId: string) => WindowState[];
  isAppRunning: (appId: string) => boolean;
}

export interface DockItem extends AppDefinition {
  isRunning: boolean;
  windowCount: number;
}

export interface SpotlightResult {
  id: string;
  type: 'app' | 'action' | 'file' | 'setting';
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
}
