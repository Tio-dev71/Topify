import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/content/pillars
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const pillars = await prisma.contentPillar.findMany({
      where: { workspaceId: (session.user as any).workspaceId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { plans: true } } },
    });
    return NextResponse.json({ pillars });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/content/pillars
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, description, color } = body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const pillar = await prisma.contentPillar.create({
      data: {
        name,
        description,
        color: color || '#5B3DF5',
        workspaceId: (session.user as any).workspaceId,
      },
    });
    return NextResponse.json(pillar, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/content/pillars?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.contentPillar.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== (session.user as any).workspaceId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.contentPillar.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
