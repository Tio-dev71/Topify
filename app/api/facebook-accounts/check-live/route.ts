import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const userWorkspaceId = (session.user as any).workspaceId;
    const account = await prisma.facebookAccount.findUnique({ where: { id } });
    if (!account || !account.uid || (session.user.role !== 'SUPER_ADMIN' && userWorkspaceId && account.workspaceId && account.workspaceId !== userWorkspaceId)) {
      return NextResponse.json({ error: 'Account or UID not found' }, { status: 404 });
    }

    // Call Facebook Graph API to check if avatar exists (fastest way to check if account is disabled)
    const response = await fetch(`https://graph.facebook.com/${account.uid}/picture?type=normal`, {
      method: 'GET',
      redirect: 'manual' // We want to capture the 302 redirect
    });

    let isLive = false;
    let statusText = 'Unknown';

    if (response.status === 302) {
      const location = response.headers.get('location') || '';
      if (location.includes('rsrc.php')) {
        isLive = false;
        statusText = 'DEAD';
      } else {
        isLive = true;
        statusText = 'LIVE';
      }
    } else if (response.status === 400 || response.status === 404) {
      isLive = false;
      statusText = 'DEAD';
    } else {
      statusText = 'CHECKPOINT';
    }

    // Update DB
    await prisma.facebookAccount.update({
      where: { id },
      data: { status: statusText as any }
    });

    return NextResponse.json({ success: true, isLive, status: statusText });

  } catch (error: any) {
    console.error('Failed to check live status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
