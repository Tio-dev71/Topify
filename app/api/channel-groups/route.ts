import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true }
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
    }

    const channelGroups = await prisma.channelGroup.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        accounts: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(channelGroups);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true }
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, accountIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const channelGroup = await prisma.channelGroup.create({
      data: {
        name,
        description,
        workspaceId: user.workspaceId,
        accounts: accountIds && accountIds.length > 0 ? {
          connect: accountIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        accounts: true
      }
    });

    return NextResponse.json(channelGroup, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
