import { NextRequest, NextResponse } from 'next/server';
import { walletStore, CommissionStatus } from '@/lib/wallet/wallet-engine';

// GET /api/referral/commissions - Get commission rules (F153) and commission history (F154)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as CommissionStatus | 'ALL' | null;

    const rules = walletStore.getCommissionRules();
    const allHistory = walletStore.getCommissionHistory();
    const history = status && status !== 'ALL'
      ? allHistory.filter((h) => h.status === status)
      : allHistory;

    const totalPaid = allHistory
      .filter((h) => h.status === 'PAID')
      .reduce((sum, h) => sum + h.commissionAmount, 0);

    const totalPending = allHistory
      .filter((h) => h.status === 'PENDING' || h.status === 'APPROVED')
      .reduce((sum, h) => sum + h.commissionAmount, 0);

    return NextResponse.json({
      success: true,
      rules,
      history,
      totalCount: history.length,
      totalPaid,
      totalPending,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi lấy dữ liệu hoa hồng' }, { status: 500 });
  }
}

// POST /api/referral/commissions - Configure/Add rule (F153) or Process commission status (F154)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, ruleData, status } = body;

    // Action 1: Add new commission rule (F153)
    if (action === 'ADD_RULE') {
      const { planName, firstMonthRate, recurringRate, cookieDays, payoutSchedule, description } = ruleData || body;
      if (!planName) {
        return NextResponse.json({ error: 'Tên gói/sự kiện không được để trống' }, { status: 400 });
      }

      const createdRule = walletStore.addCommissionRule({
        planName,
        firstMonthRate: Number(firstMonthRate || 10),
        recurringRate: Number(recurringRate || 5),
        cookieDays: Number(cookieDays || 30),
        payoutSchedule: payoutSchedule || 'Ngày 15 hàng tháng',
        description: description || `Chính sách hoa hồng ${planName}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Thêm chính sách hoa hồng mới thành công',
        rule: createdRule,
        rules: walletStore.getCommissionRules(),
      }, { status: 201 });
    }

    // Action 2: Update status of commission transaction (F154: APPROVED / PAID)
    if (action === 'UPDATE_STATUS' || action === 'PAYOUT' || action === 'APPROVE') {
      const targetId = id || body.transactionId;
      const targetStatus: CommissionStatus = status || (action === 'PAYOUT' ? 'PAID' : 'APPROVED');

      const result = walletStore.updateCommissionStatus(targetId, targetStatus);
      if (!result) {
        return NextResponse.json({ error: 'Không tìm thấy giao dịch hoa hồng' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: targetStatus === 'PAID' 
          ? `Đã quyết toán hoa hồng ${result.item.commissionAmount.toLocaleString('vi-VN')} VND vào ví thành công!` 
          : `Đã phê duyệt hoa hồng cho đơn hàng ${result.item.orderId}`,
        item: result.item,
        wallet: result.wallet,
        walletTx: result.walletTx,
        history: walletStore.getCommissionHistory(),
      });
    }

    // Action 3: Update existing commission rule (F153)
    const ruleId = id || body.ruleId;
    if (!ruleId) {
      return NextResponse.json({ error: 'Thiếu mã cấu hình quy tắc hoa hồng (id)' }, { status: 400 });
    }

    const updated = walletStore.updateCommissionRule({
      id: ruleId,
      planName: body.planName,
      firstMonthRate: body.firstMonthRate !== undefined ? Number(body.firstMonthRate) : undefined,
      recurringRate: body.recurringRate !== undefined ? Number(body.recurringRate) : undefined,
      cookieDays: body.cookieDays !== undefined ? Number(body.cookieDays) : undefined,
      payoutSchedule: body.payoutSchedule,
      description: body.description,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Không tìm thấy quy tắc hoa hồng cần cập nhật' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình quy tắc hoa hồng thành công',
      rule: updated,
      rules: walletStore.getCommissionRules(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi cập nhật hoa hồng' }, { status: 500 });
  }
}

// PATCH /api/referral/commissions - Quick status update (F154)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Thiếu id hoặc trạng thái' }, { status: 400 });
    }

    const result = walletStore.updateCommissionStatus(id, status);
    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy giao dịch hoa hồng' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: status === 'PAID'
        ? `Đã quyết toán ${result.item.commissionAmount.toLocaleString('vi-VN')} VND vào ví thành công!`
        : `Cập nhật trạng thái thành ${status}`,
      item: result.item,
      wallet: result.wallet,
      walletTx: result.walletTx,
      history: walletStore.getCommissionHistory(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/referral/commissions - Delete custom rule (F153)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id quy tắc hoa hồng cần xóa' }, { status: 400 });
    }

    const ok = walletStore.deleteCommissionRule(id);
    if (!ok) {
      return NextResponse.json({ error: 'Không tìm thấy quy tắc để xóa' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa quy tắc hoa hồng thành công',
      rules: walletStore.getCommissionRules(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
