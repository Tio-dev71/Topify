'use client';

import { useState } from 'react';
import { Loader2, LogOut, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create workspace');
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[var(--color-sidebar)] rounded-2xl shadow-sm border border-[var(--color-border)] p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#5B3DF5]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-6 h-6 text-[#5B3DF5]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
            Set up your Workspace
          </h1>
          <p className="text-[var(--color-muted-foreground)]">
            Whether you're a single creator or a team, everything happens in a workspace.
          </p>
        </div>

        <form onSubmit={handleCreateWorkspace} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. My Personal Workspace"
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[#5B3DF5] transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !workspaceName.trim()}
            className="w-full bg-[#5B3DF5] text-white px-4 py-3 rounded-xl font-medium hover:bg-[#4A2EE0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Workspace'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--color-border)] space-y-4">
          <div className="text-center">
            <p className="text-sm text-[var(--color-muted-foreground)] mb-1">
              Looking to join an existing team?
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Ask your workspace administrator for an invite link.
            </p>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
