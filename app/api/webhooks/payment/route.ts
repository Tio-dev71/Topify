import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PLAN_LIMITS } from '@/lib/workspace/quota';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Payload không hợp lệ' }, { status: 400 });
    }

    // SePay Webhook Payload format: https://docs.sepay.vn/
    const { 
      gateway, 
      transactionDate, 
      accountNumber, 
      content = '', 
      transferType, 
      transferAmount = 0, 
      referenceCode 
    } = body;

    // Chỉ xử lý giao dịch tiền vào
    if (transferType !== 'in') {
      return NextResponse.json({ success: true, message: 'Bỏ qua giao dịch chuyển tiền ra' });
    }

    console.log('[SEPAY_WEBHOOK_RECEIVED]', { content, transferAmount, referenceCode, gateway });

    // Trích xuất mã giao dịch TPF... từ nội dung chuyển khoản
    const match = String(content).match(/TPF\d{4,8}/i);
    if (!match) {
      console.warn('[SEPAY_WEBHOOK_NO_CODE_FOUND]', { content });
      return NextResponse.json({ 
        success: true, 
        message: 'Đã nhận webhook nhưng không tìm thấy mã đơn hàng TPF' 
      });
    }

    const orderCode = match[0].toUpperCase();

    // Tra cứu đơn hàng trong cơ sở dữ liệu
    const order = await prisma.paymentOrder.findUnique({
      where: { code: orderCode },
      include: { workspace: true },
    });

    if (!order) {
      console.warn('[SEPAY_WEBHOOK_ORDER_NOT_FOUND]', { orderCode });
      return NextResponse.json({ 
        success: false, 
        error: `Không tìm thấy đơn hàng tương ứng với mã ${orderCode}` 
      }, { status: 404 });
    }

    // Idempotency: Kiểm tra nếu đơn hàng đã hoàn tất trước đó
    if (order.status === 'COMPLETED') {
      console.log('[SEPAY_WEBHOOK_ALREADY_COMPLETED]', { orderCode });
      return NextResponse.json({ 
        success: true, 
        message: 'Đơn hàng này đã được kích hoạt trước đó' 
      });
    }

    // Kiểm tra số tiền chuyển
    const receivedAmount = Number(transferAmount);
    if (receivedAmount < order.amount) {
      console.warn('[SEPAY_WEBHOOK_PARTIAL_AMOUNT]', {
        orderCode,
        expected: order.amount,
        received: receivedAmount
      });
      return NextResponse.json({
        success: false,
        error: `Số tiền chuyển (${receivedAmount} đ) không đủ so với đơn hàng (${order.amount} đ)`
      }, { status: 400 });
    }

    const now = new Date();
    const workspace = order.workspace;

    // Logic cộng dồn thời hạn chuẩn xác:
    // Nếu gói cũ chưa hết hạn -> cộng dồn tiếp từ ngày hết hạn cũ.
    // Nếu đã hết hạn hoặc chưa có hạn -> tính từ thời điểm hiện tại.
    const currentExpiresAt = workspace.planExpiresAt ? new Date(workspace.planExpiresAt) : null;
    const baseDate = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
    const daysToAdd = order.durationMonths * 30;
    const newExpiresAt = new Date(baseDate.getTime() + daysToAdd * 24 * 3600 * 1000);

    const planNameText = PLAN_LIMITS[order.plan]?.name || (order.plan === 'ENTERPRISE' ? 'Gói Doanh Nghiệp' : 'Gói Chuyên Nghiệp');
    const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Thực hiện cập nhật Database nguyên tử (Atomic Transaction)
    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật đơn hàng thành COMPLETED
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          sepayTransactionId: String(referenceCode || gateway || 'SEPAY'),
          paidAt: now,
        },
      });

      // 2. Nâng cấp & cộng dồn hạn dùng cho Workspace
      await tx.workspace.update({
        where: { id: workspace.id },
        data: {
          plan: order.plan,
          planExpiresAt: newExpiresAt,
          subscriptionStatus: 'ACTIVE',
          gracePeriodEndsAt: null,
          lastRenewedAt: now,
        },
      });

      // 3. Tạo biên lai hóa đơn lưu vào lịch sử
      await tx.invoice.create({
        data: {
          invoiceNumber,
          workspaceId: workspace.id,
          orderId: order.id,
          planName: `${planNameText} - ${order.durationMonths} Tháng`,
          amount: order.amount,
          periodStart: baseDate,
          periodEnd: newExpiresAt,
          paymentMethod: 'SePay / VietQR',
          status: 'PAID',
          paidAt: now,
        },
      });
    });

    console.log('[SEPAY_WEBHOOK_SUCCESS]', {
      orderCode,
      workspaceId: workspace.id,
      plan: order.plan,
      newExpiresAt: newExpiresAt.toISOString(),
      invoiceNumber,
    });

    return NextResponse.json({
      success: true,
      message: 'Giao dịch SePay đã được xác nhận và gia hạn gói cước thành công!',
      orderCode,
      plan: order.plan,
      planExpiresAt: newExpiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[SEPAY_WEBHOOK_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi xử lý webhook từ SePay' },
      { status: 500 }
    );
  }
}
