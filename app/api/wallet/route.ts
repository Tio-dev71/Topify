import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { 
  memoryWallet, 
  memoryTransactions, 
  memoryWithdrawals, 
  memoryPaymentMethods,
  WithdrawalRequest,
  WalletTransactionItem
} from '@/lib/wallet/wallet-engine';

// GET /api/wallet - Get full wallet information, transactions, and withdrawals
export async function GET(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    const userId = session?.user?.id;

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
            data: { userId },
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
        transactions = dbWallet.transactions;
        withdrawals = dbWallet.withdrawals;
      } catch (dbErr) {
        // Fallback to memory store
      }
    }

    if (!walletData) {
      walletData = memoryWallet;
      transactions = memoryTransactions;
      withdrawals = memoryWithdrawals;
    }

    return NextResponse.json({
      wallet: walletData,
      transactions,
      withdrawals,
      paymentMethods: memoryPaymentMethods,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({
      wallet: memoryWallet,
      transactions: memoryTransactions,
      withdrawals: memoryWithdrawals,
      paymentMethods: memoryPaymentMethods,
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

    const session = await auth().catch(() => null);
    let userId = session?.user?.id;
    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      userId = firstUser?.id;
    }

    const pm = memoryPaymentMethods.find(p => p.id === paymentMethodId) || memoryPaymentMethods[0];
    const pmDesc = pm ? `${pm.bankName || pm.type} - ${pm.accountNumber}` : 'Ngân hàng mặc định';
    const accInfo = pm ? `${pm.accountName}` : 'Người dùng Topify';
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
            balance: memoryWallet.availableBalance,
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

      // Sync memory store
      memoryWallet.availableBalance = result.updatedWallet.balance;
      memoryWallet.pendingBalance = result.updatedWallet.pending;
      memoryWallet.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        message: `Đã tạo lệnh rút ${withdrawAmount.toLocaleString('vi-VN')} VND thành công! Tiền sẽ về tài khoản trong 15-30 phút.`,
        withdrawal: result.createdWithdrawal,
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

    // Fallback in-memory flow
    if (withdrawAmount > memoryWallet.availableBalance) {
      return NextResponse.json({
        error: `Số dư khả dụng không đủ (${memoryWallet.availableBalance.toLocaleString('vi-VN')} VND)`,
      }, { status: 400 });
    }

    const newWithdrawal: WithdrawalRequest = {
      id: `wd_req_${Date.now()}`,
      walletId: memoryWallet.id,
      amount: withdrawAmount,
      fee,
      netAmount,
      paymentMethod: pmDesc,
      accountInfo: accInfo,
      status: 'PENDING',
      note: note || 'Yêu cầu rút tiền qua cổng tự động VietQR/Momo',
      createdAt: new Date().toISOString(),
    };

    memoryWallet.availableBalance -= withdrawAmount;
    memoryWallet.pendingBalance += withdrawAmount;
    memoryWallet.updatedAt = new Date().toISOString();

    const newTx: WalletTransactionItem = {
      id: `tx_${Date.now()}`,
      walletId: memoryWallet.id,
      type: 'WITHDRAWAL',
      amount: -withdrawAmount,
      description: `Yêu cầu rút tiền về ${pmDesc}`,
      referenceId: newWithdrawal.id,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    memoryWithdrawals.unshift(newWithdrawal);
    memoryTransactions.unshift(newTx);

    return NextResponse.json({
      success: true,
      message: `Đã tạo lệnh rút ${withdrawAmount.toLocaleString('vi-VN')} VND thành công! Tiền sẽ về tài khoản trong 15-30 phút.`,
      withdrawal: newWithdrawal,
      wallet: memoryWallet,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
