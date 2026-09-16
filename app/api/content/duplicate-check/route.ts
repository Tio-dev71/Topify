import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/content/duplicate-check - Check for duplicate content
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { caption, threshold = 0.7 } = body;

    if (!caption || caption.length < 10) {
      return NextResponse.json({ error: 'Caption must be at least 10 characters' }, { status: 400 });
    }

    const workspaceId = (session.user as any).workspaceId;

    // Get recent posts in workspace
    const recentPosts = await prisma.post.findMany({
      where: { workspaceId },
      select: { id: true, title: true, caption: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Simple similarity check using word overlap (Jaccard similarity)
    const inputWords = new Set(caption.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2));
    
    const duplicates = recentPosts
      .filter(post => post.caption)
      .map(post => {
        const postWords = new Set(post.caption!.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2));
        const intersection = new Set(Array.from(inputWords as Set<string>).filter((x: string) => postWords.has(x)));
        const union = new Set([...Array.from(inputWords as Set<string>), ...Array.from(postWords as Set<string>)]);
        const similarity = union.size > 0 ? intersection.size / union.size : 0;
        
        return {
          postId: post.id,
          title: post.title,
          similarity: Math.round(similarity * 100),
          createdAt: post.createdAt,
        };
      })
      .filter(d => d.similarity >= threshold * 100)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

    return NextResponse.json({
      hasDuplicates: duplicates.length > 0,
      duplicates,
      checkedCount: recentPosts.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
