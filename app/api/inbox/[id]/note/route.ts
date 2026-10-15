import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/inbox/[id]/note - Create internal note (F086)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await req.json();
    const workspaceId = (session.user as any).workspaceId;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Nội dung ghi chú không được để trống' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, workspaceId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Hội thoại không tồn tại' }, { status: 404 });
    }

    const note = await prisma.conversationNote.create({
      data: {
        conversationId: id,
        content: content.trim(),
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('Error creating internal note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
