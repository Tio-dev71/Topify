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

    const workspaceId = session.user.workspaceId;
    const whereClause: Prisma.CalendarNoteWhereInput = workspaceId
      ? { workspaceId }
      : { createdById: session.user.id };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        whereClause.date = {
          gte: start,
          lte: end,
        };
      }
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

    if (!title && !content) {
      return NextResponse.json({ error: 'Tiêu đề hoặc nội dung là bắt buộc' }, { status: 400 });
    }

    const noteDate = date ? new Date(date) : new Date();
    const workspaceId = session.user.workspaceId || null;

    const newNote = await prisma.calendarNote.create({
      data: {
        title: title?.trim() || 'Ghi chú',
        content: content?.trim() || '',
        date: !isNaN(noteDate.getTime()) ? noteDate : new Date(),
        color: color || null,
        createdById: session.user.id,
        workspaceId,
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
        message: `Tạo ghi chú lịch: ${newNote.title}`,
        date: newNote.date.toISOString().split('T')[0]
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

    const workspaceId = session.user.workspaceId;
    const whereClause: Prisma.CalendarNoteWhereInput = workspaceId
      ? { id, workspaceId }
      : { id, createdById: session.user.id };

    const existing = await prisma.calendarNote.findFirst({
      where: whereClause,
      select: { title: true },
    });

    await prisma.calendarNote.deleteMany({
      where: whereClause,
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, content, date, color } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing note ID' }, { status: 400 });
    }

    const workspaceId = session.user.workspaceId;
    const whereClause: Prisma.CalendarNoteWhereInput = workspaceId
      ? { id, workspaceId }
      : { id, createdById: session.user.id };

    const existing = await prisma.calendarNote.findFirst({
      where: whereClause,
    });

    if (!existing) {
      return NextResponse.json({ error: 'Ghi chú không tồn tại' }, { status: 404 });
    }

    const updateData: Prisma.CalendarNoteUpdateInput = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (color !== undefined) updateData.color = color;
    if (date) {
      const noteDate = new Date(date);
      if (!isNaN(noteDate.getTime())) {
        updateData.date = noteDate;
      }
    }

    const updatedNote = await prisma.calendarNote.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog({
      action: 'NOTE.UPDATE',
      entityType: 'CalendarNote',
      entityId: id,
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      req,
      metadata: { 
        message: `Cập nhật ghi chú lịch: ${updatedNote.title}` 
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating calendar note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const PUT = PATCH;
