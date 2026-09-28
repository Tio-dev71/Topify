import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: {
        OR: [
          ...(user.workspaceId ? [{ workspaceId: user.workspaceId }] : []),
          { userId: user.id }
        ]
      },
      select: {
        id: true,
        provider: true,
        accountName: true,
        pageId: true,
        instagramBusinessId: true,
        youtubeChannelId: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Failed to fetch social accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
