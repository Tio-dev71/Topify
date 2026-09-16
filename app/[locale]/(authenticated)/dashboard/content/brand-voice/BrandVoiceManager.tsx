'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, Check, X, Save } from 'lucide-react';

interface BrandVoice {
  id: string;
  name: string;
  tone: string;
  style: string;
  targetAudience: string;
  keywords: string[];
  avoidWords: string[];
  isDefault: boolean;
}

export default function BrandVoiceManager() {
  const [voices, setVoices] = useState<BrandVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BrandVoice>>({});

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/content/brand-voice');
      if (!res.ok) throw new Error('Failed to fetch brand voices');
      const data = await res.json();
      setVoices(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const isNew = isEditing === 'new';
      
      const res = await fetch('/api/content/brand-voice', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? editForm : { id: isEditing, ...editForm }),
      });

      if (!res.ok) throw new Error('Failed to save brand voice');
      
      await fetchVoices();
      setIsEditing(null);
      setEditForm({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand voice?')) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/content/brand-voice?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete brand voice');
      
      await fetchVoices();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    return (
      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-foreground)]">
          {isEditing === 'new' ? 'Create New Brand Voice' : 'Edit Brand Voice'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Name</label>
            <input 
              type="text" 
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              value={editForm.name || ''}
              onChange={e => setEditForm({...editForm, name: e.target.value})}
              placeholder="e.g., Professional, Playful, Gen Z"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Tone</label>
              <input 
                type="text" 
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                value={editForm.tone || ''}
                onChange={e => setEditForm({...editForm, tone: e.target.value})}
                placeholder="e.g., Authoritative, Friendly"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Target Audience</label>
              <input 
                type="text" 
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                value={editForm.targetAudience || ''}
                onChange={e => setEditForm({...editForm, targetAudience: e.target.value})}
                placeholder="e.g., Small Business Owners"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Style Guidelines</label>
            <textarea 
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] h-24"
              value={editForm.style || ''}
              onChange={e => setEditForm({...editForm, style: e.target.value})}
              placeholder="Detailed guidelines on how to write for this voice..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Keywords (comma separated)</label>
              <input 
                type="text" 
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                value={editForm.keywords?.join(', ') || ''}
                onChange={e => setEditForm({...editForm, keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                placeholder="innovative, growth, success"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Avoid Words (comma separated)</label>
              <input 
                type="text" 
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                value={editForm.avoidWords?.join(', ') || ''}
                onChange={e => setEditForm({...editForm, avoidWords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                placeholder="cheap, maybe, try"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isDefault"
              checked={editForm.isDefault || false}
              onChange={e => setEditForm({...editForm, isDefault: e.target.checked})}
              className="rounded border-[var(--color-border)]"
            />
            <label htmlFor="isDefault" className="text-sm font-medium text-[var(--color-foreground)]">Set as default voice</label>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
            <button 
              onClick={() => { setIsEditing(null); setEditForm({}); }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Save Voice
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">Brand Voices</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">Manage your AI writing styles and guidelines</p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => { setIsEditing('new'); setEditForm({}); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Voice
          </button>
        )}
      </div>

      {isEditing && renderForm()}

      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : voices.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-[var(--color-card)] rounded-xl border border-dashed border-[var(--color-border)]">
              <p className="text-[var(--color-muted-foreground)]">No brand voices found. Create one to get started.</p>
            </div>
          ) : (
            voices.map(voice => (
              <div key={voice.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                {voice.isDefault && (
                  <span className="absolute -top-2 -right-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    Default
                  </span>
                )}
                
                <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">{voice.name}</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] text-xs rounded-md">
                    Tone: {voice.tone}
                  </span>
                  <span className="px-2 py-1 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] text-xs rounded-md truncate max-w-[150px]">
                    Audience: {voice.targetAudience}
                  </span>
                </div>
                
                <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-3 mb-4 h-[60px]">
                  {voice.style}
                </p>
                
                <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setIsEditing(voice.id); setEditForm(voice); }}
                    className="p-2 text-[var(--color-muted-foreground)] hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(voice.id)}
                    className="p-2 text-[var(--color-muted-foreground)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
