import { NextRequest, NextResponse } from 'next/server';
import { walletStore } from '@/lib/wallet/wallet-engine';

export async function GET(req: NextRequest) {
  try {
    const withdrawals = walletStore.getWithdrawals();
    return NextResponse.json({ success: true, withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, paymentMethod, accountInfo, note } = body;
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < 100000) {
      return NextResponse.json({ error: 'Số tiền rút tối thiểu là 100.000 VND' }, { status: 400 });
    }

    const created = walletStore.createWithdrawal({
      amount: withdrawAmount,
      paymentMethod: paymentMethod || 'VietQR Ngân hàng',
      accountInfo: accountInfo || 'YẾN NGÔ',
      note: note || 'Yêu cầu rút tiền tự động',
    });

    return NextResponse.json({
      success: true,
      message: `Đã tạo lệnh rút ${withdrawAmount.toLocaleString('vi-VN')} VND thành công!`,
      withdrawal: created.withdrawal,
      wallet: created.wallet,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
