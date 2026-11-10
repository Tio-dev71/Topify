import { NextRequest, NextResponse } from 'next/server';
import { workspaceStore } from '@/lib/workspace/workspace-engine';
import { PLAN_LIMITS } from '@/lib/workspace/quota';

export async function GET(req: NextRequest) {
  try {
    const data = workspaceStore.getBillingData();
    return NextResponse.json(data);
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
      const targetPlan = body.targetPlan || body.newPlan || 'ENTERPRISE';
      const currentPlan = body.currentPlan || 'PRO';
      const daysRemaining = body.daysRemaining ?? 15;

      const calculation = workspaceStore.calculateProrate({
        targetPlan,
        currentPlan,
        daysRemaining,
      });

      return NextResponse.json({
        success: true,
        calculation,
        preview: calculation,
      });
    }

    if (action === 'upgrade_plan' || action === 'change_plan') {
      const plan = body.targetPlan || body.newPlan || 'ENTERPRISE';
      const paymentMethod = body.paymentMethod || 'SePay Chuyển khoản QR Techcombank';

      const result = await workspaceStore.updatePlan({
        plan,
        paymentMethod,
        isTrial: false,
      });

      const planName = PLAN_LIMITS[plan]?.name || plan;
      return NextResponse.json({
        success: true,
        message: `Đã nâng cấp thành công lên ${planName}!`,
        invoice: result.invoice,
        workspace: result.workspace,
      });
    }

    if (action === 'start_trial') {
      const trialDays = body.trialDays || 14;
      const result = await workspaceStore.updatePlan({
        plan: 'PRO',
        isTrial: true,
        trialDays,
      });

      return NextResponse.json({
        success: true,
        message: `Đã kích hoạt ${trialDays} ngày dùng thử miễn phí toàn bộ tính năng PRO!`,
        trialDays,
        trialEndsAt: result.workspace.trialEndsAt,
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_BILLING_POST]', error);
    return NextResponse.json({ error: 'Lỗi xử lý giao dịch thanh toán' }, { status: 500 });
  }
}
