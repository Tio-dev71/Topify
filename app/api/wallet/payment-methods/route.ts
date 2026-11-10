import { NextRequest, NextResponse } from 'next/server';
import { walletStore, SavedPaymentMethod, PaymentMethodType } from '@/lib/wallet/wallet-engine';

// GET /api/wallet/payment-methods - List saved payment methods (F149)
export async function GET() {
  try {
    const paymentMethods = walletStore.getPaymentMethods();
    return NextResponse.json({
      paymentMethods,
      total: paymentMethods.length,
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

    const newMethod = walletStore.addPaymentMethod({
      type: type as PaymentMethodType,
      accountName: accountName.toUpperCase().trim(),
      accountNumber: String(accountNumber).trim(),
      bankName: bankName || (type === 'VIETQR' ? 'Ngân hàng Việt Nam' : undefined),
      isDefault: Boolean(isDefault),
    });

    return NextResponse.json({
      success: true,
      message: 'Đã thêm phương thức nhận tiền thành công',
      paymentMethod: newMethod,
      paymentMethods: walletStore.getPaymentMethods(),
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/wallet/payment-methods - Update payment method details or set as default
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, type, accountName, accountNumber, bankName, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID phương thức là bắt buộc' }, { status: 400 });
    }

    const updated = walletStore.updatePaymentMethod({
      id,
      type,
      accountName,
      accountNumber,
      bankName,
      isDefault,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Phương thức thanh toán không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật phương thức nhận tiền thành công',
      paymentMethod: updated,
      paymentMethods: walletStore.getPaymentMethods(),
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

    const success = walletStore.deletePaymentMethod(id);
    if (!success) {
      return NextResponse.json({ error: 'Không tìm thấy phương thức để xóa' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa phương thức nhận tiền thành công',
      paymentMethods: walletStore.getPaymentMethods(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
