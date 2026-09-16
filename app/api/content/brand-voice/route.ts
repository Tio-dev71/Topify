import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/content/brand-voice - List brand voices
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const voices = await prisma.brandVoice.findMany({
      where: { workspaceId: (session.user as any).workspaceId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ voices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/content/brand-voice - Create brand voice
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, tone, personality, bannedWords, preferredCTA, sampleContent, guidelines, isDefault } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const workspaceId = (session.user as any).workspaceId;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.brandVoice.updateMany({
        where: { workspaceId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const voice = await prisma.brandVoice.create({
      data: {
        name,
        tone,
        personality,
        bannedWords,
        preferredCTA,
        sampleContent,
        guidelines,
        isDefault: isDefault || false,
        workspaceId,
      },
    });

    return NextResponse.json(voice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
