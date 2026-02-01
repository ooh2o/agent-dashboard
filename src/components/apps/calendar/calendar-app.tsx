'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CronJobList } from './cron-job-list';
import { EventList } from './event-list';
import { ReminderCreator } from './reminder-creator';
import { CronJobModal } from './cron-job-modal';
import { CalendarGrid } from './calendar-grid';

export function CalendarApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showCronModal, setShowCronModal] = useState(false);
  const [showReminderCreator, setShowReminderCreator] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur h-full flex flex-col">
        <CardHeader className="pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-medium">
              <Calendar className="h-5 w-5 text-red-400" />
              Calendar & Cron
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReminderCreator(true)}
                className="border-zinc-700"
              >
                <Clock className="h-4 w-4 mr-1" />
                Reminder
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowCronModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Job
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Left sidebar - Calendar mini + events */}
            <div className="w-72 border-r border-zinc-800 flex flex-col">
              {/* Mini calendar header */}
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-100">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => navigateMonth('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CalendarGrid
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="w-full mt-2 text-blue-400"
                >
                  Today
                </Button>
              </div>

              {/* Upcoming events */}
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <EventList selectedDate={selectedDate} />
                </div>
              </ScrollArea>
            </div>

            {/* Right side - Cron jobs */}
            <div className="flex-1 flex flex-col">
              <Tabs defaultValue="jobs" className="flex-1 flex flex-col">
                <div className="px-4 pt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="jobs" className="flex-1">Cron Jobs</TabsTrigger>
                    <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="jobs" className="flex-1 overflow-hidden m-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <CronJobList onEdit={() => setShowCronModal(true)} />
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="history" className="flex-1 overflow-hidden m-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <JobHistory />
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      <CronJobModal open={showCronModal} onOpenChange={setShowCronModal} />
      <ReminderCreator open={showReminderCreator} onOpenChange={setShowReminderCreator} />
    </>
  );
}

function JobHistory() {
  const history = [
    { id: '1', job: 'Daily Backup', time: '2 hours ago', status: 'success', duration: '45s' },
    { id: '2', job: 'Memory Cleanup', time: '4 hours ago', status: 'success', duration: '12s' },
    { id: '3', job: 'Channel Sync', time: '6 hours ago', status: 'error', duration: '2s' },
    { id: '4', job: 'Daily Backup', time: 'Yesterday', status: 'success', duration: '43s' },
    { id: '5', job: 'Weekly Report', time: '2 days ago', status: 'success', duration: '1m 23s' },
  ];

  return (
    <div className="space-y-2">
      {history.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                item.status === 'success' ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <div>
              <p className="text-sm text-zinc-200">{item.job}</p>
              <p className="text-xs text-zinc-500">{item.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">{item.duration}</span>
            <Badge
              variant="secondary"
              className={
                item.status === 'success'
                  ? 'bg-green-400/10 text-green-400'
                  : 'bg-red-400/10 text-red-400'
              }
            >
              {item.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
