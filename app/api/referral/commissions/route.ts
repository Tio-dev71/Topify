import { NextRequest, NextResponse } from 'next/server';
import { 
  memoryCommissionRules, 
  memoryCommissionHistory, 
  CommissionRuleItem, 
  CommissionTransactionItem 
} from '@/lib/wallet/wallet-engine';

// GET /api/referral/commissions - Get commission rules (F153) and commission history (F154)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let history = [...memoryCommissionHistory];
    if (status && status !== 'ALL') {
      history = history.filter(h => h.status === status);
    }

    const totalPaid = memoryCommissionHistory
      .filter(h => h.status === 'PAID')
      .reduce((sum, h) => sum + h.commissionAmount, 0);

    const totalPending = memoryCommissionHistory
      .filter(h => h.status === 'PENDING' || h.status === 'APPROVED')
      .reduce((sum, h) => sum + h.commissionAmount, 0);

    return NextResponse.json({
      rules: memoryCommissionRules,
      history,
      totalCount: history.length,
      totalPaid,
      totalPending,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/referral/commissions - Update commission rule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, firstMonthRate, recurringRate, cookieDays } = body;

    const rule = memoryCommissionRules.find(r => r.id === id);
    if (!rule) {
      return NextResponse.json({ error: 'Quy tắc hoa hồng không tồn tại' }, { status: 404 });
    }

    if (firstMonthRate !== undefined) rule.firstMonthRate = Number(firstMonthRate);
    if (recurringRate !== undefined) rule.recurringRate = Number(recurringRate);
    if (cookieDays !== undefined) rule.cookieDays = Number(cookieDays);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật chính sách hoa hồng thành công',
      rule,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
