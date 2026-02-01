'use client';

import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { WidgetContainer } from './widget-container';
import { WidgetSettings } from './widget-settings';
import { MiniActivityWidget } from './mini-activity-widget';
import { MiniCostWidget } from './mini-cost-widget';
import { ClockWidget } from './clock-widget';
import { WidgetConfig, WidgetType, WidgetSize, WIDGET_CATALOG } from './types';

// Initial widget configuration
const initialWidgets: WidgetConfig[] = [
  {
    id: 'clock-1',
    type: 'clock',
    size: 'small',
    position: { x: 50, y: 50 },
    enabled: true,
  },
  {
    id: 'cost-1',
    type: 'cost',
    size: 'medium',
    position: { x: 50, y: 200 },
    enabled: true,
  },
  {
    id: 'activity-1',
    type: 'activity',
    size: 'medium',
    position: { x: 360, y: 50 },
    enabled: true,
  },
];

// Widget content renderer
function WidgetContent({ type }: { type: WidgetType }) {
  switch (type) {
    case 'activity':
      return <MiniActivityWidget />;
    case 'cost':
      return <MiniCostWidget />;
    case 'clock':
      return <ClockWidget />;
    default:
      return null;
  }
}

export function WidgetManager() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Get enabled widgets only
  const enabledWidgets = useMemo(
    () => widgets.filter((w) => w.enabled),
    [widgets]
  );

  // Add a new widget
  const handleAddWidget = useCallback((type: WidgetType, size: WidgetSize) => {
    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      size,
      position: { x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 },
      enabled: true,
    };
    setWidgets((prev) => [...prev, newWidget]);
  }, []);

  // Remove a widget
  const handleRemoveWidget = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: false } : w))
    );
  }, []);

  // Update widget position
  const handlePositionChange = useCallback(
    (id: string, position: { x: number; y: number }) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === id ? { ...w, position } : w))
      );
    },
    []
  );

  // Update widget size
  const handleSizeChange = useCallback((id: string, size: WidgetSize) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  }, []);

  return (
    <>
      {/* Widget layer */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="relative w-full h-full">
          <AnimatePresence>
            {enabledWidgets.map((widget) => (
              <div key={widget.id} className="pointer-events-auto">
                <WidgetContainer
                  id={widget.id}
                  title={WIDGET_CATALOG[widget.type].title}
                  size={widget.size}
                  position={widget.position}
                  onPositionChange={handlePositionChange}
                  onSizeChange={handleSizeChange}
                  onRemove={handleRemoveWidget}
                >
                  <WidgetContent type={widget.type} />
                </WidgetContainer>
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Settings panel */}
      <WidgetSettings
        widgets={widgets}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
        onResizeWidget={handleSizeChange}
        isOpen={settingsOpen}
        onToggle={() => setSettingsOpen((prev) => !prev)}
      />
    </>
  );
}
