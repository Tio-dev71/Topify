import { NextRequest, NextResponse } from 'next/server';
import { memoryPaymentMethods, SavedPaymentMethod, PaymentMethodType } from '@/lib/wallet/wallet-engine';

// GET /api/wallet/payment-methods - List saved payment methods (F149)
export async function GET() {
  try {
    return NextResponse.json({
      paymentMethods: memoryPaymentMethods,
      total: memoryPaymentMethods.length,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/wallet/payment-methods - Add new payment method
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, accountName, accountNumber, bankName, isDefault = false } = body;

    if (!type || !accountName || !accountNumber) {
      return NextResponse.json({
        error: 'Loại phương thức, tên chủ tài khoản và số tài khoản là bắt buộc',
      }, { status: 400 });
    }

    if (isDefault) {
      memoryPaymentMethods.forEach(pm => pm.isDefault = false);
    }

    const newMethod: SavedPaymentMethod = {
      id: `pm_${Date.now()}`,
      type: type as PaymentMethodType,
      accountName: accountName.toUpperCase(),
      accountNumber: String(accountNumber).trim(),
      bankName: bankName || (type === 'VIETQR' ? 'Ngân hàng Việt Nam' : undefined),
      isDefault: isDefault || memoryPaymentMethods.length === 0,
      createdAt: new Date().toISOString(),
    };

    memoryPaymentMethods.push(newMethod);

    return NextResponse.json({
      success: true,
      message: 'Đã thêm phương thức nhận tiền thành công',
      paymentMethod: newMethod,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/wallet/payment-methods - Set as default
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    const target = memoryPaymentMethods.find(pm => pm.id === id);
    if (!target) {
      return NextResponse.json({ error: 'Phương thức thanh toán không tồn tại' }, { status: 404 });
    }

    memoryPaymentMethods.forEach(pm => pm.isDefault = (pm.id === id));

    return NextResponse.json({
      success: true,
      message: 'Đã đặt làm phương thức nhận tiền mặc định',
      paymentMethods: memoryPaymentMethods,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/wallet/payment-methods - Remove payment method
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID phương thức là bắt buộc' }, { status: 400 });
    }

    const index = memoryPaymentMethods.findIndex(pm => pm.id === id);
    if (index !== -1) {
      memoryPaymentMethods.splice(index, 1);
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa phương thức nhận tiền thành công',
      paymentMethods: memoryPaymentMethods,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
