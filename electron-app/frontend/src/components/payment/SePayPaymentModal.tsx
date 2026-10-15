import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiBaseUrl } from '../../lib/axios';

interface SePayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: 'PRO' | 'ENTERPRISE';
  onSuccess?: () => void;
}

interface OrderData {
  id: string;
  code: string;
  plan: 'PRO' | 'ENTERPRISE';
  durationMonths: number;
  originalAmount: number;
  discountPercent: number;
  amount: number;
  qrUrl: string;
  bankId: string;
  accountNo: string;
  accountName: string;
  expiresAt: string;
}

export default function SePayPaymentModal({
  isOpen,
  onClose,
  initialPlan = 'PRO',
  onSuccess,
}: SePayPaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'ENTERPRISE'>(initialPlan);
  const [durationMonths, setDurationMonths] = useState<number>(6); // Default 6 months (10% discount)
  
  const [loadingOrder, setLoadingOrder] = useState<boolean>(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Polling & countdown state
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [completedExpiresAt, setCompletedExpiresAt] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(900); // 15 mins
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial plan
  useEffect(() => {
    if (initialPlan) {
      setSelectedPlan(initialPlan);
    }
  }, [initialPlan]);

  // Create order when modal opens or plan/duration changes
  useEffect(() => {
    if (isOpen) {
      setIsCompleted(false);
      setCompletedExpiresAt(null);
      setTimeLeftSeconds(900);
      handleCreateOrder();
    } else {
      clearAllTimers();
    }

    return () => clearAllTimers();
  }, [isOpen, selectedPlan, durationMonths]);

  const clearAllTimers = () => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  };

  const handleCreateOrder = async () => {
    clearAllTimers();
    setLoadingOrder(true);
    try {
      const res = await api.post('/payment/sepay/create-order', {
        plan: selectedPlan,
        durationMonths,
      });

      if (res.data?.success && res.data.order) {
        setOrder(res.data.order);
        startPolling(res.data.order.code);
        startCountdown();
      } else {
        toast.error(res.data?.error || 'Không thể tạo đơn thanh toán');
      }
    } catch (err: any) {
      console.error('Failed to create order', err);
      toast.error('Lỗi khi kết nối cổng thanh toán SePay');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Start polling every 2.5 seconds
  const startPolling = (code: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/payment/sepay/check-status?code=${encodeURIComponent(code)}`);
        if (res.data?.success && res.data.status === 'COMPLETED') {
          clearAllTimers();
          setIsCompleted(true);
          setCompletedExpiresAt(res.data.planExpiresAt);
          toast.success('🎉 Thanh toán thành công! Gói cước đã được kích hoạt.');
          if (onSuccess) onSuccess();
        }
      } catch (err) {
        // Silent polling error
      }
    }, 2500);
  };

  // Countdown timer for 15 minutes
  const startCountdown = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearAllTimers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenInWebBrowser = () => {
    const baseUrl = getApiBaseUrl().replace('/api', '') || 'http://localhost:3000';
    const webUrl = `${baseUrl}/thanh-toan/sepay?plan=${selectedPlan}&amount=${order?.amount || 0}&code=${order?.code || ''}`;
    window.open(webUrl, '_blank');
  };

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-white to-blue-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                Thanh Toán & Gia Hạn Gói Cước
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  VietQR Tự Động
                </span>
              </h2>
              <p className="text-xs text-gray-500">Cổng thanh toán tự động SePay, kích hoạt ngay sau 3 giây</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Màn hình Chúc Mừng khi hoàn tất */}
          {isCompleted ? (
            <div className="text-center py-8 space-y-5 animate-scale-up">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg ring-8 ring-emerald-50">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900">
                  Gia Hạn Gói Cước Thành Công!
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Workspace của bạn đã được nâng cấp lên gói{' '}
                  <strong className="text-purple-600 font-bold">
                    {selectedPlan === 'ENTERPRISE' ? 'Doanh Nghiệp (Enterprise)' : 'Chuyên Nghiệp (Pro)'}
                  </strong>.
                </p>
                {completedExpiresAt && (
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl inline-block mt-2">
                    ✓ Thời hạn dịch vụ mới đến ngày: {new Date(completedExpiresAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md transition-all"
                >
                  Hoàn tất & Đóng
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Bước 1: Chọn gói & Chu kỳ */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    1. Chọn Gói Dịch Vụ & Chu Kỳ
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan('PRO')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        selectedPlan === 'PRO'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Gói Pro
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan('ENTERPRISE')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        selectedPlan === 'ENTERPRISE'
                          ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Gói Enterprise
                    </button>
                  </div>
                </div>

                {/* Tabs chọn chu kỳ */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDurationMonths(1)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      durationMonths === 1
                        ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-900">1 Tháng</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Tiêu chuẩn</div>
                    <div className="text-sm font-extrabold text-purple-700 mt-2">
                      {selectedPlan === 'ENTERPRISE' ? '1.990.000đ' : '499.000đ'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationMonths(6)}
                    className={`p-3 rounded-2xl border text-left relative transition-all ${
                      durationMonths === 6
                        ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-1.5 py-0.5 text-[9px] font-extrabold rounded-full bg-emerald-600 text-white">
                      GIẢM 10%
                    </span>
                    <div className="text-xs font-bold text-gray-900">6 Tháng</div>
                    <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Tiết kiệm 10%</div>
                    <div className="text-sm font-extrabold text-purple-700 mt-2">
                      {selectedPlan === 'ENTERPRISE' ? '10.746.000đ' : '2.694.600đ'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationMonths(12)}
                    className={`p-3 rounded-2xl border text-left relative transition-all ${
                      durationMonths === 12
                        ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-1.5 py-0.5 text-[9px] font-extrabold rounded-full bg-amber-500 text-white shadow-xs">
                      GIẢM 20%
                    </span>
                    <div className="text-xs font-bold text-gray-900">1 Năm</div>
                    <div className="text-[11px] text-amber-600 mt-0.5 font-medium">Khuyên dùng</div>
                    <div className="text-sm font-extrabold text-purple-700 mt-2">
                      {selectedPlan === 'ENTERPRISE' ? '19.104.000đ' : '4.790.400đ'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Bước 2: Hiển thị VietQR & Thông tin Chuyển Khoản */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    2. Quét Mã QR Qua Ứng Dụng Ngân Hàng
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-mono font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    Hết hạn sau: {formatCountdown(timeLeftSeconds)}
                  </div>
                </div>

                {loadingOrder ? (
                  <div className="py-16 flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-gray-500 font-medium">Đang khởi tạo mã VietQR SePay...</p>
                  </div>
                ) : order ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                    {/* Cột 1: Mã QR Image */}
                    <div className="text-center">
                      <div className="inline-block p-2 bg-white rounded-2xl border-2 border-purple-200 shadow-md">
                        <img
                          src={order.qrUrl}
                          alt="VietQR SePay"
                          className="w-48 h-48 object-contain rounded-xl"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-2 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Quét bằng bất kỳ App Ngân hàng nào
                      </p>
                    </div>

                    {/* Cột 2: Thông tin chi tiết */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-gray-100">
                        <span className="text-gray-500">Ngân hàng:</span>
                        <span className="font-bold text-gray-900">{order.bankId}</span>
                      </div>

                      <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-gray-100">
                        <span className="text-gray-500">Số tài khoản:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-900">{order.accountNo}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(order.accountNo, 'Số tài khoản')}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                            title="Sao chép"
                          >
                            {copiedField === 'Số tài khoản' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-gray-100">
                        <span className="text-gray-500">Chủ tài khoản:</span>
                        <span className="font-semibold text-gray-900">{order.accountName}</span>
                      </div>

                      <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-gray-100">
                        <span className="text-gray-500">Số tiền:</span>
                        <span className="font-bold text-sm text-purple-700">
                          {order.amount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                        <div className="flex justify-between items-center">
                          <span className="text-amber-800 font-medium">Nội dung CK (Bắt buộc):</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(order.code, 'Nội dung chuyển khoản')}
                            className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 text-[11px]"
                          >
                            {copiedField === 'Nội dung chuyển khoản' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            Sao chép
                          </button>
                        </div>
                        <div className="font-mono font-black text-amber-900 text-sm tracking-wider mt-1">
                          {order.code}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Status Listening Indicator */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
                <div className="flex items-center gap-2 text-purple-800">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
                  <span>Đang lắng nghe chuyển khoản từ SePay... (Hệ thống tự động kích hoạt)</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenInWebBrowser}
                  className="flex items-center gap-1 text-purple-700 hover:text-purple-900 font-semibold text-xs ml-2 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Mở trên web
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Thanh toán an toàn 100% qua Napas 24/7 & SePay</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
