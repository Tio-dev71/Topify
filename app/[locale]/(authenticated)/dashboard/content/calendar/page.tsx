import React from 'react';
import CalendarView from './CalendarView';

export const metadata = {
  title: 'Content Calendar | Topify',
  description: 'Manage and schedule your content calendar',
};

export default function CalendarPage() {
  return (
    <div className="p-6 h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="mb-2">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">Content Calendar</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Plan, schedule, and manage your content across all platforms.
          </p>
        </div>
        
        <div className="flex-1 mt-4">
          <CalendarView />
        </div>
      </div>
    </div>
  );
}
