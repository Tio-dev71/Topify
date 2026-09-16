import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await prisma.automationLog.findMany({
      where: profileId ? { profileId } : {},
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('[AUTOMATION_LOGS_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
