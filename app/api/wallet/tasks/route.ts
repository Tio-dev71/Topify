import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { 
  memoryEarningTasks, 
  memoryWallet, 
  memoryTransactions, 
  WalletTransactionItem 
} from '@/lib/wallet/wallet-engine';

// GET /api/wallet/tasks - List all earning tasks (F150)
export async function GET(req?: NextRequest) {
  try {
    let claimedTaskIds = new Set<string>();

    try {
      const session = await auth().catch(() => null);
      let userId = session?.user?.id;
      if (!userId) {
        const firstUser = await prisma.user.findFirst().catch(() => null);
        userId = firstUser?.id;
      }

      if (userId) {
        const dbWallet = await prisma.wallet.findUnique({
          where: { userId },
          include: {
            transactions: {
              where: {
                type: { in: ['earning', 'EARNING'] },
              },
            },
          },
        });
        if (dbWallet?.transactions) {
          for (const tx of dbWallet.transactions) {
            if (tx.referenceId) claimedTaskIds.add(tx.referenceId);
          }
        }
      }
    } catch (authErr) {
      // Fallback silently if DB/auth is unavailable
    }

    const now = Date.now();
    const enrichedTasks = memoryEarningTasks.map(t => ({
      ...t,
      isExpired: new Date(t.expiresAt).getTime() < now,
      isClaimed: t.isClaimed || claimedTaskIds.has(t.id),
    }));

    return NextResponse.json({
      tasks: enrichedTasks,
      total: enrichedTasks.length,
      completedCount: enrichedTasks.filter(t => t.isCompleted).length,
      claimedCount: enrichedTasks.filter(t => t.isClaimed).length,
      expiredCount: enrichedTasks.filter(t => t.isExpired && !t.isCompleted).length,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/wallet/tasks - Claim reward for a completed earning task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId } = body;

    const task = memoryEarningTasks.find(t => t.id === taskId);
    if (!task) {
      return NextResponse.json({ error: 'Nhiệm vụ không tồn tại' }, { status: 404 });
    }

    const isExpired = new Date(task.expiresAt).getTime() < Date.now();

    if (!task.isCompleted) {
      if (isExpired) {
        return NextResponse.json({
          error: 'Nhiệm vụ đã hết hạn và chưa hoàn thành mục tiêu',
        }, { status: 400 });
      }
      return NextResponse.json({
        error: `Chưa hoàn thành nhiệm vụ (${task.progress}/${task.maxProgress} ${task.unit})`,
      }, { status: 400 });
    }

    // Check auth and database
    let userId: string | undefined;
    try {
      const session = await auth().catch(() => null);
      userId = session?.user?.id;
      if (!userId) {
        const firstUser = await prisma.user.findFirst().catch(() => null);
        userId = firstUser?.id;
      }
    } catch (e) {}

    if (userId) {
      try {
        let dbWallet = await prisma.wallet.findUnique({
          where: { userId },
          include: {
            transactions: {
              where: {
                referenceId: task.id,
                type: { in: ['earning', 'EARNING'] },
              },
            },
          },
        });

        if (!dbWallet) {
          dbWallet = await prisma.wallet.create({
            data: {
              userId,
              balance: memoryWallet.availableBalance,
              pending: memoryWallet.pendingBalance,
              withdrawn: memoryWallet.totalWithdrawn,
            },
            include: { transactions: true },
          });
        }

        if (dbWallet.transactions && dbWallet.transactions.length > 0) {
          task.isClaimed = true;
          return NextResponse.json({
            error: 'Nhiệm vụ này đã được nhận thưởng trước đó',
          }, { status: 400 });
        }

        // Atomically increment wallet balance and create transaction
        const [updatedWallet, createdTx] = await prisma.$transaction([
          prisma.wallet.update({
            where: { id: dbWallet.id },
            data: {
              balance: { increment: task.rewardAmount },
            },
          }),
          prisma.walletTransaction.create({
            data: {
              walletId: dbWallet.id,
              type: 'EARNING',
              amount: task.rewardAmount,
              description: `Thưởng hoàn thành nhiệm vụ: ${task.title}`,
              referenceId: task.id,
            },
          }),
        ]);

        // Sync in-memory store
        task.isClaimed = true;
        memoryWallet.availableBalance = updatedWallet.balance;
        memoryWallet.updatedAt = new Date().toISOString();

        const rewardTx: WalletTransactionItem = {
          id: createdTx.id,
          walletId: updatedWallet.id,
          type: 'EARNING',
          amount: task.rewardAmount,
          description: `Thưởng hoàn thành nhiệm vụ: ${task.title}`,
          referenceId: task.id,
          status: 'COMPLETED',
          createdAt: createdTx.createdAt.toISOString(),
        };
        memoryTransactions.unshift(rewardTx);

        return NextResponse.json({
          success: true,
          message: `Chúc mừng bạn đã nhận thưởng +${task.rewardAmount.toLocaleString('vi-VN')} VND vào ví!`,
          rewardAmount: task.rewardAmount,
          wallet: {
            id: updatedWallet.id,
            userId: updatedWallet.userId,
            availableBalance: updatedWallet.balance,
            pendingBalance: updatedWallet.pending,
            totalWithdrawn: updatedWallet.withdrawn,
            currency: 'VND',
            updatedAt: new Date().toISOString(),
          },
          transaction: rewardTx,
          task,
        });
      } catch (dbErr) {
        // Fallback to in-memory store below if DB transaction fails
      }
    }

    if (task.isClaimed) {
      return NextResponse.json({
        error: 'Nhiệm vụ này đã được nhận thưởng trước đó',
      }, { status: 400 });
    }

    // Process reward claim in memory
    task.isClaimed = true;
    memoryWallet.availableBalance += task.rewardAmount;
    memoryWallet.updatedAt = new Date().toISOString();

    // Create transaction log
    const rewardTx: WalletTransactionItem = {
      id: `tx_${Date.now()}`,
      walletId: memoryWallet.id,
      type: 'EARNING',
      amount: task.rewardAmount,
      description: `Thưởng hoàn thành nhiệm vụ: ${task.title}`,
      referenceId: task.id,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    memoryTransactions.unshift(rewardTx);

    return NextResponse.json({
      success: true,
      message: `Chúc mừng bạn đã nhận thưởng +${task.rewardAmount.toLocaleString('vi-VN')} VND vào ví!`,
      rewardAmount: task.rewardAmount,
      wallet: memoryWallet,
      transaction: rewardTx,
      task,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

