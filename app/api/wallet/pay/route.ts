import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import jwt from 'jsonwebtoken';
import { walletStore } from '@/lib/wallet/wallet-engine';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function authenticateUser(req: NextRequest): Promise<{ userId?: string; role?: string }> {
  try {
    const session = await auth().catch(() => null);
    if (session?.user?.id) return { userId: session.user.id, role: session.user.role };
  } catch {}

  try {
    const authHeader = req?.headers?.get ? req.headers.get('authorization') : null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded?.sub || decoded?.id) {
        return { userId: decoded.sub || decoded.id, role: decoded.role };
      }
    }
  } catch {}

  return {};
}

// POST /api/wallet/pay - Deduct balance to pay for real Topify services
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceType, amount, campaignId, campaignName, planName, note } = body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return NextResponse.json({ error: 'Số tiền thanh toán không hợp lệ' }, { status: 400 });
    }

    const { userId } = await authenticateUser(req);
    const storeWallet = walletStore.getWallet();

    // Check available balance
    if (storeWallet.availableBalance < payAmount) {
      return NextResponse.json({
        error: `Số dư ví không đủ (${storeWallet.availableBalance.toLocaleString('vi-VN')} VND). Vui lòng nạp thêm tiền!`,
      }, { status: 400 });
    }

    let serviceDesc = '';
    if (serviceType === 'CAMPAIGN_BUDGET') {
      serviceDesc = `Nạp ngân sách Chiến dịch M10: "${campaignName || campaignId || 'Chiến dịch'}"`;
    } else if (serviceType === 'SUBSCRIPTION_PRO') {
      serviceDesc = `Gia hạn / Nâng cấp Gói bản quyền Topify: ${planName || 'Gói Pro Creator'}`;
    } else if (serviceType === 'AI_CREDITS') {
      serviceDesc = `Mua gói 500.000 Credits AI Content Studio`;
    } else if (serviceType === 'PROXY_PURCHASE') {
      serviceDesc = `Mua gói 10 Proxy IP xoay sạch Anti-Checkpoint`;
    } else {
      serviceDesc = note || 'Thanh toán dịch vụ Topify qua số dư ví';
    }

    // 1. Database flow
    if (userId) {
      try {
        let dbWallet = await prisma.wallet.findUnique({ where: { userId } });
        if (dbWallet && dbWallet.balance >= payAmount) {
          dbWallet = await prisma.wallet.update({
            where: { id: dbWallet.id },
            data: { balance: { decrement: payAmount } },
          });

          const txRecord = await prisma.walletTransaction.create({
            data: {
              walletId: dbWallet.id,
              type: 'service_payment',
              amount: -payAmount,
              description: serviceDesc,
              referenceId: campaignId || serviceType,
            },
          });

          // If paying for campaign budget, update campaign in DB if exists
          if (serviceType === 'CAMPAIGN_BUDGET' && campaignId) {
            await prisma.campaign.update({
              where: { id: campaignId },
              data: { budget: { increment: payAmount } },
            }).catch(() => {});
          }

          // Sync local store
          walletStore.addTransaction({
            walletId: dbWallet.id,
            type: 'WITHDRAWAL',
            amount: -payAmount,
            description: serviceDesc,
            referenceId: campaignId || serviceType,
            status: 'COMPLETED',
          });

          return NextResponse.json({
            success: true,
            message: `Thanh toán thành công ${payAmount.toLocaleString('vi-VN')} VND cho ${serviceDesc}!`,
            wallet: {
              id: dbWallet.id,
              userId: dbWallet.userId,
              availableBalance: dbWallet.balance,
              pendingBalance: dbWallet.pending,
              totalWithdrawn: dbWallet.withdrawn,
              currency: 'VND',
            },
            transaction: txRecord,
          });
        }
      } catch (dbErr) {
        console.warn('[WALLET_PAY_DB_FALLBACK]', dbErr);
      }
    }

    // 2. File / Store flow fallback
    storeWallet.availableBalance -= payAmount;
    storeWallet.updatedAt = new Date().toISOString();

    const createdTx = walletStore.addTransaction({
      walletId: storeWallet.id,
      type: 'WITHDRAWAL',
      amount: -payAmount,
      description: serviceDesc,
      referenceId: campaignId || serviceType,
      status: 'COMPLETED',
    });

    return NextResponse.json({
      success: true,
      message: `Thanh toán thành công ${payAmount.toLocaleString('vi-VN')} VND cho ${serviceDesc}!`,
      wallet: storeWallet,
      transaction: createdTx,
    });
  } catch (error: any) {
    console.error('[API_WALLET_PAY]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
