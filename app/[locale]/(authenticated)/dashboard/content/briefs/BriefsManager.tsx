'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, Save, FileText, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface ContentBrief {
  id: string;
  title: string;
  objective: string;
  targetAudience: string;
  keyPoints: string[];
  callToAction: string;
  referenceUrls: string[];
  status: string;
  createdAt: string;
}

export default function BriefsManager() {
  const [briefs, setBriefs] = useState<ContentBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContentBrief>>({});

  useEffect(() => {
    fetchBriefs();
  }, []);

  const fetchBriefs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/content/briefs');
      if (!res.ok) throw new Error('Failed to fetch briefs');
      const data = await res.json();
      setBriefs(data.data || []);
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
      
      const res = await fetch('/api/content/briefs', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? editForm : { id: isEditing, ...editForm }),
      });

      if (!res.ok) throw new Error('Failed to save brief');
      
      await fetchBriefs();
      setIsEditing(null);
      setEditForm({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brief?')) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/content/briefs?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete brief');
      
      await fetchBriefs();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (brief: ContentBrief) => {
    const newStatus = brief.status === 'DRAFT' ? 'APPROVED' : 'DRAFT';
    try {
      setLoading(true);
      await fetch('/api/content/briefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: brief.id, status: newStatus }),
      });
      await fetchBriefs();
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
          {isEditing === 'new' ? 'Create New Brief' : 'Edit Brief'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Title</label>
            <input 
              type="text" 
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              value={editForm.title || ''}
              onChange={e => setEditForm({...editForm, title: e.target.value})}
              placeholder="e.g., Q3 Product Launch Announcement"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Objective</label>
            <textarea 
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] h-20"
              value={editForm.objective || ''}
              onChange={e => setEditForm({...editForm, objective: e.target.value})}
              placeholder="What is the goal of this content?"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Target Audience</label>
            <input 
              type="text" 
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              value={editForm.targetAudience || ''}
              onChange={e => setEditForm({...editForm, targetAudience: e.target.value})}
              placeholder="e.g., Existing customers, Marketing professionals"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Key Points (One per line)</label>
            <textarea 
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] h-32"
              value={editForm.keyPoints?.join('\n') || ''}
              onChange={e => setEditForm({...editForm, keyPoints: e.target.value.split('\n').filter(Boolean)})}
              placeholder="Point 1&#10;Point 2&#10;Point 3"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Call to Action (CTA)</label>
              <input 
                type="text" 
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                value={editForm.callToAction || ''}
                onChange={e => setEditForm({...editForm, callToAction: e.target.value})}
                placeholder="e.g., Sign up for webinar, Buy now"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Reference URLs (comma separated)</label>
              <input 
                type="text" 
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                value={editForm.referenceUrls?.join(', ') || ''}
                onChange={e => setEditForm({...editForm, referenceUrls: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                placeholder="https://example.com, https://..."
              />
            </div>
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
              Save Brief
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
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">Content Briefs</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">Plan and structure your upcoming content</p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => { setIsEditing('new'); setEditForm({}); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Brief
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
          ) : briefs.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-[var(--color-card)] rounded-xl border border-dashed border-[var(--color-border)]">
              <p className="text-[var(--color-muted-foreground)]">No briefs found. Create one to get started.</p>
            </div>
          ) : (
            briefs.map(brief => (
              <div key={brief.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-[var(--color-foreground)] line-clamp-1" title={brief.title}>
                    {brief.title}
                  </h3>
                  <button onClick={() => toggleStatus(brief)} className="text-[var(--color-muted-foreground)] hover:text-indigo-600">
                    {brief.status === 'APPROVED' ? <CheckCircle2 className="text-green-500" size={20} /> : <Circle size={20} />}
                  </button>
                </div>
                
                <p className="text-sm text-[var(--color-muted-foreground)] mb-3">
                  <span className="font-medium text-[var(--color-foreground)]">Objective:</span> {brief.objective}
                </p>
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-foreground)] mb-1">Key Points:</p>
                  <ul className="text-sm text-[var(--color-muted-foreground)] list-disc pl-5 space-y-1 mb-4">
                    {brief.keyPoints?.slice(0, 3).map((point, i) => (
                      <li key={i} className="line-clamp-1">{point}</li>
                    ))}
                    {brief.keyPoints?.length > 3 && (
                      <li className="list-none text-xs text-indigo-500 italic">+ {brief.keyPoints.length - 3} more</li>
                    )}
                  </ul>
                </div>
                
                <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {format(new Date(brief.createdAt), 'MMM d, yyyy')}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/content/create?briefId=${brief.id}`}
                      className="p-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1"
                    >
                      <FileText size={14} /> Use
                    </Link>
                    <button 
                      onClick={() => { setIsEditing(brief.id); setEditForm(brief); }}
                      className="p-1.5 text-[var(--color-muted-foreground)] hover:text-indigo-600 hover:bg-[var(--color-muted)] rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(brief.id)}
                      className="p-1.5 text-[var(--color-muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
