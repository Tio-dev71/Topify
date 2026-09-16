import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/crm/pipelines
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pipelines = await prisma.pipeline.findMany({
      where: { workspaceId: (session.user as any).workspaceId },
      include: {
        stages: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { deals: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ pipelines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/crm/pipelines
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, stages } = body;

    if (!name) {
      return NextResponse.json({ error: 'Pipeline name is required' }, { status: 400 });
    }

    const workspaceId = (session.user as any).workspaceId;

    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        workspaceId,
        stages: {
          create: (stages || [
            { name: 'New Lead', sortOrder: 0, color: '#3B82F6' },
            { name: 'Contacted', sortOrder: 1, color: '#8B5CF6' },
            { name: 'Qualified', sortOrder: 2, color: '#F59E0B' },
            { name: 'Proposal', sortOrder: 3, color: '#10B981' },
            { name: 'Closed', sortOrder: 4, color: '#6B7280' },
          ]).map((s: any, i: number) => ({
            name: s.name,
            sortOrder: s.sortOrder ?? i,
            color: s.color,
          })),
        },
      },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json(pipeline, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
