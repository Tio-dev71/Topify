import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/inbox/[id] - Get conversation with messages, notes, and customer link
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const workspaceId = (session.user as any).workspaceId;

    const conversation = await prisma.conversation.findFirst({
      where: { id, workspaceId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        assignedTo: { select: { id: true, name: true, email: true, image: true } },
        notes: {
          include: { createdBy: { select: { id: true, name: true, image: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: { conversationId: id, isRead: false, direction: 'INBOUND' },
      data: { isRead: true },
    });

    return NextResponse.json({ conversation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/inbox/[id] - Update conversation (status, SLA, assign, spam, labels)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const workspaceId = (session.user as any).workspaceId;

    const existing = await prisma.conversation.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null;
    if (body.labels !== undefined) updateData.labels = body.labels;
    if (body.isSpam !== undefined) {
      updateData.isSpam = Boolean(body.isSpam);
      if (body.isSpam) {
        updateData.slaDeadline = null; // Clear SLA if spam
      }
    }
    if (body.slaDeadline !== undefined) {
      updateData.slaDeadline = body.slaDeadline ? new Date(body.slaDeadline) : null;
    }

    // If status is changed to RESOLVED or CLOSED, clear SLA deadline
    if (body.status === 'RESOLVED' || body.status === 'CLOSED') {
      updateData.slaDeadline = null;
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ conversation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
