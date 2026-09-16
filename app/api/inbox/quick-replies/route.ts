import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/inbox/quick-replies - List quick replies
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quickReplies = await prisma.quickReply.findMany({
      where: { workspaceId: (session.user as any).workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ quickReplies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inbox/quick-replies - Create quick reply
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, shortcut, category } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const quickReply = await prisma.quickReply.create({
      data: {
        title,
        content,
        shortcut,
        category,
        workspaceId: (session.user as any).workspaceId,
      },
    });

    return NextResponse.json(quickReply, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
