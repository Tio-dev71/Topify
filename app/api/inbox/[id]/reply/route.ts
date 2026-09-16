import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/inbox/[id]/reply - Send reply in conversation
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content, mediaUrl } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'Content or media is required' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, workspaceId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Create the outbound message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        direction: 'OUTBOUND',
        content,
        mediaUrl,
        senderName: (session.user as any).name || session.user.email || 'Staff',
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        status: 'OPEN',
      },
    });

    // TODO: Actually send via platform API (Graph API, TikTok API, etc.)
    // This would dispatch to the appropriate platform sender

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
