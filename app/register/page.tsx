'use client';

import { useState, Suspense, useMemo } from 'react';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageContext';

import { createClient } from '@/lib/supabase/client';

// Error code → translation key mapping
const ERROR_MAP: Record<string, string> = {
  MISSING_FIELDS: 'auth.register.error_missing_fields',
  EMAIL_EXISTS: 'auth.register.error_email_exists',
  REGISTER_FAILED: 'auth.register.error_register_failed',
};

function getPasswordStrength(password: string): { level: number; key: string } {
  if (!password) return { level: 0, key: '' };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, key: 'auth.register.password_strength.weak' };
  if (score <= 3) return { level: 2, key: 'auth.register.password_strength.medium' };
  return { level: 3, key: 'auth.register.password_strength.strong' };
}

function RegisterForm() {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-emerald-500'];
  const strengthWidths = ['w-0', 'w-1/3', 'w-2/3', 'w-full'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    if (password !== confirmPassword) {
      toast.error(t('auth.register.error_password_mismatch'));
      return;
    }

    if (password.length < 8) {
      toast.error(t('auth.register.error_password_short'));
      return;
    }

    // Check for uppercase, lowercase, and number
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error(t('auth.register.error_password_weak'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success(t('auth.register.success'));
      
      // Auto login after register
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        toast.error(t('auth.register.error_auto_login'));
        router.push('/login');
      } else {
        // Sync user with Prisma database and setup workspace
        try {
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceName: `${fullName}'s Business` })
          });
        } catch (syncError) {
          console.error('Failed to sync user with database:', syncError);
        }
        window.location.href = '/dashboard';
      }

    } catch (error) {
      toast.error(t('auth.register.error_generic'));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch (error) {
      toast.error(t('auth.register.error_google'));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 animate-fade-in z-10">
      <div className="flex flex-col items-center text-center">
        <Link href="/" className="inline-flex items-center justify-center mb-5 group">
          <Image 
            src="/Topify-logo.png" 
            alt="Topify Logo" 
            width={300} 
            height={80} 
            className="h-16 w-auto object-contain" 
            priority
          />
        </Link>
        <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-foreground)]">
          {t('auth.register.title')}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          {t('auth.register.or')}{" "}
          <Link href="/login" className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
            {t('auth.register.login_link')}
          </Link>
        </p>
      </div>

      <div className="card-apple p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-[var(--color-foreground)]">
              {t('auth.register.name')}
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('auth.register.placeholder_name') as string}
              className="input-apple"
              required
              disabled={loading || googleLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-foreground)]">
              {t('auth.register.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="input-apple"
              required
              disabled={loading || googleLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-foreground)]">
              {t('auth.register.password')} ({t('auth.register.password_placeholder')})
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-apple"
              disabled={loading || googleLoading}
            />
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-1.5">
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${strengthWidths[passwordStrength.level]} ${strengthColors[passwordStrength.level]}`}
                  />
                </div>
                <p className={`text-xs font-medium ${
                  passwordStrength.level === 1 ? 'text-red-500' : 
                  passwordStrength.level === 2 ? 'text-yellow-600' : 
                  'text-emerald-600'
                }`}>
                  {t(passwordStrength.key)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-foreground)]">
              {t('auth.register.confirm_password')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-apple"
              disabled={loading || googleLoading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading || !email.trim() || !password.trim()}
            className="btn-primary w-full flex justify-center items-center gap-2 mt-6 py-2.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('auth.register.submitting')}
              </>
            ) : (
              t('auth.register.submit')
            )}
          </button>
        </form>

        <div className="relative mt-6 mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[var(--color-border)]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--color-card)] px-2 text-[var(--color-muted-foreground)]">{t('auth.register.or_continue')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="btn-secondary w-full flex justify-center items-center gap-2 py-2.5"
        >
          {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
              <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
              <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
              <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
              <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
            </svg>
          )}
          Google
        </button>

        <div className="mt-6 flex justify-center border-t border-[var(--color-border)] pt-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('auth.register.back_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="fixed inset-0 bg-gradient-to-br from-[#5B3DF5]/10 via-transparent to-[#5B3DF5]/5 pointer-events-none" />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center space-y-4 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-muted-foreground)]">{t('auth.register.loading')}</p>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
