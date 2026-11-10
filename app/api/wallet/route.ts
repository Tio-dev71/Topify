import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import jwt from 'jsonwebtoken';
import { 
  walletStore,
  memoryWallet, 
  memoryTransactions, 
  memoryWithdrawals, 
  memoryPaymentMethods,
  WithdrawalRequest,
  WalletTransactionItem
} from '@/lib/wallet/wallet-engine';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function authenticateUser(req: NextRequest): Promise<string | undefined> {
  // 1. Try NextAuth session (Web)
  try {
    const session = await auth().catch(() => null);
    if (session?.user?.id) return session.user.id;
  } catch {}

  // 2. Try Bearer JWT token (Desktop / Electron)
  try {
    const authHeader = req?.headers?.get ? req.headers.get('authorization') : null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded?.sub || decoded?.id) {
        return decoded.sub || decoded.id;
      }
    }
  } catch {}

  return undefined;
}

// GET /api/wallet - Get full wallet information, transactions, and withdrawals
export async function GET(req: NextRequest) {
  try {
    const userId = await authenticateUser(req);

    const storeWallet = walletStore.getWallet();
    const storeTransactions = walletStore.getTransactions();
    const storeWithdrawals = walletStore.getWithdrawals();
    const storePaymentMethods = walletStore.getPaymentMethods();

    let walletData: any = null;
    let transactions: any[] = [];
    let withdrawals: any[] = [];

    if (userId) {
      try {
        let dbWallet = await prisma.wallet.findUnique({
          where: { userId },
          include: {
            transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
            withdrawals: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        });

        if (!dbWallet) {
          dbWallet = await prisma.wallet.create({
            data: { 
              userId,
              balance: storeWallet.availableBalance,
              pending: storeWallet.pendingBalance,
              withdrawn: storeWallet.totalWithdrawn,
            },
            include: {
              transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
              withdrawals: { orderBy: { createdAt: 'desc' }, take: 10 },
            },
          });
        }

        walletData = {
          id: dbWallet.id,
          userId: dbWallet.userId,
          availableBalance: dbWallet.balance,
          pendingBalance: dbWallet.pending,
          totalWithdrawn: dbWallet.withdrawn,
          currency: 'VND',
          updatedAt: new Date().toISOString(),
        };

        const dbTxs = (dbWallet.transactions || []).map((tx: any) => ({
          id: tx.id,
          walletId: tx.walletId,
          type: (tx.type || 'EARNING').toUpperCase(),
          amount: tx.amount,
          description: tx.description || 'Giao dịch ví',
          referenceId: tx.referenceId,
          status: 'COMPLETED',
          createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
        }));

        transactions = dbTxs.length > 0 ? dbTxs : storeTransactions;
        withdrawals = dbWallet.withdrawals && dbWallet.withdrawals.length > 0 ? dbWallet.withdrawals : storeWithdrawals;
      } catch (dbErr) {
        // Fallback to walletStore
      }
    }

    if (!walletData) {
      walletData = storeWallet;
      transactions = storeTransactions;
      withdrawals = storeWithdrawals;
    }

    return NextResponse.json({
      wallet: walletData,
      transactions,
      withdrawals,
      paymentMethods: storePaymentMethods,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({
      wallet: walletStore.getWallet(),
      transactions: walletStore.getTransactions(),
      withdrawals: walletStore.getWithdrawals(),
      paymentMethods: walletStore.getPaymentMethods(),
      success: true,
      fallback: true,
    });
  }
}

// POST /api/wallet - Create a new withdrawal request (F148)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, paymentMethodId, note } = body;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < 100000) {
      return NextResponse.json({
        error: 'Số tiền rút tối thiểu là 100.000 VND',
      }, { status: 400 });
    }

    const userId = await authenticateUser(req);

    const pms = walletStore.getPaymentMethods();
    const pm = pms.find(p => p.id === paymentMethodId) || pms[0];
    const pmDesc = pm ? `${pm.bankName || pm.type} - ${pm.accountNumber}` : 'Ngân hàng mặc định';
    const accInfo = pm ? `${pm.accountName}` : 'YẾN NGÔ';
    const fee = 0;
    const netAmount = withdrawAmount - fee;

    // Database flow if user/wallet exists
    if (userId) {
      let dbWallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!dbWallet) {
        dbWallet = await prisma.wallet.create({
          data: {
            userId,
            balance: walletStore.getWallet().availableBalance,
            pending: 0,
            withdrawn: 0,
          },
        });
      }

      if (withdrawAmount > dbWallet.balance) {
        return NextResponse.json({
          error: `Số dư khả dụng không đủ (${dbWallet.balance.toLocaleString('vi-VN')} VND)`,
        }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Trừ số dư khả dụng và đưa vào chờ xử lý
        const updatedWallet = await tx.wallet.update({
          where: { id: dbWallet.id },
          data: {
            balance: { decrement: withdrawAmount },
            pending: { increment: withdrawAmount },
          },
        });

        // 2. Tạo bản ghi rút tiền
        const createdWithdrawal = await tx.withdrawal.create({
          data: {
            walletId: dbWallet.id,
            amount: withdrawAmount,
            paymentMethod: pmDesc,
            accountInfo: accInfo,
            status: 'PENDING',
          },
        });

        // 3. Ghi log giao dịch biến động số dư
        await tx.walletTransaction.create({
          data: {
            walletId: dbWallet.id,
            type: 'withdrawal',
            amount: -withdrawAmount,
            description: `Yêu cầu rút tiền về ${pmDesc}`,
            referenceId: createdWithdrawal.id,
          },
        });

        return { updatedWallet, createdWithdrawal };
      });

      // Sync walletStore & file persistence
      const storeRes = walletStore.createWithdrawal({
        amount: withdrawAmount,
        paymentMethod: pmDesc,
        accountInfo: accInfo,
        note: note || 'Yêu cầu rút tiền qua cổng tự động VietQR/Momo',
      });

      return NextResponse.json({
        success: true,
        message: `Đã tạo lệnh rút ${withdrawAmount.toLocaleString('vi-VN')} VND thành công! Tiền sẽ về tài khoản trong 15-30 phút.`,
        withdrawal: {
          ...result.createdWithdrawal,
          createdAt: result.createdWithdrawal.createdAt instanceof Date ? result.createdWithdrawal.createdAt.toISOString() : result.createdWithdrawal.createdAt,
        },
        wallet: {
          id: result.updatedWallet.id,
          userId: result.updatedWallet.userId,
          availableBalance: result.updatedWallet.balance,
          pendingBalance: result.updatedWallet.pending,
          totalWithdrawn: result.updatedWallet.withdrawn,
          currency: 'VND',
        },
      }, { status: 201 });
    }

    // File / Store flow
    const currentWallet = walletStore.getWallet();
    if (withdrawAmount > currentWallet.availableBalance) {
      return NextResponse.json({
        error: `Số dư khả dụng không đủ (${currentWallet.availableBalance.toLocaleString('vi-VN')} VND)`,
      }, { status: 400 });
    }

    const created = walletStore.createWithdrawal({
      amount: withdrawAmount,
      paymentMethod: pmDesc,
      accountInfo: accInfo,
      note: note || 'Yêu cầu rút tiền qua cổng tự động VietQR/Momo',
    });

    return NextResponse.json({
      success: true,
      message: `Đã tạo lệnh rút ${withdrawAmount.toLocaleString('vi-VN')} VND thành công! Tiền sẽ về tài khoản trong 15-30 phút.`,
      withdrawal: created.withdrawal,
      wallet: created.wallet,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
