import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// PUT /api/content/brand-voice/[id] - Update brand voice
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const workspaceId = (session.user as any).workspaceId;

    // Verify ownership
    const existing = await prisma.brandVoice.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.brandVoice.updateMany({
        where: { workspaceId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const voice = await prisma.brandVoice.update({
      where: { id },
      data: {
        name: body.name,
        tone: body.tone,
        personality: body.personality,
        bannedWords: body.bannedWords,
        preferredCTA: body.preferredCTA,
        sampleContent: body.sampleContent,
        guidelines: body.guidelines,
        isDefault: body.isDefault,
      },
    });

    return NextResponse.json(voice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/content/brand-voice/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const workspaceId = (session.user as any).workspaceId;

    const existing = await prisma.brandVoice.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.brandVoice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
