import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock, KeyRound, Eye, EyeOff, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';

export default function Login() {
  const [loginMode, setLoginMode] = useState<'email' | 'license'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });

      if (response.data?.token) {
        localStorage.setItem('topify_token', response.data.token);
        localStorage.setItem('topify_user', JSON.stringify(response.data.user));
        toast.success(`Đăng nhập thành công! Xin chào ${response.data.user?.name || email}`);
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại hoặc liên hệ Quản trị viên!'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      toast.error('Vui lòng nhập mã bản quyền.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/license-login', {
        licenseKey: licenseKey.trim(),
      });

      if (response.data?.token) {
        localStorage.setItem('topify_token', response.data.token);
        localStorage.setItem('topify_user', JSON.stringify(response.data.user));
        toast.success('Đăng nhập bản quyền thành công!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Mã bản quyền không hợp lệ. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 py-12 relative selection:bg-purple-500 selection:text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/5 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center mb-3">
            <h1 className="text-3xl font-black text-purple-600 tracking-tighter">TOPIFY</h1>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Đăng nhập hệ thống
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Nền tảng Tự động hóa Đa kênh & CRM Bán hàng thực chiến
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-purple-500/5 border border-gray-100">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setLoginMode('email')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                loginMode === 'email'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Email & Mật khẩu
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('license')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                loginMode === 'license'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Mã Bản Quyền
            </button>
          </div>

          {/* Form: Email & Password */}
          {loginMode === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email nhân viên / thành viên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="minh@topify.vn"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-gray-900"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-gray-700">
                    Mật khẩu đăng nhập
                  </label>
                  <span className="text-[11px] text-purple-600 font-medium">
                    Mặc định: Topify@123
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full pl-9 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-gray-900"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    'Đăng Nhập Ngay'
                  )}
                </button>
              </div>

              <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-[11px] text-purple-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>
                  Thành viên mới được mời vui lòng dùng mật khẩu mặc định <strong>Topify@123</strong> để đăng nhập lần đầu, hoặc yêu cầu Quản trị viên cấp lại.
                </span>
              </div>
            </form>
          ) : (
            /* Form: License Key */
            <form onSubmit={handleLicenseLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Mã Bản Quyền (License Key)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="TOP-A1B2-C3D4-E5F6"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-mono tracking-wider uppercase text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-gray-900"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !licenseKey.trim()}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang kiểm tra bản quyền...
                    </>
                  ) : (
                    'Kích Hoạt & Đăng Nhập'
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-gray-400">
                Mã bản quyền được cấp khi kích hoạt gói dịch vụ Topify
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
