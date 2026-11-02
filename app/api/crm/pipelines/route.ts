import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Helper to get authenticated user and workspace
async function getAuthContext(req?: NextRequest) {
  let userId: string | undefined;
  let workspaceId: string | undefined;
  let session: any = null;

  // 1. Check Bearer token from request headers (Electron App)
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.sub || decoded?.id) {
          userId = decoded.sub || decoded.id;
          workspaceId = decoded.workspaceId;
        }
      } catch (e) {
        // Token invalid or expired, continue to NextAuth check
      }
    }
  }

  // 2. Check NextAuth session (Web Dashboard)
  if (!userId) {
    session = await auth();
    userId = session?.user?.id;
    workspaceId = (session?.user as any)?.workspaceId;
  }

  // 3. If userId found but no workspaceId, load from DB
  if (userId && !workspaceId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.workspaceId) {
      workspaceId = user.workspaceId;
    }
  }

  // 4. Fallback for offline / dev mock
  if (!userId) {
    const mockUser = await prisma.user.findFirst().catch(() => null);
    if (mockUser) {
      userId = mockUser.id;
      workspaceId = mockUser.workspaceId;
    }
  }

  if (!workspaceId) {
    const ws = await prisma.workspace.findFirst().catch(() => null);
    if (ws) workspaceId = ws.id;
  }

  return { userId, workspaceId, session };
}

// GET /api/crm/pipelines
export async function GET(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    let pipelines = await prisma.pipeline.findMany({
      where: workspaceId ? { workspaceId } : {},
      include: {
        stages: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { deals: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    if (pipelines.length === 0) {
      const defaultPipe = await prisma.pipeline.create({
        data: {
          name: 'Quy trình Bán hàng chuẩn',
          isDefault: true,
          workspaceId: workspaceId || 'default-workspace',
          stages: {
            create: [
              { name: 'Khách hàng mới', sortOrder: 1, color: '#3B82F6' },
              { name: 'Đang liên hệ', sortOrder: 2, color: '#EAB308' },
              { name: 'Thương lượng', sortOrder: 3, color: '#A855F7' },
              { name: 'Đã gửi báo giá', sortOrder: 4, color: '#6366F1' },
              { name: 'Thành công', sortOrder: 5, color: '#10B981' },
            ],
          },
        },
        include: {
          stages: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { deals: true } },
        },
      });
      pipelines = [defaultPipe];
    }

    return NextResponse.json({ pipelines }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/crm/pipelines
export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { name, stages } = body;

    if (!name) {
      return NextResponse.json({ error: 'Pipeline name is required' }, { status: 400, headers: corsHeaders });
    }

    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        workspaceId: workspaceId || 'default-workspace',
        stages: {
          create: (stages || [
            { name: 'Khách hàng mới', sortOrder: 1, color: '#3B82F6' },
            { name: 'Đang liên hệ', sortOrder: 2, color: '#EAB308' },
            { name: 'Thương lượng', sortOrder: 3, color: '#A855F7' },
            { name: 'Đã gửi báo giá', sortOrder: 4, color: '#6366F1' },
            { name: 'Thành công', sortOrder: 5, color: '#10B981' },
          ]).map((s: any, i: number) => ({
            name: s.name,
            sortOrder: s.sortOrder ?? i + 1,
            color: s.color || '#3B82F6',
          })),
        },
      },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });

    await recordAuditLog({
      action: 'PIPELINE.CREATE',
      entityType: 'Pipeline',
      entityId: pipeline.id,
      userId,
      workspaceId,
      req,
      metadata: {
        message: `Tạo quy trình bán hàng mới: ${name}`,
        stagesCount: pipeline.stages.length,
      },
    });

    return NextResponse.json(pipeline, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH /api/crm/pipelines - Update pipeline and stages
export async function PATCH(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    let { id, name, description, isDefault, stages, stageId, stage } = body;

    // Direct single stage update helper
    const targetStageId = stageId || stage?.id;
    if (targetStageId) {
      const stageDelegate = prisma.pipelineStage || (prisma as any).stage;
      const stageDataToUpdate: any = {};
      if (body.name !== undefined) stageDataToUpdate.name = body.name.trim();
      if (stage?.name !== undefined) stageDataToUpdate.name = stage.name.trim();
      if (body.color !== undefined) stageDataToUpdate.color = body.color;
      if (stage?.color !== undefined) stageDataToUpdate.color = stage.color;
      if (body.sortOrder !== undefined) stageDataToUpdate.sortOrder = Number(body.sortOrder);
      if (stage?.sortOrder !== undefined) stageDataToUpdate.sortOrder = Number(stage.sortOrder);

      const updatedStage = await stageDelegate.update({
        where: { id: targetStageId },
        data: stageDataToUpdate,
      });

      return NextResponse.json(
        { success: true, stage: updatedStage },
        { headers: corsHeaders }
      );
    }

    if (!id) {
      // If no pipeline ID given, find default or first pipeline
      let firstPipe = await prisma.pipeline.findFirst({
        where: workspaceId ? { workspaceId } : {},
        include: { stages: true },
      });

      if (!firstPipe) {
        firstPipe = await prisma.pipeline.create({
          data: {
            name: 'Quy trình chuyển đổi chuẩn',
            isDefault: true,
            workspaceId: workspaceId || 'default-workspace',
            stages: {
              create: [
                { name: 'Khách hàng mới', sortOrder: 1, color: '#3B82F6' },
                { name: 'Đang liên hệ', sortOrder: 2, color: '#EAB308' },
                { name: 'Thương lượng', sortOrder: 3, color: '#A855F7' },
                { name: 'Đã gửi báo giá', sortOrder: 4, color: '#6366F1' },
                { name: 'Thành công', sortOrder: 5, color: '#10B981' },
              ],
            },
          },
          include: { stages: true },
        });
      }
      id = firstPipe.id;
    }

    let existing = await prisma.pipeline.findFirst({
      where: workspaceId ? { id, workspaceId } : { id },
      include: { stages: true },
    });

    if (!existing) {
      existing = await prisma.pipeline.findUnique({
        where: { id },
        include: { stages: true },
      });
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Quy trình không tồn tại' },
        { status: 404, headers: corsHeaders }
      );
    }

    // If setting as default, unset other default pipelines in workspace
    if (isDefault && workspaceId) {
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
      const stageDelegate = prisma.pipelineStage || (prisma as any).stage;
      const keepStageIds = new Set<string>();

      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        if (s.id && existing.stages.some((es) => es.id === s.id)) {
          // Update existing stage
          keepStageIds.add(s.id);
          await stageDelegate.update({
            where: { id: s.id },
            data: {
              name: s.name.trim(),
              sortOrder: s.sortOrder !== undefined ? Number(s.sortOrder) : i + 1,
              color: s.color || '#3B82F6',
            },
          });
        } else if (s.name) {
          // Create new stage
          const newStage = await stageDelegate.create({
            data: {
              name: s.name.trim(),
              sortOrder: s.sortOrder !== undefined ? Number(s.sortOrder) : i + 1,
              color: s.color || '#3B82F6',
              pipelineId: existing.id,
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
      where: { id: existing.id },
      include: {
        stages: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { deals: true } },
      },
    });

    await recordAuditLog({
      action: 'PIPELINE.UPDATE',
      entityType: 'Pipeline',
      entityId: existing.id,
      userId,
      workspaceId,
      req,
      metadata: {
        message: `Cập nhật quy trình bán hàng: ${updated?.name || id}`,
        stagesCount: updated?.stages?.length,
      },
    });

    return NextResponse.json(updated, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE /api/crm/pipelines?id=...
export async function DELETE(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Pipeline ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Do not delete if it has deals
    const dealsCount = await prisma.deal.count({
      where: { pipelineId: id },
    });

    if (dealsCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa quy trình này vì đang có ${dealsCount} giao dịch gắn liền.` },
        { status: 400, headers: corsHeaders }
      );
    }

    const existing = await prisma.pipeline.findFirst({
      where: workspaceId ? { id, workspaceId } : { id },
      select: { name: true },
    });

    const stageDelegate = prisma.pipelineStage || (prisma as any).stage;
    await stageDelegate.deleteMany({
      where: { pipelineId: id },
    });

    await prisma.pipeline.deleteMany({
      where: workspaceId ? { id, workspaceId } : { id },
    });

    await recordAuditLog({
      action: 'PIPELINE.DELETE',
      entityType: 'Pipeline',
      entityId: id,
      userId,
      workspaceId,
      req,
      metadata: {
        message: `Xóa quy trình bán hàng: ${existing?.name || id}`,
      },
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
