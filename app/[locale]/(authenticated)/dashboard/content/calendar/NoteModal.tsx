'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  onSuccess: () => void;
  existingNote?: { id: string; content: string } | null;
}

export default function NoteModal({ isOpen, onClose, date, onSuccess, existingNote }: NoteModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingNote) {
      setContent(existingNote.content);
    } else {
      setContent('');
    }
  }, [existingNote, isOpen]);

  if (!isOpen || !date) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      if (existingNote) {
        await fetch(`/api/calendar/notes/${existingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
      } else {
        await fetch('/api/calendar/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: date.toISOString(), content }),
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingNote) return;
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    setLoading(true);
    try {
      await fetch(`/api/calendar/notes/${existingNote.id}`, {
        method: 'DELETE',
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-background)] rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-[var(--color-border)]">
        <div className="flex justify-between items-center p-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
            {existingNote ? 'Edit Note' : 'Add Note'} for {format(date, 'MMM d, yyyy')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-muted)] rounded-md text-[var(--color-muted-foreground)]">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
              Note Content
            </label>
            <textarea
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] p-3 min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div className="flex justify-between items-center mt-6">
            {existingNote ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete
              </button>
            ) : (
              <div></div>
            )}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] border border-[var(--color-border)] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {existingNote ? 'Save Changes' : 'Save Note'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
