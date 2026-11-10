import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import jwt from 'jsonwebtoken';
import { 
  walletStore,
  memoryEarningTasks, 
  memoryWallet, 
  memoryTransactions, 
  WalletTransactionItem 
} from '@/lib/wallet/wallet-engine';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function authenticateUser(req?: NextRequest): Promise<string | undefined> {
  if (!req) return undefined;
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

// GET /api/wallet/tasks - List all earning tasks (F150)
export async function GET(req?: NextRequest) {
  try {
    let claimedTaskIds = new Set<string>();

    try {
      const userId = await authenticateUser(req);

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

    const tasksFromStore = walletStore.getEarningTasks();
    const enrichedTasks = tasksFromStore.map(t => ({
      ...t,
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

// POST /api/wallet/tasks - Claim reward for a completed earning task or update progress
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, action, progress } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId là bắt buộc' }, { status: 400 });
    }

    if (action === 'progress') {
      const updated = walletStore.updateTaskProgress(taskId, Number(progress) || 1, true);
      if (!updated) {
        return NextResponse.json({ error: 'Nhiệm vụ không tồn tại' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật tiến độ nhiệm vụ',
        task: updated,
      });
    }

    const tasks = walletStore.getEarningTasks();
    const task = tasks.find(t => t.id === taskId);
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

    if (task.isClaimed) {
      return NextResponse.json({
        error: 'Nhiệm vụ này đã được nhận thưởng trước đó',
      }, { status: 400 });
    }

    const userId = await authenticateUser(req);

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
              balance: walletStore.getWallet().availableBalance,
              pending: walletStore.getWallet().pendingBalance,
              withdrawn: walletStore.getWallet().totalWithdrawn,
            },
            include: { transactions: true },
          });
        }

        if (dbWallet.transactions && dbWallet.transactions.length > 0) {
          return NextResponse.json({
            error: 'Nhiệm vụ này đã được nhận thưởng trước đó',
          }, { status: 400 });
        }

        // Atomically increment wallet balance and create transaction in DB
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

        // Sync with walletStore file persistence
        const storeClaim = walletStore.claimEarningTask(task.id);

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
          transaction: {
            id: createdTx.id,
            walletId: updatedWallet.id,
            type: 'EARNING',
            amount: task.rewardAmount,
            description: `Thưởng hoàn thành nhiệm vụ: ${task.title}`,
            referenceId: task.id,
            status: 'COMPLETED',
            createdAt: createdTx.createdAt.toISOString(),
          },
          task: storeClaim.task,
        });
      } catch (dbErr) {
        // Fallback to walletStore below
      }
    }

    // Process reward claim in walletStore (persists to file)
    const result = walletStore.claimEarningTask(task.id);

    return NextResponse.json({
      success: true,
      message: `Chúc mừng bạn đã nhận thưởng +${task.rewardAmount.toLocaleString('vi-VN')} VND vào ví!`,
      rewardAmount: result.rewardAmount,
      wallet: result.wallet,
      transaction: result.transaction,
      task: result.task,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

