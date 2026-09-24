'use client';

import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2, Video, FileText, Image as ImageIcon } from 'lucide-react';
import NoteModal from './NoteModal';

interface PostEvent {
  id: string;
  title: string;
  start: string;
  status: string;
  type: string;
  platforms: string[];
}

interface CalendarNote {
  id: string;
  date: string;
  content: string;
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<PostEvent[]>([]);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingNote, setEditingNote] = useState<{ id: string; content: string } | null>(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const start = startOfWeek(startOfMonth(currentDate)).toISOString();
      const end = endOfWeek(endOfMonth(currentDate)).toISOString();
      
      const [eventsRes, notesRes] = await Promise.all([
        fetch(`/api/posts/calendar?start=${start}&end=${end}`),
        fetch(`/api/calendar/notes?start=${start}&end=${end}`)
      ]);
      
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }
      
      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayDoubleClick = (day: Date) => {
    setSelectedDate(day);
    setEditingNote(null);
    setIsNoteModalOpen(true);
  };

  const handleNoteClick = (e: React.MouseEvent, note: CalendarNote) => {
    e.stopPropagation();
    setSelectedDate(parseISO(note.date));
    setEditingNote({ id: note.id, content: note.content });
    setIsNoteModalOpen(true);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1 bg-[var(--color-muted)] rounded-lg p-1">
            <button 
              onClick={prevMonth}
              className="p-1.5 rounded-md hover:bg-[var(--color-background)] transition-colors text-[var(--color-foreground)]"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={today}
              className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-[var(--color-background)] transition-colors text-[var(--color-foreground)]"
            >
              Today
            </button>
            <button 
              onClick={nextMonth}
              className="p-1.5 rounded-md hover:bg-[var(--color-background)] transition-colors text-[var(--color-foreground)]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => handleDayDoubleClick(new Date())}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span>Create Note</span>
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center py-3 text-sm font-medium text-[var(--color-muted-foreground)] border-b border-[var(--color-border)] uppercase tracking-wider" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 bg-[var(--color-muted)]/30 rounded-t-xl">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        // Find events and notes for this day
        const dayEvents = events.filter(e => e.start && isSameDay(parseISO(e.start), cloneDay));
        const dayNotes = notes.filter(n => n.date && isSameDay(parseISO(n.date), cloneDay));
        
        days.push(
          <div
            className={`
              min-h-[120px] p-2 border-r border-b border-[var(--color-border)] relative transition-colors group cursor-pointer
              ${!isSameMonth(day, monthStart) ? "bg-[var(--color-muted)]/20 text-[var(--color-muted-foreground)]" : "bg-[var(--color-background)] text-[var(--color-foreground)]"}
              ${isSameDay(day, new Date()) ? "bg-indigo-50/10" : ""}
            `}
            key={day.toString()}
            onDoubleClick={() => handleDayDoubleClick(cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span className={`
                w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full
                ${isSameDay(day, new Date()) ? "bg-indigo-600 text-white" : ""}
              `}>
                {formattedDate}
              </span>
            </div>
            
            <div className="mt-2 flex flex-col gap-1 overflow-y-auto max-h-[80px] pointer-events-auto">
              {dayNotes.map(note => (
                <div 
                  key={note.id}
                  onClick={(e) => handleNoteClick(e, note)}
                  className="px-2 py-1.5 text-xs rounded shadow-sm cursor-pointer font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50 break-words"
                  title={note.content}
                >
                  {note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content}
                </div>
              ))}
              
              {dayEvents.map(event => (
                <div 
                  key={event.id}
                  className={`
                    px-2 py-1 text-xs rounded truncate font-medium
                    ${event.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                    ${event.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                    ${event.status === 'DRAFT' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : ''}
                  `}
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-l border-t border-[var(--color-border)] rounded-b-xl overflow-hidden">{rows}</div>;
  };

  return (
    <div className="flex flex-col h-full relative">
      {loading && (
        <div className="absolute inset-0 bg-[var(--color-background)]/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}
      
      {renderHeader()}
      
      <div className="flex-1 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden flex flex-col">
        {renderDays()}
        <div className="flex-1 overflow-y-auto">
          {renderCells()}
        </div>
      </div>
      
      <NoteModal 
        isOpen={isNoteModalOpen} 
        onClose={() => setIsNoteModalOpen(false)} 
        date={selectedDate} 
        onSuccess={fetchEvents}
        existingNote={editingNote}
      />
    </div>
  );
}
