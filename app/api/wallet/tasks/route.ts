import { NextRequest, NextResponse } from 'next/server';
import { 
  memoryEarningTasks, 
  memoryWallet, 
  memoryTransactions, 
  WalletTransactionItem 
} from '@/lib/wallet/wallet-engine';

// GET /api/wallet/tasks - List all earning tasks (F150)
export async function GET() {
  try {
    const now = Date.now();
    const enrichedTasks = memoryEarningTasks.map(t => ({
      ...t,
      isExpired: new Date(t.expiresAt).getTime() < now,
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

    if (task.isClaimed) {
      return NextResponse.json({
        error: 'Nhiệm vụ này đã được nhận thưởng trước đó',
      }, { status: 400 });
    }

    // Process reward claim
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
      message: `Chúc mừng bạn đã nhận thưởng +${task.rewardAmount.toLocaleString()} VND vào ví!`,
      rewardAmount: task.rewardAmount,
      wallet: memoryWallet,
      task,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
