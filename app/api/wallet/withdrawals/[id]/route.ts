import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { memoryWallet, memoryWithdrawals, memoryTransactions } from '@/lib/wallet/wallet-engine';
import { WithdrawalStatus } from '@prisma/client';

// PATCH /api/wallet/withdrawals/[id] - Approve / Process / Complete / Reject a withdrawal request
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status, note } = body;

    if (!['APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'].includes(status)) {
      return NextResponse.json({
        error: 'Trạng thái không hợp lệ. Phải là APPROVED, PROCESSING, COMPLETED, hoặc REJECTED',
      }, { status: 400 });
    }

    const now = new Date();

    // 1. Try finding in Database
    const dbWithdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { wallet: true },
    }).catch(() => null);

    if (dbWithdrawal) {
      if (['COMPLETED', 'REJECTED'].includes(dbWithdrawal.status)) {
        return NextResponse.json({
          error: `Yêu cầu rút tiền này đã ở trạng thái ${dbWithdrawal.status}, không thể thay đổi tiếp.`,
        }, { status: 400 });
      }

      const amount = dbWithdrawal.amount;
      const walletId = dbWithdrawal.walletId;

      const updated = await prisma.$transaction(async (tx) => {
        // Cập nhật trạng thái lệnh rút
        const wd = await tx.withdrawal.update({
          where: { id },
          data: {
            status: status as WithdrawalStatus,
            processedAt: ['COMPLETED', 'REJECTED'].includes(status) ? now : undefined,
          },
        });

        // Xử lý biến động số dư theo trạng thái
        if (status === 'COMPLETED') {
          // Trừ tiền đang chờ, tăng tổng tiền đã rút
          await tx.wallet.update({
            where: { id: walletId },
            data: {
              pending: { decrement: amount },
              withdrawn: { increment: amount },
            },
          });
        } else if (status === 'REJECTED') {
          // Hoàn tiền lại số dư khả dụng, trừ tiền đang chờ
          await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: { increment: amount },
              pending: { decrement: amount },
            },
          });

          // Ghi nhận giao dịch hoàn tiền
          await tx.walletTransaction.create({
            data: {
              walletId,
              type: 'refund',
              amount,
              description: `Hoàn tiền lệnh rút bị từ chối (${id}): ${note || 'Từ chối bởi quản trị viên'}`,
              referenceId: id,
            },
          });
        }

        return wd;
      });

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật trạng thái lệnh rút tiền thành ${status}`,
        withdrawal: updated,
      });
    }

    // 2. Fallback memory store update
    const memWd = memoryWithdrawals.find(w => w.id === id);
    if (!memWd) {
      return NextResponse.json({ error: 'Không tìm thấy yêu cầu rút tiền' }, { status: 404 });
    }

    memWd.status = status;
    memWd.processedAt = ['COMPLETED', 'REJECTED'].includes(status) ? now.toISOString() : undefined;
    if (note) memWd.note = note;

    if (status === 'COMPLETED') {
      memoryWallet.pendingBalance -= memWd.amount;
      memoryWallet.totalWithdrawn += memWd.amount;
    } else if (status === 'REJECTED') {
      memoryWallet.availableBalance += memWd.amount;
      memoryWallet.pendingBalance -= memWd.amount;
      memoryTransactions.unshift({
        id: `tx_${Date.now()}`,
        walletId: memoryWallet.id,
        type: 'REFUND',
        amount: memWd.amount,
        description: `Hoàn tiền lệnh rút tiền bị từ chối: ${note || ''}`,
        referenceId: memWd.id,
        status: 'COMPLETED',
        createdAt: now.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái lệnh rút tiền thành ${status}`,
      withdrawal: memWd,
      wallet: memoryWallet,
    });
  } catch (error: any) {
    console.error('[WALLET_WITHDRAWAL_UPDATE_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
