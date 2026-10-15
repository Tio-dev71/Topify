import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { generateSuggestedReplies } from '@/lib/ai/9router';

export const dynamic = 'force-dynamic';

// POST /api/inbox/[id]/ai-suggest-reply - Generate 3 quick suggested replies via 9router
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
          take: 12,
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

    const result = await generateSuggestedReplies({
      conversationHistory: history,
      contactName: conversation.contactName || 'khách hàng',
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error generating suggested replies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
