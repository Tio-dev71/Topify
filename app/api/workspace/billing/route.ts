import { NextRequest, NextResponse } from 'next/server';
import { calculateProratedBilling, PLAN_LIMITS } from '@/lib/workspace/quota';

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  planName: string;
  amount: number;
  period: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  paidAt: string;
  paymentMethod: string;
  downloadUrl?: string;
}

let billingHistory: InvoiceItem[] = [
  {
    id: 'inv_rec_1',
    invoiceNumber: 'INV-2026-0048',
    planName: 'Gói Chuyên Nghiệp (Pro Plan) - 1 Tháng',
    amount: 499000,
    period: '01/10/2026 - 01/11/2026',
    status: 'PAID',
    paidAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    paymentMethod: 'Thẻ Visa kết thúc **4242',
  },
  {
    id: 'inv_rec_2',
    invoiceNumber: 'INV-2026-0012',
    planName: 'Gói Chuyên Nghiệp (Pro Plan) - 1 Tháng',
    amount: 499000,
    period: '01/09/2026 - 01/10/2026',
    status: 'PAID',
    paidAt: new Date(Date.now() - 44 * 24 * 3600 * 1000).toISOString(),
    paymentMethod: 'Ví MoMo / Chuyển khoản',
  },
];

import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    let workspace = await prisma.workspace.findFirst({
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    let invoicesList: InvoiceItem[] = billingHistory;
    if (workspace?.invoices && workspace.invoices.length > 0) {
      invoicesList = workspace.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        planName: inv.planName,
        amount: inv.amount,
        period: `${inv.periodStart.toLocaleDateString('vi-VN')} - ${inv.periodEnd.toLocaleDateString('vi-VN')}`,
        status: inv.status as 'PAID' | 'PENDING' | 'FAILED',
        paidAt: inv.paidAt.toISOString(),
        paymentMethod: inv.paymentMethod,
      }));
    }

    return NextResponse.json({
      success: true,
      currentPlan: workspace?.plan || 'PRO',
      planExpiresAt: workspace?.planExpiresAt?.toISOString() || null,
      subscriptionStatus: workspace?.subscriptionStatus || 'ACTIVE',
      gracePeriodEndsAt: workspace?.gracePeriodEndsAt?.toISOString() || null,
      isTrial: workspace?.subscriptionStatus === 'TRIAL',
      trialEndsAt: null,
      invoices: invoicesList,
      plans: PLAN_LIMITS,
    });
  } catch (error: any) {
    console.error('[API_BILLING_GET]', error);
    return NextResponse.json({ error: 'Không thể tải thông tin thanh toán' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'prorate_preview';

    if (action === 'prorate_preview') {
      const { newPlan = 'ENTERPRISE', currentPlan = 'PRO', daysRemaining = 16 } = body;
      const preview = calculateProratedBilling({
        currentPlan,
        newPlan,
        daysRemainingInCycle: daysRemaining,
      });
      return NextResponse.json({ success: true, preview });
    }

    if (action === 'upgrade_plan') {
      const { newPlan = 'ENTERPRISE' } = body;
      const newInvoice: InvoiceItem = {
        id: `inv_rec_${Date.now()}`,
        invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        planName: PLAN_LIMITS[newPlan]?.name || 'Gói dịch vụ',
        amount: PLAN_LIMITS[newPlan]?.monthlyPrice || 0,
        period: `${new Date().toLocaleDateString('vi-VN')} - ${new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString('vi-VN')}`,
        status: 'PAID',
        paidAt: new Date().toISOString(),
        paymentMethod: 'Thẻ tín dụng / Ví doanh nghiệp',
      };
      billingHistory.unshift(newInvoice);

      return NextResponse.json({
        success: true,
        message: `Đã nâng cấp thành công lên ${PLAN_LIMITS[newPlan]?.name}!`,
        invoice: newInvoice,
      });
    }

    if (action === 'start_trial') {
      return NextResponse.json({
        success: true,
        message: 'Đã kích hoạt 14 ngày dùng thử miễn phí toàn bộ tính năng PRO!',
        trialDays: 14,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_BILLING_POST]', error);
    return NextResponse.json({ error: 'Lỗi xử lý giao dịch thanh toán' }, { status: 500 });
  }
}
