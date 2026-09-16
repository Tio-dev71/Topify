import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/wallet - Get wallet info
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    // Auto-create wallet if not exists
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.user.id },
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
          withdrawals: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });
    }

    return NextResponse.json({ wallet });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
