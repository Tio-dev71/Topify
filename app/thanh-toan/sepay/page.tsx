'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  RefreshCw, 
  QrCode, 
  CheckCircle2, 
  Copy, 
  Check, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink 
} from 'lucide-react';
import { Suspense, useEffect, useState, useRef } from 'react';

interface OrderData {
  id: string;
  code: string;
  amount: number;
  plan: 'PRO' | 'ENTERPRISE';
  durationMonths: number;
  discountPercent: number;
  bankAccount: {
    bankId: string;
    accountNo: string;
    accountName: string;
  };
  qrUrl: string;
  expiresAt: string;
  transferInstruction: string;
}

function SePayCheckoutContent() {
  const searchParams = useSearchParams();
  const initialPlan = (searchParams.get('plan')?.toUpperCase() === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO') as 'PRO' | 'ENTERPRISE';
  const initialDuration = parseInt(searchParams.get('duration') || '1') as 1 | 6 | 12;
  const existingCode = searchParams.get('code') || '';

  const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'ENTERPRISE'>(initialPlan);
  const [durationMonths, setDurationMonths] = useState<1 | 6 | 12>(
    [1, 6, 12].includes(initialDuration) ? initialDuration : 1
  );
  
  const [loadingOrder, setLoadingOrder] = useState<boolean>(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Status & polling
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [completedExpiresAt, setCompletedExpiresAt] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(900); // 15 mins

  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch or create order
  const initOrder = async () => {
    setLoadingOrder(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/payment/sepay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          durationMonths: durationMonths,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể tạo đơn hàng thanh toán.');
      }

      setOrder(data.order);
      setTimeLeftSeconds(900);
      setIsCompleted(false);
    } catch (err: any) {
      console.error('Failed to create SePay order:', err);
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoadingOrder(false);
    }
  };

  useEffect(() => {
    initOrder();
  }, [selectedPlan, durationMonths]);

  // Polling loop
  useEffect(() => {
    if (!order?.code || isCompleted) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/sepay/check-status?code=${order.code}`);
        const data = await res.json();

        if (data.success && data.status === 'COMPLETED') {
          setIsCompleted(true);
          setCompletedExpiresAt(data.planExpiresAt || null);
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        }
      } catch (err) {
        console.error('Status check polling error:', err);
      }
    };

    pollingTimerRef.current = setInterval(checkStatus, 2500);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [order?.code, isCompleted]);

  // Countdown timer
  useEffect(() => {
    if (isCompleted) return;

    countdownTimerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isCompleted]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SUCCESS CELEBRATION VIEW
  if (isCompleted) {
    return (
      <div className="w-full max-w-lg mx-auto p-8 rounded-3xl bg-white border border-gray-100 shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Giao dịch thành công 100%
          </span>
          <h2 className="text-2xl font-black text-gray-900">
            Kích Hoạt Thuê Bao Thành Công!
          </h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            Hệ thống đã nhận được thanh toán qua VietQR. Không gian làm việc của bạn đã được nâng cấp lên gói{' '}
            <strong className="text-purple-600">{order?.plan}</strong>.
          </p>
        </div>

        {completedExpiresAt && (
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 space-y-1">
            <span className="text-gray-500">Thời hạn sử dụng dịch vụ mới:</span>
            <div className="font-bold text-sm text-purple-700">
              {new Date(completedExpiresAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <p className="text-[11px] text-purple-600">
              (Đã cộng dồn chu kỳ {order?.durationMonths} tháng từ thời điểm hết hạn trước)
            </p>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex-1 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            Về Bảng Điều Khiển
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/settings?tab=billing"
            className="py-3 px-5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors flex items-center justify-center"
          >
            Xem Hóa Đơn VAT
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại bảng điều khiển
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          Cổng thanh toán tự động VietQR SePay
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              Thanh Toán Trực Tuyến
            </span>
            <h1 className="text-xl font-bold mt-1">Nâng cấp & Gia hạn Gói Dịch Vụ</h1>
            <p className="text-xs text-purple-100 mt-0.5">Quét mã QR bằng ứng dụng ngân hàng bất kỳ để kích hoạt ngay</p>
          </div>

          <div className="mt-3 sm:mt-0 flex items-center justify-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-mono">
            <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Mã hết hạn trong: <strong>{formatCountdown(timeLeftSeconds)}</strong></span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Plan Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              1. Chọn gói dịch vụ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlan('PRO')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedPlan === 'PRO'
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">Gói Chuyên Nghiệp (PRO)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Phổ biến</span>
                </div>
                <div className="text-purple-600 font-extrabold text-base mt-1">499.000đ <span className="text-xs text-gray-500 font-normal">/tháng</span></div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('ENTERPRISE')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedPlan === 'ENTERPRISE'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">Doanh Nghiệp (ENTERPRISE)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">VIP</span>
                </div>
                <div className="text-indigo-700 font-extrabold text-base mt-1">1.990.000đ <span className="text-xs text-gray-500 font-normal">/tháng</span></div>
              </button>
            </div>
          </div>

          {/* Billing Cycle Options (1 Month, 6 Months -10%, 12 Months -20%) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              2. Chu kỳ thanh toán (Ưu đãi chiết khấu)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { months: 1 as const, label: '1 Tháng', discount: 'Chuẩn', discountClass: 'bg-gray-100 text-gray-600' },
                { months: 6 as const, label: '6 Tháng', discount: 'Tiết kiệm 10%', discountClass: 'bg-emerald-100 text-emerald-700 font-bold' },
                { months: 12 as const, label: '1 Năm (12 Tháng)', discount: 'Tiết kiệm 20%', discountClass: 'bg-amber-100 text-amber-800 font-bold' },
              ].map((cycle) => (
                <button
                  key={cycle.months}
                  type="button"
                  onClick={() => setDurationMonths(cycle.months)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 ${
                    durationMonths === cycle.months
                      ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="font-bold text-xs text-gray-900">{cycle.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${cycle.discountClass}`}>
                    {cycle.discount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Details & VietQR Code */}
          {loadingOrder ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500 font-medium">Đang khởi tạo mã giao dịch VietQR SePay...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
              <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
              <button
                type="button"
                onClick={initOrder}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
              >
                Thử lại
              </button>
            </div>
          ) : order ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2 border-t border-gray-100">
              {/* Left Column: QR Code */}
              <div className="flex flex-col items-center text-center space-y-3 bg-gray-50/60 p-5 rounded-2xl border border-gray-100">
                <div className="relative p-2.5 bg-white rounded-2xl shadow-sm border border-gray-200">
                  <img
                    src={order.qrUrl}
                    alt="VietQR SePay"
                    className="w-52 h-52 object-contain rounded-xl"
                  />
                  <div className="absolute inset-x-0 bottom-3 flex justify-center">
                    <span className="text-[10px] font-bold bg-purple-600 text-white px-2.5 py-0.5 rounded-full shadow">
                      Quét mã tự điền
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-purple-700 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Hệ thống tự động lắng nghe giao dịch</span>
                </div>
              </div>

              {/* Right Column: Bank Details & Copy */}
              <div className="space-y-3 text-xs">
                {/* Bank Name */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Ngân hàng nhận:</span>
                    <strong className="text-gray-900 text-sm">{order.bankAccount.bankId}</strong>
                  </div>
                  <span className="px-2 py-1 bg-white rounded-lg text-[10px] font-semibold text-gray-500 border border-gray-200">
                    Napas247
                  </span>
                </div>

                {/* Account Number */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Số tài khoản:</span>
                    <strong className="text-gray-900 font-mono text-sm">{order.bankAccount.accountNo}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.bankAccount.accountNo, 'acc')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-purple-50 hover:text-purple-600 font-medium transition-colors"
                  >
                    {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'acc' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>

                {/* Account Name */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Chủ tài khoản:</span>
                    <strong className="text-gray-900 text-sm uppercase">{order.bankAccount.accountName}</strong>
                  </div>
                </div>

                {/* Amount */}
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-purple-600 block text-[11px]">Số tiền thanh toán:</span>
                    <strong className="text-purple-700 font-black text-base">
                      {order.amount.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.amount.toString(), 'amount')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 font-medium transition-colors"
                  >
                    {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>

                {/* Transfer Content (Code) */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-amber-800 block text-[11px] font-bold">
                      Nội dung chuyển khoản (Bắt buộc):
                    </span>
                    <strong className="text-amber-950 font-mono font-black text-sm tracking-wide">
                      {order.code}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.code, 'code')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold transition-colors shadow-xs"
                  >
                    {copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'code' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Notice Card */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Lưu ý quan trọng:
            </span>
            <p className="text-blue-800">
              Vui lòng giữ nguyên nội dung chuyển khoản <strong className="font-mono">{order?.code || 'TPF...'}</strong> để SePay khớp lệnh tự động. Sau khi chuyển tiền xong, hệ thống sẽ xác nhận và nâng cấp tức thì trong vòng 3-10 giây.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SePayCheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="w-full max-w-2xl mx-auto h-[600px] bg-white rounded-3xl animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <SePayCheckoutContent />
      </Suspense>
    </div>
  );
}
