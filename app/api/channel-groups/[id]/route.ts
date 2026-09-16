import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, accountIds } = body;

    // Verify ownership via workspace
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } });
    const existing = await prisma.channelGroup.findUnique({ where: { id } });

    if (!existing || existing.workspaceId !== user?.workspaceId) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }

    const channelGroup = await prisma.channelGroup.update({
      where: { id },
      data: {
        name,
        description,
        accounts: accountIds ? {
          set: accountIds.map((accountId: string) => ({ id: accountId }))
        } : undefined
      },
      include: {
        accounts: true
      }
    });

    return NextResponse.json(channelGroup);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } });
    const existing = await prisma.channelGroup.findUnique({ where: { id } });

    if (!existing || existing.workspaceId !== user?.workspaceId) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }

    await prisma.channelGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
