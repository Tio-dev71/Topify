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

// POST /api/wallet/deposit - Top-up wallet balance via dynamic VietQR / Bank Transfer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, transferCode, bankName = 'MB Bank', referenceNote } = body;

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount < 10000) {
      return NextResponse.json({
        error: 'Số tiền nạp tối thiểu là 10.000 VND',
      }, { status: 400 });
    }

    const { userId } = await authenticateUser(req);
    const txCode = transferCode || `NAP${Date.now().toString().slice(-6)}`;
    const description = `Nạp tiền vào ví qua VietQR 24/7 (${bankName}) - Mã GD: ${txCode}`;

    // 1. Database flow if user exists
    if (userId) {
      try {
        let dbWallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!dbWallet) {
          dbWallet = await prisma.wallet.create({
            data: {
              userId,
              balance: depositAmount,
              pending: 0,
              withdrawn: 0,
            },
          });
        } else {
          dbWallet = await prisma.wallet.update({
            where: { id: dbWallet.id },
            data: { balance: { increment: depositAmount } },
          });
        }

        const newTx = await prisma.walletTransaction.create({
          data: {
            walletId: dbWallet.id,
            type: 'deposit',
            amount: depositAmount,
            description,
            referenceId: txCode,
          },
        });

        // Sync local store
        walletStore.addTransaction({
          walletId: dbWallet.id,
          type: 'EARNING',
          amount: depositAmount,
          description,
          referenceId: txCode,
          status: 'COMPLETED',
        });

        return NextResponse.json({
          success: true,
          message: `Nạp thành công ${depositAmount.toLocaleString('vi-VN')} VND vào ví Topify!`,
          wallet: {
            id: dbWallet.id,
            userId: dbWallet.userId,
            availableBalance: dbWallet.balance,
            pendingBalance: dbWallet.pending,
            totalWithdrawn: dbWallet.withdrawn,
            currency: 'VND',
          },
          transaction: newTx,
        });
      } catch (dbErr) {
        console.warn('[WALLET_DEPOSIT_DB_FALLBACK]', dbErr);
      }
    }

    // 2. File / Store flow fallback
    const storeWallet = walletStore.getWallet();
    storeWallet.availableBalance += depositAmount;
    storeWallet.updatedAt = new Date().toISOString();

    const createdTx = walletStore.addTransaction({
      walletId: storeWallet.id,
      type: 'EARNING',
      amount: depositAmount,
      description,
      referenceId: txCode,
      status: 'COMPLETED',
    });

    return NextResponse.json({
      success: true,
      message: `Nạp thành công ${depositAmount.toLocaleString('vi-VN')} VND vào ví Topify!`,
      wallet: storeWallet,
      transaction: createdTx,
    });
  } catch (error: any) {
    console.error('[API_WALLET_DEPOSIT]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
