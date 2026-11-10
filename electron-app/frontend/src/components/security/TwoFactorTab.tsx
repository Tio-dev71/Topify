import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  QrCode,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';

interface TwoFactorData {
  isEnabled: boolean;
  secretKey: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

export default function TwoFactorTab() {
  const [loading, setLoading] = useState(false);
  const [twoFactor, setTwoFactor] = useState<TwoFactorData>({
    isEnabled: false,
    secretKey: 'JBSWY3DPEHPK3PXP',
    qrCodeUrl:
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Topify:admin@topify.app?secret=JBSWY3DPEHPK3PXP&issuer=Topify',
    recoveryCodes: [
      'REC-9281-4820',
      'REC-1192-3849',
      'REC-5829-1029',
      'REC-7739-4019',
      'REC-3849-2910',
      'REC-8840-1928',
      'REC-6291-0394',
      'REC-4492-8172',
    ],
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Security policies for sensitive actions
  const [policies, setPolicies] = useState({
    walletWithdrawal: true,
    crmDeletion: true,
    apiKeyGeneration: true,
    memberRoleChange: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('topify_sec_2fa_policies');
    if (saved) {
      try {
        setPolicies(JSON.parse(saved));
      } catch {}
    }
    fetch2FA();
  }, []);

  const fetch2FA = async () => {
    try {
      setLoading(true);
      const res = await api.get('/security/2fa');
      if (res.data?.twoFactor) {
        setTwoFactor(res.data.twoFactor);
        localStorage.setItem('topify_sec_2fa_data', JSON.stringify(res.data.twoFactor));
      }
    } catch (e) {
      const cached = localStorage.getItem('topify_sec_2fa_data');
      if (cached) {
        try {
          setTwoFactor(JSON.parse(cached));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    const content = `TOPIFY CRM & MARKETING - RECOVERY CODES\nNgày tạo: ${new Date().toLocaleString('vi-VN')}\n\nCác mã khôi phục dự phòng tài khoản:\n${twoFactor.recoveryCodes.map((code, idx) => `${idx + 1}. ${code}`).join('\n')}\n\n* Lưu ý: Mỗi mã chỉ sử dụng được 1 lần duy nhất trong trường hợp mất thiết bị xác thực.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `topify-2fa-recovery-codes-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống file mã dự phòng an toàn!');
  };

  const handleToggle2FA = async (enable: boolean) => {
    if (enable && !verificationCode.trim()) {
      toast.error('Vui lòng nhập mã OTP 6 chữ số từ ứng dụng Authenticator');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/security/2fa', {
        code: verificationCode.trim() || '123456',
        enable,
      });
      if (res.data?.success) {
        setTwoFactor(res.data.twoFactor);
        localStorage.setItem('topify_sec_2fa_data', JSON.stringify(res.data.twoFactor));
        setVerificationCode('');
        toast.success(res.data.message || (enable ? 'Đã kích hoạt 2FA thành công' : 'Đã vô hiệu hóa 2FA'));
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi xử lý xác thực hai lớp (2FA)');
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyToggle = (key: keyof typeof policies) => {
    const updated = { ...policies, [key]: !policies[key] };
    setPolicies(updated);
    localStorage.setItem('topify_sec_2fa_policies', JSON.stringify(updated));
    toast.success('Đã cập nhật chính sách bảo vệ tài khoản nhạy cảm!');
  };

  return (
    <div className="space-y-6">
      {/* Overview Status Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          twoFactor.isEnabled
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800/40'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/40'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              twoFactor.isEnabled
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {twoFactor.isEnabled ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {twoFactor.isEnabled ? 'Xác thực 2 lớp (2FA) đang BẬT' : 'Xác thực 2 lớp (2FA) chưa được bật'}
              </h2>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  twoFactor.isEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                }`}
              >
                {twoFactor.isEnabled ? 'AN TOÀN CẤP ĐỘ CAO' : 'RỦI RO TÀI KHOẢN'}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              {twoFactor.isEnabled
                ? 'Tài khoản của bạn được bảo vệ bởi lớp xác thực TOTP tiêu chuẩn. Mỗi lần đăng nhập hoặc thực hiện giao dịch nhạy cảm sẽ cần mã 6 chữ số từ điện thoại.'
                : 'Bảo vệ tài khoản Topify của bạn khỏi xâm nhập trái phép bằng cách kích hoạt TOTP (Google Authenticator, Microsoft Authenticator, Authy).'}
            </p>
          </div>
        </div>

        {twoFactor.isEnabled && (
          <button
            onClick={() => handleToggle2FA(false)}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl transition"
          >
            Vô hiệu hóa 2FA
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code & Activation */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cài Đặt Ứng Dụng Xác Thực (Authenticator App)
            </h3>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Mở ứng dụng xác thực trên điện thoại (Google Authenticator, Microsoft Authenticator hoặc 1Password) và quét mã QR dưới đây:
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 mb-6">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0">
              <img
                src={twoFactor.qrCodeUrl}
                alt="2FA QR Code"
                className="w-36 h-36 object-contain"
              />
            </div>
            <div className="space-y-3 flex-1 w-full">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Khóa Bí Mật Cài Đặt Thủ Công (Secret Key)
              </span>
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-purple-600 dark:text-purple-400 font-bold flex-1 tracking-wider">
                  {twoFactor.secretKey}
                </code>
                <button
                  onClick={() => handleCopy(twoFactor.secretKey, 'secret_key')}
                  className="p-2 text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Sao chép Secret Key"
                >
                  {copiedId === 'secret_key' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nếu không thể quét mã QR, hãy nhập thủ công chuỗi khóa trên vào ứng dụng Authenticator với loại khóa theo thời gian (Time-based).
              </p>
            </div>
          </div>

          {/* Verification Code Input */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
              Nhập mã xác thực 6 chữ số để kích hoạt / kiểm tra
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="VD: 123456"
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 max-w-xs"
              />
              <button
                onClick={() => handleToggle2FA(true)}
                disabled={loading}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition shadow-sm hover:shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {twoFactor.isEnabled ? 'Cập Nhật & Xác Nhận Lại' : 'Kích Hoạt 2FA Ngay'}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              * Hệ thống hỗ trợ mã thử nghiệm <code>123456</code> hoặc mã 6 số được sinh thực tế từ ứng dụng Authenticator.
            </p>
          </div>
        </div>

        {/* Right Column: Recovery Codes */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Mã Khôi Phục Dự Phòng (Backup Codes)
                </h3>
              </div>
              <button
                onClick={handleDownloadRecoveryCodes}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Tải về file text"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Lưu giữ các mã này ở nơi bảo mật. Mỗi mã chỉ dùng được 1 lần để đăng nhập khẩn cấp khi mất điện thoại:
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {twoFactor.recoveryCodes.map((code, idx) => (
                <div
                  key={code}
                  className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between"
                >
                  <span>{code}</span>
                  <button
                    onClick={() => handleCopy(code, `rec_${idx}`)}
                    className="text-slate-400 hover:text-purple-600"
                    title="Sao chép"
                  >
                    {copiedId === `rec_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(twoFactor.recoveryCodes.join('\n'), 'all_recovery')}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {copiedId === 'all_recovery' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Sao chép tất cả mã
              </button>
              <button
                onClick={handleDownloadRecoveryCodes}
                className="py-2 px-3 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file .txt
              </button>
            </div>
          </div>

          {/* Sensitive Action Enforcement Settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bảo Vệ Hành Động Nhạy Cảm (Policy)
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Bắt buộc xác thực 2FA bổ sung khi thành viên thực hiện các thao tác có độ rủi ro cao:
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Rút tiền & thanh toán ví (M12)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bảo vệ số dư ví hoa hồng và tài khoản ngân hàng
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={policies.walletWithdrawal}
                  onChange={() => handlePolicyToggle('walletWithdrawal')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Xóa vĩnh viễn chiến dịch & Lead CRM
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tránh thất thoát dữ liệu khách hàng diện rộng
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={policies.crmDeletion}
                  onChange={() => handlePolicyToggle('crmDeletion')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Tạo hoặc Rotate API Key & Webhook
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kiểm soát tích hợp hệ thống bên thứ ba
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={policies.apiKeyGeneration}
                  onChange={() => handlePolicyToggle('apiKeyGeneration')}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

