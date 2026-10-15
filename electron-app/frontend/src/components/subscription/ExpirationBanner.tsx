import React from 'react';
import { Clock, AlertTriangle, AlertOctagon, ArrowRight, Sparkles } from 'lucide-react';

export interface SubscriptionStatusInfo {
  workspaceId: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  planName: string;
  status: 'ACTIVE' | 'TRIAL' | 'GRACE_PERIOD' | 'EXPIRED';
  planExpiresAt: string | null;
  daysRemaining: number;
  isGracePeriod: boolean;
  gracePeriodEndsAt: string | null;
  graceDaysRemaining: number;
  alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'GRACE';
  alertMessage?: string;
}

interface ExpirationBannerProps {
  subscription: SubscriptionStatusInfo | null;
  onRenew: () => void;
}

export default function ExpirationBanner({ subscription, onRenew }: ExpirationBannerProps) {
  if (!subscription || subscription.alertLevel === 'NONE' || subscription.plan === 'FREE') {
    return null;
  }

  const { alertLevel, alertMessage, daysRemaining, graceDaysRemaining, planName } = subscription;

  if (alertLevel === 'GRACE') {
    return (
      <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse-subtle">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-500 text-white shadow-xs shrink-0 mt-0.5">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-950 flex items-center gap-2">
              Thời Gian Ân Hạn: Gói {planName} Đã Hết Hạn
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-600 text-white">
                Còn {graceDaysRemaining} ngày ân hạn
              </span>
            </h4>
            <p className="text-xs text-red-800/90 mt-0.5">
              {alertMessage || `Gói ${planName} đã hết hạn. Bạn có 3 ngày ân hạn để gia hạn trước khi hệ thống tự động chuyển về gói Miễn Phí.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRenew}
          className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
        >
          <span>Gia hạn khẩn cấp</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (alertLevel === 'URGENT') {
    return (
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-orange-950 flex items-center gap-2">
              Gói {planName} Sắp Hết Hạn Trong Hôm Nay!
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-900">
                Gấp
              </span>
            </h4>
            <p className="text-xs text-orange-900/90 mt-0.5">
              {alertMessage || `Gói cước sẽ hết hạn vào hôm nay. Vui lòng thanh toán gia hạn ngay để không bị gián đoạn tính năng.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRenew}
          className="shrink-0 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
        >
          <span>Gia hạn ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Warning level (4 - 7 days)
  return (
    <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
            Nhắc Hạn: Gói {planName} Còn {daysRemaining} Ngày Nữa
          </h4>
          <p className="text-xs text-amber-900/90 mt-0.5">
            {alertMessage || `Gói ${planName} của bạn sắp hết hạn. Gia hạn ngay để nhận ưu đãi lên đến 20% khi chọn gói 1 năm!`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRenew}
        className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Gia hạn gói cước</span>
      </button>
    </div>
  );
}
