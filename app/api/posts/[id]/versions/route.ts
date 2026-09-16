import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/posts/[id]/versions — List post versions
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.workspaceId !== (session.user as any).workspaceId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const versions = await prisma.postVersion.findMany({
      where: { postId: id },
      include: { editedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ versions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
