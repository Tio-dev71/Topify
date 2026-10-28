import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// OPTIONS /api/content/templates
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

async function getAuthContext() {
  let session = await auth();
  let userId = session?.user?.id;
  let workspaceId = (session?.user as any)?.workspaceId;

  if (!userId && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const mockUser = await prisma.user.findFirst().catch(() => null);
    if (mockUser) {
      userId = mockUser.id;
      workspaceId = mockUser.workspaceId;
    }
  }

  if (userId && !workspaceId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true },
    }).catch(() => null);
    workspaceId = dbUser?.workspaceId || null;
  }

  return { userId, workspaceId };
}

// GET /api/content/templates
export async function GET(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const where: any = {};
    if (workspaceId) {
      where.OR = [
        { workspaceId },
        { workspaceId: null },
      ];
    }

    const templates = await prisma.contentTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ templates }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/content/templates
export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { name, description, postType, caption, hashtags, cta, platform } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400, headers: corsHeaders });

    const template = await prisma.contentTemplate.create({
      data: {
        name,
        description: description || null,
        postType: postType || 'FEED',
        caption: caption || null,
        hashtags: hashtags || null,
        cta: cta || null,
        platform: platform || 'FACEBOOK_POST',
        workspaceId: workspaceId || null,
      },
    });
    return NextResponse.json(template, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PUT /api/content/templates (update by id in body)
export async function PUT(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { id, name, description, postType, caption, hashtags, cta, platform } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400, headers: corsHeaders });

    const existing = await prisma.contentTemplate.findUnique({ where: { id } });
    if (!existing) {
      // If it doesn't exist in DB (e.g. customized from a formula_ default), create it
      const created = await prisma.contentTemplate.create({
        data: {
          id: id.startsWith('formula_') ? undefined : id,
          name: name || 'Mẫu bài viết',
          description: description || null,
          postType: postType || 'FEED',
          caption: caption || null,
          hashtags: hashtags || null,
          cta: cta || null,
          platform: platform || 'FACEBOOK_POST',
          workspaceId: workspaceId || null,
        },
      });
      return NextResponse.json(created, { headers: corsHeaders });
    }

    if (workspaceId && existing.workspaceId && existing.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    const updated = await prisma.contentTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(postType !== undefined ? { postType } : {}),
        ...(caption !== undefined ? { caption } : {}),
        ...(hashtags !== undefined ? { hashtags } : {}),
        ...(cta !== undefined ? { cta } : {}),
        ...(platform !== undefined ? { platform } : {}),
      },
    });
    return NextResponse.json(updated, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH /api/content/templates
export const PATCH = PUT;

// DELETE /api/content/templates?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400, headers: corsHeaders });

    const existing = await prisma.contentTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    if (workspaceId && existing.workspaceId && existing.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    await prisma.contentTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
