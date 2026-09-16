import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

export default function Login() {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setLoading(true);

    try {
      // Gọi API lên Next.js Server để lấy JWT Token
      const response = await api.post('/auth/license-login', {
        licenseKey: licenseKey.trim()
      });

      if (response.data.token) {
        // Lưu token vào localStorage
        localStorage.setItem('topify_token', response.data.token);
        localStorage.setItem('topify_user', JSON.stringify(response.data.user));
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Mã bản quyền không hợp lệ. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="fixed inset-0 bg-gradient-to-br from-[#5B3DF5]/10 via-transparent to-[#5B3DF5]/5 pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center mb-5 group">
            {/* Logo từ public folder của Next.js, copy sang public của Vite sau */}
            <h1 className="text-4xl font-extrabold text-[var(--color-primary)] tracking-tighter">TOPIFY</h1>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-foreground)]">
            Đăng nhập hệ thống
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Vui lòng nhập mã bản quyền (License Key) để tiếp tục
          </p>
        </div>

        <div className="card-apple p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="licenseKey" className="block text-sm font-medium text-[var(--color-foreground)]">
                Mã Bản Quyền (License Key)
              </label>
              <input
                id="licenseKey"
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="VD: TOP-A1B2-C3D4-E5F6"
                className="input-apple text-center font-mono tracking-widest uppercase w-full border rounded p-2"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !licenseKey.trim()}
              className="btn-primary w-full flex justify-center items-center gap-2 py-2.5 rounded bg-blue-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
