import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/calendar/notes - Get notes for calendar view
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const notes = await prisma.calendarNote.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/calendar/notes - Create a new note
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { date, content } = body;
    const workspaceId = (session.user as any).workspaceId;
    const createdById = session.user.id;

    if (!date || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const note = await prisma.calendarNote.create({
      data: {
        date: new Date(date),
        content,
        createdById,
        workspaceId,
      },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
