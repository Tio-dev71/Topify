import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { walletStore } from '@/lib/wallet/wallet-engine';

// POST /api/wallet/reset - Clear demo mock data and start with clean real wallet
export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null;
    try {
      const session = await auth().catch(() => null);
      if (session?.user?.id) userId = session.user.id;
    } catch {}

    if (userId) {
      try {
        await prisma.walletTransaction.deleteMany({});
        await prisma.withdrawal.deleteMany({});
        await prisma.wallet.updateMany({
          data: {
            balance: 0,
            pending: 0,
            withdrawn: 0,
          },
        });
      } catch (e) {}
    }

    const store = walletStore;
    const w = store.getWallet();
    w.availableBalance = 0;
    w.pendingBalance = 0;
    w.totalWithdrawn = 0;
    w.updatedAt = new Date().toISOString();

    (store as any).transactions = [];
    (store as any).withdrawals = [];
    (store as any).saveToDisk();

    return NextResponse.json({
      success: true,
      message: 'Đã thiết lập lại ví thực tế sạch sẽ (0đ). Bạn có thể nạp tiền thật hoặc kết nối hoa hồng thực chiến!',
      wallet: w,
      transactions: [],
      withdrawals: [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
