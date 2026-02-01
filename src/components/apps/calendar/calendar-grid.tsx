'use client';

import { motion } from 'framer-motion';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function CalendarGrid({ currentDate, selectedDate, onSelectDate }: CalendarGridProps) {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const calendarDays: (number | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      calendarDays.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }

    return calendarDays;
  };

  const calendarDays = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Days with events (mock data)
  const daysWithEvents = [5, 12, 15, 20, 25];
  const hasEvent = (day: number) => daysWithEvents.includes(day);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map((day) => (
          <div
            key={day}
            className="text-xs text-zinc-500 text-center py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div key={index} className="aspect-square">
            {day && (
              <motion.button
                onClick={() => {
                  const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  onSelectDate(newDate);
                }}
                className={`w-full h-full flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative ${
                  isSelected(day)
                    ? 'bg-blue-500 text-white'
                    : isToday(day)
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {day}
                {hasEvent(day) && !isSelected(day) && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-400" />
                )}
              </motion.button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
