import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { recordAuditLog } from '@/lib/audit-log';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: Prisma.CalendarNoteWhereInput = {
      workspaceId: session.user.workspaceId,
    };
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const notes = await prisma.calendarNote.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching calendar notes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, date, color } = body;

    const newNote = await prisma.calendarNote.create({
      data: {
        title,
        content,
        date: new Date(date),
        color,
        createdById: session.user.id,
        workspaceId: session.user.workspaceId,
      },
    });

    await recordAuditLog({
      action: 'NOTE.CREATE',
      entityType: 'CalendarNote',
      entityId: newNote.id,
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      req,
      metadata: { 
        message: `Tạo ghi chú lịch: ${title}`,
        date: new Date(date).toISOString().split('T')[0]
      },
    });

    return NextResponse.json(newNote);
  } catch (error) {
    console.error('Error creating calendar note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing note ID' }, { status: 400 });
    }

    const existing = await prisma.calendarNote.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      select: { title: true },
    });

    await prisma.calendarNote.deleteMany({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    await recordAuditLog({
      action: 'NOTE.DELETE',
      entityType: 'CalendarNote',
      entityId: id,
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      req,
      metadata: { 
        message: `Xóa ghi chú lịch: ${existing?.title || id}` 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
