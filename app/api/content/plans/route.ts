import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// OPTIONS /api/content/plans
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

// GET /api/content/plans
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const workspaceId = await getWorkspaceId(session);
    let plans = await prisma.contentPlan.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { startDate: 'asc' },
      include: {
        pillar: true,
      },
    });

    // Auto-seed default plans for the workspace if none exist yet
    if (plans.length === 0 && workspaceId) {
      const existingPillars = await prisma.contentPillar.findMany({
        where: { workspaceId },
        take: 2,
      });

      const seedPlansData = [
        {
          title: 'Tuần 1: Nhận diện & Giáo dục',
          description: JSON.stringify({
            planGroup: 'Kế hoạch Tháng 10/2026',
            focus: 'Chia sẻ kiến thức ngành, mẹo vặt, giải quyết nỗi đau phổ biến.',
            target: '10 bài / 4 kênh',
          }),
          startDate: new Date('2026-10-01T00:00:00Z'),
          endDate: new Date('2026-10-07T23:59:59Z'),
          pillarId: existingPillars[0]?.id || null,
          workspaceId,
        },
        {
          title: 'Tuần 2: Tương tác & Trải nghiệm',
          description: JSON.stringify({
            planGroup: 'Kế hoạch Tháng 10/2026',
            focus: 'Đặt câu hỏi, mini-game, video tình huống hài hước giữ chân người xem.',
            target: '12 bài / 4 kênh',
          }),
          startDate: new Date('2026-10-08T00:00:00Z'),
          endDate: new Date('2026-10-14T23:59:59Z'),
          pillarId: existingPillars[1]?.id || existingPillars[0]?.id || null,
          workspaceId,
        },
        {
          title: 'Tuần 3: Case Study & Niềm tin',
          description: JSON.stringify({
            planGroup: 'Kế hoạch Tháng 10/2026',
            focus: 'Đánh giá của khách hàng, bằng chứng thực tế, so sánh ưu điểm.',
            target: '8 bài / 4 kênh',
          }),
          startDate: new Date('2026-10-15T00:00:00Z'),
          endDate: new Date('2026-10-21T23:59:59Z'),
          pillarId: existingPillars[0]?.id || null,
          workspaceId,
        },
        {
          title: 'Tuần 4: Chốt đơn & Bùng nổ',
          description: JSON.stringify({
            planGroup: 'Kế hoạch Tháng 10/2026',
            focus: 'Ưu đãi chớp nhoáng, Livestream bán hàng, Call-to-action mạnh mẽ.',
            target: '15 bài / 4 kênh',
          }),
          startDate: new Date('2026-10-22T00:00:00Z'),
          endDate: new Date('2026-10-31T23:59:59Z'),
          pillarId: null,
          workspaceId,
        },
      ];

      for (const p of seedPlansData) {
        await prisma.contentPlan.create({ data: p });
      }

      plans = await prisma.contentPlan.findMany({
        where: { workspaceId },
        orderBy: { startDate: 'asc' },
        include: {
          pillar: true,
        },
      });
    }

    return NextResponse.json({ plans }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/content/plans
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const workspaceId = await getWorkspaceId(session);
    const body = await req.json();
    const { title, description, focus, target, planGroup, startDate, endDate, pillarId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Tiêu đề kế hoạch không được để trống' }, { status: 400, headers: corsHeaders });
    }

    let finalDescription = description || '';
    if (focus !== undefined || target !== undefined || planGroup !== undefined) {
      finalDescription = JSON.stringify({
        planGroup: planGroup || 'Kế hoạch Tháng 10/2026',
        focus: focus || description || '',
        target: target || '',
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 86400000);

    const plan = await prisma.contentPlan.create({
      data: {
        title: title.trim(),
        description: finalDescription,
        startDate: start,
        endDate: end,
        pillarId: pillarId || null,
        workspaceId,
      },
      include: {
        pillar: true,
      },
    });

    return NextResponse.json(plan, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH /api/content/plans
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const workspaceId = await getWorkspaceId(session);
    const body = await req.json();
    const { id, title, description, focus, target, planGroup, startDate, endDate, pillarId } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400, headers: corsHeaders });

    const existing = await prisma.contentPlan.findUnique({ where: { id } });
    if (!existing || (existing.workspaceId && workspaceId && existing.workspaceId !== workspaceId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (pillarId !== undefined) data.pillarId = pillarId || null;

    if (focus !== undefined || target !== undefined || planGroup !== undefined) {
      // Parse existing description if possible
      let existingObj: any = {};
      try {
        existingObj = JSON.parse(existing.description || '{}');
      } catch {}

      data.description = JSON.stringify({
        planGroup: planGroup !== undefined ? planGroup : (existingObj.planGroup || 'Kế hoạch Tháng 10/2026'),
        focus: focus !== undefined ? focus : (existingObj.focus || existing.description || ''),
        target: target !== undefined ? target : (existingObj.target || ''),
      });
    } else if (description !== undefined) {
      data.description = description;
    }

    const updated = await prisma.contentPlan.update({
      where: { id },
      data,
      include: {
        pillar: true,
      },
    });

    return NextResponse.json(updated, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE /api/content/plans?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const workspaceId = await getWorkspaceId(session);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400, headers: corsHeaders });

    const existing = await prisma.contentPlan.findUnique({ where: { id } });
    if (!existing || (existing.workspaceId && workspaceId && existing.workspaceId !== workspaceId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    await prisma.contentPlan.delete({ where: { id } });
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
