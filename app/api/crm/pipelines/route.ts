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

    let pipelines = await prisma.pipeline.findMany({
      where: { workspaceId: (session.user as any).workspaceId },
      include: {
        stages: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { deals: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    if (pipelines.length === 0 && (session.user as any).workspaceId) {
      const defaultPipe = await prisma.pipeline.create({
        data: {
          name: 'Quy trình Bán hàng chuẩn',
          isDefault: true,
          workspaceId: (session.user as any).workspaceId,
          stages: {
            create: [
              { name: 'Khách hàng mới', sortOrder: 0, color: '#3B82F6' },
              { name: 'Đang liên hệ', sortOrder: 1, color: '#EAB308' },
              { name: 'Thương lượng', sortOrder: 2, color: '#A855F7' },
              { name: 'Đã gửi báo giá', sortOrder: 3, color: '#6366F1' },
              { name: 'Thành công', sortOrder: 4, color: '#10B981' },
            ]
          }
        },
        include: {
          stages: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { deals: true } },
        }
      });
      pipelines = [defaultPipe];
    }

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

// DELETE /api/crm/pipelines?id=...
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
      return NextResponse.json({ error: 'Pipeline ID is required' }, { status: 400 });
    }

    // Do not delete if it has deals
    const dealsCount = await prisma.deal.count({
      where: { pipelineId: id },
    });

    if (dealsCount > 0) {
      return NextResponse.json({ error: `Không thể xóa phễu này vì đang có ${dealsCount} giao dịch gắn liền.` }, { status: 400 });
    }

    await prisma.stage.deleteMany({
      where: { pipelineId: id },
    });

    await prisma.pipeline.deleteMany({
      where: { id, workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
