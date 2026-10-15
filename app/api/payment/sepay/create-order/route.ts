import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SubscriptionPlan } from '@prisma/client';
import { calculatePlanPricing, generateVietQrUrl, generateUniquePaymentCode, getSepayConfig } from '@/lib/payment/sepay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      plan = 'PRO', 
      durationMonths = 1,
      workspaceId: reqWorkspaceId,
      userId: reqUserId 
    } = body;

    const validatedPlan: SubscriptionPlan = plan === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO';
    const validatedDuration = [1, 6, 12].includes(Number(durationMonths)) ? Number(durationMonths) : 1;

    // Resolve Workspace & User
    let workspace = null;
    if (reqWorkspaceId) {
      workspace = await prisma.workspace.findUnique({
        where: { id: reqWorkspaceId },
        include: { users: { take: 1 } },
      });
    }

    if (!workspace) {
      workspace = await prisma.workspace.findFirst({
        include: { users: { take: 1 } },
      });
    }

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: 'Topify Workspace',
          plan: 'FREE',
        },
        include: { users: { take: 1 } },
      });
    }

    let userId = reqUserId;
    if (!userId && workspace.users?.length > 0) {
      userId = workspace.users[0].id;
    }

    if (!userId) {
      let defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        defaultUser = await prisma.user.create({
          data: {
            email: 'admin@topify.vn',
            name: 'Quản trị viên Topify',
            role: 'SUPER_ADMIN',
            workspaceId: workspace.id,
          },
        });
      }
      userId = defaultUser.id;
    }

    // Calculate pricing with cycle discounts
    const pricing = calculatePlanPricing(validatedPlan, validatedDuration);
    const code = await generateUniquePaymentCode();
    const config = getSepayConfig();

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    const order = await prisma.paymentOrder.create({
      data: {
        code,
        workspaceId: workspace.id,
        userId,
        plan: validatedPlan,
        durationMonths: validatedDuration,
        originalAmount: pricing.originalAmount,
        discountPercent: pricing.discountPercent,
        amount: pricing.amount,
        status: 'PENDING',
        gateway: 'SEPAY',
        bankId: config.bankId,
        accountNumber: config.accountNo,
        expiresAt,
      },
    });

    const qrUrl = generateVietQrUrl({
      bankId: config.bankId,
      accountNo: config.accountNo,
      amount: pricing.amount,
      description: code,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        code: order.code,
        plan: order.plan,
        durationMonths: order.durationMonths,
        originalAmount: order.originalAmount,
        discountPercent: order.discountPercent,
        amount: order.amount,
        qrUrl,
        bankId: config.bankId,
        accountNo: config.accountNo,
        accountName: config.accountName,
        expiresAt: order.expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API_SEPAY_CREATE_ORDER_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Không thể khởi tạo đơn hàng thanh toán SePay' },
      { status: 500 }
    );
  }
}
