import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

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

    await recordAuditLog({
      action: 'PIPELINE.CREATE',
      entityType: 'Pipeline',
      entityId: pipeline.id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: { 
        message: `Tạo quy trình bán hàng mới: ${name}`,
        stagesCount: pipeline.stages.length
      },
    });

    return NextResponse.json(pipeline, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/crm/pipelines - Update pipeline and stages
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, description, isDefault, stages } = body;

    if (!id) {
      return NextResponse.json({ error: 'Pipeline ID is required' }, { status: 400 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const existing = await prisma.pipeline.findFirst({
      where: { id, workspaceId },
      include: { stages: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Quy trình không tồn tại hoặc không thuộc workspace của bạn' }, { status: 404 });
    }

    // If setting as default, unset other default pipelines in workspace
    if (isDefault) {
      await prisma.pipeline.updateMany({
        where: { workspaceId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // Update pipeline basics
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    if (Object.keys(updateData).length > 0) {
      await prisma.pipeline.update({
        where: { id },
        data: updateData,
      });
    }

    // Handle stages update if provided
    if (Array.isArray(stages)) {
      const stageDelegate = (prisma.pipelineStage || (prisma as any).stage);
      const keepStageIds = new Set<string>();

      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        if (s.id && existing.stages.some(es => es.id === s.id)) {
          // Update existing stage
          keepStageIds.add(s.id);
          await stageDelegate.update({
            where: { id: s.id },
            data: {
              name: s.name,
              sortOrder: s.sortOrder ?? i,
              color: s.color,
            },
          });
        } else if (s.name) {
          // Create new stage
          const newStage = await stageDelegate.create({
            data: {
              name: s.name,
              sortOrder: s.sortOrder ?? i,
              color: s.color || '#3B82F6',
              pipelineId: id,
            },
          });
          keepStageIds.add(newStage.id);
        }
      }

      // Check if any old stages were omitted and delete them if no deals attached
      for (const oldStage of existing.stages) {
        if (!keepStageIds.has(oldStage.id)) {
          const dealCount = await prisma.deal.count({ where: { stageId: oldStage.id } });
          if (dealCount === 0) {
            await stageDelegate.delete({ where: { id: oldStage.id } });
          }
        }
      }
    }

    const updated = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { deals: true } },
      },
    });

    await recordAuditLog({
      action: 'PIPELINE.UPDATE',
      entityType: 'Pipeline',
      entityId: id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: {
        message: `Cập nhật quy trình bán hàng: ${updated?.name || id}`,
        stagesCount: updated?.stages?.length,
      },
    });

    return NextResponse.json(updated);
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
      return NextResponse.json({ error: `Không thể xóa quy trình này vì đang có ${dealsCount} giao dịch gắn liền.` }, { status: 400 });
    }

    const existing = await prisma.pipeline.findFirst({
      where: { id, workspaceId },
      select: { name: true },
    });

    const stageDelegate = (prisma.pipelineStage || (prisma as any).stage);
    await stageDelegate.deleteMany({
      where: { pipelineId: id },
    });

    await prisma.pipeline.deleteMany({
      where: { id, workspaceId },
    });

    await recordAuditLog({
      action: 'PIPELINE.DELETE',
      entityType: 'Pipeline',
      entityId: id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: { 
        message: `Xóa quy trình bán hàng: ${existing?.name || id}` 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
