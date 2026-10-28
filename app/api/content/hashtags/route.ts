import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-workspace-id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

async function getAuthContext() {
  let session = await auth();
  let userId = session?.user?.id;
  let workspaceId = (session?.user as any)?.workspaceId;
  let role = session?.user?.role;

  if (!userId && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const mockUser = await prisma.user.findFirst().catch(() => null);
    if (mockUser) {
      userId = mockUser.id;
      workspaceId = mockUser.workspaceId;
      role = mockUser.role;
    }
  }

  if (userId && !workspaceId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true, role: true },
    }).catch(() => null);
    workspaceId = dbUser?.workspaceId || null;
    if (!role && dbUser?.role) role = dbUser.role;
  }

  return { userId, workspaceId, role };
}

// GET /api/content/hashtags
export async function GET(req: NextRequest) {
  try {
    const { userId, workspaceId, role } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const category = url.searchParams.get('category'); // 'HASHTAG' or 'CTA'

    const where: any = {};
    if (category) where.category = category;

    if (role !== 'SUPER_ADMIN') {
      if (workspaceId) {
        where.OR = [
          { workspaceId },
          { workspaceId: null },
        ];
      }
    }

    const items = await prisma.hashtagLibrary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/content/hashtags
export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { name, hashtags, category } = body;

    if (!name || !hashtags) {
      return NextResponse.json({ error: 'Name and hashtags are required' }, { status: 400, headers: corsHeaders });
    }

    const item = await prisma.hashtagLibrary.create({
      data: {
        name: name.trim(),
        hashtags: hashtags.trim(),
        category: category || 'HASHTAG',
        workspaceId: workspaceId || null,
      },
    });
    return NextResponse.json(item, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH /api/content/hashtags
export async function PATCH(req: NextRequest) {
  try {
    const { userId, workspaceId, role } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { id, name, hashtags, category } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400, headers: corsHeaders });
    }

    const existing = await prisma.hashtagLibrary.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    if (role !== 'SUPER_ADMIN' && existing.workspaceId && workspaceId && existing.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    const updated = await prisma.hashtagLibrary.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(hashtags !== undefined ? { hashtags: hashtags.trim() } : {}),
        ...(category ? { category } : {}),
      },
    });

    return NextResponse.json(updated, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE /api/content/hashtags?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { userId, workspaceId, role } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400, headers: corsHeaders });
    }

    const existing = await prisma.hashtagLibrary.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    if (role !== 'SUPER_ADMIN' && existing.workspaceId && workspaceId && existing.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    await prisma.hashtagLibrary.delete({ where: { id } });
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
