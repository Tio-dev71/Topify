import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// OPTIONS /api/content/briefs
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

// GET /api/content/briefs - List or get content briefs
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const status = url.searchParams.get('status');
    const workspaceId = await getWorkspaceId(session);

    if (id) {
      const brief = await prisma.contentBrief.findUnique({
        where: { id },
        include: {
          createdBy: { select: { name: true, email: true } },
        },
      });

      if (!brief) {
        return NextResponse.json({ error: 'Content brief not found' }, { status: 404, headers: corsHeaders });
      }

      if (workspaceId && brief.workspaceId && brief.workspaceId !== workspaceId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
      }

      return NextResponse.json({ brief }, { headers: corsHeaders });
    }

    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    if (status) {
      where.status = status;
    }

    const briefs = await prisma.contentBrief.findMany({
      where,
      include: {
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ briefs }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/content/briefs - Create content brief
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { title, objective, audience, keyMessage, cta, deadline, notes, status } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400, headers: corsHeaders });
    }

    const workspaceId = await getWorkspaceId(session);

    const brief = await prisma.contentBrief.create({
      data: {
        title: title.trim(),
        objective: objective || null,
        audience: audience || null,
        keyMessage: keyMessage || null,
        cta: cta || null,
        deadline: deadline ? new Date(deadline) : null,
        notes: notes || null,
        status: status && ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status) ? status : 'DRAFT',
        createdById: session.user.id,
        workspaceId,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(brief, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH /api/content/briefs - Update content brief
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const id = body.id || url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Brief ID is required' }, { status: 400, headers: corsHeaders });
    }

    const workspaceId = await getWorkspaceId(session);
    const existing = await prisma.contentBrief.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Content brief not found' }, { status: 404, headers: corsHeaders });
    }

    if (workspaceId && existing.workspaceId && existing.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    const { title, objective, audience, keyMessage, cta, deadline, notes, status } = body;

    if (title !== undefined && (!title || typeof title !== 'string' || !title.trim())) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400, headers: corsHeaders });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (objective !== undefined) updateData.objective = objective;
    if (audience !== undefined) updateData.audience = audience;
    if (keyMessage !== undefined) updateData.keyMessage = keyMessage;
    if (cta !== undefined) updateData.cta = cta;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined && ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      updateData.status = status;
    }

    const updatedBrief = await prisma.contentBrief.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ brief: updatedBrief, success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE /api/content/briefs - Delete content brief
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const url = new URL(req.url);
    let id = url.searchParams.get('id');
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'Brief ID is required' }, { status: 400, headers: corsHeaders });
    }

    const workspaceId = await getWorkspaceId(session);
    const existing = await prisma.contentBrief.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Content brief not found' }, { status: 404, headers: corsHeaders });
    }

    if (workspaceId && existing.workspaceId && existing.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    await prisma.contentBrief.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Content brief deleted successfully' }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
