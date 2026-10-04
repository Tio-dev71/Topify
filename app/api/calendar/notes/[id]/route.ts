import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { date, content, title, color } = body;
    const workspaceId = (session.user as any).workspaceId;

    // Verify ownership or workspace access
    const existingNote = await prisma.calendarNote.findUnique({
      where: { id },
    });

    if (!existingNote || (workspaceId && existingNote.workspaceId !== workspaceId && existingNote.createdById !== session.user.id)) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    const note = await prisma.calendarNote.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        title: title !== undefined ? title : undefined,
        content: content !== undefined ? content : undefined,
        color: color !== undefined ? color : undefined,
      },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;

    const existingNote = await prisma.calendarNote.findUnique({
      where: { id },
    });

    if (!existingNote || (workspaceId && existingNote.workspaceId !== workspaceId && existingNote.createdById !== session.user.id)) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    await prisma.calendarNote.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
