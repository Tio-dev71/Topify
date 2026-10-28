import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// OPTIONS /api/content/pillars
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

async function getWorkspaceId(session: any): Promise<string | null> {
  let wsId = (session.user as any).workspaceId;
  if (!wsId && session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true },
    });
    wsId = dbUser?.workspaceId || null;
  }
  return wsId;
}

// GET /api/content/pillars
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const workspaceId = await getWorkspaceId(session);
    const pillars = await prisma.contentPillar.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { plans: true } } },
    });
    return NextResponse.json({ pillars }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/content/pillars
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const workspaceId = await getWorkspaceId(session);
    const body = await req.json();
    const { name, description, color } = body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400, headers: corsHeaders });

    const pillar = await prisma.contentPillar.create({
      data: {
        name,
        description,
        color: color || '#5B3DF5',
        workspaceId,
      },
    });
    return NextResponse.json(pillar, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE /api/content/pillars?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const workspaceId = await getWorkspaceId(session);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400, headers: corsHeaders });

    const existing = await prisma.contentPillar.findUnique({ where: { id } });
    if (!existing || (existing.workspaceId && workspaceId && existing.workspaceId !== workspaceId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }
    await prisma.contentPillar.delete({ where: { id } });
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH /api/content/pillars
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const workspaceId = await getWorkspaceId(session);
    const body = await req.json();
    const { id, name, description, color } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400, headers: corsHeaders });

    const existing = await prisma.contentPillar.findUnique({ where: { id } });
    if (!existing || (existing.workspaceId && workspaceId && existing.workspaceId !== workspaceId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (color !== undefined) data.color = color;

    const pillar = await prisma.contentPillar.update({
      where: { id },
      data,
      include: { _count: { select: { plans: true } } },
    });

    return NextResponse.json(pillar, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

