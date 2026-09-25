import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/crm/deals - List deals with pipeline/stage info
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const pipelineId = url.searchParams.get('pipelineId');
    const status = url.searchParams.get('status');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };
    if (pipelineId) where.pipelineId = pipelineId;
    if (status) where.status = status;

    const deals = await prisma.deal.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true, avatar: true } },
        stage: { select: { name: true, color: true, sortOrder: true } },
        pipeline: { select: { name: true } },
        owner: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ deals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/crm/deals
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, value, customerId, pipelineId, stageId, expectedClose } = body;

    if (!title || !pipelineId || !stageId) {
      return NextResponse.json({ error: 'Title, pipeline, and stage are required' }, { status: 400 });
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        value: value || 0,
        customerId,
        pipelineId,
        stageId,
        ownerId: session.user.id,
        expectedClose: expectedClose ? new Date(expectedClose) : null,
        workspaceId: (session.user as any).workspaceId,
      },
      include: {
        customer: { select: { name: true } },
        stage: { select: { name: true, color: true } },
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/crm/deals - Move deal between stages (drag and drop support)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { dealId, stageId, status } = body;

    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (stageId) data.stageId = stageId;
    if (status) {
      data.status = status;
      if (status === 'WON' || status === 'LOST') data.closedAt = new Date();
    }

    const deal = await prisma.deal.update({
      where: { id: dealId },
      data,
      include: {
        stage: { select: { name: true, color: true } },
      },
    });

    return NextResponse.json({ deal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/crm/deals?id=...
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const workspaceId = (session.user as any).workspaceId;

    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    await prisma.deal.deleteMany({
      where: { id, workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
