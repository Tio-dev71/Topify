import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { date, content } = body;
    const workspaceId = (session.user as any).workspaceId;

    // Verify ownership or workspace access
    const existingNote = await prisma.calendarNote.findUnique({
      where: { id: params.id },
    });

    if (!existingNote || existingNote.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    const note = await prisma.calendarNote.update({
      where: { id: params.id },
      data: {
        date: date ? new Date(date) : undefined,
        content: content !== undefined ? content : undefined,
      },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;

    const existingNote = await prisma.calendarNote.findUnique({
      where: { id: params.id },
    });

    if (!existingNote || existingNote.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    await prisma.calendarNote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
