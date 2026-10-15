import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Mã đơn hàng không được để trống' }, { status: 400 });
    }

    const order = await prisma.paymentOrder.findUnique({
      where: { code },
      include: { workspace: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: order.status,
      code: order.code,
      plan: order.plan,
      amount: order.amount,
      paidAt: order.paidAt?.toISOString() || null,
      planExpiresAt: order.workspace?.planExpiresAt?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('[API_SEPAY_CHECK_STATUS_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Lỗi kiểm tra trạng thái đơn hàng' }, { status: 500 });
  }
}
