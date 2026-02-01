export type WidgetSize = 'small' | 'medium' | 'large';

export type WidgetType = 'activity' | 'cost' | 'clock';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  position: WidgetPosition;
  enabled: boolean;
}

export interface WidgetData {
  type: WidgetType;
  title: string;
  icon: string;
  description: string;
  defaultSize: WidgetSize;
}

export const WIDGET_CATALOG: Record<WidgetType, WidgetData> = {
  activity: {
    type: 'activity',
    title: 'Activity',
    icon: 'activity',
    description: 'Shows last 3 agent events',
    defaultSize: 'medium',
  },
  cost: {
    type: 'cost',
    title: 'Cost',
    icon: 'coins',
    description: "Today's token spend",
    defaultSize: 'small',
  },
  clock: {
    type: 'clock',
    title: 'Clock',
    icon: 'clock',
    description: 'Current time display',
    defaultSize: 'small',
  },
};

export const WIDGET_SIZES: Record<WidgetSize, { width: number; height: number }> = {
  small: { width: 180, height: 120 },
  medium: { width: 280, height: 200 },
  large: { width: 380, height: 280 },
};
