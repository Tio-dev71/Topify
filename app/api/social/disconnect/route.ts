import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/social/disconnect?provider=META
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const provider = url.searchParams.get('provider');
    const accountId = url.searchParams.get('accountId');

    if (!provider && !accountId) {
      return NextResponse.json({ error: 'Provider or Account ID required' }, { status: 400 });
    }

    const user = session.user as any;
    const whereClause: any = {
      OR: [
        { userId: user.id },
        ...(user.workspaceId ? [{ workspaceId: user.workspaceId }] : [])
      ]
    };

    if (accountId) {
      whereClause.id = accountId;
    } else if (provider) {
      whereClause.provider = provider.toUpperCase() as any;
    }

    await prisma.socialAccount.deleteMany({
      where: whereClause,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
