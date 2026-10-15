import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { generateConversationSummary } from '@/lib/ai/9router';

export const dynamic = 'force-dynamic';

// POST /api/inbox/[id]/ai-summary - Summarize long conversation & next actions (F088)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Hội thoại không tồn tại' }, { status: 404 });
    }

    const history = conversation.messages.map((m) => ({
      role: (m.direction === 'INBOUND' ? 'customer' : 'agent') as 'customer' | 'agent',
      content: m.content || '',
    }));

    const summaryResult = await generateConversationSummary({
      conversationHistory: history,
      contactName: conversation.contactName || 'Khách',
    });

    return NextResponse.json({ success: true, ...summaryResult });
  } catch (error: any) {
    console.error('Error generating conversation summary:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
