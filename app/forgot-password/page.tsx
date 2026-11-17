'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { toast } from 'sonner';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setSuccess(true);
        toast.success(data?.message || 'Đã gửi email hướng dẫn lấy lại mật khẩu');
      } else {
        toast.error(data?.error || `Có lỗi xảy ra (${res.status}), vui lòng thử lại`);
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

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
          Quên mật khẩu?
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Nhập email của bạn và chúng tôi sẽ gửi liên kết để lấy lại mật khẩu
        </p>
      </div>

      <div className="card-apple p-8">
        {success ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <MailCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-lg">Kiểm tra hộp thư của bạn</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến địa chỉ email <strong>{email}</strong>
            </p>
            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <Link href="/login" className="btn-primary w-full flex justify-center py-2.5">
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-foreground)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input-apple"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="btn-primary w-full flex justify-center items-center gap-2 mt-6 py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi yêu cầu'
              )}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 flex justify-center border-t border-[var(--color-border)] pt-4">
            <Link href="/login" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="fixed inset-0 bg-gradient-to-br from-[#5B3DF5]/10 via-transparent to-[#5B3DF5]/5 pointer-events-none" />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center space-y-4 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-muted-foreground)]">Đang tải...</p>
        </div>
      }>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
