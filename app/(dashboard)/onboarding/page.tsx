'use client';

import { useState } from 'react';
import { Building2, User, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const [step, setStep] = useState<'choice' | 'business' | 'employee'>('choice');
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

      // Workspace created, refresh the page to update the session
      router.refresh();
      // Also might need to push to dashboard
      router.push('/dashboard');
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
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
            Welcome to Topify
          </h1>
          <p className="text-[var(--color-muted-foreground)]">
            Let's get your account set up
          </p>
        </div>

        {step === 'choice' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('business')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] hover:border-[#5B3DF5] hover:bg-[#5B3DF5]/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#5B3DF5]/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#5B3DF5]" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[var(--color-foreground)]">I am a Business</h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">Create a new workspace for your team</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--color-muted-foreground)] group-hover:text-[#5B3DF5] transition-colors" />
            </button>

            <button
              onClick={() => setStep('employee')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[var(--color-foreground)]">I am an Employee</h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">Wait for an invitation to join</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--color-muted-foreground)] group-hover:text-[#3B82F6] transition-colors" />
            </button>
            
            <button 
              onClick={handleSignOut}
              className="w-full mt-6 text-sm flex items-center justify-center gap-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}

        {step === 'business' && (
          <div>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Enter your business name"
                  className="w-full px-4 py-2 rounded-xl border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[#5B3DF5] transition-colors"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('choice')}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !workspaceName.trim()}
                  className="flex-1 bg-[#5B3DF5] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#4A2EE0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'employee' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-[#3B82F6]/10 rounded-full flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-[#3B82F6]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-foreground)] mb-2">Waiting for Invitation</h3>
              <p className="text-[var(--color-muted-foreground)] text-sm leading-relaxed">
                Your account is ready, but you are not assigned to a workspace yet. Please contact your administrator to invite your email address.
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-border)] transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
