'use client';

import { useState, Suspense, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  useEffect(() => {
    async function checkAuthOrToken() {
      if (token) {
        setError(null);
        return;
      }

      const code = searchParams.get('code');
      const supabase = createClient();

      if (code) {
        try {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!exErr) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
              setUserEmail(user.email);
              setError(null);
              return;
            }
          }
        } catch {}
      }

      // Check existing Supabase session (e.g. redirected from /auth/callback)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
          setError(null);
          return;
        }
      } catch {}

      // Check hash fragment (#access_token=...)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        if (accessToken) {
          try {
            const { data: { user } } = await supabase.auth.getUser(accessToken);
            if (user?.email) {
              setUserEmail(user.email);
              setError(null);
              return;
            }
          } catch {}
        }
      }

      setError('Đường dẫn không hợp lệ hoặc đã hết hạn.');
    }

    checkAuthOrToken();
  }, [token, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token && !userEmail) {
      toast.error('Thiếu mã xác thực hoặc phiên đặt lại mật khẩu.');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return;
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      if (userEmail) {
        await supabase.auth.updateUser({ password }).catch(() => null);
      }

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token || undefined, 
          email: userEmail || undefined, 
          password 
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setSuccess(true);
        toast.success(data?.message || 'Mật khẩu đã được đặt lại thành công!');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        toast.error(data?.error || `Có lỗi xảy ra (${res.status}), vui lòng thử lại`);
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="card-apple p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 font-bold text-xl">!</span>
          </div>
          <h3 className="font-semibold text-lg text-[var(--color-error)]">Lỗi</h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">{error}</p>
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <Link href="/forgot-password" className="btn-primary w-full flex justify-center py-2.5">
              Yêu cầu link mới
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 animate-fade-in">
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
          Đặt lại mật khẩu
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Vui lòng nhập mật khẩu mới của bạn
        </p>
      </div>

      <div className="card-apple p-8">
        {success ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-lg text-emerald-600">Thành công!</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Mật khẩu của bạn đã được thay đổi. Đang tự động chuyển về trang đăng nhập...
            </p>
            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <Link href="/login" className="btn-primary w-full flex justify-center py-2.5">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-foreground)]">
                Mật khẩu mới
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-apple"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-foreground)]">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-apple"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="btn-primary w-full flex justify-center items-center gap-2 mt-6 py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đổi mật khẩu'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="fixed inset-0 bg-gradient-to-br from-[#5B3DF5]/10 via-transparent to-[#5B3DF5]/5 pointer-events-none" />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center space-y-4 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-muted-foreground)]">Đang tải...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
