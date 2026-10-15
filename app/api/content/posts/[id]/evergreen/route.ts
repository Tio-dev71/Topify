import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/content/posts/[id]/evergreen - Toggle or update evergreen settings on a post
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { isEvergreen, recycleIntervalDays } = body;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (typeof isEvergreen === 'boolean') {
      updateData.isEvergreen = isEvergreen;
    }
    if (typeof recycleIntervalDays === 'number' && recycleIntervalDays > 0) {
      updateData.recycleIntervalDays = recycleIntervalDays;
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        isEvergreen: true,
        recycleIntervalDays: true,
        lastRecycledAt: true,
        recycleCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error: any) {
    console.error('❌ [POST-EVERGREEN-PATCH] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
